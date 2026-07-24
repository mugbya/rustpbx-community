import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Divider,
  Button,
  Input,
  List,
  Spin,
  Pagination,
  message,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  DownloadOutlined,
  LockOutlined,
  EditOutlined,
  PushpinOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import MarkdownRender from '@/components/MarkdownRender'
import EmptyState from '@/components/EmptyState'
import { forumApi, interactionApi, qaApi } from '@/api/forum'
import { useAuthStore } from '@/store/auth'
import type { TopicDetail, Post, Category } from '@/api/types'

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
  const [deleting, setDeleting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

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
    setDeleting(true)
    try {
      await forumApi.deleteTopic(topicId)
      message.success('删除成功')
      navigate('/forum')
    } catch {
      // 错误已由拦截器处理
    } finally {
      setDeleting(false)
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
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
          onAction={() => navigate('/forum')}
        />
      </Card>
    )
  }

  // 判断是否可以删除（作者或管理员/板块版主）
  const canDelete = user && (user.id === topic.author.id || topic.can_moderate)
  // 判断是否可以编辑（仅作者）
  const canEdit = user && user.id === topic.author.id

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        返回
      </Button>

      {/* 帖子正文 */}
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3}>{topic.title}</Typography.Title>

          <Space split={<span>·</span>} wrap>
            <Space>
              <Avatar size="small" src={topic.author.avatar}>
                {topic.author.username[0]}
              </Avatar>
              <span>{topic.author.username}</span>
            </Space>
            {topic.is_pinned && <Tag color="red">置顶</Tag>}
            {topic.is_essential && <Tag color="gold">精华</Tag>}
            {topic.is_solved && <Tag color="success">已解决</Tag>}
            {topic.is_locked && <Tag icon={<LockOutlined />}>已锁定</Tag>}
            {topic.category_id && (() => {
              const cat = categories.find((c) => c.id === topic.category_id)
              return cat ? <Tag color="blue">{cat.name}</Tag> : null
            })()}
            <span>{dayjs(topic.created_at).format('YYYY-MM-DD HH:mm')}</span>
          </Space>

          {/* 标签 */}
          {topic.tags.length > 0 && (
            <Space>
              {topic.tags.map((tag) => (
                <Tag key={tag} style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum?tag=${encodeURIComponent(tag)}`)}>
                  {tag}
                </Tag>
              ))}
            </Space>
          )}

          <Divider />

          <MarkdownRender content={topic.content} />

          {/* 资源链接 */}
          {topic.resource_url && (
            <div>
              <Space>
                <Typography.Text strong>资源链接：</Typography.Text>
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  href={topic.resource_url}
                  target="_blank"
                >
                  下载
                </Button>
                {topic.resource_type && (
                  <Tag color="blue">
                    {resourceTypeMap[topic.resource_type] || topic.resource_type}
                  </Tag>
                )}
              </Space>
            </div>
          )}

          <Divider />

          {/* 统计信息 */}
          <Space split={<span>·</span>} wrap>
            <Button
              type="text"
              icon={liked ? <LikeFilled /> : <LikeOutlined />}
              onClick={handleLike}
            >
              赞 {likeCount}
            </Button>
            <Button
              type="text"
              icon={favorited ? <StarFilled /> : <StarOutlined />}
              onClick={handleFavorite}
            >
              收藏 {favoriteCount}
            </Button>
            <Button type="text" icon={<MessageOutlined />}>
              回复 {topic.reply_count}
            </Button>
            <Button type="text" icon={<EyeOutlined />}>
              浏览 {topic.view_count}
            </Button>
            {canEdit && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => navigate(`/topic/create?type=${topic.type}&id=${topic.id}`)}
              >
                编辑
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="确定要删除这个帖子吗？"
                description="删除后无法恢复"
                onConfirm={handleDelete}
                okText="确定删除"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />} loading={deleting}>
                  删除
                </Button>
              </Popconfirm>
            )}
            {topic.can_moderate && (
              <>
                <Button
                  type="text"
                  icon={<PushpinOutlined />}
                  onClick={handleTogglePin}
                  style={topic.is_pinned ? { color: '#ff4d4f' } : undefined}
                >
                  {topic.is_pinned ? '取消置顶' : '置顶'}
                </Button>
                <Button
                  type="text"
                  icon={<TrophyOutlined />}
                  onClick={handleToggleEssential}
                  style={topic.is_essential ? { color: '#faad14' } : undefined}
                >
                  {topic.is_essential ? '取消加精' : '加精'}
                </Button>
              </>
            )}
            {topic.type === 'question' && !topic.is_solved && user?.id === topic.author.id && (
              <Popconfirm
                title="确定标记为已解决吗？"
                onConfirm={handleMarkSolved}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                  标记已解决
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Space>
      </Card>

      {/* 回复列表 */}
      <Card title={`回复 (${postsTotal})`}>
        {loadingPosts ? (
          <Spin />
        ) : posts.length === 0 ? (
          <EmptyState description="暂无回复，快来抢沙发吧" />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={posts}
              renderItem={(post) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={post.author.avatar}>{post.author.username[0]}</Avatar>}
                    title={
                      <Space split={<span>·</span>}>
                        <span>{post.author.username}</span>
                        <span>#{post.floor} 楼</span>
                        <span>{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                    }
                    description={<MarkdownRender content={post.content} />}
                  />
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<LikeOutlined />}
                      onClick={() => handlePostLike(post.id)}
                    >
                      {post.like_count}
                    </Button>
                    {topic.type === 'question' && !topic.is_solved && user?.id === topic.author.id && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        style={{ color: '#52c41a' }}
                        onClick={() => handleAcceptAnswer(post.id)}
                      >
                        采纳
                      </Button>
                    )}
                  </Space>
                </List.Item>
              )}
            />
            {postsTotal > POST_PAGE_SIZE && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
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
          <Input.TextArea
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="请输入回复内容（支持 Markdown）"
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleSubmitReply} loading={submitting}>
              发表回复
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState description="该帖子已锁定，无法回复" />
        </Card>
      )}
    </Space>
  )
}
