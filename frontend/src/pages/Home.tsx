import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  HelpCircle,
  FileText,
  CloudDownload,
  Flame,
  Users,
  Eye,
} from 'lucide-react'
import dayjs from 'dayjs'
import client from '@/api/client'
import { forumApi } from '@/api/forum'
import type { Category, ForumStats, TopicListItem } from '@/api/types'
import { TOPIC_TYPE_META, topicDetailPath } from '@/utils/constants'
import EmptyState from '@/components/EmptyState'
import { Card } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Space } from '@/components/ui/Space'
import { Statistic } from '@/components/ui/Statistic'
import { Spin } from '@/components/ui/Spin'

// 首页：社区概览、最新帖子、热门话题
export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ForumStats | null>(null)
  const [hotTopics, setHotTopics] = useState<TopicListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // 获取社区统计和热门话题（同时拉取板块列表用于显示帖子所属板块）
  useEffect(() => {
    Promise.all([
      client.get<unknown, ForumStats>('/v1/forum/stats'),
      forumApi.getTopics({ is_essential: true, sort: 'views', page: 1, page_size: 10 }),
      forumApi.getCategories(),
    ])
      .then(([statsData, topicsData, catsData]) => {
        setStats(statsData)
        setHotTopics(topicsData?.items || [])
        setCategories(catsData || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 快捷入口配置
  const shortcuts = [
    { icon: <MessageSquare className="h-5 w-5" />, title: '论坛', desc: '交流讨论，分享经验', color: '#ce422b', path: '/forum' },
    { icon: <HelpCircle className="h-5 w-5" />, title: '问答', desc: '提问解答，互帮互助', color: '#fa8c16', path: '/qa' },
    { icon: <FileText className="h-5 w-5" />, title: '文章', desc: '技术文章，深度分享', color: '#52c41a', path: '/articles' },
    { icon: <CloudDownload className="h-5 w-5" />, title: '资源', desc: '工具资源，一键下载', color: '#1677ff', path: '/resources' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 社区概览统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <Statistic title="话题" value={stats?.discussion_count ?? 0} prefix={<MessageSquare className="h-4 w-4 text-gray-400" />} />
        </Card>
        <Card>
          <Statistic title="问答" value={stats?.question_count ?? 0} prefix={<HelpCircle className="h-4 w-4 text-gray-400" />} />
        </Card>
        <Card>
          <Statistic title="文章" value={stats?.article_count ?? 0} prefix={<FileText className="h-4 w-4 text-gray-400" />} />
        </Card>
        <Card>
          <Statistic title="成员" value={stats?.user_count ?? 0} prefix={<Users className="h-4 w-4 text-gray-400" />} />
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-4 gap-4">
        {shortcuts.map((item) => (
          <Card key={item.title} onClick={() => navigate(item.path)}>
            <div className="flex items-center gap-3">
              <Avatar size={40} icon={<span style={{ color: item.color }}>{item.icon}</span>} />
              <div>
                <div className="font-medium text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 热门话题 */}
      <Card
        title={
          <Space align="center">
            <Flame className="h-4 w-4 text-primary-600" />
            <span>热门话题</span>
          </Space>
        }
      >
        {hotTopics.length === 0 ? (
          <EmptyState description="暂无话题，快来发布第一个吧" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {hotTopics.map((topic) => (
              <li key={topic.id} className="flex items-start gap-3 py-3">
                <Avatar src={topic.author.avatar}>{topic.author.username[0]}</Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {topic.is_pinned && <Tag color="red">置顶</Tag>}
                    {topic.is_essential && <Tag color="gold">精华</Tag>}
                    {(() => {
                      // 帖子所属分区（discussion/question/article/resource）
                      const meta = TOPIC_TYPE_META[topic.type]
                      return meta ? (
                        <Tag
                          color={meta.color}
                          className="cursor-pointer"
                        >
                          <button onClick={() => navigate(meta.route)}>{meta.label}</button>
                        </Tag>
                      ) : null
                    })()}
                    {topic.category_id && (() => {
                      // 帖子所属板块（Category）
                      const cat = categories.find((c) => c.id === topic.category_id)
                      return cat ? <Tag color="default">{cat.name}</Tag> : null
                    })()}
                    <button
                      className="text-primary-600 hover:underline text-left"
                      onClick={() => navigate(topicDetailPath(topic.type, topic.id))}
                    >
                      {topic.title}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <span>{topic.author.username}</span>
                    <span>·</span>
                    <span>{topic.reply_count} 回复</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="h-3 w-3" /> {topic.view_count}
                    </span>
                    <span>·</span>
                    <span>{dayjs(topic.created_at).format('YYYY-MM-DD')}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
