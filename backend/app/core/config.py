"""应用配置管理"""

from typing import List
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，从环境变量读取"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 应用配置
    APP_NAME: str = "rustpbx-community"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # 数据库配置
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "rustpbx"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "rustpbx_community"

    @property
    def database_url(self) -> str:
        """构建数据库连接 URL，对密码做 URL 编码以支持特殊字符"""
        pwd = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{pwd}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            "?charset=utf8mb4"
        )

    @property
    def async_database_url(self) -> str:
        """构建异步数据库连接 URL，对密码做 URL 编码以支持特殊字符"""
        pwd = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+aiomysql://{self.MYSQL_USER}:{pwd}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            "?charset=utf8mb4"
        )

    # JWT 配置
    JWT_SECRET_KEY: str = "change-this-to-a-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 天

    # GitHub OAuth 配置
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:5173/auth/github/callback"

    # 腾讯云 COS 配置
    COS_SECRET_ID: str = ""
    COS_SECRET_KEY: str = ""
    COS_REGION: str = "ap-guangzhou"
    COS_BUCKET: str = ""
    # CDN 加速域名（配置后上传返回 CDN URL，留空则用 COS 直连）
    CDN_DOMAIN: str = ""

    # CORS 配置
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # SEO 配置：sitemap.xml 和 robots.txt 使用的站点根域名
    # 部署时必须改成真实域名（含 https://），不能用 localhost 或 IP
    SITEMAP_BASE_URL: str = "https://rustpbx.dev"


settings = Settings()
