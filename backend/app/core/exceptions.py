from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Any
from backend.app.core.logging import logger

async def global_exception_handler(request: Request, exc: Any) -> JSONResponse:
    """
    Centralized exception handler to ensure consistent API error responses.
    Format: { "error": "CODE", "message": "Human readable message" }
    """

    # Handle FastAPI/Starlette HTTPExceptions
    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        status_code = exc.status_code
        detail = exc.detail

        # Map status codes to error codes
        error_code = "API_ERROR"
        if status_code == 401: error_code = "UNAUTHORIZED"
        elif status_code == 403: error_code = "FORBIDDEN"
        elif status_code == 404: error_code = "NOT_FOUND"
        elif status_code == 422: error_code = "VALIDATION_ERROR"
        elif status_code == 429: error_code = "TOO_MANY_REQUESTS"

        logger.warning(f"HTTP {status_code} - {error_code}: {detail} | Path: {request.url.path}")
        return JSONResponse(
            status_code=status_code,
            content={"error": error_code, "message": detail}
        )

    # Handle Pydantic validation errors (usually 422)
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"error": "VALIDATION_ERROR", "message": str(exc)}
        )

    # Handle all other unexpected server errors
    logger.exception(f"Unexpected Server Error: {str(exc)} | Path: {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred on our end."}
    )
