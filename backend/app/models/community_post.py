"""社区建设帖子模型"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class CommunityPost(Base, TimestampMixin):
    """社区建设帖子表（独立于 topics）"""

    __tablename__ = "community_posts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(String(20), default="markdown")
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    reply_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    like_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    last_reply_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_reply_user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class CommunityReply(Base, TimestampMixin):
    """社区建设回复表"""

    __tablename__ = "community_replies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("community_posts.id"), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 楼中楼
    floor: Mapped[int] = mapped_column(Integer, default=1)
    like_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
