"""板块版主模型"""

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class CategoryModerator(Base, TimestampMixin):
    """板块版主关联表"""

    __tablename__ = "category_moderators"
    __table_args__ = (
        UniqueConstraint("category_id", "user_id", name="uq_category_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categories.id"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True
    )
