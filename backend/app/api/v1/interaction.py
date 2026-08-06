"""互动 API：点赞、收藏、通知"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_pagination
from app.db.session import get_db
from app.models.interaction import (
    Favorite,
    Like,
    Notification,
    TargetType,
)
from app.models.post import Post
from app.models.topic import Topic
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedData
from pydantic import BaseModel

router = APIRouter()


class LikeRequest(BaseModel):
    """点赞请求"""

    target_type: str  # "topic" | "post"
    target_id: int


class NotificationResponse(BaseModel):
    """通知响应"""

    id: int
    type: str
    from_user_id: int | None = None
    content: str | None = None
    target_type: str | None = None
    target_id: int | None = None
    is_read: bool
    created_at: str


# ===== 点赞 =====


@router.post("/like", response_model=ApiResponse)
def toggle_like(
    request: LikeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """点赞/取消点赞"""
    try:
        target_type = TargetType(request.target_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的目标类型: {request.target_type}",
        )

    # 校验目标存在
    if target_type == TargetType.TOPIC:
        target = db.query(Topic).filter(Topic.id == request.target_id).first()
    else:
        target = db.query(Post).filter(Post.id == request.target_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="目标不存在",
        )

    # 查找是否已点赞
    existing = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.target_type == target_type,
        Like.target_id == request.target_id,
    ).first()

    if existing:
        # 取消点赞
        db.delete(existing)
        if target_type == TargetType.TOPIC:
            target.like_count = max(0, target.like_count - 1)
        else:
            target.like_count = max(0, target.like_count - 1)
        db.commit()
        return ApiResponse(data={"liked": False, "like_count": target.like_count})
    else:
        # 点赞
        like = Like(
            user_id=current_user.id,
            target_type=target_type,
            target_id=request.target_id,
        )
        db.add(like)
        target.like_count += 1
        db.commit()
        return ApiResponse(data={"liked": True, "like_count": target.like_count})


# ===== 收藏 =====


@router.post("/favorite", response_model=ApiResponse)
def toggle_favorite(
    request: LikeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """收藏/取消收藏"""
    try:
        target_type = TargetType(request.target_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的目标类型: {request.target_type}",
        )

    # 仅支持帖子收藏
    if target_type != TargetType.TOPIC:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持收藏帖子",
        )

    target = db.query(Topic).filter(Topic.id == request.target_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.target_type == target_type,
        Favorite.target_id == request.target_id,
    ).first()

    if existing:
        db.delete(existing)
        target.favorite_count = max(0, target.favorite_count - 1)
        db.commit()
        return ApiResponse(
            data={"favorited": False, "favorite_count": target.favorite_count}
        )
    else:
        fav = Favorite(
            user_id=current_user.id,
            target_type=target_type,
            target_id=request.target_id,
        )
        db.add(fav)
        target.favorite_count += 1
        db.commit()
        return ApiResponse(
            data={"favorited": True, "favorite_count": target.favorite_count}
        )


# ===== 通知 =====


@router.get("/notifications", response_model=PaginatedData[NotificationResponse])
def list_notifications(
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取通知列表"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    total = query.count()
    notifications = (
        query.order_by(Notification.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    items = [
        NotificationResponse(
            id=n.id,
            type=n.type.value,
            from_user_id=n.from_user_id,
            content=n.content,
            target_type=n.target_type,
            target_id=n.target_id,
            is_read=n.is_read,
            created_at=n.created_at.isoformat() if n.created_at else None,
        ).model_dump()
        for n in notifications
    ]

    return PaginatedData(
        items=items,
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
    )


@router.put("/notifications/{notification_id}/read", response_model=ApiResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """标记通知已读"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="通知不存在",
        )
    notification.is_read = True
    db.commit()
    return ApiResponse(message="已标记为已读")


@router.put("/notifications/read-all", response_model=ApiResponse)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """全部标记已读"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,  # noqa: E712
    ).update({Notification.is_read: True})
    db.commit()
    return ApiResponse(message="全部已标记为已读")


@router.get("/notifications/unread-count", response_model=ApiResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取未读通知数量"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,  # noqa: E712
    ).count()
    return ApiResponse(data={"count": count})
