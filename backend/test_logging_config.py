import pytest
import logging
import structlog
from logging_config import configure_logging, get_logger

def test_configure_logging():
    # This might be tricky to test side effects, but we can check if it runs without error
    configure_logging()
    
    # Check if structlog is configured
    logger = structlog.get_logger("test")
    assert logger is not None

def test_get_logger():
    logger = get_logger("test_module")
    assert logger is not None
    # Check if it has the expected methods
    assert hasattr(logger, "info")
    assert hasattr(logger, "error")
    assert hasattr(logger, "debug")
