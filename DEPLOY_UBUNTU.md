# Ubuntu 生产环境部署教程

> 使用 Docker 部署时，请阅读 [Ubuntu Docker 部署教程](./DEPLOY_UBUNTU_DOCKER.md)。本文是不使用 Docker 的传统部署方案。

本教程适用于当前 `gys-frontend` 项目，推荐环境为 Ubuntu 22.04 或 Ubuntu 24.04，架构为：

```text
浏览器 -> Nginx (80/443) -> Vinext/Node.js (127.0.0.1:3000)
                                      -> https://gys.oljuxj.xyz
```

项目将前端页面和 `/api/*` 代理都运行在 Node.js 中。服务器必须能够通过 HTTPS 访问 `gys.oljuxj.xyz`。

## 1. 部署前准备

需要：

- 一台 Ubuntu 22.04/24.04 服务器，建议至少 1 GB 内存。
- 具有 `sudo` 权限的 SSH 账号。
- 服务器可出站访问 GitHub、NodeSource 和 `https://gys.oljuxj.xyz`。
- 如需 HTTPS，准备一个已解析到服务器公网 IP 的域名。
- 云厂商安全组放行 TCP `22`/`80`/`443`。

以下命令均在 Ubuntu 服务器中执行。

## 2. 安装基础软件

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
```

项目要求 Node.js `>=22.13.0`。建议安装当前 LTS 版 Node.js 24：

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs

node -v
npm -v
```

`node -v` 应显示 `v24.x.x`。

> Node.js 24 已进入 LTS，官方计划支持至 2028 年 4 月。NodeSource 支持在 Ubuntu 22.04 和 24.04 上安装 Node.js 24。

## 3. 创建独立运行账号

不要使用 `root` 直接运行网站：

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo install -d -o deploy -g deploy /opt/gys-frontend
```

## 4. 从 GitHub 拉取代码

公开仓库可直接使用 HTTPS：

```bash
sudo -H -u deploy git clone https://github.com/sanyeyuanqi/-.git /opt/gys-frontend
```

如果仓库是私有的，请先按本文末尾的“私有仓库 Deploy Key”完成授权，再拉取代码。不要把 GitHub Token 直接写进仓库地址或脚本。

## 5. 安装依赖并构建

```bash
cd /opt/gys-frontend
sudo -H -u deploy npm ci
sudo -H -u deploy npm run lint
sudo -H -u deploy npm run build
```

构建成功时会看到 `Build complete`。

> 不要使用 `npm ci --omit=dev`。当前项目的构建和生产启动命令需要 `vinext`，它位于 `devDependencies`。

可先手动验证一次：

```bash
sudo -H -u deploy npm run start -- --hostname 127.0.0.1 --port 3000
```

看到服务启动后，新开一个 SSH 窗口执行：

```bash
curl -I http://127.0.0.1:3000/login
```

返回 HTTP `200` 或正常跳转即可。回到第一个窗口按 `Ctrl+C` 停止手动进程。

## 6. 使用 systemd 常驻运行

先确认 npm 路径：

```bash
command -v npm
```

NodeSource 默认应返回 `/usr/bin/npm`。如果不同，请把下面 `ExecStart` 中的路径换成实际结果。

创建服务：

```bash
sudo tee /etc/systemd/system/gys-frontend.service >/dev/null <<'EOF'
[Unit]
Description=GYS React Frontend
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/gys-frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
UMask=0027

[Install]
WantedBy=multi-user.target
EOF
```

启动并设为开机自启：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gys-frontend
sudo systemctl status gys-frontend --no-pager
```

再次检查：

```bash
curl -I http://127.0.0.1:3000/login
```

## 7. 配置 Nginx 反向代理

将下面的 `example.com` 替换为你的真实域名。如果暂时只用 IP，可将 `server_name` 填为服务器公网 IP，并先跳过 HTTPS 章节。

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
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/gys-frontend /etc/nginx/sites-enabled/gys-frontend
sudo nginx -t
sudo systemctl reload nginx
```

如果这台服务器没有其他 Nginx 站点，可移除默认站点：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

浏览器打开 `http://example.com/login`。确认登录页可访问后再配置 HTTPS。

## 8. 配置 HTTPS

先确保：

1. 域名 A 记录已指向服务器公网 IPv4。
2. 如配置了 AAAA 记录，IPv6 也必须正确可达。
3. 云安全组和防火墙允许公网访问 `80` 和 `443`。

使用 Certbot 官方推荐的 Snap 版本：

```bash
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d example.com
```

按提示输入邮箱、接受条款，Certbot 会自动修改 Nginx 配置并开启 HTTPS。

测试自动续期：

```bash
sudo certbot renew --dry-run
```

最终访问：

```text
https://example.com/login
```

## 9. 防火墙

如果使用 UFW，启用前务必先放行 SSH，避免将自己锁在服务器外：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Node.js 只监听 `127.0.0.1:3000`，因此无需也不应该向公网放行 `3000` 端口。

## 10. 发布后验收

依次检查：

```bash
# Node.js 服务
sudo systemctl status gys-frontend --no-pager

# Nginx
sudo nginx -t
sudo systemctl status nginx --no-pager

# 本机直连应用
curl -I http://127.0.0.1:3000/login

# 公网 HTTPS
curl -I https://example.com/login

# 确认服务器可访问原站
curl -I https://gys.oljuxj.xyz/login
```

然后在浏览器中验证：

1. 登录和退出正常。
2. 控制台、消费快照、我的渠道能获取真实数据。
3. 上传密钥的成功和错误提示正常。
4. 中英文切换正常。
5. 电脑和手机尺寸均无横向溢出。

## 11. 日常更新发布

本地代码推送到 GitHub `main` 分支后，在 Ubuntu 服务器执行：

```bash
cd /opt/gys-frontend
sudo -H -u deploy git pull --ff-only origin main
sudo -H -u deploy npm ci
sudo -H -u deploy npm run lint
sudo -H -u deploy npm run build
sudo systemctl restart gys-frontend
sudo systemctl status gys-frontend --no-pager
```

只有在构建成功后才执行 `restart`。如果 `git pull --ff-only` 失败，说明服务器上有未同步的提交或修改，不要强制覆盖，先查看：

```bash
sudo -H -u deploy git status
```

## 12. 回滚到旧版本

查看最近提交：

```bash
cd /opt/gys-frontend
sudo -H -u deploy git log --oneline -10
```

选择一个已知正常的提交 ID，例如 `<commit-id>`：

```bash
sudo -H -u deploy git switch --detach <commit-id>
sudo -H -u deploy npm ci
sudo -H -u deploy npm run build
sudo systemctl restart gys-frontend
```

需要回到最新 `main` 分支时：

```bash
sudo -H -u deploy git switch main
sudo -H -u deploy git pull --ff-only origin main
sudo -H -u deploy npm ci
sudo -H -u deploy npm run build
sudo systemctl restart gys-frontend
```

## 13. 常见故障排查

### 页面显示 502 Bad Gateway

```bash
sudo systemctl status gys-frontend --no-pager
sudo journalctl -u gys-frontend -n 100 --no-pager
curl -I http://127.0.0.1:3000/login
sudo ss -ltnp | grep ':3000'
```

通常是 Node.js 服务未启动、构建失败或 `3000` 端口被其他进程占用。

### Nginx 修改后无法启动

```bash
sudo nginx -t
sudo journalctl -u nginx -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

### 页面能打开，但登录或数据请求失败

```bash
curl -I https://gys.oljuxj.xyz/login
getent hosts gys.oljuxj.xyz
sudo journalctl -u gys-frontend -n 200 --no-pager
```

检查服务器的出站 `443` 端口、DNS 解析和系统时间。本项目的 `/api/*` 会实时请求原站，因此原站不可达时业务数据也会失败。

### 查看实时日志

```bash
sudo journalctl -u gys-frontend -f
```

## 14. 私有仓库 Deploy Key

如果 GitHub 仓库是私有的，可以为这台服务器创建只读 Deploy Key：

```bash
sudo -H -u deploy mkdir -p /home/deploy/.ssh
sudo -H -u deploy ssh-keygen \
  -t ed25519 \
  -C "gys-ubuntu-deploy" \
  -f /home/deploy/.ssh/gys_deploy \
  -N ""

sudo cat /home/deploy/.ssh/gys_deploy.pub
```

将输出的公钥添加到 GitHub 仓库：

```text
Settings -> Deploy keys -> Add deploy key
```

保持 `Allow write access` 未勾选，服务器只需拉取代码。

记录 GitHub 主机指纹并拉取：

```bash
sudo -H -u deploy ssh-keyscan github.com >> /home/deploy/.ssh/known_hosts
sudo chown deploy:deploy /home/deploy/.ssh/known_hosts
sudo chmod 600 /home/deploy/.ssh/known_hosts

sudo -H -u deploy env \
  GIT_SSH_COMMAND='ssh -i /home/deploy/.ssh/gys_deploy -o IdentitiesOnly=yes' \
  git clone git@github.com:sanyeyuanqi/-.git /opt/gys-frontend

sudo -H -u deploy git -C /opt/gys-frontend config core.sshCommand \
  'ssh -i /home/deploy/.ssh/gys_deploy -o IdentitiesOnly=yes'
```

## 参考文档

- [Node.js 24 LTS 发布说明](https://nodejs.org/en/blog/release/v24.11.0)
- [NodeSource Ubuntu/Debian 安装说明](https://github.com/nodesource/distributions)
- [Ubuntu Server：安装 Nginx](https://ubuntu.com/server/docs/how-to/web-services/install-nginx/)
- [Ubuntu Server：配置 Nginx](https://ubuntu.com/server/docs/how-to/web-services/configure-nginx/)
- [Nginx 反向代理模块](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Certbot + Nginx 官方指引](https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal)
- [GitHub Deploy Key 官方文档](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)
