import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Pencil, MessageSquare, FileText, HelpCircle, ThumbsUp } from 'lucide-react'
import dayjs from 'dayjs'
import { useAuthStore } from '@/store/auth'
import client from '@/api/client'
import { forumApi } from '@/api/forum'
import type { UserInfo, UserStats, TopicType } from '@/api/types'
import EmptyState from '@/components/EmptyState'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spin } from '@/components/ui/Spin'
import { Statistic } from '@/components/ui/Statistic'
import { Tabs } from '@/components/ui/Tabs'
import { FormItem } from '@/components/ui/FormItem'
import { Title, Text } from '@/components/ui/Typography'
import { message } from '@/components/ui/MessageProvider'
import { topicDetailPath } from '@/utils/constants'

// Tab key 到 topic_type 的映射
const tabToTopicType: Record<string, TopicType> = {
  topics: 'discussion',
  questions: 'question',
  articles: 'article',
}

interface EditFormValues {
  username: string
  avatar?: string
  bio?: string
  signature?: string
}

// 用户个人中心
export default function Profile() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit: handleSubmitEdit, reset, formState: { errors } } = useForm<EditFormValues>()

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
    reset({
      username: user?.username,
      avatar: user?.avatar ?? undefined,
      bio: user?.bio ?? undefined,
      signature: user?.signature ?? undefined,
    })
    setEditOpen(true)
  }

  // 保存编辑
  const handleSave = async (values: EditFormValues) => {
    setSaving(true)
    try {
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
        <div className="text-center py-12">
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
        <ul className="divide-y divide-gray-100">
          {items.map((item: any, idx: number) => (
            <li key={idx} className="py-3">
              <button
                className="text-primary-600 hover:underline"
                onClick={() => navigate(topicDetailPath(undefined, item.topic_id))}
              >
                {item.topic_title}
              </button>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <span>#{item.floor} 楼</span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {item.like_count}</span>
                <span>·</span>
                <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </li>
          ))}
        </ul>
      )
    }
    // 帖子列表
    return (
      <ul className="divide-y divide-gray-100">
        {items.map((item: any, idx: number) => (
          <li key={idx} className="py-3">
            <button
              className="text-primary-600 hover:underline"
              onClick={() => navigate(topicDetailPath(item.type, item.id))}
            >
              {item.title}
            </button>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {item.reply_count} 回复</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {item.like_count} 赞</span>
              <span>·</span>
              <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  // Tab 标签页配置
  const tabItems = [
    { key: 'topics', label: `我的话题${stats ? ` (${stats.discussion_count})` : ''}`, children: renderTabContent('topics') },
    { key: 'replies', label: `我的回复${stats ? ` (${stats.reply_count})` : ''}`, children: renderTabContent('replies') },
    { key: 'questions', label: `我的问答${stats ? ` (${stats.question_count})` : ''}`, children: renderTabContent('questions') },
    { key: 'articles', label: `我的文章${stats ? ` (${stats.article_count})` : ''}`, children: renderTabContent('articles') },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 用户信息卡片 */}
      <Card>
        <div className="flex items-center gap-6">
          <Avatar size={80} src={user.avatar}>{user.username[0]}</Avatar>
          <div className="flex-1 flex flex-col gap-1">
            <Title level={4} className="m-0">{user.username}</Title>
            <Text type="secondary">{user.bio || '这个人很懒，什么都没留下'}</Text>
            {user.signature && (
              <Text type="secondary" className="italic">- {user.signature}</Text>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>邮箱：{user.email}</span>
              <span>·</span>
              <span>加入时间：{dayjs(user.created_at).format('YYYY-MM-DD')}</span>
            </div>
          </div>
          <Button variant="primary" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
            编辑资料
          </Button>
        </div>
      </Card>

      {/* 统计数据 */}
      <div className="grid grid-cols-4 gap-4">
        <Card><Statistic title="话题" value={stats?.discussion_count ?? 0} prefix={<MessageSquare className="h-4 w-4 text-gray-400" />} /></Card>
        <Card><Statistic title="问答" value={stats?.question_count ?? 0} prefix={<HelpCircle className="h-4 w-4 text-gray-400" />} /></Card>
        <Card><Statistic title="文章" value={stats?.article_count ?? 0} prefix={<FileText className="h-4 w-4 text-gray-400" />} /></Card>
        <Card><Statistic title="获赞" value={stats?.like_count ?? 0} prefix={<ThumbsUp className="h-4 w-4 text-gray-400" />} /></Card>
      </div>

      {/* 发布内容 Tab */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mb-4" />
        <div>{tabItems.find((t) => t.key === activeTab)?.children}</div>
      </Card>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑资料"
        open={editOpen}
        onOk={handleSubmitEdit(handleSave)}
        onCancel={() => setEditOpen(false)}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <form onSubmit={handleSubmitEdit(handleSave)}>
          <FormItem label="用户名" error={errors.username?.message} required>
            <Input {...register('username', { required: '请输入用户名' })} />
          </FormItem>
          <FormItem label="头像 URL">
            <Input placeholder="请输入头像图片地址" {...register('avatar')} />
          </FormItem>
          <FormItem label="个人简介">
            <Textarea rows={3} placeholder="介绍一下自己吧" {...register('bio')} />
          </FormItem>
          <FormItem label="签名">
            <Input placeholder="一句话签名" maxLength={200} {...register('signature')} />
          </FormItem>
        </form>
      </Modal>
    </div>
  )
}
