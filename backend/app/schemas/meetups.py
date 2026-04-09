from pydantic import BaseModel
from datetime import datetime

class MeetupCreateRequest(BaseModel):
    conversation_id: str
    receiver_id: str
    scheduled_at: datetime
    location: str | None = None

class MeetupStatusUpdateRequest(BaseModel):
    status: str  # pending, accepted, declined, cancelled

class MeetupResponse(BaseModel):
    id: str
    conversation_id: str
    proposer_id: str
    receiver_id: str
    scheduled_at: datetime
    location: str | None
    status: str
    created_at: datetime