"""认证 API：注册、登录、GitHub OAuth"""

from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    GitHubOAuthRequest,
    GitHubOAuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """邮箱注册"""
    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册",
        )
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户名已被使用",
        )

    # 创建用户
    user = User(
        email=request.email,
        username=request.username,
        password_hash=get_password_hash(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 生成令牌
    access_token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """邮箱登录"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用",
        )

    # 更新最后登录时间
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/github", response_model=GitHubOAuthResponse)
async def github_oauth(
    request: GitHubOAuthRequest, db: Session = Depends(get_db)
):
    """GitHub OAuth 登录/注册"""
    # 用 code 换取 access_token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": request.code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()
        if "access_token" not in token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="GitHub 授权失败",
            )

        github_token = token_data["access_token"]

        # 获取 GitHub 用户信息
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        github_user = user_resp.json()

    if "id" not in github_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="获取 GitHub 用户信息失败",
        )

    github_id = str(github_user["id"])
    github_email = github_user.get("email")
    github_username = github_user.get("login", "")
    github_avatar = github_user.get("avatar_url", "")

    # 查找已绑定的用户
    user = db.query(User).filter(User.github_id == github_id).first()
    is_new_user = False

    if user:
        # 已绑定，直接登录
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
    else:
        # 未绑定，创建新用户
        if not github_email:
            # GitHub 未公开邮箱，用 id 构造默认邮箱
            github_email = f"github_{github_id}@rustpbx.local"

        # 检查邮箱是否被其他用户使用
        existing = db.query(User).filter(User.email == github_email).first()
        if existing:
            # 绑定到已有用户
            existing.github_id = github_id
            existing.github_username = github_username
            existing.avatar = existing.avatar or github_avatar
            user = existing
        else:
            # 创建新用户
            user = User(
                email=github_email,
                username=f"github_{github_username}_{github_id[:6]}",
                github_id=github_id,
                github_username=github_username,
                avatar=github_avatar,
                is_verified=True,
            )
            db.add(user)
            is_new_user = True

        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=str(user.id))
    return GitHubOAuthResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user,
    )


@router.get("/me", response_model=ApiResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """获取当前登录用户信息"""
    return ApiResponse(data=UserResponse.model_validate(current_user).model_dump())
