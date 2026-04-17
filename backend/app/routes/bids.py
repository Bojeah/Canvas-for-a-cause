from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.bid import Bid
from app.models.user import User
from app.schemas.bid import BidCreate, BidRead
from app.services.bidding_service import place_bid
from app.services.email_service import notify_outbid

router = APIRouter(tags=["bids"])


@router.post("/artworks/{artwork_id}/bid", response_model=BidRead, status_code=status.HTTP_201_CREATED)
def submit_bid(
    artwork_id: int,
    payload: BidCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Bid:
    """Route layer stays thin: place bid in service, schedule notification in background."""
    result = place_bid(
        db,
        artwork_id=artwork_id,
        user=current_user,
        amount=payload.amount,
        ip_address=request.client.host if request.client else None,
    )

    background_tasks.add_task(notify_outbid, result.previous_bidder, result.artwork, result.bid)

    return result.bid
