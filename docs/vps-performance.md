# VPS 访问加速配置（针对日本 VPS 跨境场景）

## 背景

VPS 在日本，用户在国内，跨境 RTT ~300ms，属于典型的"长肥管道"。
默认的 cubic 拥塞控制在这种链路上窗口起不来，导致大文件（如前端 JS chunk）
传输速度只有 10-30KB/s，而小文件（接口、favicon）正常。

本文档配置两件事：

1. **内核开 BBR 拥塞控制** —— 让跨境大文件传输跑起来（治本）
2. **nginx 开 brotli + 调大 socket buffer** —— 让 BBR 有空间发挥，JS 再瘦一圈

> 以下命令均在 VPS 上以 root（或 sudo）执行。

---

## 第一步：开启 BBR 拥塞控制

### 1.1 检查内核版本（需 4.9+）

```bash
uname -r
```

输出例如 `5.15.0-...` 即可。低于 4.9 需先升级内核（主流 VPS 一般都满足）。

### 1.2 检查 BBR 模块是否可用

```bash
sysctl net.ipv4.tcp_available_congestion_control
```

输出应包含 `bbr`，例如：
```
net.ipv4.tcp_available_congestion_control = reno cubic bbr
```

如果没有 `bbr`，手动加载：
```bash
modprobe tcp_bbr
lsmod | grep bbr   # 确认加载成功
```

### 1.3 永久开启 BBR + 调大 socket buffer

编辑 `/etc/sysctl.conf`，追加：

```conf
# ===== 拥塞控制：换 BBR（对高 RTT 跨境链路效果立竿见影）=====
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# ===== socket buffer 调大，让 BBR 拥塞窗口有空间撑起来 =====
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.rmem_default = 1048576
net.core.wmem_default = 1048576
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# ===== 顺手开的网络优化（可选但推荐）=====
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_mtu_probing = 1
```

### 1.4 生效并验证

```bash
sysctl -p
sysctl net.ipv4.tcp_congestion_control   # 应输出 ... = bbr
sysctl net.core.default_qdisc            # 应输出 ... = fq
```

### 1.5 验证效果

从国内机器（或本地）重新测同一个 JS：

```bash
curl -s -o /dev/null -w 'total=%{time_total}s speed=%{speed_download}B/s\n' \
  -H 'accept-encoding: gzip' --compressed \
  https://www.rustpbx.cn/assets/index-B974VQ8R.js
```

对比之前的 10-30KB/s，开了 BBR 后通常能到 100KB/s+（取决于实际带宽）。

---

## 第二步：nginx 开启 brotli + 优化

宿主机有一层 nginx 做反代（`systemctl reload nginx` 那一层），
压缩应在这一层配置，而不是容器内的 nginx。

### 2.1 确认 nginx 是否支持 brotli

```bash
nginx -V 2>&1 | grep -o 'brotli'
```

- 有输出 → 已支持，跳到 2.3
- 无输出 → 需要先装 brotli 模块（见 2.2）

### 2.2 安装 brotli 模块（按系统选其一）

**CentOS / RHEL（你的 nginx 是 1.20.1，多半是 CentOS）：**

```bash
# 装 EPEL 和 brotli 模块（动态模块方式）
yum install -y epel-release
yum install -y nginx-mod-brotli   # 包名可能是 nginx-module-brotli，按实际仓库调整

# 如果仓库里没有，用 getpagespeed 仓库：
# yum install -y https://nginx.org/packages/centos/...（略，按官方文档）
```

**Ubuntu / Debian：**

```bash
apt install -y libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static
```

装完确认：
```bash
nginx -V 2>&1 | grep brotli
```

> 如果装不上 brotli 模块也没关系，**保留 gzip 即可**，brotli 只是锦上添花，
> BBR 才是治本的。gzip 已经能把 JS 从 1.1MB 压到 ~350KB。

### 2.3 配置 nginx 压缩

编辑 nginx 主配置（通常 `/etc/nginx/nginx.conf`），在 `http {}` 块内加入：

```nginx
http {
    # ===== 既有配置 =====

    # ===== gzip（兜底，所有浏览器都支持）=====
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        application/javascript
        application/json
        application/xml
        image/svg+xml
        font/ttf
        font/otf;

    # ===== brotli（比 gzip 对 JS 压得更好，需模块支持）=====
    # 如果 2.2 没装成功，把下面这段注释掉即可
    brotli on;
    brotli_comp_level 6;
    brotli_min_length 1024;
    brotli_types
        text/plain
        text/css
        text/xml
        application/javascript
        application/json
        application/xml
        image/svg+xml
        font/ttf
        font/otf;

    # ===== 静态资源长缓存（带 hash 的文件可 immutable）=====
    # 前端 chunk 文件名带 hash，内容变才换名，可以激进缓存
    map $sent_http_content_type $cache_control {
        default                                  "no-cache";
        ~*application/javascript                 "public, max-age=31536000, immutable";
        ~*text/css                               "public, max-age=31536000, immutable";
        ~*image/svg\+xml                         "public, max-age=31536000, immutable";
        ~*text/html                              "no-cache";
    }
}
```

在站点配置（`/etc/nginx/conf.d/www.rustpbx.cn.conf` 之类）里，
对应静态资源 location 加上缓存头：

```nginx
server {
    # ... 既有配置

    # 前端静态资源
    location /assets/ {
        alias /opt/rustpbx-community/frontend/dist/assets/;
        try_files $uri =404;
        add_header Cache-Control $cache_control;
        # 带指纹的文件可 immutable
        expires 1y;
    }

    # favicon
    location = /favicon.svg {
        root /opt/rustpbx-community/frontend/dist;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # ... 其它 location 不变
}
```

### 2.4 测试并 reload

```bash
nginx -t                  # 配置语法检查
systemctl reload nginx    # 平滑重载
```

### 2.5 验证 brotli 生效

```bash
curl -sI -H 'accept-encoding: br' https://www.rustpbx.cn/assets/index-B974VQ8R.js | grep -i 'content-encoding'
```

输出 `content-encoding: br` 即成功。对比 gzip 大小：

```bash
# gzip 大小
curl -s -o /dev/null -w '%{size_download}\n' -H 'accept-encoding: gzip' --compressed \
  https://www.rustpbx.cn/assets/index-B974VQ8R.js

# brotli 大小
curl -s -o /dev/null -w '%{size_download}\n' -H 'accept-encoding: br' --compressed \
  https://www.rustpbx.cn/assets/index-B974VQ8R.js
```

brotli 对 JS 通常比 gzip 再省 15-20%。

---

## 验证整体效果

从国内机器或本地执行：

```bash
# 单次完整时序
curl -s -o /dev/null -w \
  'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} speed=%{speed_download}B/s\n' \
  -H 'accept-encoding: br' --compressed \
  https://www.rustpbx.cn/assets/index-B974VQ8R.js

# 多次取平均
for i in 1 2 3; do
  curl -s -o /dev/null -w "run$i: total=%{time_total}s speed=%{speed_download}B/s\n" \
    -H 'accept-encoding: br' --compressed \
    https://www.rustpbx.cn/assets/index-B974VQ8R.js
done
```

预期对比：

| 阶段 | 优化前 | 优化后 |
|------|--------|--------|
| 单文件 JS（gzip 387KB） | 17-90s | 2-5s |
| 传输速度 | 10-30KB/s | 100KB/s+ |
| 首屏总量（gzip） | 387KB | ~400KB（但 antd 等可长缓存，二次访问近 0） |

---

## 回滚

### BBR 回滚

编辑 `/etc/sysctl.conf`，把这两行改回：
```conf
net.core.default_qdisc = fq_codel
net.ipv4.tcp_congestion_control = cubic
```
然后 `sysctl -p`。

### nginx 回滚

注释掉 `nginx.conf` 里新增的 brotli/gzip/cache 段，`nginx -t && systemctl reload nginx`。
