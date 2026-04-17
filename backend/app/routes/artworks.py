from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.artwork import Artwork
from app.schemas.auction_window import AuctionWindowRead
from app.schemas.artwork import ArtworkRead
from app.services.auction_service import (
    close_expired_auction_window_task,
    get_current_auction_window,
    serialize_auction_window,
)

router = APIRouter(tags=["artworks"])


@router.get("/auction-window", response_model=AuctionWindowRead)
def get_auction_window(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
) -> dict:
    background_tasks.add_task(close_expired_auction_window_task)
    window = get_current_auction_window(db)
    return serialize_auction_window(window)


@router.get("/artworks", response_model=list[ArtworkRead])
def list_artworks(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
) -> list[Artwork]:
    # Offload window expiration checks to background to keep the GET request fast
    background_tasks.add_task(close_expired_auction_window_task)
    return db.query(Artwork).order_by(Artwork.created_at.desc()).all()


@router.get("/artworks/{artwork_id}", response_model=ArtworkRead)
def get_artwork(
    artwork_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
) -> Artwork:
    # Background execution avoids blocking the detail view
    background_tasks.add_task(close_expired_auction_window_task)
    artwork = db.get(Artwork, artwork_id)
    if artwork is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found"
        )
    return artwork
