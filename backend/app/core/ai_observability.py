import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger("ai_observability")

class AIObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only track chat endpoints to avoid pollution
        if not request.url.path.startswith("/api/v1/chat"):
            return await call_next(request)

        start_time = time.time()
        response: Response = await call_next(request)
        process_time = time.time() - start_time

        logger.info(
            f"AI Endpoint: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Latency: {process_time:.3f}s"
        )
        response.headers["X-AI-Latency"] = f"{process_time:.3f}s"
        return response
