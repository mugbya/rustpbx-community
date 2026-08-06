import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Eye, ThumbsUp, Star } from 'lucide-react'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { CategoryTagsBar } from '@/components/CategoryTagsBar'
import { TopicStatusTags, TopicBoardTags } from '@/components/TopicMeta'
import { forumApi } from '@/api/forum'
import type { Category, TopicListItem } from '@/api/types'
import { topicDetailPath } from '@/utils/constants'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spin } from '@/components/ui/Spin'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 20

// 论坛板块列表
export default function ForumList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<TopicListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [tags, setTags] = useState<{ id: number; name: string; usage_count: number }[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [loadingCats, setLoadingCats] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  // 获取板块分类列表
  useEffect(() => {
    setLoadingCats(true)
    forumApi
      .getCategories('discussion')
      .then((data) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoadingCats(false))
  }, [])

  // 获取热门标签列表
  useEffect(() => {
    forumApi.getTags('discussion').then(setTags).catch(() => {})
  }, [])

  // 获取帖子列表（按选中板块筛选）
  useEffect(() => {
    setLoadingTopics(true)
    forumApi
      .getTopics({
        topic_type: 'discussion',
        category_id: selectedCategory ?? undefined,
        tag: selectedTag ?? undefined,
        page,
        page_size: PAGE_SIZE,
      })
      .then((data) => {
        setTopics(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoadingTopics(false))
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
    <div className="flex flex-col gap-6 w-full">
      {/* 板块列表 */}
      <Card
        title="论坛板块"
        extra={
          <Button variant="primary" onClick={() => navigate('/topic/create?type=discussion')}>
            <Plus className="h-4 w-4" />
            发帖
          </Button>
        }
      >
        {loadingCats ? (
          <Spin />
        ) : (
          <CategoryTagsBar
            loading={loadingCats}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
            countField="discussion_count"
            tags={tags}
            selectedTag={selectedTag}
            onTagClick={handleTagClick}
          />
        )}
      </Card>

      {/* 帖子列表 */}
      <Card title={selectedCategory ? `${categories.find((c) => c.id === selectedCategory)?.name ?? ''}的帖子` : '最新帖子'}>
        {loadingTopics ? (
          <Spin />
        ) : topics.length === 0 ? (
          <EmptyState
            description="暂无帖子"
            actionText="发帖"
            onAction={() => navigate('/topic/create?type=discussion')}
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {topics.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-3 cursor-pointer"
                  onClick={() => navigate(topicDetailPath(item.type, item.id))}
                >
                  <Avatar src={item.author.avatar}>{item.author.username[0]}</Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TopicStatusTags topic={item} />
                      <span className="text-gray-800">{item.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <span>{item.author.username}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {item.reply_count}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" /> {item.view_count}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {item.like_count}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3" /> {item.favorite_count}</span>
                      <span>·</span>
                      <span>{dayjs(item.created_at).format('MM-DD HH:mm')}</span>
                    </div>
                    <div className="mt-1">
                      <TopicBoardTags
                        topic={item}
                        categories={categories}
                        onTagClick={(tag) => { handleTagClick(tag); setPage(1) }}
                      />
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
