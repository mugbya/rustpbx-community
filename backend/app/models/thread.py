"""主题帖模型（统一讨论、问答、文章、资源）"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class ThreadType(str, enum.Enum):
    """帖子类型"""

    DISCUSSION = "discussion"  # 讨论
    QUESTION = "question"      # 问答
    ARTICLE = "article"        # 文章
    RESOURCE = "resource"      # 资源


class Thread(Base, TimestampMixin):
    """主题帖表，统一管理讨论/问答/文章/资源"""

    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    content: Mapped[str] = mapped_column(Text(length=16777215))  # MEDIUMTEXT
    content_type: Mapped[str] = mapped_column(String(20), default="markdown")
    type: Mapped[ThreadType] = mapped_column(
        Enum(ThreadType), default=ThreadType.DISCUSSION, index=True
    )

    # 关联
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id"), nullable=True, index=True
    )

    # 统计
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    reply_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    favorite_count: Mapped[int] = mapped_column(Integer, default=0)

    # 状态
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_essential: Mapped[bool] = mapped_column(Boolean, default=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # 问答专用字段
    is_solved: Mapped[bool] = mapped_column(Boolean, default=False)
    accepted_answer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("posts.id"), nullable=True
    )

    # 最后回复
    last_reply_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    last_reply_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # 资源专用字段
    resource_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    resource_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # file / config / script
