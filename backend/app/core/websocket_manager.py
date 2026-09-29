from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class InventoryConnectionManager:
    def __init__(self):
        # Store active connections
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection established. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket connection closed. Total: {len(self.active_connections)}")

    async def broadcast_stock_update(self, product_id: int, new_stock: int):
        """
        Broadcasts a stock update event to all connected clients.
        """
        payload = json.dumps({
            "event": "STOCK_UPDATED",
            "payload": {
                "product_id": product_id,
                "new_stock": new_stock
            }
        })

        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected_clients.append(connection)

        # Clean up dead connections
        for client in disconnected_clients:
            self.disconnect(client)

inventory_ws_manager = InventoryConnectionManager()
