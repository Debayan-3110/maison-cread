"""
Vercel Multi-Service API Gateway for Maison Cread.
Receives public traffic at /api/* and routes to internal backend service via BACKEND_URL binding.
In standalone mode, falls back to direct in-process FastAPI app execution.
"""
import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
import httpx

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# BACKEND_URL binding injected by Vercel Services
BACKEND_URL = os.environ.get("BACKEND_URL", "").rstrip("/")

if BACKEND_URL:
    app = FastAPI(
        title="Maison Cread API Gateway",
        description="Public API Gateway proxying requests to internal backend service",
        version="2.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def proxy_gateway(request: Request, path: str):
        target_path = path if path.startswith("api/") else f"api/{path}" if path else "api"
        target_url = f"{BACKEND_URL}/{target_path}"
        if request.url.query:
            target_url = f"{target_url}?{request.url.query}"

        client = httpx.AsyncClient(timeout=60.0)
        req_headers = dict(request.headers)
        req_headers.pop("host", None)
        req_headers.pop("content-length", None)
        body = await request.body()

        rp_req = client.build_request(
            request.method,
            target_url,
            headers=req_headers,
            content=body,
        )
        rp_resp = await client.send(rp_req, stream=True)

        return StreamingResponse(
            rp_resp.aiter_raw(),
            status_code=rp_resp.status_code,
            headers=dict(rp_resp.headers),
            background=client.aclose,
        )
else:
    # Direct standalone execution
    os.environ.setdefault("VERCEL", "1")
    from backend.main import app
