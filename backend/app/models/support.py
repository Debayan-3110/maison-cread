"""Support tickets + messages and SLA evidence (E11)."""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base, TimestampMixin
from backend.app.models.status import TicketPriority, TicketState


class Ticket(Base, TimestampMixin):
    __tablename__ = "support_tickets"
    __table_args__ = (Index("ix_tickets_state_priority", "state", "priority"),)

    id = Column(Integer, primary_key=True)
    reference = Column(String(20), unique=True, nullable=False, index=True)
    subject = Column(String(200), nullable=False)
    body = Column(Text, default="")
    category = Column(String(40), default="general")
    state = Column(String(24), default=TicketState.OPEN, nullable=False, index=True)
    priority = Column(String(16), default=TicketPriority.NORMAL, nullable=False)
    channel = Column(String(24), default="web")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    order_id = Column(String(24), nullable=True, index=True)
    assignee_id = Column(Integer, nullable=True, index=True)
    sla_due_at = Column(DateTime(timezone=True), nullable=True)
    first_response_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    csat_score = Column(Integer, nullable=True)
    tags = Column(JSON, default=list)

    messages = relationship("TicketMessage", back_populates="ticket",
                            cascade="all, delete-orphan", lazy="selectin",
                            order_by="TicketMessage.id")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "reference": self.reference, "subject": self.subject,
            "body": self.body, "category": self.category, "state": self.state,
            "priority": self.priority, "channel": self.channel,
            "orderId": self.order_id, "assigneeId": self.assignee_id,
            "csatScore": self.csat_score,
            "slaDueAt": self.sla_due_at.isoformat() if self.sla_due_at else None,
            "resolvedAt": self.resolved_at.isoformat() if self.resolved_at else None,
            "messages": [m.to_dict() for m in self.messages],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class TicketMessage(Base, TimestampMixin):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"),
                       nullable=False, index=True)
    author_id = Column(Integer, nullable=True)
    author_type = Column(String(16), default="customer")  # customer|agent|system
    body = Column(Text, default="")
    internal = Column(Boolean, default=False)
    attachments = Column(JSON, default=list)

    ticket = relationship("Ticket", back_populates="messages")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "authorType": self.author_type,
            "authorId": self.author_id,
            "body": self.body,
            "internal": bool(self.internal),
            "attachments": self.attachments or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
