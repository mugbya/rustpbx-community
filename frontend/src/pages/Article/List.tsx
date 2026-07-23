import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Typography, Space, Avatar, Button, Tag, Spin, Pagination } from 'antd'
import { PlusOutlined, EyeOutlined, LikeOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { forumApi } from '@/api/forum'
import type { Category, ThreadListItem } from '@/api/types'

const PAGE_SIZE = 20

// 文章列表
export default function ArticleList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ThreadListItem[]>([])
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
      .getCategories()
      .then((data) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoadingCats(false))
  }, [])

  // 获取热门标签列表
  useEffect(() => {
    forumApi.getTags('article').then(setTags).catch(() => {})
  }, [])

  // 获取文章列表（按板块筛选）
  useEffect(() => {
    setLoading(true)
    forumApi
      .getThreads({
        thread_type: 'article',
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

  // 点击标签：切换筛选
  const handleTagClick = (tagName: string | null) => {
    setSelectedTag(tagName)
    setPage(1)
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* 板块筛选 */}
      <Card>
        {loadingCats ? (
          <Spin size="small" />
        ) : (
          <Space wrap size={[8, 8]}>
            <Tag
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              color={selectedCategory === null ? 'red' : 'default'}
              onClick={() => handleCategoryClick(null)}
            >
              全部
            </Tag>
            {categories.map((cat) => (
              <Tag
                key={cat.id}
                style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
                color={selectedCategory === cat.id ? 'red' : 'default'}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name} ({cat.article_count ?? 0})
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <Card>
          <Space wrap size={[8, 8]}>
            <Tag
              style={{ cursor: 'pointer', padding: '2px 10px' }}
              color={selectedTag === null ? 'orange' : 'default'}
              onClick={() => handleTagClick(null)}
            >
              全部标签
            </Tag>
            {tags.map((t) => (
              <Tag
                key={t.id}
                style={{ cursor: 'pointer', padding: '2px 10px' }}
                color={selectedTag === t.name ? 'orange' : 'default'}
                onClick={() => handleTagClick(t.name)}
              >
                {t.name} ({t.usage_count})
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 文章列表 */}
      <Card
        title={selectedCategory ? `${categories.find((c) => c.id === selectedCategory)?.name ?? ''}的文章` : '文章'}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/thread/create?type=article')}>
            写文章
          </Button>
        }
      >
        {loading ? (
          <Spin />
        ) : items.length === 0 ? (
          <EmptyState
            description="暂无文章"
            actionText="写文章"
            onAction={() => navigate('/thread/create?type=article')}
          />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={items}
              renderItem={(item) => (
                <List.Item key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum/topic/${item.id}`)}>
                  <List.Item.Meta
                    avatar={<Avatar size={48} src={item.author.avatar}>{item.author.username[0]}</Avatar>}
                    title={
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        {item.title}
                      </Typography.Title>
                    }
                    description={
                      <Space split={<span>·</span>}>
                        <span>{item.author.username}</span>
                        <span><CalendarOutlined /> {dayjs(item.created_at).format('YYYY-MM-DD')}</span>
                        <span><EyeOutlined /> {item.view_count}</span>
                        <span><LikeOutlined /> {item.like_count}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
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
    </Space>
  )
}
