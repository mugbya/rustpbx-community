import { Button } from '@/components/ui/Button'
import { Result } from '@/components/ui/Result'
import { useNavigate } from 'react-router-dom'

// 404 页面
export default function NotFound() {
  const navigate = useNavigate()

  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      extra={
        <Button variant="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      }
    />
  )
}
