"""腾讯云 COS 服务"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from qcloud_cos import CosConfig, CosS3Client

from app.core.config import settings

_client: Optional[CosS3Client] = None


def get_cos_client() -> CosS3Client:
    """获取 COS 客户端（单例）"""
    global _client
    if _client is None:
        config = CosConfig(
            Region=settings.COS_REGION,
            SecretId=settings.COS_SECRET_ID,
            SecretKey=settings.COS_SECRET_KEY,
            Scheme="https",
        )
        _client = CosS3Client(config)
    return _client


def upload_file(
    file_data: bytes,
    original_filename: str,
    folder: str = "uploads",
) -> str:
    """
    上传文件到 COS

    Args:
        file_data: 文件数据
        original_filename: 原始文件名
        folder: 存储目录

    Returns:
        访问 URL
    """
    client = get_cos_client()

    # 生成唯一文件名，保留原始扩展名
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else ""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique_name = f"{uuid.uuid4().hex}"
    if ext:
        unique_name = f"{unique_name}.{ext}"

    key = f"{folder}/{date_str}/{unique_name}"

    client.put_object(
        Bucket=settings.COS_BUCKET,
        Body=file_data,
        Key=key,
    )

    # 返回访问 URL：优先使用 CDN 域名
    if settings.CDN_DOMAIN:
        domain = settings.CDN_DOMAIN
        if not domain.startswith('http'):
            domain = f'https://{domain}'
        return f'{domain}/{key}'
    return f"https://{settings.COS_BUCKET}.cos.{settings.COS_REGION}.myqcloud.com/{key}"


def delete_file(key: str) -> None:
    """删除 COS 文件"""
    client = get_cos_client()
    client.delete_object(Bucket=settings.COS_BUCKET, Key=key)
