import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Tag, Avatar, Space, Button, Spin, Pagination } from 'antd'
import { PlusOutlined, MessageOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { forumApi } from '@/api/forum'
import type { ThreadListItem } from '@/api/types'

const PAGE_SIZE = 20

// 问答列表
export default function QAList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ThreadListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    forumApi
      .getThreads({ thread_type: 'question', page, page_size: PAGE_SIZE })
      .then((data) => {
        setItems(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <Card
      title="问答"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/thread/create?type=question')}>
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
          onAction={() => navigate('/thread/create?type=question')}
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
  )
}
