import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import ALLOWED_ORIGINS
from app.core.database import session_scope
from app.core.rate_limiter import limiter
from app.models import auction_window, audit_log, artwork, bid, user  # noqa: F401
from app.models.auction_window import AuctionWindow
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.artworks import router as artworks_router
from app.routes.bids import router as bids_router
from app.services.auction_service import ensure_default_auction_window


logger = logging.getLogger(__name__)


def _custom_rate_limit_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


app = FastAPI(title="Charity Art Auction API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _custom_rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Schema lifecycle is managed by Alembic migrations.
    try:
        with session_scope() as db:
            bind = db.get_bind()
            if bind is None or not inspect(bind).has_table(AuctionWindow.__tablename__):
                logger.warning("Skipping auction window initialization because the schema has not been created yet")
                return

            ensure_default_auction_window(db)
            db.commit()
    except SQLAlchemyError:
        logger.warning("Skipping auction window initialization because the database is unavailable", exc_info=True)


app.include_router(auth_router)
app.include_router(artworks_router)
app.include_router(bids_router)
app.include_router(admin_router)