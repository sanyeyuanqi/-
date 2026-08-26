# Ubuntu + Docker 生产环境部署教程

本教程适用于当前 `gys-frontend` 项目，推荐 Ubuntu 22.04 或 24.04。前端、Nginx 和 Certbot 均通过 Docker Compose 管理，Nginx 配置与 HTTPS 证书挂载到 Ubuntu 宿主机持久化保存。

```text
浏览器
   |
   v
gys-nginx :80/:443
   |
   v
gys-frontend:3000 (仅 Docker 内部网络)
   |
   v
https://gys.oljuxj.xyz
```

这种方式只向公网发布 Nginx 的 `80/443`，前端容器的 `3000` 端口不会映射到 Ubuntu 宿主机。

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
sudo apt install -y ca-certificates curl git
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
nginx/conf.d/default.conf
nginx/conf.d/https.conf.example
nginx/nginx.conf
package.json
package-lock.json
```

## 4. 构建并启动容器

```bash
cd /opt/gys-frontend
sudo docker compose pull nginx
sudo docker compose build --pull frontend
sudo docker compose up -d frontend nginx
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
sudo docker inspect --format='{{.State.Health.Status}}' gys-nginx
sudo docker compose logs --tail=100 frontend nginx
```

当健康状态变为 `healthy` 后，在 Ubuntu 宿主机测试：

```bash
curl -I http://127.0.0.1/login
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

- 前端 `3000` 端口只向 Docker 内部网络开放。
- Nginx 对外发布宿主机的 `80/443`，容器内使用非特权端口 `8080/8443`。
- `nginx/conf.d` 只读挂载到 `/etc/nginx/conf.d`。
- `nginx/certbot/conf` 挂载为证书持久化目录。
- `nginx/certbot/www` 挂载为 ACME 域名验证目录。
- 两个常驻容器的根文件系统均为只读，仅必要临时目录可写。
- 前端移除全部 Linux capabilities；Nginx 仅保留工作进程降权所需的 `CHOWN/SETUID/SETGID`。
- 限制日志文件大小，避免长期运行占满磁盘。

## 6. Nginx 挂载说明

Compose 使用以下只读挂载：

```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/conf.d:/etc/nginx/conf.d:ro
  - ./nginx/certbot/www:/var/www/certbot:ro
  - ./nginx/certbot/conf:/etc/letsencrypt:ro
```

修改宿主机中的 `nginx/conf.d/default.conf` 后，先检查配置再平滑重载：

```bash
cd /opt/gys-frontend
sudo docker compose exec nginx nginx -t
sudo docker compose exec nginx nginx -s reload
```

确认 Nginx 和反向代理均正常：

```bash
curl http://127.0.0.1/nginx-health
curl -I http://127.0.0.1/login
sudo docker compose exec nginx wget -qO- http://frontend:3000/login >/dev/null
```

此时可以通过 `http://服务器公网IP/login` 访问。生产环境应继续配置域名和 HTTPS。

## 7. 配置 HTTPS

确保域名 A 记录已指向这台 Ubuntu 服务器，且安全组放行 `80` 和 `443`。将下面两个变量替换为真实域名和邮箱：

```bash
cd /opt/gys-frontend
export DOMAIN=example.com
export EMAIL=admin@example.com

sudo docker compose --profile tools run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"
```

证书会写入宿主机的 `nginx/certbot/conf`。然后启用仓库中的 HTTPS 配置模板：

```bash
sudo cp nginx/conf.d/https.conf.example nginx/conf.d/default.conf
sudo sed -i "s/example.com/$DOMAIN/g" nginx/conf.d/default.conf
sudo docker compose exec nginx nginx -t
sudo docker compose restart nginx
```

完成后访问：

```text
https://example.com/login
```

手动续期与重载：

```bash
sudo docker compose --profile tools run --rm certbot renew
sudo docker compose exec nginx nginx -s reload
```

可在 root 的 crontab 中每天检查一次续期：

```cron
0 3 * * * cd /opt/gys-frontend && /usr/bin/docker compose --profile tools run --rm certbot renew --quiet && /usr/bin/docker compose exec -T nginx nginx -s reload
```

## 8. 防火墙注意事项

Docker 在 Linux 中会创建自己的 iptables/nftables 规则，直接发布的容器端口可能绕过 UFW 的常规规则。本项目只发布：

```yaml
ports:
  - "80:8080"
  - "443:8443"
```

前端的 `3000` 没有宿主机映射，公网流量必须经过 Nginx。不要给 `frontend` 添加 `3000:3000`，除非你明确需要直接对公网开放并已配置 `DOCKER-USER` 防火墙链。

如使用 UFW：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
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
sudo docker compose pull nginx
sudo docker compose build --pull frontend
sudo docker compose up -d --remove-orphans
sudo docker compose ps
sudo docker compose logs --tail=100 frontend nginx
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
sudo docker compose logs -f frontend nginx

# 重启
sudo docker compose restart frontend nginx

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
sudo docker compose build --no-cache --pull frontend
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
curl http://127.0.0.1/nginx-health
sudo docker compose ps
sudo docker compose logs --tail=200 frontend nginx
sudo docker compose exec nginx nginx -t
sudo docker compose exec nginx wget -qO- http://frontend:3000/login >/dev/null
```

### 页面能打开，但登录或数据加载失败

从容器的网络命名空间中测试原站：

```bash
sudo docker exec gys-frontend node -e \
  "fetch('https://gys.oljuxj.xyz/login').then(r => console.log(r.status)).catch(console.error)"
```

如果请求失败，检查 Ubuntu 的 DNS、出站 `443` 端口和云服务器网络规则。

## 13. 发布验收清单

1. `sudo docker compose ps` 显示 `gys-frontend` 和 `gys-nginx` 均为 `Up` 和 `healthy`。
2. `curl -I http://127.0.0.1/login` 返回正常状态。
3. `https://example.com/login` 能显示登录页。
4. 登录、退出、上传密钥与错误提示正常。
5. 控制台、我的渠道、消费快照能加载原站数据。
6. 中英文切换和手机端布局正常。
7. `sudo docker compose --profile tools run --rm certbot renew --dry-run` 通过。

## 官方参考

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker packet filtering and UFW](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Docker Compose services](https://docs.docker.com/reference/compose-file/services/)
- [Nginx reverse proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Certbot Docker installation](https://eff-certbot.readthedocs.io/en/stable/install.html#alternative-1-docker)
- [Certbot webroot authentication](https://eff-certbot.readthedocs.io/en/stable/using.html#webroot)
