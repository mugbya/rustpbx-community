import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Typography, Space, Avatar, Tag, Button, Spin, Pagination } from 'antd'
import { PlusOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { forumApi } from '@/api/forum'
import type { Category, ThreadListItem } from '@/api/types'

const PAGE_SIZE = 20

// 资源列表
export default function ResourceList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ThreadListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
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

  // 获取资源列表（按板块筛选）
  useEffect(() => {
    setLoading(true)
    forumApi
      .getThreads({
        thread_type: 'resource',
        category_id: selectedCategory ?? undefined,
        page,
        page_size: PAGE_SIZE,
      })
      .then((data) => {
        setItems(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, selectedCategory])

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
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
                {cat.name} ({cat.resource_count ?? 0})
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      {/* 资源列表 */}
      <Card
        title={selectedCategory ? `${categories.find((c) => c.id === selectedCategory)?.name ?? ''}的资源` : '资源'}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/thread/create?type=resource')}>
            上传资源
          </Button>
        }
      >
        {loading ? (
          <Spin />
        ) : items.length === 0 ? (
          <EmptyState
            description="暂无资源"
            actionText="上传资源"
            onAction={() => navigate('/thread/create?type=resource')}
          />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/forum/topic/${item.id}`)}
                  actions={[
                    <Button type="link" icon={<DownloadOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/forum/topic/${item.id}`) }}>
                      查看详情
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar size={48} style={{ background: '#1677ff' }} src={item.author.avatar}>{item.author.username[0]}</Avatar>}
                    title={
                      <Space>
                        <Typography.Text strong>{item.title}</Typography.Text>
                        <Tag color="blue">资源</Tag>
                      </Space>
                    }
                    description={
                      <Space split={<span>·</span>}>
                        <span>上传者：{item.author.username}</span>
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
