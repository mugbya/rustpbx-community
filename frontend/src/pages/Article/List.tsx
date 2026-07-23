import { List, Card, Typography, Space, Avatar, Button } from 'antd'
import { PlusOutlined, EyeOutlined, LikeOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import type { Article } from '@/api/types'

// 模拟文章数据
const articles: Article[] = [
  {
    id: 1,
    title: 'RustPBX 架构设计深度解析',
    summary: '本文从整体架构出发，深入分析 RustPBX 的模块设计和数据流向...',
    author: { id: 1, username: 'writer1', email: '', avatar: '', nickname: '架构师', bio: '', created_at: '' },
    cover: '',
    views: 890,
    likes: 56,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    title: '从零开始搭建企业级 PBX 系统',
    summary: '手把手教你使用 RustPBX 搭建完整的 PBX 系统，涵盖安装、配置、部署全流程...',
    author: { id: 2, username: 'writer2', email: '', avatar: '', nickname: '实战派', bio: '', created_at: '' },
    cover: '',
    views: 1200,
    likes: 89,
    created_at: '2025-01-14T14:00:00Z',
  },
]

// 文章列表
export default function ArticleList() {
  return (
    <Card
      title="文章"
      extra={<Button type="primary" icon={<PlusOutlined />}>写文章</Button>}
    >
      {articles.length === 0 ? (
        <EmptyState description="暂无文章" />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={articles}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar size={48}>{item.author.nickname?.[0] ?? 'U'}</Avatar>}
                title={
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    <Typography.Link href={`/articles/${item.id}`}>{item.title}</Typography.Link>
                  </Typography.Title>
                }
                description={
                  <Space direction="vertical" size={8}>
                    <Typography.Paragraph ellipsis={{ rows: 2 }} type="secondary">
                      {item.summary}
                    </Typography.Paragraph>
                    <Space split={<span>·</span>}>
                      <span>{item.author.nickname}</span>
                      <span><CalendarOutlined /> {dayjs(item.created_at).format('YYYY-MM-DD')}</span>
                      <span><EyeOutlined /> {item.views}</span>
                      <span><LikeOutlined /> {item.likes}</span>
                    </Space>
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
