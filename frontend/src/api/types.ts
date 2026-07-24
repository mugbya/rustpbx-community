// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页响应数据
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// 用户信息
export interface UserInfo {
  id: number
  username: string
  email: string
  avatar: string | null
  bio: string | null
  signature: string | null
  role: string
  reputation: number
  is_verified: boolean
  created_at: string
  last_login_at: string | null
}

// 作者简要信息
export interface AuthorBrief {
  id: number
  username: string
  avatar: string | null
}

// 论坛板块
export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  topic_type: string | null
  thread_count: number
  parent_id: number | null
  discussion_count?: number
  question_count?: number
  article_count?: number
  resource_count?: number
}

// 帖子类型
export type TopicType = 'discussion' | 'question' | 'article' | 'resource'

// 帖子列表项
export interface TopicListItem {
  id: number
  title: string
  type: TopicType
  category_id: number | null
  author: AuthorBrief
  view_count: number
  reply_count: number
  like_count: number
  favorite_count: number
  is_pinned: boolean
  is_essential: boolean
  is_solved: boolean
  created_at: string
  last_reply_at: string | null
}

// 帖子详情
export interface TopicDetail {
  id: number
  title: string
  content: string
  content_type: string
  type: TopicType
  category_id: number | null
  author: AuthorBrief
  view_count: number
  reply_count: number
  like_count: number
  favorite_count: number
  is_pinned: boolean
  is_essential: boolean
  is_locked: boolean
  is_solved: boolean
  tags: string[]
  resource_url: string | null
  resource_type: string | null
  created_at: string
  updated_at: string
  last_reply_at: string | null
  last_reply_user_id: number | null
  can_moderate?: boolean
}

// 回复
export interface Post {
  id: number
  topic_id: number
  author: AuthorBrief
  content: string
  content_type: string
  floor: number
  parent_id: number | null
  like_count: number
  created_at: string
}

// 用户统计数据
export interface UserStats {
  discussion_count: number
  question_count: number
  article_count: number
  reply_count: number
  like_count: number
}

// 社区统计数据
export interface ForumStats {
  discussion_count: number
  question_count: number
  article_count: number
  user_count: number
}
