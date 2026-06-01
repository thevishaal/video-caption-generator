import concurrent.futures
import logging
from django.db import close_old_connections

logger = logging.getLogger(__name__)

# Global thread pool executor with 4 workers for CPU/IO-bound video rendering tasks
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def run_in_background(fn, *args, **kwargs):
    """
    Executes a function in a background thread and ensures database connections
    are closed when complete to prevent leaks.
    """
    def wrapper():
        try:
            fn(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Error in background task {fn.__name__}: {e}")
        finally:
            close_old_connections()

    return _executor.submit(wrapper)
