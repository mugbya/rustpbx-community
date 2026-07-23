# rustpbx-community

rustpbx 中文社区

## 技术栈

- 后端：FastAPI + Python 3.13 + SQLAlchemy + Alembic
- 前端：React + Vite + TypeScript + Ant Design + Zustand
- 数据库：MySQL 8.0
- 文件存储：腾讯云 COS
- 部署：Docker Compose

## 项目结构

```
rustpbx-community/
├── backend/                        # FastAPI 后端
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # 依赖注入（认证、分页、权限）
│   │   │   └── v1/                 # API 路由
│   │   │       ├── auth.py         # 认证（注册/登录/GitHub OAuth）
│   │   │       ├── users.py        # 用户信息
│   │   │       ├── forum.py        # 论坛（板块/帖子/回复）
│   │   │       ├── qa.py            # 问答（采纳答案/标记已解决）
│   │   │       ├── interaction.py  # 互动（点赞/收藏/通知）
│   │   │       ├── upload.py       # 文件上传（腾讯云 COS）
│   │   │       └── router.py       # 路由聚合
│   │   ├── core/
│   │   │   ├── config.py           # 应用配置（Pydantic Settings）
│   │   │   └── security.py         # JWT 令牌 + 密码哈希
│   │   ├── db/
│   │   │   └── session.py          # 数据库引擎和会话
│   │   ├── models/                  # SQLAlchemy 数据模型
│   │   │   ├── user.py              # 用户
│   │   │   ├── category.py         # 板块分类
│   │   │   ├── thread.py           # 主题帖（讨论/问答/文章/资源）
│   │   │   ├── post.py              # 回复
│   │   │   ├── tag.py              # 标签
│   │   │   └── interaction.py      # 点赞/收藏/通知
│   │   ├── schemas/                 # Pydantic 请求/响应模型
│   │   ├── services/
│   │   │   └── cos.py              # 腾讯云 COS 服务
│   │   └── main.py                 # FastAPI 应用入口
│   ├── alembic/                    # 数据库迁移
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                       # React + Vite 前端
│   ├── src/
│   │   ├── api/                    # Axios 封装（JWT 拦截器）
│   │   ├── components/             # 公共组件（Markdown 渲染等）
│   │   ├── layouts/               # 布局（主布局/认证布局）
│   │   ├── pages/                  # 页面
│   │   │   ├── Home.tsx           # 首页
│   │   │   ├── auth/              # 登录/注册
│   │   │   ├── Forum/             # 论坛列表/帖子详情
│   │   │   ├── QA/                # 问答列表
│   │   │   ├── Article/           # 文章列表
│   │   │   ├── Resource/         # 资源列表
│   │   │   └── User/             # 个人中心
│   │   ├── router/               # 路由配置（含路由守卫）
│   │   ├── store/                # Zustand 状态管理
│   │   └── utils/                # 工具函数和常量
│   ├── Dockerfile                 # 多阶段构建（node -> nginx）
│   └── package.json
├── docker-compose.yml              # MySQL + 后端 + 前端
└── .gitignore
```

## 启动方式

### 方式一：Docker Compose 一键启动（推荐）

```bash
# 1. 启动 Docker daemon
colima start          # macOS（或打开 Docker Desktop）

# 2. 复制环境配置并填写密钥
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入 GitHub OAuth 和腾讯云 COS 密钥

# 3. 一键启动
docker-compose up -d

# 4. 查看日志
docker-compose logs -f backend
```

启动后访问：
- 前端页面：http://localhost:5173
- 后端 API 文档：http://localhost:8000/docs

### 方式二：本地开发模式（前后端分离启动）

```bash
# 1. 启动 MySQL
docker-compose up -d mysql

# 2. 启动后端
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 编辑 .env 填入配置
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. 启动前端
cd frontend
npm install
npm run dev
```

### 需要配置的密钥

在 `backend/.env` 中填入：

| 配置项 | 说明 |
|--------|------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth 应用密钥（Settings > Developer settings > OAuth Apps） |
| `COS_SECRET_ID` / `COS_SECRET_KEY` / `COS_BUCKET` | 腾讯云 COS 存储配置 |
| `JWT_SECRET_KEY` | JWT 签名密钥（生产环境务必修改） |
