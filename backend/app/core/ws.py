"""WebSocket hub for live inventory and order updates (E6.15, E15.3).

Replaces the previous single-list manager with channel multiplexing and
safe disconnect handling. Clients subscribe by connecting to
``/api/v1/ws/inventory`` (all stock moves) or ``/api/v1/ws/orders/{id}``.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Set

from fastapi import WebSocket, WebSocketDisconnect


class ChannelManager:
    def __init__(self) -> None:
        self._channels: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._channels.setdefault(channel, set()).add(websocket)

    async def disconnect(self, channel: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._channels.get(channel, set()).discard(websocket)

    def client_count(self, channel: str | None = None) -> int:
        if channel is not None:
            return len(self._channels.get(channel, set()))
        return sum(len(clients) for clients in self._channels.values())

    async def publish(self, channel: str, event: str, payload: Dict[str, Any]) -> int:
        message = json.dumps({"event": event, "channel": channel, "payload": payload})
        clients = list(self._channels.get(channel, set()))
        delivered = 0
        stale: List[WebSocket] = []
        for client in clients:
            try:
                await client.send_text(message)
                delivered += 1
            except Exception:
                stale.append(client)
        for client in stale:
            await self.disconnect(channel, client)
        return delivered


inventory_hub = ChannelManager()
order_hub = ChannelManager()

INVENTORY_CHANNEL = "inventory"


def order_channel(order_id: str) -> str:
    return f"order:{order_id}"


async def broadcast_stock_update(product_id: int, new_stock: int,
                                extra: Dict[str, Any] | None = None) -> int:
    """Backwards-compatible payload shape used by ``useInventorySocket``."""
    payload: Dict[str, Any] = {"product_id": product_id, "new_stock": new_stock}
    if extra:
        payload.update(extra)
    return await inventory_hub.publish(INVENTORY_CHANNEL, "STOCK_UPDATED", payload)


async def broadcast_order_update(order_id: str, status: str,
                                 extra: Dict[str, Any] | None = None) -> int:
    payload: Dict[str, Any] = {"order_id": order_id, "status": status}
    if extra:
        payload.update(extra)
    return await order_hub.publish(order_channel(order_id), "ORDER_UPDATED", payload)
