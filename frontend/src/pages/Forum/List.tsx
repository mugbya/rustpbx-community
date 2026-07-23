import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Tag, Avatar, Space, Button, Spin, Pagination } from 'antd'
import { PlusOutlined, MessageOutlined, EyeOutlined, LikeOutlined, StarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { forumApi } from '@/api/forum'
import type { Category, ThreadListItem } from '@/api/types'

const PAGE_SIZE = 20

// 论坛板块列表
export default function ForumList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [threads, setThreads] = useState<ThreadListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loadingCats, setLoadingCats] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(false)

  // 获取板块分类列表
  useEffect(() => {
    setLoadingCats(true)
    forumApi
      .getCategories()
      .then((data) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoadingCats(false))
  }, [])

  // 获取帖子列表（按选中板块筛选）
  useEffect(() => {
    setLoadingThreads(true)
    forumApi
      .getThreads({
        thread_type: 'discussion',
        category_id: selectedCategory ?? undefined,
        page,
        page_size: PAGE_SIZE,
      })
      .then((data) => {
        setThreads(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoadingThreads(false))
  }, [page, selectedCategory])

  // 点击板块：切换筛选
  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setPage(1)
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 板块列表 */}
      <Card
        title="论坛板块"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/thread/create?type=discussion')}>
            发帖
          </Button>
        }
      >
        {loadingCats ? (
          <Spin />
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
                {cat.name} ({cat.discussion_count ?? 0})
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      {/* 帖子列表 */}
      <Card title={selectedCategory ? `${categories.find((c) => c.id === selectedCategory)?.name ?? ''}的帖子` : '最新帖子'}>
        {loadingThreads ? (
          <Spin />
        ) : threads.length === 0 ? (
          <EmptyState
            description="暂无帖子"
            actionText="发帖"
            onAction={() => navigate('/thread/create?type=discussion')}
          />
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={threads}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/forum/topic/${item.id}`)}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.author.avatar}>{item.author.username[0]}</Avatar>}
                    title={
                      <Space>
                        {item.is_pinned && <Tag color="red">置顶</Tag>}
                        {item.is_essential && <Tag color="gold">精华</Tag>}
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={
                      <Space split={<span>·</span>}>
                        <span>{item.author.username}</span>
                        <span><MessageOutlined /> {item.reply_count}</span>
                        <span><EyeOutlined /> {item.view_count}</span>
                        <span><LikeOutlined /> {item.like_count}</span>
                        <span><StarOutlined /> {item.favorite_count}</span>
                        <span>{dayjs(item.created_at).format('MM-DD HH:mm')}</span>
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
