import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Avatar,
  Typography,
  Space,
  Divider,
  Button,
  Input,
  List,
  Spin,
  Pagination,
  message,
  Popconfirm,
  Tag,
} from 'antd'
import {
  ArrowLeftOutlined,
  MessageOutlined,
  EyeOutlined,
  LikeOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import MarkdownRender from '@/components/MarkdownRender'
import EmptyState from '@/components/EmptyState'
import { communityApi, type CommunityPostDetail, type CommunityReply } from '@/api/community'

const REPLY_PAGE_SIZE = 20

// 社区帖子详情页
export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const postId = Number(id)

  const [post, setPost] = useState<CommunityPostDetail | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const [repliesTotal, setRepliesTotal] = useState(0)
  const [repliesPage, setRepliesPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 获取帖子详情
  useEffect(() => {
    if (!postId || isNaN(postId)) return
    setLoading(true)
    communityApi
      .getPost(postId)
      .then((data) => setPost(data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [postId])

  // 获取回复列表
  const fetchReplies = useCallback(
    (pageNum: number) => {
      setLoadingReplies(true)
      communityApi
        .getReplies(postId, { page: pageNum, page_size: REPLY_PAGE_SIZE })
        .then((data) => {
          setReplies(data.items)
          setRepliesTotal(data.total)
        })
        .catch(() => {})
        .finally(() => setLoadingReplies(false))
    },
    [postId],
  )

  useEffect(() => {
    if (!postId || isNaN(postId)) return
    fetchReplies(repliesPage)
  }, [fetchReplies, repliesPage, postId])

  // 提交回复
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容')
      return
    }
    setSubmitting(true)
    try {
      await communityApi.createReply(postId, { content: replyContent })
      message.success('回复成功')
      setReplyContent('')
      // 刷新回复列表
      fetchReplies(repliesPage)
      // 刷新帖子详情（更新回复数）
      communityApi
        .getPost(postId)
        .then((data) => setPost(data))
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
      await communityApi.deletePost(postId)
      message.success('删除成功')
      navigate('/community')
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
  if (!post) {
    return (
      <Card>
        <EmptyState
          description="帖子不存在或已被删除"
          actionText="返回社区"
          onAction={() => navigate('/community')}
        />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        返回
      </Button>

      {/* 帖子正文 */}
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={3}>{post.title}</Typography.Title>

          <Space split={<span>·</span>} wrap>
            <Space>
              <Avatar size="small" src={post.author.avatar}>
                {post.author.username[0]}
              </Avatar>
              <span>{post.author.username}</span>
            </Space>
            <span>{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</span>
          </Space>

          <Divider />

          <MarkdownRender content={post.content} />

          <Divider />

          {/* 统计信息与操作按钮 */}
          <Space split={<span>·</span>} wrap>
            <Tag icon={<MessageOutlined />}>回复 {post.reply_count}</Tag>
            <Tag icon={<EyeOutlined />}>浏览 {post.view_count}</Tag>
            <Tag icon={<LikeOutlined />}>赞 {post.like_count}</Tag>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/community/create?id=${post.id}`)}
            >
              编辑
            </Button>
            {post.can_delete && (
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
      <Card title={`回复 (${repliesTotal})`}>
        {loadingReplies ? (
          <Spin />
        ) : replies.length === 0 ? (
          <EmptyState description="暂无回复，快来抢沙发吧" />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={replies}
              renderItem={(reply) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={reply.author.avatar}>{reply.author.username[0]}</Avatar>}
                    title={
                      <Space split={<span>·</span>}>
                        <span>{reply.author.username}</span>
                        <span>#{reply.floor} 楼</span>
                        <span>{dayjs(reply.created_at).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                    }
                    description={<MarkdownRender content={reply.content} />}
                  />
                </List.Item>
              )}
            />
            {repliesTotal > REPLY_PAGE_SIZE && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Pagination
                  current={repliesPage}
                  total={repliesTotal}
                  pageSize={REPLY_PAGE_SIZE}
                  onChange={setRepliesPage}
                  showTotal={(t) => `共 ${t} 条`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 回复输入框 */}
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
    </Space>
  )
}
