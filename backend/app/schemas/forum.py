"""论坛 Schema（帖子、回复、板块）"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.thread import ThreadType


class CategoryResponse(BaseModel):
    """板块响应"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int
    thread_count: int
    parent_id: Optional[int] = None


class AuthorBrief(BaseModel):
    """作者简要信息"""

    id: int
    username: str
    avatar: Optional[str] = None


class ThreadListItem(BaseModel):
    """帖子列表项"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: ThreadType
    category_id: Optional[int] = None
    author: AuthorBrief
    view_count: int
    reply_count: int
    like_count: int
    favorite_count: int
    is_pinned: bool
    is_essential: bool
    is_solved: bool = False
    created_at: datetime
    last_reply_at: Optional[datetime] = None


class ThreadDetail(BaseModel):
    """帖子详情"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    content_type: str
    type: ThreadType
    category_id: Optional[int] = None
    author: AuthorBrief
    view_count: int
    reply_count: int
    like_count: int
    favorite_count: int
    is_pinned: bool
    is_essential: bool
    is_locked: bool
    is_solved: bool = False
    tags: List[str] = []
    resource_url: Optional[str] = None
    resource_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_reply_at: Optional[datetime] = None
    last_reply_user_id: Optional[int] = None


class ThreadCreate(BaseModel):
    """发帖请求"""

    title: str = Field(min_length=2, max_length=255)
    content: str = Field(min_length=1)
    content_type: str = "markdown"
    type: ThreadType = ThreadType.DISCUSSION
    category_id: Optional[int] = None
    tags: List[str] = Field(default=[], max_length=5)
    resource_url: Optional[str] = None
    resource_type: Optional[str] = None


class ThreadUpdate(BaseModel):
    """编辑帖子"""

    title: Optional[str] = Field(None, min_length=2, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = Field(None, max_length=5)


class PostResponse(BaseModel):
    """回复响应"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    thread_id: int
    author: AuthorBrief
    content: str
    content_type: str
    floor: int
    parent_id: Optional[int] = None
    like_count: int
    created_at: datetime


class PostCreate(BaseModel):
    """回复请求"""

    content: str = Field(min_length=1)
    parent_id: Optional[int] = None
