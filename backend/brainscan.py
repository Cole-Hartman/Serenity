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

print(f"Streaming EEG data... Sampling rate: {sr} Hz")
print(f"EEG channels: {eeg}")
print("Waiting for headset to settle (30 seconds)...")
time.sleep(30)  # Let headset stabilize

# Store recent ratios for smoothing
recent_ratios = []
SMOOTHING_WINDOW = 5

try:
    while True:
        # Get 4 seconds of data for better frequency resolution
        data = board.get_current_board_data(1024)
        
        # Check if we have enough data
        if data.shape[1] < 512:
            print(f"Insufficient data: {data.shape[1]} samples, skipping...")
            time.sleep(1)
            continue
        
        # Process each EEG channel
        valid_channels = []
        for ch in eeg:
            eeg_channel = data[ch, :]
            
            # Check for NaN or invalid values
            if np.isnan(eeg_channel).any() or np.isinf(eeg_channel).any():
                continue
            
            # Remove DC offset
            DataFilter.detrend(eeg_channel, DetrendOperations.CONSTANT.value)
            
            # Apply bandpass filter (1-50 Hz) to remove drift and high-freq noise
            DataFilter.perform_bandpass(eeg_channel, sr, 1.0, 50.0, 4, 
                                       FilterTypes.BUTTERWORTH.value, 0)
            
            # Remove high amplitude artifacts (eye blinks, movement)
            if np.max(np.abs(eeg_channel)) < 200:  # Threshold in microvolts
                valid_channels.append(ch)
        
        # Need at least 2 good channels
        if len(valid_channels) < 2:
            print("Too many artifacts, skipping...")
            time.sleep(1)
            continue
        
        # Calculate band powers from clean channels only
        bands = DataFilter.get_avg_band_powers(data, valid_channels, sr, True)
        feature_vector = bands[0]  # [delta, theta, alpha, beta, gamma]
        
        alpha = feature_vector[2]
        beta = feature_vector[3]
        
        # Calculate BETA/ALPHA ratio (not alpha/beta!)
        ratio = beta / alpha if alpha > 0 else 0
        
        # Apply smoothing
        recent_ratios.append(ratio)
        if len(recent_ratios) > SMOOTHING_WINDOW:
            recent_ratios.pop(0)
        smoothed_ratio = np.mean(recent_ratios)
        
        payload = {
            "alpha": float(alpha),
            "beta": float(beta),
            "beta_alpha_ratio": float(smoothed_ratio)
        }

        supabase.table("brain_data").insert(payload).execute()
        print(f"Alpha: {alpha:.2f}, Beta: {beta:.2f}, Ratio: {smoothed_ratio:.2f}")        

        time.sleep(2)  # Sample every 2 seconds instead of 1
        
except KeyboardInterrupt:
    print("\nStopping stream...")
finally:
    board.stop_stream()
    board.release_session()
