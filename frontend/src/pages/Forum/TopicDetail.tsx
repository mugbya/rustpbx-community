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
} from '@ant-design/icons'
import dayjs from 'dayjs'
import MarkdownRender from '@/components/MarkdownRender'
import EmptyState from '@/components/EmptyState'
import { forumApi, interactionApi } from '@/api/forum'
import { useAuthStore } from '@/store/auth'
import type { ThreadDetail, Post, Category } from '@/api/types'

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
  const threadId = Number(id)

  const [thread, setThread] = useState<ThreadDetail | null>(null)
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
    if (!threadId || isNaN(threadId)) return
    setLoading(true)
    forumApi
      .getThread(threadId)
      .then((data) => {
        setThread(data)
        setLikeCount(data.like_count)
        setFavoriteCount(data.favorite_count)
      })
      .catch(() => {
        setThread(null)
      })
      .finally(() => setLoading(false))
  }, [threadId])

  // 获取回复列表
  const fetchPosts = useCallback(
    (pageNum: number) => {
      setLoadingPosts(true)
      forumApi
        .getPosts(threadId, { page: pageNum, page_size: POST_PAGE_SIZE })
        .then((data) => {
          setPosts(data.items)
          setPostsTotal(data.total)
        })
        .catch(() => {})
        .finally(() => setLoadingPosts(false))
    },
    [threadId],
  )

  useEffect(() => {
    if (!threadId || isNaN(threadId)) return
    fetchPosts(postsPage)
  }, [fetchPosts, postsPage, threadId])

  // 点赞
  const handleLike = async () => {
    try {
      const { liked, like_count } = await interactionApi.toggleLike('thread', threadId)
      setLiked(liked)
      setLikeCount(like_count)
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 收藏
  const handleFavorite = async () => {
    try {
      const { favorited, favorite_count } = await interactionApi.toggleFavorite('thread', threadId)
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
      await forumApi.createPost(threadId, { content: replyContent })
      message.success('回复成功')
      setReplyContent('')
      // 刷新回复列表
      fetchPosts(postsPage)
      // 刷新帖子详情（更新回复数）
      forumApi
        .getThread(threadId)
        .then((data) => setThread(data))
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
      await forumApi.deleteThread(threadId)
      message.success('删除成功')
      navigate('/forum')
    } catch {
      // 错误已由拦截器处理
    } finally {
      setDeleting(false)
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
  if (!thread) {
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

  // 判断是否可以删除（作者或管理员）
  const canDelete = user && (user.id === thread.author.id || user.role === 'admin')
  // 判断是否可以编辑（仅作者）
  const canEdit = user && user.id === thread.author.id

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        返回
      </Button>

      {/* 帖子正文 */}
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3}>{thread.title}</Typography.Title>

          <Space split={<span>·</span>} wrap>
            <Space>
              <Avatar size="small" src={thread.author.avatar}>
                {thread.author.username[0]}
              </Avatar>
              <span>{thread.author.username}</span>
            </Space>
            {thread.is_pinned && <Tag color="red">置顶</Tag>}
            {thread.is_essential && <Tag color="gold">精华</Tag>}
            {thread.is_solved && <Tag color="success">已解决</Tag>}
            {thread.is_locked && <Tag icon={<LockOutlined />}>已锁定</Tag>}
            {thread.category_id && (() => {
              const cat = categories.find((c) => c.id === thread.category_id)
              return cat ? <Tag color="blue">{cat.name}</Tag> : null
            })()}
            <span>{dayjs(thread.created_at).format('YYYY-MM-DD HH:mm')}</span>
          </Space>

          {/* 标签 */}
          {thread.tags.length > 0 && (
            <Space>
              {thread.tags.map((tag) => (
                <Tag key={tag} style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum?tag=${encodeURIComponent(tag)}`)}>
                  {tag}
                </Tag>
              ))}
            </Space>
          )}

          <Divider />

          <MarkdownRender content={thread.content} />

          {/* 资源链接 */}
          {thread.resource_url && (
            <div>
              <Space>
                <Typography.Text strong>资源链接：</Typography.Text>
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  href={thread.resource_url}
                  target="_blank"
                >
                  下载
                </Button>
                {thread.resource_type && (
                  <Tag color="blue">
                    {resourceTypeMap[thread.resource_type] || thread.resource_type}
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
              回复 {thread.reply_count}
            </Button>
            <Button type="text" icon={<EyeOutlined />}>
              浏览 {thread.view_count}
            </Button>
            {canEdit && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => navigate(`/thread/create?type=${thread.type}&id=${thread.id}`)}
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
                  <Button
                    type="text"
                    size="small"
                    icon={<LikeOutlined />}
                    onClick={() => handlePostLike(post.id)}
                  >
                    {post.like_count}
                  </Button>
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
      {!thread.is_locked ? (
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
