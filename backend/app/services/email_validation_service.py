import logging
import re
from typing import Literal

import httpx

from app.core.config import HUNTER_API_KEY, HUNTER_EMAIL_VERIFY_URL

logger = logging.getLogger(__name__)

EmailValidationStatus = Literal["valid", "risky", "invalid", "unknown"]
_EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$")
_EMAIL_VALIDATION_TIMEOUT_SECONDS = 5.0


def _is_valid_email_format(email: str) -> bool:
    return bool(_EMAIL_PATTERN.match(email))


def validate_email_for_signup(email: str) -> EmailValidationStatus:
    """Validate email format and deliverability for signup only."""
    normalized_email = (email or "").strip().lower()
    if not _is_valid_email_format(normalized_email):
        return "invalid"

    if not HUNTER_API_KEY:
        logger.warning("Email validation API key is missing; defaulting signup status to unknown")
        return "unknown"

    try:
        response = httpx.get(
            HUNTER_EMAIL_VERIFY_URL,
            params={"email": normalized_email, "api_key": HUNTER_API_KEY},
            timeout=_EMAIL_VALIDATION_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception:
        logger.error("Email validation API request failed during signup", exc_info=True)
        return "unknown"

    if not isinstance(payload, dict):
        return "unknown"

    data = payload.get("data")
    if not isinstance(data, dict):
        return "unknown"

    provider_status = str(data.get("status", "")).strip().lower()
    if provider_status == "valid":
        return "valid"
    if provider_status in {"invalid", "disposable"}:
        return "invalid"
    if provider_status in {"risky", "accept_all", "webmail", "unknown"}:
        return "risky"

    return "risky"
