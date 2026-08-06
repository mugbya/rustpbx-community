import type { Category, TopicListItem } from '@/api/types'
import { Tag } from '@/components/ui/Tag'
import { Space } from '@/components/ui/Space'

interface TopicMetaBaseProps {
  /** 帖子列表项 */
  topic: TopicListItem
  /** 板块列表（用于按 category_id 解析板块名） */
  categories?: Category[]
}

interface TopicStatusTagsProps extends TopicMetaBaseProps {}

/**
 * 帖子状态标签：置顶 / 加精 / 已解决。
 * 放在帖子标题左侧，与标题同行。
 */
export function TopicStatusTags({ topic }: TopicStatusTagsProps) {
  if (!topic.is_pinned && !topic.is_essential && !topic.is_solved) return null
  return (
    <>
      {topic.is_pinned && <Tag color="red">置顶</Tag>}
      {topic.is_essential && <Tag color="gold">精华</Tag>}
      {topic.is_solved && <Tag color="green">已解决</Tag>}
    </>
  )
}

interface TopicBoardTagsProps extends TopicMetaBaseProps {
  /** 标签点击回调；不传则标签仅展示不可点 */
  onTagClick?: (tag: string) => void
}

/**
 * 帖子的板块与标签，放在帖子标题下一行。
 * 板块与标签级别不同，做视觉区分：
 * - 板块：带边框 + 底色（蓝色 Tag），前置一个「板块」小字标识
 * - 标签：浅灰文字样式，前缀「#」，更轻量
 */
export function TopicBoardTags({ topic, categories, onTagClick }: TopicBoardTagsProps) {
  const categoryName =
    topic.category_id != null
      ? categories?.find((c) => c.id === topic.category_id)?.name
      : undefined

  const hasTags = topic.tags && topic.tags.length > 0
  if (!categoryName && !hasTags) return null

  return (
    <Space wrap size={[8, 6]} align="center">
      {categoryName && (
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="text-gray-400">板块</span>
          <Tag color="blue">{categoryName}</Tag>
        </span>
      )}
      {hasTags && (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          {topic.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onTagClick?.(tag)
              }}
              className={`text-xs text-gray-500 hover:text-primary-600 ${
                onTagClick ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              #{tag}
            </button>
          ))}
        </span>
      )}
    </Space>
  )
}
