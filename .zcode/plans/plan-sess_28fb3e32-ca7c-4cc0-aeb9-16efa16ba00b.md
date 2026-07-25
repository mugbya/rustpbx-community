## 目标
为 rustpbx-community 实现 Google SEO 所需的 sitemap.xml 和 robots.txt，方案为**后端动态生成**。

## 架构决策

sitemap 由 FastAPI 实时查询数据库生成（动态帖子/社区帖会自动收录），通过 nginx 转发暴露到根域名 `https://域名/sitemap.xml` 和 `/robots.txt`。域名用 `SITEMAP_BASE_URL` 环境变量配置，避免硬编码。

## 实施步骤

### 1. 后端新增 SEO 端点

**新建 `backend/app/api/v1/seo.py`**，包含两个路由（挂载在根路径，不走 `/api/v1` 前缀）：

- `GET /sitemap.xml`
  - 查询所有未删除的 `Topic`（含 discussion/question/article/resource 四类）和 `CommunityPost`，提取 `id` 和 `updated_at`
  - 静态页 URL（首页、`/forum`、`/qa`、`/articles`、`/resources`、`/community`）写死
  - 动态 URL：`{base}/forum/topic/{id}`、`{base}/community/detail/{id}`
  - 输出符合协议的 XML（含 `<urlset>`、`<loc>`、`<lastmod>`、`<changefreq>`、`<priority>`），用 `lxml` 或纯字符串模板生成（**优先字符串模板 + FastAPI `Response(media_type="application/xml")`，避免新增依赖**）
  - URL 超过 50000 条时自动拆分为 sitemap index（当前数据量小，先做单文件，但代码留好结构）

- `GET /robots.txt`
  - 输出纯文本：`User-agent: *`，`Disallow` 登录态页面（`/login`、`/register`、`/user/profile`、`/admin`、`/topic/create`、`/community/create`、`/auth/`、`/api/`）
  - `Allow: /`
  - `Sitemap: {base}/sitemap.xml`

### 2. 注册路由到 main.py

在 `backend/app/main.py` 直接 `app.include_router(seo.router)`（不加 `/api/v1` 前缀，这样路径是 `/sitemap.xml` 而非 `/api/v1/sitemap.xml`，符合 Google 约定）。

### 3. 配置项

在 `backend/app/core/config.py` 的 `Settings` 类新增：
```python
SITEMAP_BASE_URL: str = "https://rustpbx.dev"  # 占位，部署时在 .env 改成真实域名
```

### 4. nginx 转发

修改 `frontend/Dockerfile` 里的 nginx 配置，新增两条 location：
```
location = /sitemap.xml { proxy_pass http://backend:8001; ... }
location = /robots.txt   { proxy_pass http://backend:8001; ... }
```
放在 `location /` 的 `try_files` 之前（精确匹配优先级高于前缀匹配，天然生效，但显式写在前面更清晰）。

### 5. 文档同步

更新 `backend/.env.example`，补充 `SITEMAP_BASE_URL` 说明（从 `backend/.env.example` 读取后确认）。

## 不做的事（明确边界）

- ❌ 不做 SSR / 预渲染 —— 这是 SEO 的"第二步"，等你观察到 SPA 抓取问题后再单独评估
- ❌ 不提交 Google Search Console —— 这是你在浏览器里操作的运营动作，我会给你操作指引
- ❌ 不处理 `.env` 里的真实域名 —— 你部署时自己填
- ❌ 不引入新 Python 依赖（不加 lxml 等），用标准库 + 字符串模板

## 你在实施后需要做的（运营动作，我会一并给出指引）

1. 在 `.env` 设置 `SITEMAP_BASE_URL=https://你的真实域名`
2. 部署后访问 `https://你的域名/sitemap.xml` 验证能返回 XML
3. 去 [Google Search Console](https://search.google.com/search-console) 添加资源 → 在"站点地图"提交 `https://你的域名/sitemap.xml`
4. 在"索引 → 网页检查"里对几个核心 URL 执行"请求编入索引"
5. （可选，建议后期）前端 head 加 `<link rel="canonical">` 和各页 title/description —— 这是 SEO 第二阶段，本次不做
