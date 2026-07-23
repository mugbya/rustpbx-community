"""模型导出"""

from app.models.category import Category
from app.models.interaction import (
    Favorite,
    Like,
    Notification,
    NotificationType,
    TargetType,
)
from app.models.post import Post
from app.models.tag import Tag, ThreadTag
from app.models.thread import Thread, ThreadType
from app.models.user import User, UserRole

__all__ = [
    "Category",
    "Favorite",
    "Like",
    "Notification",
    "NotificationType",
    "Post",
    "Tag",
    "TargetType",
    "Thread",
    "ThreadTag",
    "ThreadType",
    "User",
    "UserRole",
]
