# Ubuntu + Docker 生产环境部署教程

本教程适用于当前 `gys-frontend` 项目，推荐 Ubuntu 22.04 或 24.04。应用运行在 Docker 容器中，Nginx 和 HTTPS 由 Ubuntu 宿主机管理。

```text
浏览器
   |
   v
Nginx :80/:443 (Ubuntu 宿主机)
   |
   v
127.0.0.1:3000 -> gys-frontend Docker 容器
                         |
                         v
                  https://gys.oljuxj.xyz
```

这种方式不向公网直接暴露容器的 `3000` 端口。

## 1. 准备服务器

需要：

- Ubuntu 22.04/24.04 64 位服务器，建议至少 2 GB 内存。
- 具有 `sudo` 权限的 SSH 账号。
- 服务器能访问 GitHub、Docker Hub 和 `https://gys.oljuxj.xyz`。
- 如需 HTTPS，准备已解析到服务器公网 IP 的域名。
- 云服务器安全组放行 TCP `22`/`80`/`443`。

项目的 `/api/*` 接口会从容器中请求原站，因此容器必须能够出站访问 HTTPS。

## 2. 安装 Docker Engine 和 Compose

如果已安装官方 Docker Engine 与 `docker compose`，可直接跳到第 3 步。

移除可能冲突的非官方软件包：

```bash
sudo apt remove -y docker.io docker-compose docker-compose-v2 docker-doc \
  docker-buildx podman-docker containerd runc 2>/dev/null || true
```

添加 Docker 官方 APT 仓库：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

验证安装：

```bash
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

## 3. 拉取项目

```bash
sudo install -d -o "$USER" -g "$USER" /opt/gys-frontend
git clone https://github.com/sanyeyuanqi/-.git /opt/gys-frontend
cd /opt/gys-frontend
```

如果仓库是私有的，可使用 GitHub Deploy Key。详细步骤见 [传统 Ubuntu 部署教程](./DEPLOY_UBUNTU.md#14-私有仓库-deploy-key)。

确认项目包含：

```text
Dockerfile
.dockerignore
docker-compose.yml
package.json
package-lock.json
```

## 4. 构建并启动容器

```bash
cd /opt/gys-frontend
sudo docker compose build --pull
sudo docker compose up -d
```

首次构建会下载 Node.js 24 镜像和 npm 依赖，需要几分钟。Dockerfile 会自动执行：

```text
npm ci
npm run lint
npm run build
```

查看状态：

```bash
sudo docker compose ps
sudo docker inspect --format='{{.State.Health.Status}}' gys-frontend
sudo docker compose logs --tail=100 frontend
```

当健康状态变为 `healthy` 后，在 Ubuntu 宿主机测试：

```bash
curl -I http://127.0.0.1:3000/login
```

容器通过 Compose 的 `restart: unless-stopped` 在异常退出和服务器重启后自动恢复。

## 5. Docker 文件说明

### Dockerfile

- 使用 Node.js 24 官方 Debian Slim 镜像。
- 构建阶段安装完整依赖并生成 Vinext standalone 输出。
- 运行阶段只复制 `dist/standalone` 及必要运行依赖。
- 容器内使用非 root 的 `node` 用户。
- 内置 `/login` 健康检查。

### docker-compose.yml

- 容器端口只绑定到宿主机 `127.0.0.1:3000`。
- 根文件系统为只读，仅 `/tmp` 为临时可写目录。
- 移除 Linux capabilities，禁止获取新权限。
- 限制日志文件大小，避免长期运行占满磁盘。

## 6. 配置宿主机 Nginx

将下面的 `example.com` 全部替换为你的真实域名。

```bash
sudo tee /etc/nginx/sites-available/gys-frontend >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name example.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 15s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/gys-frontend \
  /etc/nginx/sites-enabled/gys-frontend
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

浏览器打开：

```text
http://example.com/login
```

## 7. 配置 HTTPS

确保域名 A 记录已指向这台 Ubuntu 服务器，且安全组放行 `80` 和 `443`。

```bash
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d example.com
sudo certbot renew --dry-run
```

完成后访问：

```text
https://example.com/login
```

## 8. 防火墙注意事项

Docker 在 Linux 中会创建自己的 iptables/nftables 规则，直接发布的容器端口可能绕过 UFW 的常规规则。本项目使用：

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

因此 `3000` 只能从 Ubuntu 本机访问，公网流量必须经过 Nginx。不要改成 `3000:3000`，除非你明确需要直接对公网开放并已配置 `DOCKER-USER` 防火墙链。

如使用 UFW：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

启用 UFW 前必须先放行 SSH。

## 9. 日常更新发布

开始更新前先为当前镜像保留一个回滚标签：

```bash
cd /opt/gys-frontend
sudo docker image tag gys-frontend:latest gys-frontend:rollback
```

拉取、重新构建并替换容器：

```bash
git pull --ff-only origin main
sudo docker compose build --pull
sudo docker compose up -d --remove-orphans
sudo docker compose ps
sudo docker compose logs --tail=100 frontend
```

确认新版正常后可清理无用构建缓存和悬空镜像：

```bash
sudo docker builder prune -f
sudo docker image prune -f
```

## 10. 回滚

如果新版异常，将保留的镜像重新标记为 `latest`：

```bash
cd /opt/gys-frontend
sudo docker compose down
sudo docker image tag gys-frontend:rollback gys-frontend:latest
sudo docker compose up -d --no-build
sudo docker compose ps
```

## 11. 常用管理命令

```bash
# 查看状态
sudo docker compose ps

# 实时日志
sudo docker compose logs -f frontend

# 重启
sudo docker compose restart frontend

# 停止
sudo docker compose stop

# 启动
sudo docker compose start

# 删除容器，保留镜像
sudo docker compose down

# 查看容器资源使用
sudo docker stats gys-frontend
```

## 12. 常见故障

### 镜像构建失败

```bash
sudo docker compose build --no-cache --pull
```

如果失败在 `npm ci`，检查服务器到 npm 仓库的网络。如果失败在 `npm run build`，保留完整构建日志。

### 容器不健康

```bash
sudo docker compose ps
sudo docker inspect gys-frontend --format='{{json .State.Health}}'
sudo docker compose logs --tail=200 frontend
```

### Nginx 显示 502

```bash
curl -I http://127.0.0.1:3000/login
sudo docker compose ps
sudo docker compose logs --tail=200 frontend
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

### 页面能打开，但登录或数据加载失败

从容器的网络命名空间中测试原站：

```bash
sudo docker exec gys-frontend node -e \
  "fetch('https://gys.oljuxj.xyz/login').then(r => console.log(r.status)).catch(console.error)"
```

如果请求失败，检查 Ubuntu 的 DNS、出站 `443` 端口和云服务器网络规则。

## 13. 发布验收清单

1. `sudo docker compose ps` 显示容器为 `Up` 和 `healthy`。
2. `curl -I http://127.0.0.1:3000/login` 返回正常状态。
3. `https://example.com/login` 能显示登录页。
4. 登录、退出、上传密钥与错误提示正常。
5. 控制台、我的渠道、消费快照能加载原站数据。
6. 中英文切换和手机端布局正常。
7. `sudo certbot renew --dry-run` 通过。

## 官方参考

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker packet filtering and UFW](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Docker Compose services](https://docs.docker.com/reference/compose-file/services/)
- [Nginx reverse proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Certbot with Nginx](https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal)
