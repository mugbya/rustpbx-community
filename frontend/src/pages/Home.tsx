import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, List, Tag, Avatar, Typography, Space, Statistic, Spin } from 'antd'
import {
  MessageOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  FireOutlined,
  TeamOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import client from '@/api/client'
import { forumApi } from '@/api/forum'
import type { ForumStats, ThreadListItem } from '@/api/types'
import EmptyState from '@/components/EmptyState'

// 首页：社区概览、最新帖子、热门话题
export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ForumStats | null>(null)
  const [hotThreads, setHotThreads] = useState<ThreadListItem[]>([])
  const [loading, setLoading] = useState(true)

  // 获取社区统计和热门话题
  useEffect(() => {
    Promise.all([
      client.get<unknown, ForumStats>('/v1/forum/stats'),
      forumApi.getThreads({ is_essential: true, sort: 'views', page: 1, page_size: 10 }),
    ])
      .then(([statsData, threadsData]) => {
        setStats(statsData)
        setHotThreads(threadsData.items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 快捷入口配置
  const shortcuts = [
    { icon: <MessageOutlined />, title: '论坛', desc: '交流讨论，分享经验', color: '#ce422b', path: '/forum' },
    { icon: <QuestionCircleOutlined />, title: '问答', desc: '提问解答，互帮互助', color: '#fa8c16', path: '/qa' },
    { icon: <FileTextOutlined />, title: '文章', desc: '技术文章，深度分享', color: '#52c41a', path: '/articles' },
    { icon: <CloudDownloadOutlined />, title: '资源', desc: '工具资源，一键下载', color: '#1677ff', path: '/resources' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 社区概览统计 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="话题"
              value={stats?.discussion_count ?? 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="问答"
              value={stats?.question_count ?? 0}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="文章"
              value={stats?.article_count ?? 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成员"
              value={stats?.user_count ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Row gutter={16}>
        {shortcuts.map((item) => (
          <Col span={6} key={item.title}>
            <Card hoverable onClick={() => navigate(item.path)}>
              <Card.Meta
                avatar={
                  <Avatar style={{ background: item.color }} icon={item.icon} />
                }
                title={item.title}
                description={item.desc}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 热门话题 */}
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#ce422b' }} />
            <span>热门话题</span>
          </Space>
        }
      >
        {hotThreads.length === 0 ? (
          <EmptyState description="暂无话题，快来发布第一个吧" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={hotThreads}
            renderItem={(topic) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar src={topic.author.avatar}>
                      {topic.author.username[0]}
                    </Avatar>
                  }
                  title={
                    <Space>
                      {topic.is_pinned && <Tag color="red">置顶</Tag>}
                      {topic.is_essential && <Tag color="gold">精华</Tag>}
                      <Typography.Link onClick={() => navigate(`/forum/topic/${topic.id}`)}>
                        {topic.title}
                      </Typography.Link>
                    </Space>
                  }
                  description={
                    <Space split={<span>·</span>}>
                      <span>{topic.author.username}</span>
                      <span>{topic.reply_count} 回复</span>
                      <span>
                        <EyeOutlined /> {topic.view_count}
                      </span>
                      <span>{dayjs(topic.created_at).format('YYYY-MM-DD')}</span>
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
