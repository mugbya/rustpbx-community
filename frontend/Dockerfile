# 多阶段构建：第一阶段用 node 构建产物
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package.json package-lock.json* ./
RUN npm install

# 复制源码并构建
COPY . .
RUN npm run build

# 第二阶段：nginx 部署静态资源
FROM nginx:alpine

# 复制构建产物到 nginx 静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 替换默认配置，支持 SPA history 路由回退到 index.html
RUN echo '\
server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    # SEO：sitemap 和 robots 转发到后端动态生成\n\
    location = /sitemap.xml {\n\
        proxy_pass http://backend:8001;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    }\n\
    location = /robots.txt {\n\
        proxy_pass http://backend:8001;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    }\n\
    # API 代理到后端\n\
    location /api/ {\n\
        proxy_pass http://backend:8001;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
