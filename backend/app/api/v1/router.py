"""API v1 路由聚合"""

from fastapi import APIRouter

from app.api.v1 import auth, community, forum, interaction, qa, upload, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(forum.router, prefix="/forum", tags=["论坛"])
api_router.include_router(qa.router, prefix="/qa", tags=["问答"])
api_router.include_router(interaction.router, prefix="/interactions", tags=["互动"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上传"])
api_router.include_router(community.router, prefix="/community", tags=["社区建设"])
