// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页响应数据
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}

// 用户信息
export interface UserInfo {
  id: number
  username: string
  email: string
  avatar: string
  nickname: string
  bio: string
  created_at: string
}

// 登录响应
export interface LoginResult {
  token: string
  user: UserInfo
}

// 论坛板块
export interface ForumCategory {
  id: number
  name: string
  description: string
  topic_count: number
  post_count: number
}

// 帖子（话题）
export interface Topic {
  id: number
  title: string
  author: UserInfo
  category: ForumCategory
  replies: number
  views: number
  created_at: string
  last_reply_at: string
  is_pinned: boolean
  is_essence: boolean
}

// 问答
export interface Question {
  id: number
  title: string
  author: UserInfo
  tags: string[]
  answers: number
  views: number
  created_at: string
  is_solved: boolean
}

// 文章
export interface Article {
  id: number
  title: string
  summary: string
  author: UserInfo
  cover: string
  views: number
  likes: number
  created_at: string
}

// 资源
export interface Resource {
  id: number
  title: string
  description: string
  author: UserInfo
  type: string
  download_url: string
  downloads: number
  created_at: string
}
