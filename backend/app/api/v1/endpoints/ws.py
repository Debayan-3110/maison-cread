from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.core.websocket_manager import inventory_ws_manager
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/inventory")
async def websocket_inventory_endpoint(websocket: WebSocket):
    await inventory_ws_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive and listen for client heartbeats/messages
            # This prevents the connection from timing out
            await websocket.receive_text()
    except WebSocketDisconnect:
        inventory_ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        inventory_ws_manager.disconnect(websocket)
