import { List, Card, Tag, Avatar, Typography, Space, Button } from 'antd'
import { PlusOutlined, MessageOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import type { ForumCategory } from '@/api/types'

// 模拟板块数据
const categories: ForumCategory[] = [
  { id: 1, name: '综合讨论', description: 'RustPBX 相关的综合交流', topic_count: 320, post_count: 1820 },
  { id: 2, name: '安装部署', description: '安装、配置与部署问题', topic_count: 156, post_count: 780 },
  { id: 3, name: '技术讨论', description: '深入技术实现与架构讨论', topic_count: 240, post_count: 1340 },
  { id: 4, name: '问题反馈', description: 'Bug 反馈与问题追踪', topic_count: 89, post_count: 412 },
]

// 论坛板块列表
export default function ForumList() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        title="论坛板块"
        extra={<Button type="primary" icon={<PlusOutlined />}>发帖</Button>}
      >
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={categories}
          renderItem={(category) => (
            <List.Item>
              <Card hoverable size="small">
                <Card.Meta
                  avatar={<Avatar style={{ background: '#ce422b' }}>{category.name[0]}</Avatar>}
                  title={
                    <Typography.Link href={`/forum?category=${category.id}`}>
                      {category.name}
                    </Typography.Link>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <span>{category.description}</span>
                      <Space split={<span>·</span>}>
                        <Tag>{category.topic_count} 话题</Tag>
                        <Tag>{category.post_count} 帖子</Tag>
                      </Space>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Card title="最新话题">
        {categories.length === 0 ? (
          <EmptyState description="暂无话题" actionText="发帖" onAction={() => {}} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={categories}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{item.name[0]}</Avatar>}
                  title={<Typography.Link href={`/forum/topic/${item.id}`}>{item.name}</Typography.Link>}
                  description={
                    <Space split={<span>·</span>}>
                      <span><MessageOutlined /> {item.topic_count}</span>
                      <span><EyeOutlined /> {item.post_count}</span>
                      <span>{dayjs().format('MM-DD HH:mm')}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  )
}
