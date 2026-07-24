"""论坛 API：板块、帖子、回复"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_pagination
from app.db.session import get_db
from app.models.category import Category
from app.models.post import Post
from app.models.tag import Tag, ThreadTag
from app.models.thread import Thread, ThreadType
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse, PaginatedData
from app.schemas.forum import (
    AuthorBrief,
    CategoryResponse,
    PostCreate,
    PostResponse,
    ThreadCreate,
    ThreadDetail,
    ThreadListItem,
    ThreadUpdate,
)

router = APIRouter()


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


def _get_tags(db: Session, thread_id: int) -> list[str]:
    """获取帖子的标签列表"""
    rows = (
        db.query(Tag.name)
        .join(ThreadTag, ThreadTag.tag_id == Tag.id)
        .filter(ThreadTag.thread_id == thread_id)
        .all()
    )
    return [r[0] for r in rows]


def _sync_tags(db: Session, thread: Thread, tag_names: list[str]) -> None:
    """同步帖子标签"""
    # 删除旧关联
    db.query(ThreadTag).filter(ThreadTag.thread_id == thread.id).delete()
    # 创建新关联
    for name in tag_names:
        name = name.strip()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name, slug=name.lower().replace(" ", "-"))
            db.add(tag)
            db.flush()
            tag.usage_count = 1
        else:
            tag.usage_count += 1
        db.add(ThreadTag(thread_id=thread.id, tag_id=tag.id))


# ===== 公开配置 =====


@router.get("/config", response_model=ApiResponse)
def get_public_config():
    """获取公开配置（CDN 域名等）"""
    cos_domain = f"{settings.COS_BUCKET}.cos.{settings.COS_REGION}.myqcloud.com"
    cdn_domain = settings.CDN_DOMAIN
    if cdn_domain and not cdn_domain.startswith('http'):
        cdn_domain = f'https://{cdn_domain}'
    return ApiResponse(data={
        "cdn_domain": cdn_domain or None,
        "cos_domain": cos_domain,
    })


# ===== 板块 =====


@router.get("/categories", response_model=ApiResponse)
def list_categories(db: Session = Depends(get_db)):
    """获取板块列表（含各类型帖子数统计）"""
    categories = (
        db.query(Category)
        .filter(Category.is_active == True)  # noqa: E712
        .order_by(Category.sort_order)
        .all()
    )

    # 单次聚合查询所有板块的各类型帖子数，避免 N+1 查询
    stats = (
        db.query(
            Thread.category_id,
            func.sum(case((Thread.type == ThreadType.DISCUSSION, 1), else_=0)).label("discussion_count"),
            func.sum(case((Thread.type == ThreadType.QUESTION, 1), else_=0)).label("question_count"),
            func.sum(case((Thread.type == ThreadType.ARTICLE, 1), else_=0)).label("article_count"),
            func.sum(case((Thread.type == ThreadType.RESOURCE, 1), else_=0)).label("resource_count"),
        )
        .filter(Thread.is_deleted == False)  # noqa: E712
        .group_by(Thread.category_id)
        .all()
    )

    stats_map = {
        s.category_id: {
            "discussion_count": int(s.discussion_count or 0),
            "question_count": int(s.question_count or 0),
            "article_count": int(s.article_count or 0),
            "resource_count": int(s.resource_count or 0),
        }
        for s in stats
    }

    result = []
    for c in categories:
        item = CategoryResponse.model_validate(c).model_dump()
        s = stats_map.get(c.id, {})
        item["discussion_count"] = s.get("discussion_count", 0)
        item["question_count"] = s.get("question_count", 0)
        item["article_count"] = s.get("article_count", 0)
        item["resource_count"] = s.get("resource_count", 0)
        result.append(item)
    return ApiResponse(data=result)


@router.get("/stats", response_model=ApiResponse)
def get_forum_stats(db: Session = Depends(get_db)):
    """获取社区统计数据"""
    discussion_count = db.query(Thread).filter(
        Thread.type == ThreadType.DISCUSSION,
        Thread.is_deleted == False,  # noqa: E712
    ).count()
    question_count = db.query(Thread).filter(
        Thread.type == ThreadType.QUESTION,
        Thread.is_deleted == False,  # noqa: E712
    ).count()
    article_count = db.query(Thread).filter(
        Thread.type == ThreadType.ARTICLE,
        Thread.is_deleted == False,  # noqa: E712
    ).count()
    user_count = db.query(User).count()

    return ApiResponse(
        data={
            "discussion_count": discussion_count,
            "question_count": question_count,
            "article_count": article_count,
            "user_count": user_count,
        }
    )


# ===== 帖子列表 =====


@router.get("/tags", response_model=ApiResponse)
def list_tags(
    thread_type: ThreadType | None = Query(None),
    db: Session = Depends(get_db),
):
    """获取热门标签列表（可按帖子类型筛选，只返回有该类型帖子的标签）"""
    if thread_type:
        tags = (
            db.query(
                Tag.id.label("id"),
                Tag.name.label("name"),
                func.count(ThreadTag.thread_id).label("usage_count"),
            )
            .join(ThreadTag, ThreadTag.tag_id == Tag.id)
            .join(Thread, Thread.id == ThreadTag.thread_id)
            .filter(
                Thread.type == thread_type,
                Thread.is_deleted == False,  # noqa: E712
            )
            .group_by(Tag.id, Tag.name)
            .order_by(func.count(ThreadTag.thread_id).desc())
            .limit(20)
            .all()
        )
    else:
        tags = (
            db.query(Tag)
            .filter(Tag.usage_count > 0)
            .order_by(Tag.usage_count.desc())
            .limit(20)
            .all()
        )
    return ApiResponse(
        data=[
            {"id": t.id, "name": t.name, "usage_count": int(t.usage_count)}
            for t in tags
        ]
    )


@router.get("/threads", response_model=PaginatedData[ThreadListItem])
def list_threads(
    category_id: int | None = Query(None),
    thread_type: ThreadType | None = Query(None),
    keyword: str | None = Query(None),
    user_id: int | None = Query(None),
    tag: str | None = Query(None),
    is_essential: bool | None = Query(None),
    sort: str | None = Query(None),
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取帖子列表"""
    query = db.query(Thread).filter(Thread.is_deleted == False)  # noqa: E712

    if category_id is not None:
        query = query.filter(Thread.category_id == category_id)
    if thread_type is not None:
        query = query.filter(Thread.type == thread_type)
    if keyword:
        query = query.filter(Thread.title.contains(keyword))
    if user_id is not None:
        query = query.filter(Thread.user_id == user_id)
    if tag:
        query = query.join(ThreadTag, ThreadTag.thread_id == Thread.id).join(
            Tag, Tag.id == ThreadTag.tag_id
        ).filter(Tag.name == tag)
    if is_essential is not None:
        query = query.filter(Thread.is_essential == is_essential)

    # 排序：置顶帖始终在最前
    if sort == "views":
        query = query.order_by(Thread.is_pinned.desc(), Thread.view_count.desc())
    elif sort == "replies":
        query = query.order_by(Thread.is_pinned.desc(), Thread.reply_count.desc())
    else:
        query = query.order_by(Thread.is_pinned.desc(), Thread.last_reply_at.desc())

    total = query.count()
    threads = (
        query.offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    # 批量获取作者信息，避免 N+1 查询
    user_map = _batch_authors(db, {t.user_id for t in threads})

    items = []
    for t in threads:
        items.append(
            ThreadListItem(
                id=t.id,
                title=t.title,
                type=t.type,
                category_id=t.category_id,
                author=_author_from_map(user_map, t.user_id),
                view_count=t.view_count,
                reply_count=t.reply_count,
                like_count=t.like_count,
                favorite_count=t.favorite_count,
                is_pinned=t.is_pinned,
                is_essential=t.is_essential,
                is_solved=t.is_solved,
                created_at=t.created_at,
                last_reply_at=t.last_reply_at,
            ).model_dump()
        )

    return PaginatedData(
        items=items,
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
    )


# ===== 帖子详情 =====


@router.get("/threads/{thread_id}", response_model=ApiResponse)
def get_thread(thread_id: int, db: Session = Depends(get_db)):
    """获取帖子详情"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 增加浏览量
    thread.view_count += 1
    db.commit()

    return ApiResponse(
        data=ThreadDetail(
            id=thread.id,
            title=thread.title,
            content=thread.content,
            content_type=thread.content_type,
            type=thread.type,
            category_id=thread.category_id,
            author=_get_author(db, thread.user_id),
            view_count=thread.view_count,
            reply_count=thread.reply_count,
            like_count=thread.like_count,
            favorite_count=thread.favorite_count,
            is_pinned=thread.is_pinned,
            is_essential=thread.is_essential,
            is_locked=thread.is_locked,
            is_solved=thread.is_solved,
            tags=_get_tags(db, thread.id),
            resource_url=thread.resource_url,
            resource_type=thread.resource_type,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            last_reply_at=thread.last_reply_at,
            last_reply_user_id=thread.last_reply_user_id,
        ).model_dump()
    )


# ===== 用户回复列表 =====


@router.get("/posts", response_model=ApiResponse)
def list_user_posts(
    user_id: int | None = Query(None),
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取回复列表（支持按用户筛选，包含帖子标题）"""
    query = db.query(Post).filter(Post.is_deleted == False)  # noqa: E712
    if user_id is not None:
        query = query.filter(Post.user_id == user_id)

    total = query.count()
    posts = (
        query.order_by(Post.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    # 批量获取帖子标题
    thread_ids = {p.thread_id for p in posts}
    threads = (
        db.query(Thread.id, Thread.title).filter(Thread.id.in_(thread_ids)).all()
    ) if thread_ids else []
    thread_map = {t.id: t.title for t in threads}

    # 批量获取作者
    post_user_map = _batch_authors(db, {p.user_id for p in posts})

    items = [
        {
            "id": p.id,
            "thread_id": p.thread_id,
            "thread_title": thread_map.get(p.thread_id, ""),
            "author": _author_from_map(post_user_map, p.user_id).model_dump(),
            "content": p.content,
            "floor": p.floor,
            "like_count": p.like_count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]

    return ApiResponse(
        data={
            "items": items,
            "total": total,
            "page": pagination["page"],
            "page_size": pagination["page_size"],
        }
    )


# ===== 管理员操作 =====


@router.put("/threads/{thread_id}/pin", response_model=ApiResponse)
def toggle_pin(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """置顶/取消置顶（管理员或版主）"""
    if current_user.role not in (UserRole.ADMIN, UserRole.MODERATOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员或版主可操作",
        )
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )
    thread.is_pinned = not thread.is_pinned
    db.commit()
    return ApiResponse(data={"is_pinned": thread.is_pinned})


@router.put("/threads/{thread_id}/essential", response_model=ApiResponse)
def toggle_essential(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """加精/取消加精（管理员或版主）"""
    if current_user.role not in (UserRole.ADMIN, UserRole.MODERATOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员或版主可操作",
        )
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )
    thread.is_essential = not thread.is_essential
    db.commit()
    return ApiResponse(data={"is_essential": thread.is_essential})


# ===== 发帖 =====


@router.post("/threads", response_model=ApiResponse, status_code=201)
def create_thread(
    request: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """发帖"""
    # 校验板块
    if request.category_id:
        category = db.query(Category).filter(
            Category.id == request.category_id,
            Category.is_active == True,  # noqa: E712
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="板块不存在或已关闭",
            )

    thread = Thread(
        title=request.title,
        content=request.content,
        content_type=request.content_type,
        type=request.type,
        user_id=current_user.id,
        category_id=request.category_id,
        resource_url=request.resource_url,
        resource_type=request.resource_type,
    )
    db.add(thread)
    db.flush()

    # 处理标签
    if request.tags:
        _sync_tags(db, thread, request.tags)

    # 更新板块帖子数
    if request.category_id:
        db.query(Category).filter(
            Category.id == request.category_id
        ).update({Category.thread_count: Category.thread_count + 1})

    db.commit()
    db.refresh(thread)

    return ApiResponse(
        data=ThreadDetail(
            id=thread.id,
            title=thread.title,
            content=thread.content,
            content_type=thread.content_type,
            type=thread.type,
            category_id=thread.category_id,
            author=_get_author(db, thread.user_id),
            view_count=thread.view_count,
            reply_count=thread.reply_count,
            like_count=thread.like_count,
            favorite_count=thread.favorite_count,
            is_pinned=thread.is_pinned,
            is_essential=thread.is_essential,
            is_locked=thread.is_locked,
            is_solved=thread.is_solved,
            tags=_get_tags(db, thread.id),
            resource_url=thread.resource_url,
            resource_type=thread.resource_type,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            last_reply_at=thread.last_reply_at,
            last_reply_user_id=thread.last_reply_user_id,
        ).model_dump()
    )


# ===== 编辑帖子 =====


@router.put("/threads/{thread_id}", response_model=ApiResponse)
def update_thread(
    thread_id: int,
    request: ThreadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """编辑帖子"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 权限检查：作者或管理员
    if thread.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权编辑此帖子",
        )

    if request.title is not None:
        thread.title = request.title
    if request.content is not None:
        thread.content = request.content
    if request.tags is not None:
        _sync_tags(db, thread, request.tags)

    db.commit()
    db.refresh(thread)

    return ApiResponse(data={"id": thread.id, "message": "更新成功"})


# ===== 删除帖子 =====


@router.delete("/threads/{thread_id}", response_model=ApiResponse)
def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除帖子（软删除）"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    if thread.user_id != current_user.id and current_user.role not in (
        UserRole.ADMIN,
        UserRole.MODERATOR,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此帖子",
        )

    thread.is_deleted = True
    db.commit()
    return ApiResponse(message="删除成功")


# ===== 回复列表 =====


@router.get("/threads/{thread_id}/posts", response_model=PaginatedData[PostResponse])
def list_posts(
    thread_id: int,
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取帖子回复列表"""
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    query = db.query(Post).filter(
        Post.thread_id == thread_id,
        Post.is_deleted == False,  # noqa: E712
    )
    total = query.count()
    posts = (
        query.order_by(Post.floor.asc())
        .offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    # 批量获取作者信息，避免 N+1 查询
    post_user_map = _batch_authors(db, {p.user_id for p in posts})

    items = [
        PostResponse(
            id=p.id,
            thread_id=p.thread_id,
            author=_author_from_map(post_user_map, p.user_id),
            content=p.content,
            content_type=p.content_type,
            floor=p.floor,
            parent_id=p.parent_id,
            like_count=p.like_count,
            created_at=p.created_at,
        ).model_dump()
        for p in posts
    ]

    return PaginatedData(
        items=items,
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
    )


# ===== 发表回复 =====


@router.post("/threads/{thread_id}/posts", response_model=ApiResponse, status_code=201)
def create_post(
    thread_id: int,
    request: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """发表回复"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    if thread.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="帖子已锁定，无法回复",
        )

    # 计算楼层号
    floor = (thread.reply_count or 0) + 1

    # 校验楼中楼父回复
    if request.parent_id:
        parent = db.query(Post).filter(
            Post.id == request.parent_id,
            Post.thread_id == thread_id,
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="父回复不存在",
            )

    post = Post(
        thread_id=thread_id,
        user_id=current_user.id,
        content=request.content,
        floor=floor,
        parent_id=request.parent_id,
    )
    db.add(post)

    # 更新帖子统计
    thread.reply_count = floor
    thread.last_reply_at = datetime.now(timezone.utc)
    thread.last_reply_user_id = current_user.id

    db.commit()
    db.refresh(post)

    return ApiResponse(
        data=PostResponse(
            id=post.id,
            thread_id=post.thread_id,
            author=_get_author(db, post.user_id),
            content=post.content,
            content_type=post.content_type,
            floor=post.floor,
            parent_id=post.parent_id,
            like_count=post.like_count,
            created_at=post.created_at,
        ).model_dump()
    )
