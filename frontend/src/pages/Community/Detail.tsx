import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, Trash2, Pencil } from 'lucide-react'
import dayjs from 'dayjs'
import MarkdownRender from '@/components/MarkdownRender'
import EmptyState from '@/components/EmptyState'
import { communityApi, type CommunityPostDetail, type CommunityReply } from '@/api/community'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Space } from '@/components/ui/Space'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Spin } from '@/components/ui/Spin'
import { Pagination } from '@/components/ui/Pagination'
import { Title } from '@/components/ui/Typography'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { message } from '@/components/ui/MessageProvider'

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
    try {
      await communityApi.deletePost(postId)
      message.success('删除成功')
      navigate('/community')
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
    <div className="flex flex-col gap-6 w-full">
      <Button onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        返回
      </Button>

      {/* 帖子正文 */}
      <Card>
        <div className="flex flex-col gap-4 w-full">
          <Title level={3}>{post.title}</Title>

          <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500">
            <Space align="center">
              <Avatar size="small" src={post.author.avatar}>{post.author.username[0]}</Avatar>
              <span>{post.author.username}</span>
            </Space>
            <span>·</span>
            <span>{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</span>
          </div>

          <Divider />

          <MarkdownRender content={post.content} />

          <Divider />

          {/* 统计信息与操作按钮 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag><MessageSquare className="h-3 w-3 inline mr-0.5" />回复 {post.reply_count}</Tag>
            <Tag><Eye className="h-3 w-3 inline mr-0.5" />浏览 {post.view_count}</Tag>
            <Tag><ThumbsUp className="h-3 w-3 inline mr-0.5" />赞 {post.like_count}</Tag>
            <Button variant="text" onClick={() => navigate(`/community/create?id=${post.id}`)}>
              <Pencil className="h-4 w-4" />编辑
            </Button>
            {post.can_delete && (
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
          </div>
        </div>
      </Card>

      {/* 回复列表 */}
      <Card title={`回复 (${repliesTotal})`}>
        {loadingReplies ? (
          <Spin />
        ) : replies.length === 0 ? (
          <EmptyState description="暂无回复，快来抢沙发吧" />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {replies.map((reply) => (
                <li key={reply.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={reply.author.avatar}>{reply.author.username[0]}</Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-gray-700">{reply.author.username}</span>
                        <span>·</span>
                        <span>#{reply.floor} 楼</span>
                        <span>·</span>
                        <span>{dayjs(reply.created_at).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      <div className="mt-2">
                        <MarkdownRender content={reply.content} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {repliesTotal > REPLY_PAGE_SIZE && (
              <div className="flex justify-end mt-4">
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
    </div>
  )
}
