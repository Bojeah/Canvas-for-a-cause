import logging
import resend

from app.core.config import EMAIL_FROM, RESEND_API_KEY
from app.models.artwork import Artwork
from app.models.bid import Bid
from app.models.user import User
from app.services.email_templates import build_outbid_email_html, build_welcome_email_html

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> None:
    """Send an email through Resend and swallow transport errors safely."""
    if not to:
        logger.warning("Email not sent: missing recipient")
        return
    if not RESEND_API_KEY:
        logger.warning("Email not sent: RESEND_API_KEY is not configured")
        return

    resend.api_key = RESEND_API_KEY

    try:
        resend.Emails.send(
            {
                "from": EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception:
        logger.error("Failed to send email via Resend", exc_info=True)


def notify_welcome_email(user: User) -> None:
    """Send a welcome email to a newly registered user."""
    if not user.email:
        return

    html = build_welcome_email_html(recipient_email=user.email)
    send_email(
        to=user.email,
        subject="Welcome to Canvas Bid Portal",
        html=html,
    )


def notify_outbid(previous_user: User | None, artwork: Artwork, new_bid: Bid) -> None:
    """Notify only the previous highest bidder when they are displaced by a new bid."""
    if previous_user is None:
        return
    if not previous_user.email:
        return
    if new_bid.user_id == previous_user.id:
        return

    html = build_outbid_email_html(
        artwork_id=artwork.id,
        artwork_title=artwork.title,
        new_bid_amount=new_bid.amount,
        currency=artwork.currency,
    )
    send_email(
        to=previous_user.email,
        subject=f"You've been outbid on {artwork.title}",
        html=html,
    )
