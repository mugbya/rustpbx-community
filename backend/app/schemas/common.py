"""通用 Schema"""

from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel):
    """统一 API 响应格式"""

    code: int = 0
    message: str = "success"
    data: Optional[Any] = None


class PaginatedData(BaseModel, Generic[T]):
    """分页数据"""

    items: List[T]
    total: int
    page: int
    page_size: int


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应"""

    code: int = 0
    message: str = "success"
    data: PaginatedData[T]


class PageParams(BaseModel):
    """分页参数"""

    page: int = 1
    page_size: int = 20
