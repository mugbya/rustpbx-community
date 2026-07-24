/**
 * 图片处理工具
 * 配合腾讯云 CDN + 数据万象 imageMogr2 实现实时缩略图
 */

import client from '@/api/client'

// 缩略图尺寸预设
const THUMBNAIL_PRESETS = {
  small: '400x300', // 列表/卡片
  medium: '1200x800', // 详情页
} as const

type ThumbnailSize = keyof typeof THUMBNAIL_PRESETS

// CDN 配置缓存
let cdnConfig: { cdn_domain: string | null; cos_domain: string } | null = null

/**
 * 初始化 CDN 配置（从后端获取，App 启动时调用一次）
 */
export async function initCdnConfig() {
  if (cdnConfig) return
  try {
    const data = await client.get<
      unknown,
      { cdn_domain: string | null; cos_domain: string }
    >('/v1/forum/config')
    cdnConfig = data
  } catch {
    cdnConfig = { cdn_domain: null, cos_domain: '' }
  }
}

/**
 * 替换 COS 直连域名为 CDN 域名
 * 旧帖子中的图片 URL 是 COS 直连地址，渲染时自动替换为 CDN
 */
function replaceWithCdn(url: string): string {
  if (!cdnConfig?.cdn_domain || !cdnConfig?.cos_domain) return url
  const cdnDomain = cdnConfig.cdn_domain
  const cosDomain = cdnConfig.cos_domain
  // CDN 域名包含协议时，替换整个 URL 前缀（含协议）
  if (cdnDomain.startsWith('http')) {
    return url.replace(`https://${cosDomain}`, cdnDomain)
  }
  // 否则只替换域名
  return url.replace(cosDomain, cdnDomain)
}

/**
 * 判断是否为腾讯云图片（COS 直连或 CDN）
 */
function isTencentCloudImage(url: string): boolean {
  return url.includes('myqcloud.com') || url.includes('cdn.')
}

/**
 * 生成缩略图 URL
 * 对腾讯云图片追加 imageMogr2 参数实现实时缩略
 * 如果配置了 CDN 域名，自动替换 COS 直连为 CDN
 *
 * @param url 原始图片 URL
 * @param size 缩略图尺寸预设（small=列表/卡片, medium=详情页）
 * @returns 带缩略图参数的 CDN URL
 */
export function getThumbUrl(
  url: string,
  size: ThumbnailSize = 'medium',
): string {
  if (!url) return url
  // 替换 COS 直连域名为 CDN 域名
  const cdnUrl = replaceWithCdn(url)
  // 只对腾讯云图片处理
  if (!isTencentCloudImage(cdnUrl)) return cdnUrl
  // 已有 imageMogr2 参数则不重复添加
  if (cdnUrl.includes('imageMogr2')) return cdnUrl
  const preset = THUMBNAIL_PRESETS[size]
  return `${cdnUrl}?imageMogr2/thumbnail/${preset}/quality/85`
}

/**
 * 获取原图 URL（去掉缩略图参数，替换为 CDN 域名）
 */
export function getOriginalUrl(url: string): string {
  if (!url) return url
  const cdnUrl = replaceWithCdn(url)
  return cdnUrl.split('?')[0]
}
