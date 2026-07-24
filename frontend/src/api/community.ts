import client from '@/api/client'

export interface CommunityPostItem {
  id: number
  title: string
  author: { id: number; username: string; avatar: string | null }
  view_count: number
  reply_count: number
  like_count: number
  created_at: string
  last_reply_at: string | null
}

export interface CommunityPostDetail extends CommunityPostItem {
  content: string
  content_type: string
  can_delete: boolean
}

export interface CommunityReply {
  id: number
  content: string
  author: { id: number; username: string; avatar: string | null }
  floor: number
  like_count: number
  created_at: string
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export const communityApi = {
  getPosts: (params: { keyword?: string; page?: number; page_size?: number; sort?: string }) =>
    client.get<unknown, PaginatedData<CommunityPostItem>>('/v1/community/posts', { params }),

  getPost: (id: number) =>
    client.get<unknown, CommunityPostDetail>(`/v1/community/posts/${id}`),

  createPost: (data: { title: string; content: string }) =>
    client.post<unknown, CommunityPostDetail>('/v1/community/posts', data),

  updatePost: (id: number, data: { title: string; content: string }) =>
    client.put<unknown, CommunityPostDetail>(`/v1/community/posts/${id}`, data),

  deletePost: (id: number) =>
    client.delete<unknown, void>(`/v1/community/posts/${id}`),

  getReplies: (postId: number, params: { page?: number; page_size?: number }) =>
    client.get<unknown, PaginatedData<CommunityReply>>(`/v1/community/posts/${postId}/replies`, { params }),

  createReply: (postId: number, data: { content: string; parent_id?: number }) =>
    client.post<unknown, CommunityReply>(`/v1/community/posts/${postId}/replies`, data),
}
