"""问答 API：采纳答案、标记已解决"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.post import Post
from app.models.thread import Thread, ThreadType
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse

router = APIRouter()


@router.put("/threads/{thread_id}/accept/{post_id}", response_model=ApiResponse)
def accept_answer(
    thread_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """采纳答案"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="问题不存在",
        )

    if thread.type != ThreadType.QUESTION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅问答类型可以采纳答案",
        )

    # 权限检查：提问者或管理员
    if thread.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅提问者或管理员可以采纳答案",
        )

    if thread.is_solved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该问题已采纳过答案",
        )

    # 校验回答存在且属于该帖子
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.thread_id == thread_id,
        Post.is_deleted == False,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="回答不存在",
        )

    # 采纳
    thread.accepted_answer_id = post_id
    thread.is_solved = True

    # 给回答者增加声望
    answer_author = db.query(User).filter(User.id == post.user_id).first()
    if answer_author:
        answer_author.reputation += 10

    db.commit()
    return ApiResponse(message="已采纳答案")


@router.put("/threads/{thread_id}/solve", response_model=ApiResponse)
def mark_solved(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """标记问题已解决（不采纳特定答案）"""
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.is_deleted == False,  # noqa: E712
    ).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="问题不存在",
        )

    if thread.type != ThreadType.QUESTION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅问答类型可以标记已解决",
        )

    if thread.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅提问者或管理员可以操作",
        )

    thread.is_solved = True
    db.commit()
    return ApiResponse(message="已标记为已解决")
