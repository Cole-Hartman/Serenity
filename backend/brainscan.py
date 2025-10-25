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

