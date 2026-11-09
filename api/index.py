"""
Vercel Serverless Function Entrypoint for Maison Cread FastAPI Backend.
Handles all /api/* requests on Vercel Serverless runtime.
"""
import sys
import os
from pathlib import Path

# Add project root directory to Python path so `backend` can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure VERCEL environment flag is detected
os.environ.setdefault("VERCEL", "1")

from backend.main import app
