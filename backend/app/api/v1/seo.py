"""SEO：动态生成 sitemap.xml 和 robots.txt

- /sitemap.xml：从数据库实时查询未删除的帖子和社区帖，生成站点地图
- /robots.txt：声明可/不可抓取路径，并指向 sitemap

这两个路由挂在根路径（不走 /api/v1 前缀），符合搜索引擎约定。
域名从 settings.SITEMAP_BASE_URL 读取，部署时在 .env 配置。
"""

from datetime import datetime
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.community_post import CommunityPost
from app.models.topic import Topic

router = APIRouter()

# XML 协议头
_SITEMAP_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'
_URLSET_OPEN = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
_URLSET_CLOSE = "</urlset>"

# 静态页：路径、更新频率、优先级（论坛/问答等内容聚合页优先级较高）
_STATIC_PAGES: list[tuple[str, float]] = [
    ("/", 1.0),
    ("/forum", 0.9),
    ("/qa", 0.9),
    ("/articles", 0.9),
    ("/resources", 0.8),
    ("/community", 0.8),
]


def _format_lastmod(dt: datetime | None) -> str | None:
    """将时间戳格式化为 sitemap 协议要求的 YYYY-MM-DD"""
    if not dt:
        return None
    return dt.strftime("%Y-%m-%d")


def _url_entry(loc: str, lastmod: str | None, changefreq: str, priority: float) -> str:
    """拼接单条 <url> 节点"""
    parts = ["  <url>", f"    <loc>{escape(loc)}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    parts.append(f"    <changefreq>{changefreq}</changefreq>")
    parts.append(f"    <priority>{priority}</priority>")
    parts.append("  </url>")
    return "\n".join(parts)


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap(db: Session = Depends(get_db)) -> Response:
    """动态生成 sitemap.xml

    包含：静态页 + 所有未删除的主题帖 + 所有未删除的社区帖
    """
    base = settings.SITEMAP_BASE_URL.rstrip("/")
    lines: list[str] = [_SITEMAP_HEADER, _URLSET_OPEN]

    # 1. 静态页
    for path, priority in _STATIC_PAGES:
        lines.append(
            _url_entry(
                loc=f"{base}{path}",
                lastmod=None,
                changefreq="daily",
                priority=priority,
            )
        )

    # 2. 主题帖（discussion/question/article/resource 统一走 /forum/topic/:id）
    topics = (
        db.execute(
            select(Topic.id, Topic.updated_at).filter(Topic.is_deleted == False)  # noqa: E712
        )
        .all()
    )
    for topic_id, updated_at in topics:
        lines.append(
            _url_entry(
                loc=f"{base}/forum/topic/{topic_id}",
                lastmod=_format_lastmod(updated_at),
                changefreq="weekly",
                priority=0.7,
            )
        )

    # 3. 社区建设帖
    community_posts = (
        db.execute(
            select(CommunityPost.id, CommunityPost.updated_at).filter(
                CommunityPost.is_deleted == False  # noqa: E712
            )
        )
        .all()
    )
    for post_id, updated_at in community_posts:
        lines.append(
            _url_entry(
                loc=f"{base}/community/detail/{post_id}",
                lastmod=_format_lastmod(updated_at),
                changefreq="weekly",
                priority=0.6,
            )
        )

    lines.append(_URLSET_CLOSE)
    content = "\n".join(lines)

    return Response(content=content, media_type="application/xml; charset=utf-8")


@router.get("/robots.txt", include_in_schema=False)
def robots() -> Response:
    """生成 robots.txt：屏蔽登录态/接口路径，指向 sitemap"""
    base = settings.SITEMAP_BASE_URL.rstrip("/")

    # 屏蔽规则：登录态页面、API、OAuth 回调等无需被收录
    disallow_paths = [
        "/api/",
        "/login",
        "/register",
        "/auth/",
        "/user/profile",
        "/admin",
        "/topic/create",
        "/community/create",
    ]

    lines = ["User-agent: *", "Allow: /"]
    for path in disallow_paths:
        lines.append(f"Disallow: {path}")
    lines.append("")
    lines.append(f"Sitemap: {base}/sitemap.xml")
    content = "\n".join(lines)

    return Response(content=content, media_type="text/plain; charset=utf-8")
