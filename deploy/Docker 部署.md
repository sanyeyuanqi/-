# Docker 部署

适用于 Ubuntu 22.04/24.04。服务器需放行 TCP `22`、`80`、`443`。

```text
deploy/
├── Docker 部署.md
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dockerignore
│   └── docker-compose.yml
└── nginx/
    ├── docker-compose.yml
    ├── cert/
    ├── conf/
    └── log/
```

## 1. 安装 Docker

已安装 Docker Engine 和 Docker Compose 时跳过此步骤。

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
sudo systemctl enable --now docker
```

## 2. 拉取项目

```bash
sudo install -d -o "$USER" -g "$USER" /data/gys-frontend
git clone https://github.com/sanyeyuanqi/-.git /data/gys-frontend
cd /data/gys-frontend
```

## 3. 创建通信网络

```bash
sudo docker network create gys-network
```

## 4. 部署前端

```bash
cd /data/gys-frontend/deploy/frontend
sudo docker compose build --pull
sudo docker compose up -d
sudo docker compose ps
```

## 5. 单独部署 Nginx

```bash
cd /data/gys-frontend/deploy/nginx
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
curl http://127.0.0.1/nginx-health
curl -I http://127.0.0.1/login
```

## 6. 更新部署

```bash
cd /data/gys-frontend
git pull --ff-only origin main

cd deploy/frontend
sudo docker compose up -d --build

cd ../nginx
sudo docker compose up -d
```
