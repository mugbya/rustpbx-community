"""标签模型"""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class Tag(Base, TimestampMixin):
    """标签表"""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)


class TopicTag(Base):
    """帖子-标签关联表"""

    __tablename__ = "topic_tags"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id"))
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"))
