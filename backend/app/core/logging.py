from loguru import logger
import sys
from pathlib import Path

# Configure logging directory
LOG_DIR = Path("C:/Users/debay/Downloads/E-commerce/backend/logs")
LOG_DIR.mkdir(exist_ok=True)

# Remove default handler
logger.remove()

# 1. Console Handler (Colored, Human-readable)
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

# 2. File Handler (Structured, for Auditing)
logger.add(
    LOG_DIR / "app.log",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
    level="INFO"
)

# 3. Security Audit Log (Only WARNING and above)
logger.add(
    LOG_DIR / "security_audit.log",
    filter=lambda record: "SECURITY" in record["extra"],
    format="{time:YYYY-MM-DD HH:mm:ss} | SECURITY | {message}",
    level="WARNING"
)

def get_security_logger():
    """Returns a logger specifically for security events."""
    return logger.bind(SECURITY=True)
