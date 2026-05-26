from loguru import logger
import sys
from pathlib import Path


# Crear carpeta logs si no existe
Path("logs").mkdir(exist_ok=True)

# Remueve logger por defecto
logger.remove()

# Logger consola
logger.add(
    sys.stdout,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level}</level> | "
        "<cyan>{name}</cyan>:"
        "<cyan>{function}</cyan>:"
        "<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    ),
    level="INFO",
    colorize=True
)

# Logger archivo
logger.add(
    "logs/stargaze.log",
    rotation="10 MB",
    retention="7 days",
    compression="zip",
    level="INFO",
    encoding="utf-8"
)