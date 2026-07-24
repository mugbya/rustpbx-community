"""社区建设 API（独立模块）"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_optional_user, get_pagination
from app.db.session import get_db
from app.models.community_post import CommunityPost, CommunityReply
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse, PaginatedData

router = APIRouter()


# ===== 数据结构 =====


class AuthorBrief(BaseModel):
    """作者简要信息"""

    id: int
    username: str
    avatar: str | None = None


class CommunityPostCreate(BaseModel):
    """创建帖子请求"""

    title: str
    content: str


class CommunityPostUpdate(BaseModel):
    """编辑帖子请求"""

    title: str | None = None
    content: str | None = None


class CommunityReplyCreate(BaseModel):
    """创建回复请求"""

    content: str
    parent_id: int | None = None


# ===== 辅助函数 =====


def _get_author(db: Session, user_id: int) -> AuthorBrief:
    """获取作者简要信息（单条查询）"""
    user = db.query(User).filter(User.id == user_id).first()
    return AuthorBrief(
        id=user.id,
        username=user.username,
        avatar=user.avatar,
    )


def _batch_authors(db: Session, user_ids: set) -> dict:
    """批量获取作者信息，避免 N+1 查询"""
    if not user_ids:
        return {}
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    return {u.id: u for u in users}


def _author_from_map(user_map: dict, user_id: int) -> AuthorBrief:
    """从用户字典中获取作者信息"""
    u = user_map.get(user_id)
    return AuthorBrief(
        id=u.id if u else 0,
        username=u.username if u else "未知用户",
        avatar=u.avatar if u else None,
    )


# ===== 帖子列表 =====


@router.get("/posts", response_model=ApiResponse)
def list_posts(
    keyword: str | None = Query(None),
    sort: str | None = Query(None),
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取社区建设帖子列表（支持关键词搜索、分页、排序）"""
    query = db.query(CommunityPost).filter(CommunityPost.is_deleted == False)  # noqa: E712

    # 关键词搜索（标题）
    if keyword:
        query = query.filter(CommunityPost.title.contains(keyword))

    # 排序：按更新时间、创建时间倒序
    if sort == "views":
        query = query.order_by(CommunityPost.view_count.desc(), CommunityPost.updated_at.desc(), CommunityPost.created_at.desc())
    elif sort == "replies":
        query = query.order_by(CommunityPost.reply_count.desc(), CommunityPost.updated_at.desc(), CommunityPost.created_at.desc())
    else:
        query = query.order_by(CommunityPost.updated_at.desc(), CommunityPost.created_at.desc())

    total = query.count()
    posts = (
        query.offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    # 批量获取作者信息，避免 N+1 查询
    user_map = _batch_authors(db, {p.user_id for p in posts})

    items = []
    for p in posts:
        items.append(
            {
                "id": p.id,
                "title": p.title,
                "author": _author_from_map(user_map, p.user_id).model_dump(),
                "view_count": p.view_count,
                "reply_count": p.reply_count,
                "like_count": p.like_count,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "last_reply_at": p.last_reply_at.isoformat() if p.last_reply_at else None,
            }
        )

    return ApiResponse(
        data={
            "items": items,
            "total": total,
            "page": pagination["page"],
            "page_size": pagination["page_size"],
        }
    )


# ===== 帖子详情 =====


@router.get("/posts/{post_id}", response_model=ApiResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """获取帖子详情（增加浏览量，返回 can_delete 字段）"""
    post = db.query(CommunityPost).filter(
        CommunityPost.id == post_id,
        CommunityPost.is_deleted == False,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 增加浏览量
    post.view_count += 1
    db.commit()

    # 当前用户是否可以删除该帖子（作者或管理员）
    can_delete = current_user is not None and (
        post.user_id == current_user.id or current_user.role == UserRole.ADMIN
    )

    data = {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "content_type": post.content_type,
        "author": _get_author(db, post.user_id).model_dump(),
        "view_count": post.view_count,
        "reply_count": post.reply_count,
        "like_count": post.like_count,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "last_reply_at": post.last_reply_at.isoformat() if post.last_reply_at else None,
        "can_delete": can_delete,
    }

    return ApiResponse(data=data)


# ===== 创建帖子 =====


@router.post("/posts", response_model=ApiResponse, status_code=201)
def create_post(
    request: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """创建帖子（需登录）"""
    post = CommunityPost(
        title=request.title,
        content=request.content,
        user_id=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return ApiResponse(
        data={
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "content_type": post.content_type,
            "author": _get_author(db, post.user_id).model_dump(),
            "view_count": post.view_count,
            "reply_count": post.reply_count,
            "like_count": post.like_count,
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "last_reply_at": post.last_reply_at.isoformat() if post.last_reply_at else None,
        }
    )


# ===== 编辑帖子 =====


@router.put("/posts/{post_id}", response_model=ApiResponse)
def update_post(
    post_id: int,
    request: CommunityPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """编辑帖子（仅作者）"""
    post = db.query(CommunityPost).filter(
        CommunityPost.id == post_id,
        CommunityPost.is_deleted == False,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 权限检查：仅作者
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权编辑此帖子",
        )

    if request.title is not None:
        post.title = request.title
    if request.content is not None:
        post.content = request.content

    db.commit()
    db.refresh(post)

    return ApiResponse(data={"id": post.id, "message": "更新成功"})


# ===== 删除帖子 =====


@router.delete("/posts/{post_id}", response_model=ApiResponse)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除帖子（仅作者或管理员，软删除）"""
    post = db.query(CommunityPost).filter(
        CommunityPost.id == post_id,
        CommunityPost.is_deleted == False,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 权限检查：作者或管理员
    if post.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此帖子",
        )

    post.is_deleted = True
    db.commit()
    return ApiResponse(message="删除成功")


# ===== 回复列表 =====


@router.get("/posts/{post_id}/replies", response_model=ApiResponse)
def list_replies(
    post_id: int,
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取帖子回复列表（分页，按楼层排序）"""
    post = db.query(CommunityPost).filter(
        CommunityPost.id == post_id,
        CommunityPost.is_deleted == False,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    query = db.query(CommunityReply).filter(
        CommunityReply.post_id == post_id,
        CommunityReply.is_deleted == False,  # noqa: E712
    )

    total = query.count()
    replies = (
        query.order_by(CommunityReply.floor.asc())
        .offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    # 批量获取作者信息，避免 N+1 查询
    user_map = _batch_authors(db, {r.user_id for r in replies})

    items = [
        {
            "id": r.id,
            "content": r.content,
            "author": _author_from_map(user_map, r.user_id).model_dump(),
            "floor": r.floor,
            "like_count": r.like_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in replies
    ]

    return ApiResponse(
        data={
            "items": items,
            "total": total,
            "page": pagination["page"],
            "page_size": pagination["page_size"],
        }
    )


# ===== 创建回复 =====


@router.post("/posts/{post_id}/replies", response_model=ApiResponse, status_code=201)
def create_reply(
    post_id: int,
    request: CommunityReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """创建回复（需登录，自动计算楼层）"""
    post = db.query(CommunityPost).filter(
        CommunityPost.id == post_id,
        CommunityPost.is_deleted == False,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 计算楼层号：当前帖子最大楼层 + 1
    max_floor = (
        db.query(func.max(CommunityReply.floor))
        .filter(CommunityReply.post_id == post_id)
        .scalar()
    )
    floor = (max_floor or 0) + 1

    # 校验楼中楼父回复
    if request.parent_id:
        parent = db.query(CommunityReply).filter(
            CommunityReply.id == request.parent_id,
            CommunityReply.post_id == post_id,
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="父回复不存在",
            )

    reply = CommunityReply(
        post_id=post_id,
        user_id=current_user.id,
        content=request.content,
        floor=floor,
        parent_id=request.parent_id,
    )
    db.add(reply)

    # 更新帖子统计
    post.reply_count = floor
    post.last_reply_at = datetime.now(timezone.utc)
    post.last_reply_user_id = current_user.id

    db.commit()
    db.refresh(reply)

    return ApiResponse(
        data={
            "id": reply.id,
            "content": reply.content,
            "author": _get_author(db, reply.user_id).model_dump(),
            "floor": reply.floor,
            "like_count": reply.like_count,
            "created_at": reply.created_at.isoformat() if reply.created_at else None,
        }
    )
