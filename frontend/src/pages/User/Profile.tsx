import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Avatar, Typography, Space, Button, Tabs, Row, Col, Statistic, Modal, Form, Input, List, message, Spin } from 'antd'
import { EditOutlined, MessageOutlined, FileTextOutlined, QuestionCircleOutlined, LikeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuthStore } from '@/store/auth'
import client from '@/api/client'
import { forumApi } from '@/api/forum'
import type { UserInfo, UserStats, TopicListItem, TopicType } from '@/api/types'
import EmptyState from '@/components/EmptyState'

// Tab key 到 topic_type 的映射
const tabToTopicType: Record<string, TopicType> = {
  topics: 'discussion',
  questions: 'question',
  articles: 'article',
}

// 用户个人中心
export default function Profile() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // 统计数据
  const [stats, setStats] = useState<UserStats | null>(null)

  // Tab 数据
  const [activeTab, setActiveTab] = useState('topics')
  const [tabDataMap, setTabDataMap] = useState<Record<string, any[]>>({})
  const [tabLoading, setTabLoading] = useState(false)

  // 获取统计数据
  useEffect(() => {
    if (!user) return
    client
      .get<unknown, UserStats>(`/v1/users/${user.id}/stats`)
      .then((data) => setStats(data))
      .catch(() => {})
  }, [user])

  // 获取 Tab 数据
  const fetchTabData = useCallback(
    (tab: string) => {
      if (!user) return
      if (tabDataMap[tab]) return
      setTabLoading(true)
      if (tab === 'replies') {
        forumApi
          .getUserPosts({ user_id: user.id, page: 1, page_size: 20 })
          .then((data) => setTabDataMap((prev) => ({ ...prev, [tab]: data.items })))
          .catch(() => setTabDataMap((prev) => ({ ...prev, [tab]: [] })))
          .finally(() => setTabLoading(false))
        return
      }
      const topicType = tabToTopicType[tab]
      if (!topicType) return
      forumApi
        .getTopics({ user_id: user.id, topic_type: topicType, page: 1, page_size: 20 })
        .then((data) => setTabDataMap((prev) => ({ ...prev, [tab]: data.items })))
        .catch(() => setTabDataMap((prev) => ({ ...prev, [tab]: [] })))
        .finally(() => setTabLoading(false))
    },
    [user, tabDataMap],
  )

  useEffect(() => {
    fetchTabData(activeTab)
  }, [fetchTabData, activeTab])

  // 打开编辑弹窗
  const handleEdit = () => {
    editForm.setFieldsValue({
      username: user?.username,
      avatar: user?.avatar,
      bio: user?.bio,
      signature: user?.signature,
    })
    setEditOpen(true)
  }

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await editForm.validateFields()
      setSaving(true)
      const updated = await client.put<unknown, UserInfo>('/v1/users/me', values)
      setUser(updated)
      message.success('更新成功')
      setEditOpen(false)
    } catch {
      // 错误已由拦截器处理
    } finally {
      setSaving(false)
    }
  }

  // 未登录时显示提示
  if (!user) {
    return (
      <Card>
        <EmptyState
          description="请先登录后查看个人中心"
          actionText="去登录"
          onAction={() => navigate('/login')}
        />
      </Card>
    )
  }

  // 渲染 Tab 内容
  const renderTabContent = (tabKey: string) => {
    const items = tabDataMap[tabKey]
    if (!items && tabLoading) {
      return (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      )
    }
    if (!items || items.length === 0) {
      return <EmptyState description="暂无内容" />
    }
    // 回复列表
    if (tabKey === 'replies') {
      return (
        <List
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Typography.Link onClick={() => navigate(`/forum/topic/${item.topic_id}`)}>
                    {item.topic_title}
                  </Typography.Link>
                }
                description={
                  <Space split={<span>·</span>}>
                    <span>#{item.floor} 楼</span>
                    <span><LikeOutlined /> {item.like_count}</span>
                    <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )
    }
    // 帖子列表
    return (
      <List
        itemLayout="horizontal"
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Typography.Link onClick={() => navigate(`/forum/topic/${item.id}`)}>
                  {item.title}
                </Typography.Link>
              }
              description={
                <Space split={<span>·</span>}>
                  <span>
                    <MessageOutlined /> {item.reply_count} 回复
                  </span>
                  <span>
                    <LikeOutlined /> {item.like_count} 赞
                  </span>
                  <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  // Tab 标签页配置
  const tabItems = [
    {
      key: 'topics',
      label: `我的话题${stats ? ` (${stats.discussion_count})` : ''}`,
      children: renderTabContent('topics'),
    },
    {
      key: 'replies',
      label: `我的回复${stats ? ` (${stats.reply_count})` : ''}`,
      children: renderTabContent('replies'),
    },
    {
      key: 'questions',
      label: `我的问答${stats ? ` (${stats.question_count})` : ''}`,
      children: renderTabContent('questions'),
    },
    {
      key: 'articles',
      label: `我的文章${stats ? ` (${stats.article_count})` : ''}`,
      children: renderTabContent('articles'),
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 用户信息卡片 */}
      <Card>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar size={80} src={user.avatar} style={{ background: '#ce422b' }}>
              {user.username[0]}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size={4}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {user.username}
              </Typography.Title>
              <Typography.Text type="secondary">
                {user.bio || '这个人很懒，什么都没留下'}
              </Typography.Text>
              {user.signature && (
                <Typography.Text italic type="secondary">
                  - {user.signature}
                </Typography.Text>
              )}
              <Space split={<span>·</span>}>
                <span>邮箱：{user.email}</span>
                <span>加入时间：{dayjs(user.created_at).format('YYYY-MM-DD')}</span>
              </Space>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              编辑资料
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计数据 */}
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
            <Statistic title="获赞" value={stats?.like_count ?? 0} prefix={<LikeOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 发布内容 Tab */}
      <Card>
        <Tabs items={tabItems} onChange={setActiveTab} />
      </Card>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑资料"
        open={editOpen}
        onOk={handleSave}
        onCancel={() => setEditOpen(false)}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="avatar" label="头像 URL">
            <Input placeholder="请输入头像图片地址" />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} placeholder="介绍一下自己吧" />
          </Form.Item>
          <Form.Item name="signature" label="签名">
            <Input placeholder="一句话签名" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
