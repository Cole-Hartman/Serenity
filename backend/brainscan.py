"""
Unified EEG Scanner for Muse 2
Streams data to both per-electrode (electrode_data) and aggregated (brain_data) tables
"""
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

print("="*70)
print("UNIFIED EEG SCANNER - Muse 2")
print("="*70)
print(f"Streaming EEG data... Sampling rate: {sr} Hz")
print(f"EEG channels: {eeg}")
print(f"Electrode mapping: {ELECTRODE_NAMES}")
print("\nWriting to:")
print("  • electrode_data table (per-electrode, for brain visualization)")
print("  • brain_data table (aggregated, for historical tracking)")
print("="*70)
print("\nWaiting for headset to settle (30 seconds)...")
time.sleep(30)  # Let headset stabilize

# Store recent ratios for smoothing
electrode_history = {name: [] for name in ELECTRODE_NAMES.values()}
aggregate_history = []
SMOOTHING_WINDOW = 3  # Per-electrode smoothing
AGGREGATE_SMOOTHING = 5  # Aggregate smoothing

# Stress intensity calibration
MIN_RATIO = 0.5   # Ratios below this = 0 stress
MAX_RATIO = 3.0   # Ratios above this = 1.0 stress

def normalize_stress(ratio):
    """Convert beta/alpha ratio to 0-1 stress intensity scale"""
    if ratio < MIN_RATIO:
        return 0.0
    elif ratio > MAX_RATIO:
        return 1.0
    else:
        return (ratio - MIN_RATIO) / (MAX_RATIO - MIN_RATIO)

try:
    while True:
        # Get 2 seconds of data for better frequency resolution
        # Muse 2 samples at 256 Hz, so 2 seconds = 512 samples
        data = board.get_current_board_data(1024)

        # Check if we have enough data (at least 1 second worth)
        if data.shape[1] < 512:
            print(f"⚠️  Insufficient data: {data.shape[1]} samples, skipping...")
            time.sleep(0.5)
            continue

        # Process each electrode separately
        electrode_data = {}
        valid_channels = []

        for ch in eeg:
            electrode_name = ELECTRODE_NAMES[ch]
            eeg_channel = data[ch, :].copy()  # Make a copy for processing

            # Check for NaN or invalid values
            if np.isnan(eeg_channel).any() or np.isinf(eeg_channel).any():
                print(f"⚠️  {electrode_name}: Invalid data, skipping...")
                continue

            # Remove DC offset
            DataFilter.detrend(eeg_channel, DetrendOperations.CONSTANT.value)

            # Apply bandpass filter (1-50 Hz) to remove drift and high-freq noise
            DataFilter.perform_bandpass(eeg_channel, sr, 1, 50.0, 4,
                                       FilterTypes.BUTTERWORTH.value, 0)

            # Check for extreme amplitude artifacts (eye blinks, movement)
            # Most real artifacts are >1000 µV, normal EEG is 10-200 µV
            max_amplitude = np.max(np.abs(eeg_channel))
            if max_amplitude >= 500:  # Threshold in microvolts
                print(f"⚠️  {electrode_name}: High amplitude artifact detected ({max_amplitude:.1f} µV), skipping...")
                continue

            # Calculate band powers for this single channel
            bands = DataFilter.get_avg_band_powers(data, [ch], sr, True)
            feature_vector = bands[0]  # [delta, theta, alpha, beta, gamma]

            delta = feature_vector[0]
            theta = feature_vector[1]
            alpha = feature_vector[2]
            beta = feature_vector[3]
            gamma = feature_vector[4]

            print(f"  Debug {electrode_name}: delta={delta:.4f}, theta={theta:.4f}, alpha={alpha:.4f}, beta={beta:.4f}, gamma={gamma:.4f}")

            # Skip if delta > 0.5 (user is drowsy/sleeping, not stressed)
            if delta > 0.5:
                print(f"⚠️  {electrode_name}: High delta detected ({delta:.4f}), user appears drowsy/sleeping, skipping...")
                continue

            # Skip if alpha is too low (likely complete signal loss or disconnection)
            # Lowered threshold to 0.03 to accept eyes-open states (alpha naturally low)
            if alpha < 0.03:
                print(f"⚠️  {electrode_name}: Alpha power too low ({alpha:.4f}), likely poor contact, skipping...")
                continue

            # Calculate traditional BETA/ALPHA ratio
            beta_alpha_ratio = beta / alpha if alpha > 0 else 0

            # Calculate BETA/THETA ratio as additional stress indicator
            beta_theta_ratio = beta / theta if theta > 0 else 0

            # Multi-metric stress detection (weighted composite score)
            # Normalize beta power to 0-1 range (typical beta is 0.05-0.35)
            normalized_beta = min(max((beta - 0.05) / 0.30, 0), 1)

            # Normalize beta/theta ratio to 0-1 (typical range 0.5-3.0)
            normalized_beta_theta = min(max((beta_theta_ratio - 0.5) / 2.5, 0), 1)

            # Normalize beta/alpha ratio to 0-1 (typical range 0.5-3.0)
            normalized_beta_alpha = min(max((beta_alpha_ratio - 0.5) / 2.5, 0), 1)

            # Weighted composite stress score
            # Weights: beta/theta (40%), beta power (30%), beta/alpha (20%), asymmetry (10% - calculated later)
            composite_stress = (
                0.40 * normalized_beta_theta +
                0.30 * normalized_beta +
                0.20 * normalized_beta_alpha
            )

            # Apply smoothing to composite stress
            electrode_history[electrode_name].append(composite_stress)
            if len(electrode_history[electrode_name]) > SMOOTHING_WINDOW:
                electrode_history[electrode_name].pop(0)
            smoothed_stress = np.mean(electrode_history[electrode_name])

            # Clamp to 0-1 range
            stress_intensity = min(max(smoothed_stress, 0), 1)

            # Store processed data for this electrode
            electrode_data[electrode_name] = {
                'alpha': float(alpha),
                'beta': float(beta),
                'theta': float(theta),
                'beta_alpha_ratio': float(beta_alpha_ratio),
                'beta_theta_ratio': float(beta_theta_ratio),
                'stress_intensity': float(stress_intensity)
            }

            # Track valid channels for aggregate calculation
            valid_channels.append(ch)

        # Need at least 1 good electrode
        if len(electrode_data) < 1:
            print("⚠️  No valid electrodes, skipping...")
            time.sleep(1)
            continue

        print(f"\n📊 Processing {len(electrode_data)} electrode(s):")

        # ===== 1. Write per-electrode data (for brain visualization) =====
        for electrode_name, data_point in electrode_data.items():
            payload = {
                'electrode_name': electrode_name,
                'alpha': data_point['alpha'],
                'beta': data_point['beta'],
                'beta_alpha_ratio': data_point['beta_alpha_ratio'],
                'stress_intensity': data_point['stress_intensity'],
                'timestamp': 'now()'
            }

            try:
                # UPSERT: Insert or update if electrode_name already exists
                supabase.table("electrode_data").upsert(
                    payload,
                    on_conflict='electrode_name'
                ).execute()

                # Determine stress level emoji
                stress = data_point['stress_intensity']
                if stress > 0.7:
                    emoji = "🔴"
                elif stress > 0.4:
                    emoji = "🟡"
                else:
                    emoji = "🟢"

                print(f"  {emoji} {electrode_name}: α={data_point['alpha']:5.2f}, "
                      f"β={data_point['beta']:5.2f}, "
                      f"ratio={data_point['beta_alpha_ratio']:4.2f}, "
                      f"stress={stress:4.2f}")
            except Exception as e:
                print(f"  ❌ Error upserting {electrode_name}: {e}")

        # ===== 2. Write aggregated data (for historical tracking) =====
        # Only compute aggregate if we have 2+ electrodes for meaningful statistics
        if len(valid_channels) >= 2:
            try:
                # Calculate aggregate band powers from all valid channels
                aggregate_bands = DataFilter.get_avg_band_powers(data, valid_channels, sr, True)
                aggregate_features = aggregate_bands[0]

                aggregate_theta = aggregate_features[1]
                aggregate_alpha = aggregate_features[2]
                aggregate_beta = aggregate_features[3]

                # Calculate ratios
                aggregate_beta_alpha_ratio = aggregate_beta / aggregate_alpha if aggregate_alpha > 0 else 0
                aggregate_beta_theta_ratio = aggregate_beta / aggregate_theta if aggregate_theta > 0 else 0

                # Apply smoothing to beta/alpha ratio
                aggregate_history.append(aggregate_beta_alpha_ratio)
                if len(aggregate_history) > AGGREGATE_SMOOTHING:
                    aggregate_history.pop(0)
                smoothed_aggregate = np.mean(aggregate_history)

                aggregate_payload = {
                    "alpha": float(aggregate_alpha),
                    "beta": float(aggregate_beta),
                    "theta": float(aggregate_theta),
                    "beta_alpha_ratio": float(smoothed_aggregate),
                    "beta_theta_ratio": float(aggregate_beta_theta_ratio)
                }

                supabase.table("brain_data").insert(aggregate_payload).execute()
                print(f"\n  📈 Aggregate ({len(valid_channels)} channels): α={aggregate_alpha:5.2f}, "
                      f"β={aggregate_beta:5.2f}, θ={aggregate_theta:5.2f}, "
                      f"β/α={smoothed_aggregate:4.2f}, β/θ={aggregate_beta_theta_ratio:4.2f}")

            except Exception as e:
                print(f"  ❌ Error inserting aggregate data: {e}")
        else:
            print(f"\n  ⚠️  Skipping aggregate (only {len(valid_channels)} channel, need 2+)")

        print("-" * 70)
        time.sleep(1)  # Sample every 1 second for responsive updates

except KeyboardInterrupt:
    print("\n\n" + "="*70)
    print("Stopping stream...")
    print("="*70)
finally:
    board.stop_stream()
    board.release_session()
    print("✅ Session ended. Thank you!")
