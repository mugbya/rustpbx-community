"""用户模型"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class UserRole(str, enum.Enum):
    """用户角色"""

    USER = "user"          # 普通用户
    MODERATOR = "moderator"  # 版主
    ADMIN = "admin"        # 管理员


class User(Base, TimestampMixin):
    """用户表"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    # OAuth 用户可能没有密码，所以允许为空
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signature: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.USER, server_default="user"
    )
    reputation: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    # GitHub OAuth 绑定
    github_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, unique=True
    )
    github_username: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="1"
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="0"
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
