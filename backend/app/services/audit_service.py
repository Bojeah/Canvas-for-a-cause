from datetime import date, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def _json_safe_metadata(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _json_safe_metadata(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe_metadata(item) for item in value]
    return value


def create_audit_log(
    db: Session,
    *,
    user_id: int | None,
    action_type: str,
    entity_type: str,
    entity_id: int | None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    safe_metadata = _json_safe_metadata(metadata or {})
    audit_log = AuditLog(
        user_id=user_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=safe_metadata,
        ip_address=ip_address,
    )
    db.add(audit_log)
    db.flush()
    return audit_log
