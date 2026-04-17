from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import MetaData, Table, inspect, select, text

from app.core.config import ALLOWED_ORIGINS
from app.core.database import Base, engine
from app.models import auction_window, audit_log, artwork, bid, user  # noqa: F401
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.artworks import router as artworks_router
from app.routes.bids import router as bids_router

app = FastAPI(title="Charity Art Auction API", version="1.0.0")

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


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_artwork_images()


app.include_router(auth_router)
app.include_router(artworks_router)
app.include_router(bids_router)
app.include_router(admin_router)
