// 应用常量定义

// API 基础路径（通过 vite 代理到后端 8000 端口）
export const API_BASE_URL = '/api'

// GitHub OAuth 授权地址
export const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'

// 文档站地址
export const DOCS_URL = 'https://docs.rustpbx.cn/'

// GitHub 仓库地址
export const GITHUB_REPO_URL = 'https://github.com/restsend/rustpbx'

// Token 在 localStorage 中的存储键名
export const TOKEN_KEY = 'rustpbx_token'

// 社区导航菜单项
export const NAV_MENU_ITEMS = [
  { key: '/', label: '首页' },
  { key: '/forum', label: '论坛' },
  { key: '/qa', label: '问答' },
  { key: '/articles', label: '文章' },
  { key: '/resources', label: '资源' },
  { key: '/community', label: '社区建设' },
  { key: 'docs', label: '文档', external: DOCS_URL },
] as const

// 帖子类型（分区）元信息：名称、列表页路由、标签颜色
// 分区 = topic.type，对应论坛/问答/文章/资源四个顶级分区
export type TopicTypeKey = 'discussion' | 'question' | 'article' | 'resource'

export const TOPIC_TYPE_META: Record<
  TopicTypeKey,
  { label: string; route: string; color: 'blue' | 'orange' | 'green' | 'cyan' }
> = {
  discussion: { label: '论坛', route: '/forum', color: 'blue' },
  question: { label: '问答', route: '/qa', color: 'orange' },
  article: { label: '文章', route: '/articles', color: 'green' },
  resource: { label: '资源', route: '/resources', color: 'cyan' },
}

// 构造帖子详情页路径：按分区前缀生成，使导航高亮能正确匹配所属分区。
// type 缺省时回退到 /forum（例如「我的回复」只拿到 topic_id 时），
// 详情页拿到 topic.type 后会自纠偏到正确分区前缀。
export function topicDetailPath(
  type?: TopicTypeKey,
  id: number | string = 0,
): string {
  const base = type && TOPIC_TYPE_META[type] ? TOPIC_TYPE_META[type].route : '/forum'
  return `${base}/topic/${id}`
}
