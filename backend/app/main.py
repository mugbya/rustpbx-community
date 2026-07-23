"""FastAPI 应用入口"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 开发环境自动创建表（生产环境用 alembic 迁移）
    if settings.DEBUG:
        from app.db.session import Base, engine
        # 导入所有模型确保建表
        from app.models import (  # noqa: F401
            Category,
            Favorite,
            Like,
            Notification,
            Post,
            Tag,
            Thread,
            ThreadTag,
            User,
        )

        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="rustpbx 中文社区 API",
    description="rustpbx 中文社区后端接口文档",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """根路由"""
    return {
        "name": "rustpbx 中文社区 API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok"}
