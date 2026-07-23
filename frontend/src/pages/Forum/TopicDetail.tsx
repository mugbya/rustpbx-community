import { useParams, useNavigate } from 'react-router-dom'
import { Card, Avatar, Typography, Space, Tag, Divider, Button, Input, List } from 'antd'
import { ArrowLeftOutlined, LikeOutlined, MessageOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import MarkdownRender from '@/components/MarkdownRender'

// 模拟帖子内容和回复
const mockContent = `## 帖子内容

这是帖子的正文内容示例，支持 **Markdown** 格式。

### 功能特点

- 支持 SIP 协议
- 高并发处理
- 模块化设计

\`\`\`rust
fn main() {
    println!("Hello, RustPBX!");
}
\`\`\`
`

const mockReplies = [
  {
    id: 1,
    author: '回复者A',
    avatar: '',
    content: '非常实用的分享，学到了很多！',
    created_at: '2025-01-15T12:00:00Z',
    likes: 5,
  },
  {
    id: 2,
    author: '回复者B',
    avatar: '',
    content: '感谢分享，期待更多内容。',
    created_at: '2025-01-15T14:30:00Z',
    likes: 3,
  },
]

// 帖子详情
export default function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/forum')}>
        返回论坛
      </Button>

      {/* 帖子正文 */}
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3}>
            帖子标题 #{id}
          </Typography.Title>

          <Space split={<span>·</span>}>
            <Space>
              <Avatar size="small">U</Avatar>
              <span>作者用户名</span>
            </Space>
            <Tag color="red">置顶</Tag>
            <Tag color="gold">精华</Tag>
            <span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>
          </Space>

          <Divider />

          <MarkdownRender content={mockContent} />

          <Divider />

          <Space split={<span>·</span>}>
            <Button type="text" icon={<LikeOutlined />}>赞 12</Button>
            <Button type="text" icon={<MessageOutlined />}>回复 5</Button>
            <Button type="text" icon={<EyeOutlined />}>浏览 1280</Button>
          </Space>
        </Space>
      </Card>

      {/* 回复列表 */}
      <Card title={`回复 (${mockReplies.length})`}>
        <List
          itemLayout="vertical"
          dataSource={mockReplies}
          renderItem={(reply) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{reply.author[0]}</Avatar>}
                title={
                  <Space split={<span>·</span>}>
                    <span>{reply.author}</span>
                    <span>{dayjs(reply.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  </Space>
                }
                description={reply.content}
              />
              <Button type="text" size="small" icon={<LikeOutlined />}>{reply.likes}</Button>
            </List.Item>
          )}
        />
      </Card>

      {/* 回复输入框 */}
      <Card title="发表回复">
        <Input.TextArea rows={4} placeholder="请输入回复内容（支持 Markdown）" />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary">发表回复</Button>
        </div>
      </Card>
    </Space>
  )
}
