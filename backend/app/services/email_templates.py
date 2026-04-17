from app.core.config import FRONTEND_URL


def _base_template(*, heading: str, body_html: str, cta_label: str, cta_href: str) -> str:
    """Build a consistent HTML wrapper used by all transactional emails."""
    return f"""
    <div style=\"background:#f5f7fb;padding:24px;font-family:Arial,sans-serif;color:#111827;\">
      <div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;\">
        <div style=\"padding:24px;\">
          <h2 style=\"margin:0 0 12px;font-size:22px;line-height:1.3;\">{heading}</h2>
          <div style=\"font-size:15px;line-height:1.6;color:#374151;\">{body_html}</div>
          <p style=\"margin:24px 0 0;\">
            <a href=\"{cta_href}\" style=\"display:inline-block;background:#0f2f5f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;\">{cta_label}</a>
          </p>
        </div>
      </div>
    </div>
    """.strip()


def build_welcome_email_html(*, recipient_email: str) -> str:
    """Generate the welcome email body sent right after successful registration."""
    body = (
        f"<p>Welcome to Canvas Bid Portal, <strong>{recipient_email}</strong>.</p>"
        "<p>Your bidder account is ready. You can now explore live auctions and place bids securely.</p>"
    )
    return _base_template(
        heading="Welcome to Canvas Bid Portal",
        body_html=body,
        cta_label="Go to Auction",
        cta_href=f"{FRONTEND_URL}/artworks",
    )


def build_outbid_email_html(*, artwork_id: int, artwork_title: str, new_bid_amount: int) -> str:
    """Generate an outbid notification with artwork details and a direct CTA back to bidding."""
    body = (
        f"<p>You were outbid on <strong>{artwork_title}</strong>.</p>"
        f"<p>The new highest bid is <strong>{new_bid_amount}</strong>.</p>"
        "<p>If you're still interested, return to the auction and place a higher bid.</p>"
    )
    return _base_template(
        heading="You've been outbid",
        body_html=body,
        cta_label="View Auction",
        cta_href=f"{FRONTEND_URL}/artwork/{artwork_id}",
    )
