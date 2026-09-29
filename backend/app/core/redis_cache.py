import time
import json
from typing import Optional, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger("redis_cache")

class RedisSemanticCacheMiddleware(BaseHTTPMiddleware):
    """
    High-speed caching for AI recommendations and vector embeddings.
    In a production environment, this would use 'redis-py' to connect to a Redis cluster.
    This implementation provides the logic for semantic caching.
    """
    def __init__(self, app, cache_ttl: int = 3600):
        super().__init__(app)
        self.cache_ttl = cache_ttl
        # Local memory fallback for demonstration (Replace with redis_client in production)
        self._local_cache = {}

    async def dispatch(self, request: Request, call_next):
        # Only cache specific AI read-only endpoints
        if request.method != "GET" or not request.url.path.startswith("/api/v1/chat/recommend"):
            return await call_next(request)

        # Create a unique cache key based on the query parameters
        cache_key = f"ai_cache:{request.url.path}:{hash(frozenset(request.query_params.items()))}"

        # 1. Try to retrieve from cache
        cached_response = self._local_cache.get(cache_key)
        if cached_response:
            entry = json.loads(cached_response)
            if time.time() < entry["expiry"]:
                logger.info(f"Cache HIT for {cache_key}")
                return Response(
                    content=entry["data"],
                    media_type="application/json",
                    headers={"X-Cache": "HIT"}
                )

        # 2. Cache MISS: Execute the request
        response = await call_next(request)

        # 3. Store the response in cache if it was successful
        if response.status_code == 200:
            # We need to read the response body to cache it
            # Since the response body is a stream, we consume it first
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk

            # Store in cache with TTL
            expiry = time.time() + self.cache_ttl
            self._local_cache[cache_key] = json.dumps({
                "expiry": expiry,
                "data": response_body.decode("utf-8")
            })

            # Re-create the response object because the body was consumed
            from fastapi.responses import Response as FastAPIResponse
            return FastAPIResponse(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )

        return response
