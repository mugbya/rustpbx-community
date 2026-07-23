"""认证 Schema"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    """注册请求"""

    email: EmailStr
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    """登录请求"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """令牌响应"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GitHubOAuthRequest(BaseModel):
    """GitHub OAuth 请求"""

    code: str


class GitHubOAuthResponse(BaseModel):
    """GitHub OAuth 响应"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool
