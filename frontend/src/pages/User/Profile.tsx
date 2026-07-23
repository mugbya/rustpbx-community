import { useState } from 'react'
import { Card, Avatar, Typography, Space, Button, Tabs, Row, Col, Statistic, Modal, Form, Input, message } from 'antd'
import { EditOutlined, MessageOutlined, FileTextOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuthStore } from '@/store/auth'
import client from '@/api/client'
import type { UserInfo } from '@/api/types'
import EmptyState from '@/components/EmptyState'

// 用户个人中心
export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

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
          onAction={() => (window.location.href = '/login')}
        />
      </Card>
    )
  }

  // Tab 标签页内容
  const tabItems = [
    {
      key: 'topics',
      label: '我的话题',
      children: <EmptyState description="暂无发布的话题" />,
    },
    {
      key: 'replies',
      label: '我的回复',
      children: <EmptyState description="暂无回复" />,
    },
    {
      key: 'questions',
      label: '我的问答',
      children: <EmptyState description="暂无问答" />,
    },
    {
      key: 'articles',
      label: '我的文章',
      children: <EmptyState description="暂无文章" />,
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
              <Typography.Text type="secondary">{user.bio || '这个人很懒，什么都没留下'}</Typography.Text>
              {user.signature && (
                <Typography.Text italic type="secondary">— {user.signature}</Typography.Text>
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
            <Statistic title="话题" value={0} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="问答" value={0} prefix={<QuestionCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="文章" value={0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="获赞" value={0} />
          </Card>
        </Col>
      </Row>

      {/* 发布内容 Tab */}
      <Card>
        <Tabs items={tabItems} />
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
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
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
