import json
import time
from typing import Dict, Any
# Assuming redis_client is available in the core module
# from backend.app.core.redis import redis_client

async def log_user_event(event_type: str, user_id: str, payload: Dict[str, Any]):
    """
    Logs user behavioral events (e.g., 'cart_add', 'view_item') to a Redis Stream.
    This enables real-time analytics and customer segmentation.
    """
    event_data = {
        "event_type": event_type,
        "user_id": user_id,
        "timestamp": time.time(),
        "payload": json.dumps(payload)
    }

    # In a real production environment with Redis installed:
    # await redis_client.xadd("stream:user_events", event_data)

    # For the current implementation, we log to the system logger as a proxy
    import logging
    logger = logging.getLogger("event_stream")
    logger.info(f"EVENT_STREAM: {event_data}")
