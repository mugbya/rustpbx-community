import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Eye,
  Star,
  Trash2,
  Download,
  Lock,
  Pencil,
  Pin,
  Trophy,
  CheckCircle,
} from 'lucide-react'
import dayjs from 'dayjs'
import MarkdownRender from '@/components/MarkdownRender'
import EmptyState from '@/components/EmptyState'
import { Toc } from '@/components/Toc'
import type { TocHeading } from '@/utils/slug'
import { forumApi, interactionApi, qaApi } from '@/api/forum'
import { useAuthStore } from '@/store/auth'
import type { TopicDetail, Post, Category } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Space } from '@/components/ui/Space'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Spin } from '@/components/ui/Spin'
import { Pagination } from '@/components/ui/Pagination'
import { Title, Text } from '@/components/ui/Typography'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { message } from '@/components/ui/MessageProvider'
import { TOPIC_TYPE_META, topicDetailPath } from '@/utils/constants'

const POST_PAGE_SIZE = 20

// 资源类型中文映射
const resourceTypeMap: Record<string, string> = {
  file: '文件',
  config: '配置',
  script: '脚本',
}

// 帖子详情页
export default function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const topicId = Number(id)

  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [postsTotal, setPostsTotal] = useState(0)
  const [postsPage, setPostsPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [headings, setHeadings] = useState<TocHeading[]>([])

  // 获取板块列表（用于显示帖子所属板块）
  useEffect(() => {
    forumApi.getCategories().then(setCategories).catch(() => {})
  }, [])

  // 获取帖子详情
  useEffect(() => {
    if (!topicId || isNaN(topicId)) return
    setLoading(true)
    forumApi
      .getTopic(topicId)
      .then((data) => {
        setTopic(data)
        setLikeCount(data.like_count)
        setFavoriteCount(data.favorite_count)
      })
      .catch(() => {
        setTopic(null)
      })
      .finally(() => setLoading(false))
  }, [topicId])

  // 自纠偏：拿到 topic.type 后，若当前 URL 的分区前缀与帖子实际分区不符，
  // 则 replace 到正确分区前缀的详情路径（如 /forum/topic/1 -> /articles/topic/1）。
  // 这样导航高亮才能命中正确分区；replace 不污染浏览历史，目标路径前缀已匹配不会循环。
  useEffect(() => {
    if (!topic) return
    const expected = TOPIC_TYPE_META[topic.type]?.route
    if (expected && !location.pathname.startsWith(expected)) {
      navigate(topicDetailPath(topic.type, topicId), { replace: true })
    }
  }, [topic, topicId, location.pathname, navigate])

  // 获取回复列表
  const fetchPosts = useCallback(
    (pageNum: number) => {
      setLoadingPosts(true)
      forumApi
        .getPosts(topicId, { page: pageNum, page_size: POST_PAGE_SIZE })
        .then((data) => {
          setPosts(data.items)
          setPostsTotal(data.total)
        })
        .catch(() => {})
        .finally(() => setLoadingPosts(false))
    },
    [topicId],
  )

  useEffect(() => {
    if (!topicId || isNaN(topicId)) return
    fetchPosts(postsPage)
  }, [fetchPosts, postsPage, topicId])

  // 点赞
  const handleLike = async () => {
    try {
      const { liked, like_count } = await interactionApi.toggleLike('thread', topicId)
      setLiked(liked)
      setLikeCount(like_count)
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 收藏
  const handleFavorite = async () => {
    try {
      const { favorited, favorite_count } = await interactionApi.toggleFavorite('thread', topicId)
      setFavorited(favorited)
      setFavoriteCount(favorite_count)
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 回复点赞
  const handlePostLike = async (postId: number) => {
    try {
      const { like_count } = await interactionApi.toggleLike('post', postId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, like_count } : p)))
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 提交回复
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容')
      return
    }
    setSubmitting(true)
    try {
      await forumApi.createPost(topicId, { content: replyContent })
      message.success('回复成功')
      setReplyContent('')
      // 刷新回复列表
      fetchPosts(postsPage)
      // 刷新帖子详情（更新回复数）
      forumApi
        .getTopic(topicId)
        .then((data) => setTopic(data))
        .catch(() => {})
    } catch {
      // 错误已由拦截器处理
    } finally {
      setSubmitting(false)
    }
  }

  // 删除帖子
  const handleDelete = async () => {
    try {
      await forumApi.deleteTopic(topicId)
      message.success('删除成功')
      // 返回帖子所属分区的列表页
      navigate(TOPIC_TYPE_META[topic?.type ?? 'discussion']?.route ?? '/forum')
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 置顶/取消置顶
  const handleTogglePin = async () => {
    if (!topic) return
    try {
      const data = await forumApi.togglePin(topic.id)
      setTopic({ ...topic, is_pinned: data.is_pinned })
      message.success(data.is_pinned ? '已置顶' : '已取消置顶')
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 加精/取消加精
  const handleToggleEssential = async () => {
    if (!topic) return
    try {
      const data = await forumApi.toggleEssential(topic.id)
      setTopic({ ...topic, is_essential: data.is_essential })
      message.success(data.is_essential ? '已加精' : '已取消加精')
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 标记已解决
  const handleMarkSolved = async () => {
    if (!topic) return
    try {
      await qaApi.markSolved(topic.id)
      setTopic({ ...topic, is_solved: true })
      message.success('已标记为已解决')
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 采纳答案
  const handleAcceptAnswer = async (postId: number) => {
    if (!topic) return
    try {
      await qaApi.acceptAnswer(topic.id, postId)
      setTopic({ ...topic, is_solved: true })
      message.success('已采纳答案')
      fetchPosts(postsPage)
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    )
  }

  // 帖子不存在
  if (!topic) {
    return (
      <Card>
        <EmptyState
          description="帖子不存在或已被删除"
          actionText="返回论坛"
          onAction={() => navigate(-1)}
        />
      </Card>
    )
  }

  // 判断是否可以删除（作者或管理员/板块版主）
  const canDelete = user && (user.id === topic.author.id || topic.can_moderate)
  // 判断是否可以编辑（仅作者）
  const canEdit = user && user.id === topic.author.id

  return (
    <div className="flex gap-6 w-full">
      <div className="flex flex-col gap-6 flex-1 min-w-0">
      <Button onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        返回
      </Button>

      {/* 帖子正文 */}
      <Card>
        <div className="flex flex-col gap-4 w-full">
          <Title level={3}>{topic.title}</Title>

          <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500">
            <Space align="center">
              <Avatar size="small" src={topic.author.avatar}>{topic.author.username[0]}</Avatar>
              <span>{topic.author.username}</span>
            </Space>
            <span>·</span>
            {topic.is_pinned && <Tag color="red">置顶</Tag>}
            {topic.is_essential && <Tag color="gold">精华</Tag>}
            {topic.is_solved && <Tag color="green">已解决</Tag>}
            {topic.is_locked && <Tag><Lock className="h-3 w-3 inline mr-0.5" />已锁定</Tag>}
            {(() => {
              // 帖子所属分区（topic.type），点击跳转到对应分区列表
              const meta = TOPIC_TYPE_META[topic.type]
              return meta ? (
                <Tag color={meta.color} className="cursor-pointer">
                  <button onClick={() => navigate(meta.route)}>{meta.label}</button>
                </Tag>
              ) : null
            })()}
            {topic.category_id && (() => {
              const cat = categories.find((c) => c.id === topic.category_id)
              return cat ? <Tag color="blue">{cat.name}</Tag> : null
            })()}
            <span>{dayjs(topic.created_at).format('YYYY-MM-DD HH:mm')}</span>
          </div>

          {/* 标签 */}
          {topic.tags.length > 0 && (
            <Space>
              {topic.tags.map((tag) => (
                <Tag key={tag} className="cursor-pointer" >
                  <button
                    onClick={() =>
                      navigate(
                        `${TOPIC_TYPE_META[topic.type]?.route ?? '/forum'}?tag=${encodeURIComponent(tag)}`,
                      )
                    }
                  >
                    {tag}
                  </button>
                </Tag>
              ))}
            </Space>
          )}

          <Divider />

          <MarkdownRender content={topic.content} onHeadings={setHeadings} />

          {/* 资源链接 */}
          {topic.resource_url && (
            <div>
              <Space>
                <Text strong>资源链接：</Text>
                <a href={topic.resource_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="link">
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                </a>
                {topic.resource_type && (
                  <Tag color="blue">{resourceTypeMap[topic.resource_type] || topic.resource_type}</Tag>
                )}
              </Space>
            </div>
          )}

          <Divider />

          {/* 统计信息 */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Button variant="text" onClick={handleLike}>
              <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-primary-600 text-primary-600' : ''}`} />
              赞 {likeCount}
            </Button>
            <Button variant="text" onClick={handleFavorite}>
              <Star className={`h-4 w-4 ${favorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              收藏 {favoriteCount}
            </Button>
            <Button variant="text"><MessageSquare className="h-4 w-4" />回复 {topic.reply_count}</Button>
            <Button variant="text"><Eye className="h-4 w-4" />浏览 {topic.view_count}</Button>
            {canEdit && (
              <Button variant="text" onClick={() => navigate(`/topic/create?type=${topic.type}&id=${topic.id}`)}>
                <Pencil className="h-4 w-4" />编辑
              </Button>
            )}
            {canDelete && (
              <ConfirmButton
                title="确定要删除这个帖子吗？删除后无法恢复"
                okText="确定删除"
                variant="danger"
                onConfirm={handleDelete}
              >
                <span className="inline-flex items-center text-red-500">
                  <Trash2 className="h-4 w-4" />删除
                </span>
              </ConfirmButton>
            )}
            {topic.can_moderate && (
              <>
                <Button
                  variant="text"
                  onClick={handleTogglePin}
                  className={topic.is_pinned ? 'text-red-500' : ''}
                >
                  <Pin className="h-4 w-4" />
                  {topic.is_pinned ? '取消置顶' : '置顶'}
                </Button>
                <Button
                  variant="text"
                  onClick={handleToggleEssential}
                  className={topic.is_essential ? 'text-amber-500' : ''}
                >
                  <Trophy className="h-4 w-4" />
                  {topic.is_essential ? '取消加精' : '加精'}
                </Button>
              </>
            )}
            {topic.type === 'question' && !topic.is_solved && user?.id === topic.author.id && (
              <ConfirmButton
                title="确定标记为已解决吗？"
                okText="确定"
                onConfirm={handleMarkSolved}
              >
                <span className="inline-flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4" />标记已解决
                </span>
              </ConfirmButton>
            )}
          </div>
        </div>
      </Card>

      {/* 回复列表 */}
      <Card title={`回复 (${postsTotal})`}>
        {loadingPosts ? (
          <Spin />
        ) : posts.length === 0 ? (
          <EmptyState description="暂无回复，快来抢沙发吧" />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {posts.map((post) => (
                <li key={post.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={post.author.avatar}>{post.author.username[0]}</Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-gray-700">{post.author.username}</span>
                        <span>·</span>
                        <span>#{post.floor} 楼</span>
                        <span>·</span>
                        <span>{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      <div className="mt-2">
                        <MarkdownRender content={post.content} />
                      </div>
                      <div className="mt-2">
                        <Space>
                          <Button variant="text" size="small" onClick={() => handlePostLike(post.id)}>
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {post.like_count}
                          </Button>
                          {topic.type === 'question' && !topic.is_solved && user?.id === topic.author.id && (
                            <Button
                              variant="text"
                              size="small"
                              className="text-green-600"
                              onClick={() => handleAcceptAnswer(post.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              采纳
                            </Button>
                          )}
                        </Space>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {postsTotal > POST_PAGE_SIZE && (
              <div className="flex justify-end mt-4">
                <Pagination
                  current={postsPage}
                  total={postsTotal}
                  pageSize={POST_PAGE_SIZE}
                  onChange={setPostsPage}
                  showTotal={(t) => `共 ${t} 条`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 回复输入框 */}
      {!topic.is_locked ? (
        <Card title="发表回复">
          <Textarea
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="请输入回复内容（支持 Markdown）"
          />
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSubmitReply} loading={submitting}>
              发表回复
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState description="该帖子已锁定，无法回复" />
        </Card>
      )}
      </div>

      {/* 右侧粘性目录（仅文章 + 大屏显示） */}
      {topic.type === 'article' && (
        <aside className="hidden lg:block w-56 shrink-0">
          <Toc headings={headings} />
        </aside>
      )}
    </div>
  )
}
