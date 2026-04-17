from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    action_type: str
    entity_type: str
    entity_id: int | None
    metadata_json: dict
    ip_address: str | None
    timestamp: datetime
