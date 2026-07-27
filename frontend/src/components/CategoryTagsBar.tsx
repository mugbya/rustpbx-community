import { Spin } from '@/components/ui/Spin'
import { Space } from '@/components/ui/Space'
import type { Category } from '@/api/types'

type CountField = 'discussion_count' | 'question_count' | 'article_count' | 'resource_count'

interface CategoryTagsBarProps {
  loading: boolean
  categories: Category[]
  selectedCategory: number | null
  onCategoryClick: (id: number | null) => void
  countField: CountField
  tags: { id: number; name: string; usage_count: number }[]
  selectedTag: string | null
  onTagClick: (name: string | null) => void
}

// 板块 + 标签筛选条（Forum/QA/Article/Resource 列表页共用）
// 只渲染内部的按钮组，外层 Card 由调用方决定
export function CategoryTagsBar({
  loading,
  categories,
  selectedCategory,
  onCategoryClick,
  countField,
  tags,
  selectedTag,
  onTagClick,
}: CategoryTagsBarProps) {
  const catBtn = (active: boolean) =>
    `px-3 py-1 text-sm rounded border cursor-pointer transition-colors ${
      active
        ? 'border-primary-600 bg-primary-50 text-primary-600'
        : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-primary-600 hover:text-primary-600'
    }`
  const tagBtn = (active: boolean) =>
    `px-2.5 py-0.5 text-xs rounded border cursor-pointer transition-colors ${
      active
        ? 'border-orange-400 bg-orange-50 text-orange-600'
        : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-orange-400 hover:text-orange-600'
    }`

  return (
    <div className="flex flex-col gap-4">
      {/* 板块筛选 */}
      {loading ? (
        <Spin size="small" />
      ) : (
        <Space wrap size={[8, 8]}>
          <button className={catBtn(selectedCategory === null)} onClick={() => onCategoryClick(null)}>
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={catBtn(selectedCategory === cat.id)}
              onClick={() => onCategoryClick(cat.id)}
            >
              {cat.name} ({(cat as any)[countField] ?? 0})
            </button>
          ))}
        </Space>
      )}

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <Space wrap size={[8, 8]}>
          <button className={tagBtn(selectedTag === null)} onClick={() => onTagClick(null)}>
            全部标签
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              className={tagBtn(selectedTag === t.name)}
              onClick={() => onTagClick(t.name)}
            >
              {t.name} ({t.usage_count})
            </button>
          ))}
        </Space>
      )}
    </div>
  )
}
