"""主题帖模型（统一讨论、问答、文章、资源）"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class TopicType(str, enum.Enum):
    """帖子类型（分区）"""

    DISCUSSION = "discussion"  # 论坛
    QUESTION = "question"      # 问答
    ARTICLE = "article"        # 文章
    RESOURCE = "resource"      # 资源


class Topic(Base, TimestampMixin):
    """主题帖表，统一管理讨论/问答/文章/资源"""

    __tablename__ = "topics"
    __table_args__ = (
        # 列表页常用查询：按类型 + 板块筛选
        Index("ix_topics_type_deleted_category", "type", "is_deleted", "category_id"),
        # 个人中心常用查询：按类型 + 用户筛选
        Index("ix_topics_type_deleted_user", "type", "is_deleted", "user_id"),
        # 板块筛选
        Index("ix_topics_deleted_category", "is_deleted", "category_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    content: Mapped[str] = mapped_column(Text(length=16777215))  # MEDIUMTEXT
    content_type: Mapped[str] = mapped_column(String(20), default="markdown")
    type: Mapped[TopicType] = mapped_column(
        Enum(TopicType, values_callable=lambda e: [v.value for v in e]),
        default=TopicType.DISCUSSION, index=True
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
