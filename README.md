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
- 后端 API 文档：http://localhost:8001/docs

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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

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

## 数据库表结构

共 9 张表，核心设计是 `threads` 一张表统一管理 4 种内容类型（讨论/问答/文章/资源），通过 `type` 字段区分。

### 表说明

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `users` | 用户账号 | email, username, password_hash, role(user/moderator/admin), reputation, github_id |
| `categories` | 板块分类（综合讨论、安装部署、SIP配置等） | name, slug, description, thread_count, parent_id |
| `threads` | 主题帖（统一存储讨论/问答/文章/资源） | title, content, type(discussion/question/article/resource), category_id, user_id, view_count, reply_count, like_count, is_pinned, is_essential, is_locked, is_solved, is_deleted |
| `posts` | 回复/评论 | thread_id, user_id, content, floor, parent_id（楼中楼）, like_count, is_deleted |
| `tags` | 标签 | name, slug, usage_count |
| `thread_tags` | 帖子-标签多对多关联 | thread_id, tag_id |
| `likes` | 点赞记录 | user_id, target_type(thread/post), target_id |
| `favorites` | 收藏记录 | user_id, target_type(thread/post), target_id |
| `notifications` | 站内通知 | user_id, type(reply/like/favorite/mention/system), from_user_id, is_read |

### 表关系

```
users ─┬─< threads ─┬─< posts（回复）
       │            ├─< thread_tags >─ tags
       │            └─< likes / favorites
       ├─< likes（点赞）
       ├─< favorites（收藏）
       └─< notifications（通知）

categories ─< threads（板块分类筛选）
```

### 复合索引

针对常用查询场景优化：

| 索引名 | 表 | 字段 | 优化场景 |
|--------|------|------|----------|
| `ix_threads_type_deleted_category` | threads | type, is_deleted, category_id | 列表页按类型+板块筛选 |
| `ix_threads_type_deleted_user` | threads | type, is_deleted, user_id | 个人中心按类型+用户筛选 |
| `ix_threads_deleted_category` | threads | is_deleted, category_id | 按板块筛选 |
| `ix_posts_thread_deleted_floor` | posts | thread_id, is_deleted, floor | 回复列表按帖子+楼层排序 |

### 默认板块

| 板块 | slug | 说明 |
|------|------|------|
| 综合讨论 | general | RustPBX 相关的综合交流 |
| 安装部署 | installation | 安装、配置与部署问题 |
| SIP 配置 | sip-config | SIP 协议、注册、分机配置 |
| 路由中继 | routing | 路由配置、SipTrunk、线路管理 |
| 故障排查 | troubleshooting | Bug 反馈与问题排查 |
| WebRTC | webrtc | WebRTC 相关讨论与技术分享 |
| 灌水区 | off-topic | 轻松闲聊，技术之外的话题 |

板块对所有内容类型（讨论/问答/文章/资源）通用，每个页面都支持按板块筛选。
