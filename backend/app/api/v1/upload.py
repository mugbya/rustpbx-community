"""文件上传 API"""

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from typing import List

from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.cos import upload_file

router = APIRouter()

# 允许的图片类型
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

# 允许的文件类型
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | {
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-gzip",
    "application/x-7z-compressed",
    "application/x-rar-compressed",
    # 文本类
    "text/plain",
    "text/markdown",
    "text/css",
    "text/xml",
    "text/javascript",
    "text/yaml",
    "text/x-yaml",
    # 脚本类
    "application/x-sh",
    "text/x-shellscript",
    "application/x-python",
    "text/x-python",
    "application/x-perl",
    "application/x-ruby",
    # 配置类
    "application/json",
    "application/xml",
    "application/x-yaml",
    "application/x-toml",
    # 其他
    "application/octet-stream",
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/image", response_model=ApiResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """上传图片（头像、截图等）"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的图片格式，仅支持 JPEG/PNG/GIF/WebP/SVG",
        )

    file_data = await file.read()
    if len(file_data) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片大小不能超过 5MB",
        )

    url = upload_file(file_data, file.filename or "image.png", folder="images")
    return ApiResponse(data={"url": url})


@router.post("/file", response_model=ApiResponse)
async def upload_file_api(
    file: UploadFile = File(...),
    folder: str = Query("files"),
    current_user: User = Depends(get_current_active_user),
):
    """上传文件（资源附件等，按 folder 分目录存储，不限制文件格式）"""
    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件大小不能超过 5MB",
        )

    url = upload_file(file_data, file.filename or "file.bin", folder=folder)
    return ApiResponse(data={"url": url})


@router.post("/images", response_model=ApiResponse)
async def upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """批量上传图片"""
    if len(files) > 9:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="最多同时上传 9 张图片",
        )

    urls = []
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"文件 {file.filename} 格式不支持",
            )

        file_data = await file.read()
        if len(file_data) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"图片 {file.filename} 大小超过 5MB",
            )

        url = upload_file(file_data, file.filename or "image.png", folder="images")
        urls.append(url)

    return ApiResponse(data={"urls": urls})
