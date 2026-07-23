import { Row, Col, Card, List, Tag, Avatar, Typography, Space, Statistic } from 'antd'
import {
  MessageOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  FireOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

// 模拟热门话题数据
const hotTopics = [
  {
    id: 1,
    title: 'RustPBX 部署实践分享：从零搭建企业级 PBX',
    authorName: 'Rust爱好者',
    categoryName: '部署实践',
    replies: 32,
    views: 1280,
    created_at: '2025-01-15T10:00:00Z',
    is_pinned: true,
    is_essential: true,
  },
  {
    id: 2,
    title: '关于 SIP 协议在 RustPBX 中的实现讨论',
    authorName: 'PBX开发者',
    categoryName: '技术讨论',
    replies: 18,
    views: 860,
    created_at: '2025-01-14T14:00:00Z',
    is_pinned: false,
    is_essential: false,
  },
]

// 首页：社区概览、最新帖子、热门话题
export default function Home() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 社区概览统计 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="话题" value={1248} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="问答" value={567} prefix={<QuestionCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="文章" value={89} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="成员" value={3200} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card hoverable>
            <Card.Meta
              avatar={<Avatar style={{ background: '#ce422b' }} icon={<MessageOutlined />} />}
              title="论坛"
              description="交流讨论，分享经验"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Card.Meta
              avatar={<Avatar style={{ background: '#fa8c16' }} icon={<QuestionCircleOutlined />} />}
              title="问答"
              description="提问解答，互帮互助"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Card.Meta
              avatar={<Avatar style={{ background: '#52c41a' }} icon={<FileTextOutlined />} />}
              title="文章"
              description="技术文章，深度分享"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Card.Meta
              avatar={<Avatar style={{ background: '#1677ff' }} icon={<CloudDownloadOutlined />} />}
              title="资源"
              description="工具资源，一键下载"
            />
          </Card>
        </Col>
      </Row>

      {/* 热门话题 */}
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#ce422b' }} />
            <span>热门话题</span>
          </Space>
        }
      >
        <List
          itemLayout="horizontal"
          dataSource={hotTopics}
          renderItem={(topic) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{topic.authorName[0]}</Avatar>}
                title={
                  <Space>
                    {topic.is_pinned && <Tag color="red">置顶</Tag>}
                    {topic.is_essential && <Tag color="gold">精华</Tag>}
                    <Typography.Link href={`/forum/topic/${topic.id}`}>
                      {topic.title}
                    </Typography.Link>
                  </Space>
                }
                description={
                  <Space split={<span>·</span>}>
                    <span>{topic.authorName}</span>
                    <span>{topic.categoryName}</span>
                    <span>{topic.replies} 回复</span>
                    <span>{topic.views} 浏览</span>
                    <span>{dayjs(topic.created_at).format('YYYY-MM-DD')}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
