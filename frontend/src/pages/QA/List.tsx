import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Tag, Avatar, Space, Button, Spin, Pagination } from 'antd'
import { PlusOutlined, MessageOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { forumApi } from '@/api/forum'
import type { Category, TopicListItem } from '@/api/types'

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
                {cat.name} ({cat.question_count ?? 0})
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

      {/* 问答列表 */}
      <Card
        title={selectedCategory ? `${categories.find((c) => c.id === selectedCategory)?.name ?? ''}的问答` : '问答'}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/topic/create?type=question')}>
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
            <List
              itemLayout="horizontal"
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/forum/topic/${item.id}`)}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.author.avatar}>{item.author.username[0]}</Avatar>}
                    title={
                      <Space>
                        {item.is_solved ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">
                            已解决
                          </Tag>
                        ) : (
                          <Tag color="processing">未解决</Tag>
                        )}
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={
                      <Space split={<span>·</span>}>
                        <span>{item.author.username}</span>
                        <span><MessageOutlined /> {item.reply_count} 回答</span>
                        <span><EyeOutlined /> {item.view_count} 浏览</span>
                        <span>{dayjs(item.created_at).format('YYYY-MM-DD')}</span>
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
