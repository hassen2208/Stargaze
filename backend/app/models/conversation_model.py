from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func

from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    prompt = Column(String)

    response = Column(String)

    latency = Column(Float)

    tokens_used = Column(Integer)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )