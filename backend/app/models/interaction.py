"""互动模型：点赞、收藏、通知"""

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
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TargetType(str, enum.Enum):
    """点赞/收藏目标类型"""

    THREAD = "thread"
    POST = "post"


class Like(Base):
    """点赞表"""

    __tablename__ = "likes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    target_type: Mapped[TargetType] = mapped_column(Enum(TargetType))
    target_id: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


class Favorite(Base):
    """收藏表"""

    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    target_type: Mapped[TargetType] = mapped_column(Enum(TargetType))
    target_id: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )


class NotificationType(str, enum.Enum):
    """通知类型"""

    REPLY = "reply"          # 回复
    LIKE = "like"            # 点赞
    FAVORITE = "favorite"    # 收藏
    MENTION = "mention"      # @提及
    SYSTEM = "system"        # 系统


class Notification(Base):
    """通知表"""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    from_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    target_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
