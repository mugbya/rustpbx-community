"""用户 API"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/{user_id}", response_model=ApiResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """获取用户公开信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    return ApiResponse(data=UserResponse.model_validate(user).model_dump())


@router.put("/me", response_model=ApiResponse)
def update_me(
    request: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """更新当前用户信息"""
    # 检查用户名唯一性
    if request.username and request.username != current_user.username:
        if db.query(User).filter(User.username == request.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该用户名已被使用",
            )
        current_user.username = request.username

    if request.avatar is not None:
        current_user.avatar = request.avatar
    if request.bio is not None:
        current_user.bio = request.bio
    if request.signature is not None:
        current_user.signature = request.signature

    db.commit()
    db.refresh(current_user)
    return ApiResponse(data=UserResponse.model_validate(current_user).model_dump())
