"""用户 API"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_pagination
from app.db.session import get_db
from app.models.post import Post
from app.models.thread import Thread, ThreadType
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse, PaginatedData
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


def _require_admin(current_user: User):
    """检查管理员权限"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可操作",
        )


# ===== 管理员接口 =====


class RoleUpdateRequest(BaseModel):
    role: str


class StatusUpdateRequest(BaseModel):
    is_active: bool


@router.get("", response_model=PaginatedData)
def list_users(
    keyword: str | None = Query(None),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取用户列表（仅管理员）"""
    _require_admin(current_user)
    query = db.query(User)
    if keyword:
        query = query.filter(
            or_(
                User.username.contains(keyword),
                User.email.contains(keyword),
            )
        )
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    items = [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "avatar": u.avatar,
            "role": u.role.value if isinstance(u.role, UserRole) else u.role,
            "reputation": u.reputation,
            "is_active": u.is_active,
            "github_username": u.github_username,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]

    return PaginatedData(
        items=items,
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
    )


@router.put("/{user_id}/role", response_model=ApiResponse)
def update_user_role(
    user_id: int,
    request: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """修改用户角色（仅管理员）"""
    _require_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    try:
        new_role = UserRole(request.role)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的角色")
    user.role = new_role
    db.commit()
    return ApiResponse(data={"role": user.role.value})


@router.put("/{user_id}/status", response_model=ApiResponse)
def update_user_status(
    user_id: int,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """禁用/启用用户（仅管理员）"""
    _require_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user.is_active = request.is_active
    db.commit()
    return ApiResponse(data={"is_active": user.is_active})


# ===== 用户公开接口 =====


@router.get("/{user_id}/stats", response_model=ApiResponse)
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """获取用户统计数据"""
    discussion_count = db.query(Thread).filter(
        Thread.user_id == user_id,
        Thread.type == ThreadType.DISCUSSION,
        Thread.is_deleted == False,  # noqa: E712
    ).count()
    question_count = db.query(Thread).filter(
        Thread.user_id == user_id,
        Thread.type == ThreadType.QUESTION,
        Thread.is_deleted == False,  # noqa: E712
    ).count()
    article_count = db.query(Thread).filter(
        Thread.user_id == user_id,
        Thread.type == ThreadType.ARTICLE,
        Thread.is_deleted == False,  # noqa: E712
    ).count()
    reply_count = db.query(Post).filter(
        Post.user_id == user_id,
        Post.is_deleted == False,  # noqa: E712
    ).count()

    # 获赞数 = 帖子获赞 + 回复获赞
    thread_likes = db.query(func.sum(Thread.like_count)).filter(
        Thread.user_id == user_id
    ).scalar() or 0
    post_likes = db.query(func.sum(Post.like_count)).filter(
        Post.user_id == user_id
    ).scalar() or 0
    total_likes = int(thread_likes) + int(post_likes)

    return ApiResponse(data={
        "discussion_count": discussion_count,
        "question_count": question_count,
        "article_count": article_count,
        "reply_count": reply_count,
        "like_count": total_likes,
    })


@router.get("/{user_id}", response_model=ApiResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """获取用户公开信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    return ApiResponse(data=UserResponse.model_validate(user).model_dump())


@router.put("/me", response_model=ApiResponse)
def update_me(
    request: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """更新当前用户信息"""
    # 检查用户名唯一性
    if request.username and request.username != current_user.username:
        if db.query(User).filter(User.username == request.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该用户名已被使用",
            )
        current_user.username = request.username

    if request.avatar is not None:
        current_user.avatar = request.avatar
    if request.bio is not None:
        current_user.bio = request.bio
    if request.signature is not None:
        current_user.signature = request.signature

    db.commit()
    db.refresh(current_user)
    return ApiResponse(data=UserResponse.model_validate(current_user).model_dump())
