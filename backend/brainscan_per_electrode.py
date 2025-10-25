from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes, DetrendOperations
from supabase import create_client
from dotenv import load_dotenv
import os, time
import numpy as np

# --- Load .env ---
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- BrainFlow setup ---
params = BrainFlowInputParams()
board = BoardShim(BoardIds.MUSE_2_BOARD.value, params)
board.prepare_session()
board.start_stream()

eeg = BoardShim.get_eeg_channels(BoardIds.MUSE_2_BOARD.value)
sr = BoardShim.get_sampling_rate(BoardIds.MUSE_2_BOARD.value)

# Muse 2 electrode mapping (BrainFlow channel order)
# Based on BrainFlow documentation: "TP9,AF7,AF8,TP10"
ELECTRODE_NAMES = {
    eeg[0]: 'TP9',  # Left temporal (behind left ear)
    eeg[1]: 'AF7',  # Left frontal (above left eye)
    eeg[2]: 'AF8',  # Right frontal (above right eye)
    eeg[3]: 'TP10'  # Right temporal (behind right ear)
}

print(f"Streaming EEG data... Sampling rate: {sr} Hz")
print(f"EEG channels: {eeg}")
print(f"Electrode mapping: {ELECTRODE_NAMES}")
print("Waiting for headset to settle (30 seconds)...")
time.sleep(30)  # Let headset stabilize

# Store recent ratios for smoothing per electrode
electrode_history = {name: [] for name in ELECTRODE_NAMES.values()}
SMOOTHING_WINDOW = 3  # Smaller window for more responsive updates

# Stress intensity calibration
# These values can be tuned based on observed data
MIN_RATIO = 0.5   # Ratios below this = 0 stress
MAX_RATIO = 3.0   # Ratios above this = 1.0 stress

def normalize_stress(ratio):
    """
    Convert beta/alpha ratio to 0-1 stress intensity scale
    """
    if ratio < MIN_RATIO:
        return 0.0
    elif ratio > MAX_RATIO:
        return 1.0
    else:
        # Linear mapping between MIN_RATIO and MAX_RATIO
        return (ratio - MIN_RATIO) / (MAX_RATIO - MIN_RATIO)

try:
    while True:
        # Get 4 seconds of data for better frequency resolution
        data = board.get_current_board_data(1024)

        # Check if we have enough data
        if data.shape[1] < 512:
            print(f"Insufficient data: {data.shape[1]} samples, skipping...")
            time.sleep(1)
            continue

        # Process each electrode separately
        electrode_data = {}

        for ch in eeg:
            electrode_name = ELECTRODE_NAMES[ch]
            eeg_channel = data[ch, :].copy()  # Make a copy for processing

            # Check for NaN or invalid values
            if np.isnan(eeg_channel).any() or np.isinf(eeg_channel).any():
                print(f"{electrode_name}: Invalid data, skipping...")
                continue

            # Remove DC offset
            DataFilter.detrend(eeg_channel, DetrendOperations.CONSTANT.value)

            # Apply bandpass filter (1-50 Hz) to remove drift and high-freq noise
            DataFilter.perform_bandpass(eeg_channel, sr, 1.0, 50.0, 4,
                                       FilterTypes.BUTTERWORTH.value, 0)

            # Remove high amplitude artifacts (eye blinks, movement)
            if np.max(np.abs(eeg_channel)) >= 200:  # Threshold in microvolts
                print(f"{electrode_name}: High amplitude artifact detected, skipping...")
                continue

            # Calculate band powers for this single channel
            bands = DataFilter.get_avg_band_powers(data, [ch], sr, True)
            feature_vector = bands[0]  # [delta, theta, alpha, beta, gamma]

            alpha = feature_vector[2]
            beta = feature_vector[3]

            # Skip if alpha is too low (likely noise)
            if alpha < 0.1:
                print(f"{electrode_name}: Alpha power too low, skipping...")
                continue

            # Calculate BETA/ALPHA ratio
            ratio = beta / alpha

            # Apply smoothing per electrode
            electrode_history[electrode_name].append(ratio)
            if len(electrode_history[electrode_name]) > SMOOTHING_WINDOW:
                electrode_history[electrode_name].pop(0)
            smoothed_ratio = np.mean(electrode_history[electrode_name])

            # Calculate stress intensity (0-1 scale)
            stress_intensity = normalize_stress(smoothed_ratio)

            # Store processed data for this electrode
            electrode_data[electrode_name] = {
                'alpha': float(alpha),
                'beta': float(beta),
                'beta_alpha_ratio': float(smoothed_ratio),
                'stress_intensity': float(stress_intensity)
            }

        # Need at least 2 good electrodes
        if len(electrode_data) < 2:
            print("Too few valid electrodes, skipping...")
            time.sleep(1)
            continue

        # Insert/update data for each electrode using UPSERT
        for electrode_name, data_point in electrode_data.items():
            payload = {
                'electrode_name': electrode_name,
                'alpha': data_point['alpha'],
                'beta': data_point['beta'],
                'beta_alpha_ratio': data_point['beta_alpha_ratio'],
                'stress_intensity': data_point['stress_intensity'],
                'timestamp': 'now()'  # PostgreSQL function
            }

            try:
                # UPSERT: Insert or update if electrode_name already exists
                supabase.table("electrode_data").upsert(
                    payload,
                    on_conflict='electrode_name'
                ).execute()

                print(f"{electrode_name}: α={data_point['alpha']:.2f}, "
                      f"β={data_point['beta']:.2f}, "
                      f"ratio={data_point['beta_alpha_ratio']:.2f}, "
                      f"stress={data_point['stress_intensity']:.2f}")
            except Exception as e:
                print(f"Error upserting {electrode_name}: {e}")

        print("-" * 60)
        time.sleep(1)  # Sample every 1 second for responsive updates

except KeyboardInterrupt:
    print("\nStopping stream...")
finally:
    board.stop_stream()
    board.release_session()
