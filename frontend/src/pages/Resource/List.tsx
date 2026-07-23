import { List, Card, Typography, Space, Avatar, Tag, Button } from 'antd'
import { PlusOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import EmptyState from '@/components/EmptyState'
import type { Resource } from '@/api/types'

// 模拟资源数据
const resources: Resource[] = [
  {
    id: 1,
    title: 'RustPBX v1.0 完整安装包',
    description: '包含所有依赖的完整安装包，支持 Linux/Mac/Windows 平台',
    author: { id: 1, username: 'admin', email: '', avatar: '', nickname: '官方', bio: '', created_at: '' },
    type: '安装包',
    download_url: '#',
    downloads: 560,
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 2,
    title: 'RustPBX 配置模板合集',
    description: '常用场景的配置文件模板，可直接使用或修改',
    author: { id: 2, username: 'contributor', email: '', avatar: '', nickname: '贡献者', bio: '', created_at: '' },
    type: '模板',
    download_url: '#',
    downloads: 230,
    created_at: '2025-01-08T14:00:00Z',
  },
]

// 资源列表
export default function ResourceList() {
  return (
    <Card
      title="资源"
      extra={<Button type="primary" icon={<PlusOutlined />}>上传资源</Button>}
    >
      {resources.length === 0 ? (
        <EmptyState description="暂无资源" actionText="上传资源" onAction={() => {}} />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={resources}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button type="link" icon={<DownloadOutlined />} href={item.download_url}>
                  下载 ({item.downloads})
                </Button>,
                <Button type="link" icon={<EyeOutlined />}>详情</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar size={48} style={{ background: '#1677ff' }}>{item.type[0]}</Avatar>}
                title={
                  <Space>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Tag>{item.type}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <span>{item.description}</span>
                    <Space split={<span>·</span>}>
                      <span>上传者：{item.author.nickname}</span>
                      <span>{dayjs(item.created_at).format('YYYY-MM-DD')}</span>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
