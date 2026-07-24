"""论坛 API：板块、帖子、回复"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import case, desc, func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_optional_user, get_pagination
from app.core.config import settings
from app.db.session import get_db
from app.models.category import Category
from app.models.category_moderator import CategoryModerator
from app.models.post import Post
from app.models.tag import Tag, TopicTag
from app.models.topic import Topic, TopicType
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse, PaginatedData
from app.schemas.forum import (
    AuthorBrief,
    CategoryResponse,
    PostCreate,
    PostResponse,
    TopicCreate,
    TopicDetail,
    TopicListItem,
    TopicUpdate,
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


def _is_category_moderator(db: Session, user_id: int, category_id: int) -> bool:
    """检查用户是否是指定板块的版主"""
    return (
        db.query(CategoryModerator)
        .filter(
            CategoryModerator.category_id == category_id,
            CategoryModerator.user_id == user_id,
        )
        .first()
        is not None
    )


def _get_tags(db: Session, topic_id: int) -> list[str]:
    """获取帖子的标签列表"""
    rows = (
        db.query(Tag.name)
        .join(TopicTag, TopicTag.tag_id == Tag.id)
        .filter(TopicTag.topic_id == topic_id)
        .all()
    )
    return [r[0] for r in rows]


def _sync_tags(db: Session, topic: Topic, tag_names: list[str]) -> None:
    """同步帖子标签"""
    # 删除旧关联
    db.query(TopicTag).filter(TopicTag.topic_id == topic.id).delete()
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
        db.add(TopicTag(topic_id=topic.id, tag_id=tag.id))


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
def list_categories(
    topic_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """获取板块列表（含各类型帖子数统计，可按分区筛选）"""
    query = db.query(Category).filter(Category.is_active == True)  # noqa: E712
    if topic_type:
        # topic_type 存储为逗号分隔的值（如 "discussion,question"），NULL 表示全局
        query = query.filter(
            or_(
                Category.topic_type.is_(None),
                Category.topic_type == "",
                func.find_in_set(topic_type, Category.topic_type) > 0,
            )
        )
    categories = query.order_by(Category.sort_order).all()

    # 单次聚合查询所有板块的各类型帖子数，避免 N+1 查询
    stats = (
        db.query(
            Topic.category_id,
            func.sum(case((Topic.type == TopicType.DISCUSSION, 1), else_=0)).label("discussion_count"),
            func.sum(case((Topic.type == TopicType.QUESTION, 1), else_=0)).label("question_count"),
            func.sum(case((Topic.type == TopicType.ARTICLE, 1), else_=0)).label("article_count"),
            func.sum(case((Topic.type == TopicType.RESOURCE, 1), else_=0)).label("resource_count"),
        )
        .filter(Topic.is_deleted == False)  # noqa: E712
        .group_by(Topic.category_id)
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
    discussion_count = db.query(Topic).filter(
        Topic.type == TopicType.DISCUSSION,
        Topic.is_deleted == False,  # noqa: E712
    ).count()
    question_count = db.query(Topic).filter(
        Topic.type == TopicType.QUESTION,
        Topic.is_deleted == False,  # noqa: E712
    ).count()
    article_count = db.query(Topic).filter(
        Topic.type == TopicType.ARTICLE,
        Topic.is_deleted == False,  # noqa: E712
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
    topic_type: TopicType | None = Query(None),
    db: Session = Depends(get_db),
):
    """获取热门标签列表（可按帖子类型筛选，只返回有该类型帖子的标签）"""
    if topic_type:
        tags = (
            db.query(
                Tag.id.label("id"),
                Tag.name.label("name"),
                func.count(TopicTag.topic_id).label("usage_count"),
            )
            .join(TopicTag, TopicTag.tag_id == Tag.id)
            .join(Topic, Topic.id == TopicTag.topic_id)
            .filter(
                Topic.type == topic_type,
                Topic.is_deleted == False,  # noqa: E712
            )
            .group_by(Tag.id, Tag.name)
            .order_by(func.count(TopicTag.topic_id).desc())
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


@router.get("/topics", response_model=PaginatedData[TopicListItem])
def list_topics(
    category_id: int | None = Query(None),
    topic_type: TopicType | None = Query(None),
    keyword: str | None = Query(None),
    user_id: int | None = Query(None),
    tag: str | None = Query(None),
    is_essential: bool | None = Query(None),
    sort: str | None = Query(None),
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取帖子列表"""
    query = db.query(Topic).filter(Topic.is_deleted == False)  # noqa: E712

    if category_id is not None:
        query = query.filter(Topic.category_id == category_id)
    if topic_type is not None:
        query = query.filter(Topic.type == topic_type)
    if keyword:
        query = query.filter(Topic.title.contains(keyword))
    if user_id is not None:
        query = query.filter(Topic.user_id == user_id)
    if tag:
        query = query.join(TopicTag, TopicTag.topic_id == Topic.id).join(
            Tag, Tag.id == TopicTag.tag_id
        ).filter(Tag.name == tag)
    if is_essential is not None:
        query = query.filter(Topic.is_essential == is_essential)

    # 排序：置顶帖始终在最前，其次按更新时间、创建时间倒序
    if sort == "views":
        query = query.order_by(Topic.is_pinned.desc(), Topic.view_count.desc(), Topic.updated_at.desc(), Topic.created_at.desc())
    elif sort == "replies":
        query = query.order_by(Topic.is_pinned.desc(), Topic.reply_count.desc(), Topic.updated_at.desc(), Topic.created_at.desc())
    else:
        query = query.order_by(Topic.is_pinned.desc(), Topic.updated_at.desc(), Topic.created_at.desc())

    total = query.count()
    topics = (
        query.offset(pagination["offset"])
        .limit(pagination["page_size"])
        .all()
    )

    # 批量获取作者信息，避免 N+1 查询
    user_map = _batch_authors(db, {t.user_id for t in topics})

    items = []
    for t in topics:
        items.append(
            TopicListItem(
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


@router.get("/topics/{topic_id}", response_model=ApiResponse)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """获取帖子详情"""
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.is_deleted == False,  # noqa: E712
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 增加浏览量
    topic.view_count += 1
    db.commit()

    data = TopicDetail(
        id=topic.id,
        title=topic.title,
        content=topic.content,
        content_type=topic.content_type,
        type=topic.type,
        category_id=topic.category_id,
        author=_get_author(db, topic.user_id),
        view_count=topic.view_count,
        reply_count=topic.reply_count,
        like_count=topic.like_count,
        favorite_count=topic.favorite_count,
        is_pinned=topic.is_pinned,
        is_essential=topic.is_essential,
        is_locked=topic.is_locked,
        is_solved=topic.is_solved,
        tags=_get_tags(db, topic.id),
        resource_url=topic.resource_url,
        resource_type=topic.resource_type,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
        last_reply_at=topic.last_reply_at,
        last_reply_user_id=topic.last_reply_user_id,
    ).model_dump()

    # 当前用户是否可以管理该帖子（管理员或该板块版主）
    data["can_moderate"] = current_user is not None and (
        current_user.role == UserRole.ADMIN
        or _is_category_moderator(db, current_user.id, topic.category_id)
    )

    return ApiResponse(data=data)


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
    topic_ids = {p.topic_id for p in posts}
    topics = (
        db.query(Topic.id, Topic.title).filter(Topic.id.in_(topic_ids)).all()
    ) if topic_ids else []
    topic_map = {t.id: t.title for t in topics}

    # 批量获取作者
    post_user_map = _batch_authors(db, {p.user_id for p in posts})

    items = [
        {
            "id": p.id,
            "topic_id": p.topic_id,
            "topic_title": topic_map.get(p.topic_id, ""),
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


# ===== 板块管理（管理员） =====


class CategoryCreateRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None
    topic_type: str | None = None
    sort_order: int = 0


class CategoryUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    topic_type: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


@router.post("/categories", response_model=ApiResponse, status_code=201)
def create_category(
    request: CategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """创建板块（仅管理员）"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅管理员可操作")
    # 检查 slug 唯一性
    if db.query(Category).filter(Category.slug == request.slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="slug 已存在")
    category = Category(
        name=request.name,
        slug=request.slug,
        description=request.description,
        topic_type=request.topic_type,
        sort_order=request.sort_order,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return ApiResponse(data=CategoryResponse.model_validate(category).model_dump())


@router.put("/categories/{category_id}", response_model=ApiResponse)
def update_category(
    category_id: int,
    request: CategoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """编辑板块（仅管理员）"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅管理员可操作")
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="板块不存在")
    if request.name is not None:
        category.name = request.name
    if request.description is not None:
        category.description = request.description
    if request.topic_type is not None:
        category.topic_type = request.topic_type
    if request.sort_order is not None:
        category.sort_order = request.sort_order
    if request.is_active is not None:
        category.is_active = request.is_active
    db.commit()
    db.refresh(category)
    return ApiResponse(data=CategoryResponse.model_validate(category).model_dump())


@router.delete("/categories/{category_id}", response_model=ApiResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除板块（仅管理员，软删除）"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅管理员可操作")
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="板块不存在")
    category.is_active = False
    db.commit()
    return ApiResponse(data={"deleted": True})


# ===== 板块版主管理 =====


@router.get("/categories/{category_id}/moderators", response_model=ApiResponse)
def list_moderators(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取板块版主列表（仅管理员）"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可操作",
        )
    moderators = (
        db.query(CategoryModerator, User)
        .join(User, User.id == CategoryModerator.user_id)
        .filter(CategoryModerator.category_id == category_id)
        .all()
    )
    return ApiResponse(
        data=[
            {
                "id": cm.id,
                "user_id": u.id,
                "username": u.username,
                "avatar": u.avatar,
                "email": u.email,
            }
            for cm, u in moderators
        ]
    )


@router.post(
    "/categories/{category_id}/moderators",
    response_model=ApiResponse,
    status_code=201,
)
def add_moderator(
    category_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """分配板块版主（仅管理员）"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可操作",
        )
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="板块不存在")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    existing = (
        db.query(CategoryModerator)
        .filter(
            CategoryModerator.category_id == category_id,
            CategoryModerator.user_id == user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该用户已是此板块版主")
    cm = CategoryModerator(category_id=category_id, user_id=user_id)
    db.add(cm)
    db.commit()
    return ApiResponse(data={"id": cm.id, "user_id": user_id, "username": user.username})


@router.delete(
    "/categories/{category_id}/moderators/{user_id}", response_model=ApiResponse
)
def remove_moderator(
    category_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """取消板块版主（仅管理员）"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员可操作",
        )
    cm = (
        db.query(CategoryModerator)
        .filter(
            CategoryModerator.category_id == category_id,
            CategoryModerator.user_id == user_id,
        )
        .first()
    )
    if not cm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="该用户不是此板块版主")
    db.delete(cm)
    db.commit()
    return ApiResponse(data={"removed": True})


# ===== 管理员/版主操作 =====


@router.put("/topics/{topic_id}/pin", response_model=ApiResponse)
def toggle_pin(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """置顶/取消置顶（管理员或该板块版主）"""
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.is_deleted == False,  # noqa: E712
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )
    # 权限检查：管理员或该板块版主
    if current_user.role != UserRole.ADMIN and not _is_category_moderator(
        db, current_user.id, topic.category_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员或该板块版主可操作",
        )
    topic.is_pinned = not topic.is_pinned
    db.commit()
    return ApiResponse(data={"is_pinned": topic.is_pinned})


@router.put("/topics/{topic_id}/essential", response_model=ApiResponse)
def toggle_essential(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """加精/取消加精（管理员或该板块版主）"""
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.is_deleted == False,  # noqa: E712
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )
    # 权限检查：管理员或该板块版主
    if current_user.role != UserRole.ADMIN and not _is_category_moderator(
        db, current_user.id, topic.category_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅管理员或该板块版主可操作",
        )
    topic.is_essential = not topic.is_essential
    db.commit()
    return ApiResponse(data={"is_essential": topic.is_essential})


# ===== 发帖 =====


@router.post("/topics", response_model=ApiResponse, status_code=201)
def create_topic(
    request: TopicCreate,
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

    topic = Topic(
        title=request.title,
        content=request.content,
        content_type=request.content_type,
        type=request.type,
        user_id=current_user.id,
        category_id=request.category_id,
        resource_url=request.resource_url,
        resource_type=request.resource_type,
    )
    db.add(topic)
    db.flush()

    # 处理标签
    if request.tags:
        _sync_tags(db, topic, request.tags)

    # 更新板块帖子数
    if request.category_id:
        db.query(Category).filter(
            Category.id == request.category_id
        ).update({Category.thread_count: Category.thread_count + 1})

    db.commit()
    db.refresh(topic)

    return ApiResponse(
        data=TopicDetail(
            id=topic.id,
            title=topic.title,
            content=topic.content,
            content_type=topic.content_type,
            type=topic.type,
            category_id=topic.category_id,
            author=_get_author(db, topic.user_id),
            view_count=topic.view_count,
            reply_count=topic.reply_count,
            like_count=topic.like_count,
            favorite_count=topic.favorite_count,
            is_pinned=topic.is_pinned,
            is_essential=topic.is_essential,
            is_locked=topic.is_locked,
            is_solved=topic.is_solved,
            tags=_get_tags(db, topic.id),
            resource_url=topic.resource_url,
            resource_type=topic.resource_type,
            created_at=topic.created_at,
            updated_at=topic.updated_at,
            last_reply_at=topic.last_reply_at,
            last_reply_user_id=topic.last_reply_user_id,
        ).model_dump()
    )


# ===== 编辑帖子 =====


@router.put("/topics/{topic_id}", response_model=ApiResponse)
def update_topic(
    topic_id: int,
    request: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """编辑帖子"""
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.is_deleted == False,  # noqa: E712
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 权限检查：作者或管理员
    if topic.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权编辑此帖子",
        )

    if request.title is not None:
        topic.title = request.title
    if request.content is not None:
        topic.content = request.content
    if request.tags is not None:
        _sync_tags(db, topic, request.tags)

    db.commit()
    db.refresh(topic)

    return ApiResponse(data={"id": topic.id, "message": "更新成功"})


# ===== 删除帖子 =====


@router.delete("/topics/{topic_id}", response_model=ApiResponse)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除帖子（软删除）"""
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.is_deleted == False,  # noqa: E712
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    # 权限检查：作者、管理员或该板块版主
    if (
        topic.user_id != current_user.id
        and current_user.role != UserRole.ADMIN
        and not _is_category_moderator(db, current_user.id, topic.category_id)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此帖子",
        )

    topic.is_deleted = True
    db.commit()
    return ApiResponse(message="删除成功")


# ===== 回复列表 =====


@router.get("/topics/{topic_id}/posts", response_model=PaginatedData[PostResponse])
def list_posts(
    topic_id: int,
    pagination: dict = Depends(get_pagination),
    db: Session = Depends(get_db),
):
    """获取帖子回复列表"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    query = db.query(Post).filter(
        Post.topic_id == topic_id,
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
            topic_id=p.topic_id,
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


@router.post("/topics/{topic_id}/posts", response_model=ApiResponse, status_code=201)
def create_post(
    topic_id: int,
    request: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """发表回复"""
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.is_deleted == False,  # noqa: E712
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="帖子不存在",
        )

    if topic.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="帖子已锁定，无法回复",
        )

    # 计算楼层号
    floor = (topic.reply_count or 0) + 1

    # 校验楼中楼父回复
    if request.parent_id:
        parent = db.query(Post).filter(
            Post.id == request.parent_id,
            Post.topic_id == topic_id,
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="父回复不存在",
            )

    post = Post(
        topic_id=topic_id,
        user_id=current_user.id,
        content=request.content,
        floor=floor,
        parent_id=request.parent_id,
    )
    db.add(post)

    # 更新帖子统计
    topic.reply_count = floor
    topic.last_reply_at = datetime.now(timezone.utc)
    topic.last_reply_user_id = current_user.id

    db.commit()
    db.refresh(post)

    return ApiResponse(
        data=PostResponse(
            id=post.id,
            topic_id=post.topic_id,
            author=_get_author(db, post.user_id),
            content=post.content,
            content_type=post.content_type,
            floor=post.floor,
            parent_id=post.parent_id,
            like_count=post.like_count,
            created_at=post.created_at,
        ).model_dump()
    )
