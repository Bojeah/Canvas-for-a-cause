from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import MetaData, Table, inspect, select, text

from app.core.config import ALLOWED_ORIGINS
from app.core.database import Base, engine, session_scope
from app.core.rate_limiter import limiter
from app.models import auction_window, audit_log, artwork, bid, user  # noqa: F401
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.artworks import router as artworks_router
from app.routes.bids import router as bids_router
from app.services.auction_service import ensure_default_auction_window


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


def _migrate_artwork_images() -> None:
    inspector = inspect(engine)
    if "artworks" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("artworks")}
    if "images" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE artworks ADD COLUMN images JSON"))

    if "image_url" not in columns:
        return

    metadata = MetaData()
    artworks_table = Table("artworks", metadata, autoload_with=engine)

    with engine.begin() as connection:
        rows = connection.execute(
            select(artworks_table.c.id, artworks_table.c.image_url, artworks_table.c.images).where(
                artworks_table.c.image_url.is_not(None)
            )
        ).all()

        for row in rows:
            if row.images:
                continue
            image_url = (row.image_url or "").strip()
            if not image_url:
                continue
            connection.execute(
                artworks_table.update()
                .where(artworks_table.c.id == row.id)
                .values(images=[{"url": image_url}])
            )


def _migrate_user_email_status() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "email_status" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN email_status VARCHAR(20) NOT NULL DEFAULT 'valid'"))


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_artwork_images()
    _migrate_user_email_status()
    with session_scope() as db:
        ensure_default_auction_window(db)
        db.commit()


app.include_router(auth_router)
app.include_router(artworks_router)
app.include_router(bids_router)
app.include_router(admin_router)
