import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Eye, ThumbsUp, Search } from 'lucide-react'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import { communityApi } from '@/api/community'
import type { CommunityPostItem } from '@/api/community'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spin } from '@/components/ui/Spin'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 20

// 社区建设帖子列表
export default function CommunityList() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState<string | undefined>(undefined)
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取帖子列表
  useEffect(() => {
    setLoading(true)
    communityApi
      .getPosts({ keyword, page, page_size: PAGE_SIZE })
      .then((data) => {
        setPosts(data.items)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [keyword, page])

  // 搜索：重置页码
  const handleSearch = () => {
    setKeyword(searchValue || undefined)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 搜索栏与发帖按钮 */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <Input
            placeholder="搜索帖子标题"
            allowClear
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<Search className="h-4 w-4" />}
            className="max-w-[300px]"
          />
          <Button variant="primary" onClick={() => navigate('/community/create')}>
            <Plus className="h-4 w-4" />
            发帖
          </Button>
        </div>
      </Card>

      {/* 帖子列表 */}
      <Card title="最新帖子">
        {loading ? (
          <Spin />
        ) : posts.length === 0 ? (
          <EmptyState
            description="暂无帖子"
            actionText="发帖"
            onAction={() => navigate('/community/create')}
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {posts.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-3 cursor-pointer"
                  onClick={() => navigate(`/community/detail/${item.id}`)}
                >
                  <Avatar src={item.author.avatar}>{item.author.username[0]}</Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800">{item.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <span>{item.author.username}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {item.reply_count}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" /> {item.view_count}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {item.like_count}</span>
                      <span>·</span>
                      <span>{dayjs(item.created_at).format('MM-DD HH:mm')}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <Pagination
                current={page}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
