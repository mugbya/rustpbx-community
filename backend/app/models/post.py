"""回复/帖子内容模型"""

from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class Post(Base, TimestampMixin):
    """回复表"""

    __tablename__ = "posts"
    __table_args__ = (
        # 回复列表常用查询：按帖子 + 未删除 + 楼层排序
        Index("ix_posts_thread_deleted_floor", "thread_id", "is_deleted", "floor"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text(length=16777215))  # MEDIUMTEXT
    content_type: Mapped[str] = mapped_column(String(20), default="markdown")
    floor: Mapped[int] = mapped_column(Integer, default=1)  # 楼层
    # 楼中楼回复
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("posts.id"), nullable=True
    )
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
