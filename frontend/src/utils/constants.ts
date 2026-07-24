// 应用常量定义

// API 基础路径（通过 vite 代理到后端 8000 端口）
export const API_BASE_URL = '/api'

// GitHub OAuth 授权地址
export const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'

// 文档站地址
export const DOCS_URL = 'https://docs.rustpbx.cn/'

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
