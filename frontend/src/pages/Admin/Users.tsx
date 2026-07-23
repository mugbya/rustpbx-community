import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Avatar,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Radio,
  message,
  Popconfirm,
  Typography,
} from 'antd'
import { UserOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import client from '@/api/client'

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
const roleConfig: Record<string, { label: string; color: string }> = {
  user: { label: '普通用户', color: 'default' },
  moderator: { label: '版主', color: 'blue' },
  admin: { label: '管理员', color: 'red' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
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

  const columns: ColumnsType<AdminUser> = [
    {
      title: '用户',
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
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (role: string) => {
        const info = roleConfig[role] || roleConfig.user
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '声望',
      dataIndex: 'reputation',
      width: 80,
    },
    {
      title: 'GitHub',
      dataIndex: 'github_username',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (active: boolean) =>
        active ? (
          <Tag color="green">正常</Tag>
        ) : (
          <Tag color="red">禁用</Tag>
        ),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      width: 160,
      render: (v: string | null) =>
        v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '从未',
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleRoleChange(record)}>
            修改角色
          </Button>
          <Popconfirm
            title={record.is_active ? '确定要禁用该用户吗？' : '确定要启用该用户吗？'}
            onConfirm={() => handleToggleStatus(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger={record.is_active}>
              {record.is_active ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleRoleChange = (user: AdminUser) => {
    setRoleModal({ open: true, user, role: user.role })
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Typography.Title level={3}>用户管理</Typography.Title>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="搜索用户名或邮箱"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="角色筛选"
            allowClear
            style={{ width: 120 }}
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v)
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
            style={{ width: 120 }}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
            options={[
              { label: '正常', value: true },
              { label: '禁用', value: false },
            ]}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="修改角色"
        open={roleModal.open}
        onOk={handleRoleSave}
        onCancel={() => setRoleModal({ open: false, user: null, role: 'user' })}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: 16 }}>
            用户：<strong>{roleModal.user?.username}</strong>
          </p>
          <Radio.Group
            value={roleModal.role}
            onChange={(e) =>
              setRoleModal({ ...roleModal, role: e.target.value })
            }
          >
            <Radio value="user">普通用户</Radio>
            <Radio value="moderator">版主</Radio>
            <Radio value="admin">管理员</Radio>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  )
}
