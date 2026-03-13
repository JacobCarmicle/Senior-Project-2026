import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.errors import (
    RequestIDAndLoggingMiddleware,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.routers.auth import router as auth_router
from app.routers.listings import router as listings_router
from app.routers.conversations import router as conversations_router
from app.routers.messages import router as messages_router
from app.routers.reviews import router as reviews_router
from app.routers.realtime import router as realtime_router
from app.routers.uploads import router as uploads_router
from app.routers.users import router as users_router

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="TradeForge Backend", version="0.1.0")

app.add_middleware(RequestIDAndLoggingMiddleware)

frontend_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Comma-separated origins for deployed frontends, e.g. Vercel URLs
extra_origins_raw = os.environ.get("FRONTEND_ORIGINS", "")
if extra_origins_raw:
    frontend_origins.extend([o.strip() for o in extra_origins_raw.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(reviews_router)
app.include_router(realtime_router)
app.include_router(uploads_router)
app.include_router(users_router)


@app.get("/health")
def health():
    return {"status": "ok"}
