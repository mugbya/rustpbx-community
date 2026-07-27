import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { User as UserIcon, Search } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import client from '@/api/client'
import AdminModerators from '@/pages/Admin/Moderators'
import AdminCategories from '@/pages/Admin/Categories'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Space } from '@/components/ui/Space'
import { Modal } from '@/components/ui/Modal'
import { Radio, RadioGroup } from '@/components/ui/Radio'
import { Tabs } from '@/components/ui/Tabs'
import { Title } from '@/components/ui/Typography'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { message } from '@/components/ui/MessageProvider'

interface AdminUser {
  id: number
  email: string
  username: string
  avatar: string | null
  role: string
  reputation: number
  is_active: boolean
  github_username: string | null
  last_login_at: string | null
  created_at: string
}

// 角色标签配置
const roleConfig: Record<string, { label: string; color: 'default' | 'blue' | 'red' }> = {
  user: { label: '普通用户', color: 'default' },
  moderator: { label: '版主', color: 'blue' },
  admin: { label: '管理员', color: 'red' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined)
  const [roleModal, setRoleModal] = useState<{
    open: boolean
    user: AdminUser | null
    role: string
  }>({ open: false, user: null, role: 'user' })

  const fetchUsers = useCallback(() => {
    setLoading(true)
    client
      .get('/v1/users', {
        params: { keyword, role: roleFilter, is_active: statusFilter, page, page_size: 20 },
      })
      .then((data: any) => {
        setUsers(data.items || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [keyword, roleFilter, statusFilter, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  // 修改角色
  const handleRoleSave = async () => {
    if (!roleModal.user) return
    try {
      await client.put(`/v1/users/${roleModal.user.id}/role`, {
        role: roleModal.role,
      })
      message.success('角色修改成功')
      setRoleModal({ open: false, user: null, role: 'user' })
      fetchUsers()
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 禁用/启用
  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await client.put(`/v1/users/${user.id}/status`, {
        is_active: !user.is_active,
      })
      message.success(user.is_active ? '已禁用' : '已启用')
      fetchUsers()
    } catch {
      // 错误已由拦截器处理
    }
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      id: 'username',
      header: '用户',
      cell: ({ row }) => {
        const record = row.original
        return (
          <Space align="center">
            <Avatar src={record.avatar} icon={<UserIcon className="h-4 w-4" />} />
            <div>
              <div className="font-medium">{record.username}</div>
              <div className="text-xs text-gray-400">{record.email}</div>
            </div>
          </Space>
        )
      },
    },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => {
        const info = roleConfig[row.original.role] || roleConfig.user
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    { accessorKey: 'reputation', header: '声望' },
    {
      id: 'github_username',
      header: 'GitHub',
      cell: ({ row }) => row.original.github_username || '-',
    },
    {
      id: 'is_active',
      header: '状态',
      cell: ({ row }) =>
        row.original.is_active ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>,
    },
    {
      id: 'last_login_at',
      header: '最后登录',
      cell: ({ row }) => {
        const v = row.original.last_login_at
        return v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '从未'
      },
    },
    {
      accessorKey: 'created_at',
      header: '注册时间',
      cell: ({ row }) => dayjs(row.original.created_at).format('YYYY-MM-DD'),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const record = row.original
        return (
          <Space>
            <Button size="small" onClick={() => handleRoleChange(record)}>
              修改角色
            </Button>
            <ConfirmButton
              title={record.is_active ? '确定要禁用该用户吗？' : '确定要启用该用户吗？'}
              okText="确定"
              onConfirm={() => handleToggleStatus(record)}
            >
              <span className={record.is_active ? 'text-red-500' : 'text-green-600'}>
                {record.is_active ? '禁用' : '启用'}
              </span>
            </ConfirmButton>
          </Space>
        )
      },
    },
  ]

  const handleRoleChange = (user: AdminUser) => {
    setRoleModal({ open: true, user, role: user.role })
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <Title level={3}>管理后台</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'users', label: '用户管理' },
          { key: 'moderators', label: '板块版主' },
          { key: 'categories', label: '板块管理' },
        ]}
        className="mb-4"
      />
      {activeTab === 'users' && (
        <>
          <Card>
            <div className="mb-4 flex gap-3 items-center flex-wrap">
              <Input
                placeholder="搜索用户名或邮箱"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                className="w-60"
                prefix={<Search className="h-4 w-4" />}
                allowClear
              />
              <Select
                placeholder="角色筛选"
                allowClear
                className="w-32"
                value={roleFilter}
                onChange={(v) => {
                  setRoleFilter(v as string | undefined)
                  setPage(1)
                }}
                options={[
                  { label: '普通用户', value: 'user' },
                  { label: '版主', value: 'moderator' },
                  { label: '管理员', value: 'admin' },
                ]}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                className="w-32"
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v as boolean | undefined)
                  setPage(1)
                }}
                options={[
                  { label: '正常', value: true },
                  { label: '禁用', value: false },
                ]}
              />
              <Button variant="primary" onClick={handleSearch}>
                搜索
              </Button>
            </div>

            <Table
              columns={columns}
              data={users}
              rowKey="id"
              loading={loading}
            />

            {total > 20 && (
              <div className="flex justify-end mt-4">
                <span className="text-sm text-gray-500 self-center mr-3">共 {total} 条</span>
                <div className="inline-flex items-center gap-2">
                  <Button size="small" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
                  <span className="text-sm text-gray-600">第 {page} 页</span>
                  <Button size="small" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>下一页</Button>
                </div>
              </div>
            )}
          </Card>

          <Modal
            title="修改角色"
            open={roleModal.open}
            onOk={handleRoleSave}
            onCancel={() => setRoleModal({ open: false, user: null, role: 'user' })}
            okText="保存"
            cancelText="取消"
          >
            <div className="py-5">
              <p className="mb-4">
                用户：<strong>{roleModal.user?.username}</strong>
              </p>
              <RadioGroup
                value={roleModal.role}
                onChange={(v) => setRoleModal({ ...roleModal, role: v as string })}
              >
                <Radio value="user">普通用户</Radio>
                <Radio value="moderator">版主</Radio>
                <Radio value="admin">管理员</Radio>
              </RadioGroup>
            </div>
          </Modal>
        </>
      )}
      {activeTab === 'moderators' && <AdminModerators />}
      {activeTab === 'categories' && <AdminCategories />}
    </div>
  )
}
