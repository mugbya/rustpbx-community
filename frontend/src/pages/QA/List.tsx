import { List, Tag, Avatar, Typography, Space, Button, Card } from 'antd'
import { PlusOutlined, MessageOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import type { Question } from '@/api/types'

// 模拟问答数据
const questions: Question[] = [
  {
    id: 1,
    title: 'RustPBX 如何配置多路并发呼叫？',
    author: { id: 1, username: 'user1', email: '', avatar: '', nickname: '小明', bio: '', created_at: '' },
    tags: ['配置', '并发'],
    answers: 3,
    views: 156,
    created_at: '2025-01-15T10:00:00Z',
    is_solved: true,
  },
  {
    id: 2,
    title: 'SIP 注册失败如何排查？',
    author: { id: 2, username: 'user2', email: '', avatar: '', nickname: '小红', bio: '', created_at: '' },
    tags: ['SIP', '排查'],
    answers: 1,
    views: 89,
    created_at: '2025-01-14T16:00:00Z',
    is_solved: false,
  },
]

// 问答列表
export default function QAList() {
  return (
    <Card
      title="问答"
      extra={<Button type="primary" icon={<PlusOutlined />}>提问</Button>}
    >
      {questions.length === 0 ? (
        <EmptyState description="暂无问答" actionText="提问" onAction={() => {}} />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={questions}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{item.author.nickname?.[0] ?? 'U'}</Avatar>}
                title={
                  <Space>
                    {item.is_solved && (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        已解决
                      </Tag>
                    )}
                    <Typography.Link href={`/qa/${item.id}`}>{item.title}</Typography.Link>
                  </Space>
                }
                description={
                  <Space split={<span>·</span>}>
                    <span>{item.author.nickname}</span>
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <span><MessageOutlined /> {item.answers} 回答</span>
                    <span><EyeOutlined /> {item.views} 浏览</span>
                    <span>{dayjs(item.created_at).format('YYYY-MM-DD')}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
