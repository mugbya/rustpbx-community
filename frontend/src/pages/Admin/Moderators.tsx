import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Avatar,
  Button,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Typography,
  Empty,
} from 'antd'
import { UserOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { forumApi } from '@/api/forum'
import client from '@/api/client'
import type { Category } from '@/api/types'

// 分区选项
const TOPIC_TYPE_OPTIONS = [
  { label: '论坛', value: 'discussion' },
  { label: '问答', value: 'question' },
  { label: '文章', value: 'article' },
  { label: '资源', value: 'resource' },
]

interface Moderator {
  id: number
  user_id: number
  username: string
  avatar: string | null
  email: string
}

interface SearchResult {
  id: number
  username: string
  email: string
  avatar: string | null
}

export default function AdminModerators() {
  const [selectedType, setSelectedType] = useState<string | undefined>()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // 选择分区后获取该分区的板块列表
  useEffect(() => {
    if (!selectedType) {
      setCategories([])
      setSelectedCategory(undefined)
      setModerators([])
      return
    }
    setSelectedCategory(undefined)
    setModerators([])
    forumApi.getCategories(selectedType).then(setCategories).catch(() => {})
  }, [selectedType])

  // 获取版主列表
  const fetchModerators = useCallback(() => {
    if (!selectedCategory) {
      setModerators([])
      return
    }
    setLoading(true)
    forumApi
      .getModerators(selectedCategory)
      .then(setModerators)
      .catch(() => setModerators([]))
      .finally(() => setLoading(false))
  }, [selectedCategory])

  useEffect(() => {
    fetchModerators()
  }, [fetchModerators])

  // 搜索用户
  const handleSearch = () => {
    if (!searchKeyword.trim()) return
    setSearching(true)
    client
      .get('/v1/users', { params: { keyword: searchKeyword, page: 1, page_size: 10 } })
      .then((data: any) => {
        // 过滤掉已经是版主的用户
        const existingIds = new Set(moderators.map((m) => m.user_id))
        setSearchResults(
          (data.items || []).filter((u: any) => !existingIds.has(u.id)),
        )
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false))
  }

  // 添加版主
  const handleAdd = async (user: SearchResult) => {
    if (!selectedCategory) return
    try {
      await forumApi.addModerator(selectedCategory, user.id)
      message.success(`已将 ${user.username} 设为版主`)
      setSearchResults(searchResults.filter((u) => u.id !== user.id))
      fetchModerators()
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 移除版主
  const handleRemove = async (userId: number) => {
    if (!selectedCategory) return
    try {
      await forumApi.removeModerator(selectedCategory, userId)
      message.success('已移除版主')
      fetchModerators()
    } catch {
      // 错误已由拦截器处理
    }
  }

  const columns: ColumnsType<Moderator> = [
    {
      title: '版主',
      dataIndex: 'username',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.username}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="确定要移除该版主吗？"
          onConfirm={() => handleRemove(record.user_id)}
          okText="确定"
          cancelText="取消"
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Card>
        {/* 第一步：选择分区 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>选择分区：</span>
          <Select
            placeholder="请选择分区"
            style={{ width: 160 }}
            value={selectedType}
            onChange={(v) => {
              setSelectedType(v)
              setSearchResults([])
            }}
            options={TOPIC_TYPE_OPTIONS}
          />
        </div>

        {/* 第二步：选择板块 */}
        {selectedType && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>选择板块：</span>
            <Select
              placeholder="请选择板块"
              style={{ width: 200 }}
              value={selectedCategory}
              onChange={(v) => {
                setSelectedCategory(v)
                setSearchResults([])
              }}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </div>
        )}

        {selectedCategory ? (
          <>
            {/* 当前版主列表 */}
            <Typography.Title level={5}>当前版主</Typography.Title>
            <Table
              columns={columns}
              dataSource={moderators}
              rowKey="user_id"
              loading={loading}
              pagination={false}
              locale={{ emptyText: <Empty description="暂无版主" /> }}
              style={{ marginBottom: 24 }}
            />

            {/* 搜索用户添加版主 */}
            <Typography.Title level={5}>添加版主</Typography.Title>
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索用户名或邮箱"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 240 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Button type="primary" onClick={handleSearch} loading={searching}>
                搜索
              </Button>
            </Space>

            {searchResults.length > 0 && (
              <Table
                size="small"
                columns={[
                  {
                    title: '用户',
                    dataIndex: 'username',
                    render: (_, record) => (
                      <Space>
                        <Avatar src={record.avatar} icon={<UserOutlined />} size="small" />
                        <span>{record.username}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>{record.email}</span>
                      </Space>
                    ),
                  },
                  {
                    title: '操作',
                    width: 100,
                    render: (_, record) => (
                      <Button size="small" type="link" onClick={() => handleAdd(record)}>
                        设为版主
                      </Button>
                    ),
                  },
                ]}
                dataSource={searchResults}
                rowKey="id"
                pagination={false}
              />
            )}
          </>
        ) : (
          selectedType && <Empty description="请选择一个板块" />
        )}
        {!selectedType && <Empty description="请先选择一个分区" />}
      </Card>
    </div>
  )
}
