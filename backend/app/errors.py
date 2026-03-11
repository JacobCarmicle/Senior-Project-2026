from __future__ import annotations

import logging
import uuid
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("tradeforge.api")


def _request_id(request: Request) -> str:
    rid = getattr(request.state, "request_id", None)
    return rid if isinstance(rid, str) and rid else str(uuid.uuid4())


def _error_payload(request: Request, *, code: str, message: str, detail: Any) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": detail,
        },
        "detail": detail,
        "request_id": _request_id(request),
    }


class RequestIDAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("request_failed", extra={"request_id": request_id, "path": request.url.path})
            raise

        response.headers["x-request-id"] = request_id
        logger.info(
            "request_complete",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
            },
        )
        return response


async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if exc.detail is not None else "Request failed"
    body = _error_payload(request, code="http_error", message=str(detail), detail=detail)
    response = JSONResponse(status_code=exc.status_code, content=body)
    response.headers["x-request-id"] = _request_id(request)
    return response


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    detail = exc.errors()
    body = _error_payload(
        request,
        code="validation_error",
        message="Validation failed",
        detail=detail,
    )
    response = JSONResponse(status_code=422, content=body)
    response.headers["x-request-id"] = _request_id(request)
    return response


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_exception", extra={"request_id": _request_id(request), "path": request.url.path})
    body = _error_payload(
        request,
        code="internal_error",
        message="Internal server error",
        detail="Internal server error",
    )
    response = JSONResponse(status_code=500, content=body)
    response.headers["x-request-id"] = _request_id(request)
    return response
