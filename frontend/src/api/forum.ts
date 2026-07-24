import client from './client'
import type {
  Category,
  ThreadListItem,
  ThreadDetail,
  Post,
  PaginatedData,
  ThreadType,
} from './types'

// 论坛相关 API
export const forumApi = {
  // 获取板块分类列表（可按分区筛选）
  getCategories: (thread_type?: string) => client.get<unknown, Category[]>('/v1/forum/categories', { params: { thread_type } }),

  // 创建板块（管理员）
  createCategory: (data: { name: string; slug: string; description?: string; thread_type?: string; sort_order?: number }) =>
    client.post<unknown, Category>('/v1/forum/categories', data),

  // 编辑板块（管理员）
  updateCategory: (id: number, data: { name?: string; description?: string; thread_type?: string; sort_order?: number; is_active?: boolean }) =>
    client.put<unknown, Category>(`/v1/forum/categories/${id}`, data),

  // 删除板块（管理员）
  deleteCategory: (id: number) => client.delete<unknown, { deleted: boolean }>(`/v1/forum/categories/${id}`),

  // 获取热门标签列表（可按帖子类型筛选）
  getTags: (thread_type?: ThreadType) => client.get<unknown, { id: number; name: string; usage_count: number }[]>('/v1/forum/tags', { params: { thread_type } }),

  // 获取用户回复列表（包含帖子标题）
  getUserPosts: (params: { user_id?: number; page?: number; page_size?: number }) =>
    client.get<unknown, { items: { id: number; thread_id: number; thread_title: string; author: { id: number; username: string; avatar: string | null }; content: string; floor: number; like_count: number; created_at: string }[]; total: number; page: number; page_size: number }>('/v1/forum/posts', { params }),

  // 获取帖子列表（支持按板块、类型、关键词、标签筛选和分页）
  getThreads: (params: {
    category_id?: number
    thread_type?: ThreadType
    keyword?: string
    user_id?: number
    tag?: string
    is_essential?: boolean
    sort?: string
    page?: number
    page_size?: number
  }) => client.get<unknown, PaginatedData<ThreadListItem>>('/v1/forum/threads', { params }),

  // 置顶/取消置顶（管理员或板块版主）
  togglePin: (threadId: number) => client.put<unknown, { is_pinned: boolean }>(`/v1/forum/threads/${threadId}/pin`),

  // 加精/取消加精（管理员或板块版主）
  toggleEssential: (threadId: number) => client.put<unknown, { is_essential: boolean }>(`/v1/forum/threads/${threadId}/essential`),

  // 获取板块版主列表
  getModerators: (categoryId: number) => client.get<unknown, { id: number; user_id: number; username: string; avatar: string | null; email: string }[]>(`/v1/forum/categories/${categoryId}/moderators`),

  // 分配板块版主
  addModerator: (categoryId: number, userId: number) => client.post<unknown, { id: number; user_id: number; username: string }>(`/v1/forum/categories/${categoryId}/moderators`, null, { params: { user_id: userId } }),

  // 取消板块版主
  removeModerator: (categoryId: number, userId: number) => client.delete<unknown, { removed: boolean }>(`/v1/forum/categories/${categoryId}/moderators/${userId}`),

  // 获取帖子详情
  getThread: (id: number) => client.get<unknown, ThreadDetail>(`/v1/forum/threads/${id}`),

  // 创建帖子
  createThread: (data: {
    title: string
    content: string
    content_type?: string
    type: ThreadType
    category_id?: number
    tags?: string[]
    resource_url?: string
    resource_type?: string
  }) => client.post<unknown, ThreadDetail>('/v1/forum/threads', data),

  // 更新帖子
  updateThread: (id: number, data: { title?: string; content?: string; tags?: string[] }) =>
    client.put<unknown, ThreadDetail>(`/v1/forum/threads/${id}`, data),

  // 删除帖子
  deleteThread: (id: number) => client.delete<unknown, void>(`/v1/forum/threads/${id}`),

  // 获取帖子回复列表
  getPosts: (threadId: number, params: { page?: number; page_size?: number }) =>
    client.get<unknown, PaginatedData<Post>>(`/v1/forum/threads/${threadId}/posts`, { params }),

  // 创建回复
  createPost: (threadId: number, data: { content: string; parent_id?: number }) =>
    client.post<unknown, Post>(`/v1/forum/threads/${threadId}/posts`, data),
}

// 互动 API（点赞 / 收藏）
export const interactionApi = {
  // 切换点赞状态
  toggleLike: (target_type: string, target_id: number) =>
    client.post<unknown, { liked: boolean; like_count: number }>('/v1/interactions/like', {
      target_type,
      target_id,
    }),

  // 切换收藏状态
  toggleFavorite: (target_type: string, target_id: number) =>
    client.post<unknown, { favorited: boolean; favorite_count: number }>('/v1/interactions/favorite', {
      target_type,
      target_id,
    }),
}

// 文件上传 API
export const uploadApi = {
  // 上传图片
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<unknown, { url: string }>('/v1/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // 上传文件
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<unknown, { url: string }>('/v1/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
