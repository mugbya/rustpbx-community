/**
 * 图片处理工具
 * 配合腾讯云 CDN + 数据万象 imageMogr2 实现实时缩略图
 */

// 缩略图尺寸预设
const THUMBNAIL_PRESETS = {
  small: '400x300', // 列表/卡片
  medium: '1200x800', // 详情页
} as const

type ThumbnailSize = keyof typeof THUMBNAIL_PRESETS

/**
 * 判断是否为腾讯云图片（COS 直连或 CDN）
 */
function isTencentCloudImage(url: string): boolean {
  return url.includes('myqcloud.com') || url.includes('cdn.')
}

/**
 * 生成缩略图 URL
 * 对腾讯云图片追加 imageMogr2 参数实现实时缩略
 *
 * @param url 原始图片 URL
 * @param size 缩略图尺寸预设（small=列表/卡片, medium=详情页）
 * @returns 带缩略图参数的 URL
 */
export function getThumbUrl(
  url: string,
  size: ThumbnailSize = 'medium',
): string {
  if (!url) return url
  // 只对腾讯云图片处理
  if (!isTencentCloudImage(url)) return url
  // 已有 imageMogr2 参数则不重复添加
  if (url.includes('imageMogr2')) return url
  const preset = THUMBNAIL_PRESETS[size]
  return `${url}?imageMogr2/thumbnail/${preset}/quality/85`
}

/**
 * 获取原图 URL（去掉缩略图参数）
 */
export function getOriginalUrl(url: string): string {
  if (!url) return url
  return url.split('?')[0]
}
