import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Eye, CheckCircle } from 'lucide-react'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { CategoryTagsBar } from '@/components/CategoryTagsBar'
import { forumApi } from '@/api/forum'
import type { Category, TopicListItem } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spin } from '@/components/ui/Spin'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 20

// 问答列表
export default function QAList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<TopicListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [tags, setTags] = useState<{ id: number; name: string; usage_count: number }[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [loadingCats, setLoadingCats] = useState(false)
  const [loading, setLoading] = useState(false)

  // 获取板块列表
  useEffect(() => {
    setLoadingCats(true)
    forumApi
      .getCategories('question')
      .then((data) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoadingCats(false))
  }, [])

  // 获取热门标签列表
  useEffect(() => {
    forumApi.getTags('question').then(setTags).catch(() => {})
  }, [])

  // 获取问答列表（按板块筛选）
  useEffect(() => {
    setLoading(true)
    forumApi
      .getTopics({
        topic_type: 'question',
        category_id: selectedCategory ?? undefined,
        tag: selectedTag ?? undefined,
        page,
        page_size: PAGE_SIZE,
      })
      .then((data) => {
        setItems(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, selectedCategory, selectedTag])

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setPage(1)
  }

  const handleTagClick = (tagName: string | null) => {
    setSelectedTag(tagName)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 板块 + 标签筛选 */}
      <Card>
        <CategoryTagsBar
          loading={loadingCats}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
          countField="question_count"
          tags={tags}
          selectedTag={selectedTag}
          onTagClick={handleTagClick}
        />
      </Card>

      {/* 问答列表 */}
      <Card
        title={selectedCategory ? `${categories.find((c) => c.id === selectedCategory)?.name ?? ''}的问答` : '问答'}
        extra={
          <Button variant="primary" onClick={() => navigate('/topic/create?type=question')}>
            <Plus className="h-4 w-4" />
            提问
          </Button>
        }
      >
        {loading ? (
          <Spin />
        ) : items.length === 0 ? (
          <EmptyState
            description="暂无问答"
            actionText="提问"
            onAction={() => navigate('/topic/create?type=question')}
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-3 cursor-pointer"
                  onClick={() => navigate(`/forum/topic/${item.id}`)}
                >
                  <Avatar src={item.author.avatar}>{item.author.username[0]}</Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.is_solved ? (
                        <Tag color="green">
                          <CheckCircle className="h-3 w-3 inline mr-0.5" />
                          已解决
                        </Tag>
                      ) : (
                        <Tag color="blue">未解决</Tag>
                      )}
                      <span className="text-gray-800">{item.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <span>{item.author.username}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {item.reply_count} 回答</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" /> {item.view_count} 浏览</span>
                      <span>·</span>
                      <span>{dayjs(item.created_at).format('YYYY-MM-DD')}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <Pagination
                current={page}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
