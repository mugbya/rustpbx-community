"""用户 Schema"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    """用户信息响应"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    signature: Optional[str] = None
    role: str
    reputation: int
    is_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    """更新用户信息"""

    username: Optional[str] = Field(None, min_length=2, max_length=50)
    avatar: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    signature: Optional[str] = Field(None, max_length=200)
