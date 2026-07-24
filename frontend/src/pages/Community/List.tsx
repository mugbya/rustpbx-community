import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Avatar, Space, Button, Input, Pagination, Spin } from 'antd'
import { PlusOutlined, MessageOutlined, EyeOutlined, LikeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { communityApi } from '@/api/community'
import type { CommunityPostItem } from '@/api/community'

const PAGE_SIZE = 20

// 社区建设帖子列表
export default function CommunityList() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  // 获取帖子列表
  useEffect(() => {
    setLoading(true)
    communityApi
      .getPosts({ keyword, page, page_size: PAGE_SIZE })
      .then((data) => {
        setPosts(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [keyword, page])

  // 搜索：重置页码
  const handleSearch = (value: string) => {
    setKeyword(value || undefined)
    setPage(1)
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 搜索栏与发帖按钮 */}
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input.Search
            placeholder="搜索帖子标题"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/community/create')}>
            发帖
          </Button>
        </Space>
      </Card>

      {/* 帖子列表 */}
      <Card title="最新帖子">
        {loading ? (
          <Spin />
        ) : posts.length === 0 ? (
          <EmptyState
            description="暂无帖子"
            actionText="发帖"
            onAction={() => navigate('/community/create')}
          />
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={posts}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/community/detail/${item.id}`)}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.author.avatar}>{item.author.username[0]}</Avatar>}
                    title={<span>{item.title}</span>}
                    description={
                      <Space split={<span>·</span>}>
                        <span>{item.author.username}</span>
                        <span><MessageOutlined /> {item.reply_count}</span>
                        <span><EyeOutlined /> {item.view_count}</span>
                        <span><LikeOutlined /> {item.like_count}</span>
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
