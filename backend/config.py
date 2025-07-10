import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration settings
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DAILY_REQUEST_LIMIT = int(os.getenv("DAILY_REQUEST_LIMIT", "1"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "50000")) 