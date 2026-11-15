# 裸机部署说明

适用环境：Ubuntu 22.04 / 24.04、Debian 12、宝塔面板及普通云服务器。该模式运行本地版 Node 服务（Fastify + SQLite），Nginx 负责反向代理与 HTTPS；不适用于 Cloudflare Worker 云端托管版。

## 运行条件

1. Node.js 22 及以上，推荐 24 LTS。
2. 私有源码或交付包。
3. 常驻 Node 进程：`node apps/api/src/server.js`。
4. Nginx 反向代理至 `127.0.0.1:3650`。
5. 可写数据目录，用于 SQLite、设备指纹、会话密钥与设置。

默认端口为 3650，可通过 `PORT` 调整。服务监听 `0.0.0.0`，生产环境应通过 Nginx 反代并启用 HTTPS。

## 目录与权限

```bash
sudo mkdir -p /opt/wuyou/{app,data,backups}
sudo chown -R $USER:$USER /opt/wuyou
cd /opt/wuyou/app
```

目录需包含 `apps/api/src/server.js`、`apps/web/public/`、`packages/shared/`、`node_modules/`、`deploy/keys/public.hex` 与 `VERSION`。

## 安装依赖

```bash
cd /opt/wuyou/app
node -v
npm ci --omit=dev
```

`better-sqlite3` 与 `argon2` 为原生模块。架构或预编译产物不一致时执行：

```bash
sudo apt install -y build-essential python3
npm rebuild better-sqlite3 argon2
```

## 环境变量

`/opt/wuyou/app/.env` 示例：

```bash
PORT=3650
NODE_ENV=production
TZ=Asia/Shanghai
DATA_DIR=/opt/wuyou/data
BACKUP_DIR=/opt/wuyou/backups
SESSION_SECRET=32位以上随机字符
BOOTSTRAP_ADMIN_USER=admin
BOOTSTRAP_ADMIN_PASSWORD=Admin@3650
CF_CONFIG_URL=https://as.xlry.cc.cd/v1/config
LICENSE_PUBLIC_KEY=8385f7824215f272745c17fb60c39c39fd96b2deafbada3ba1d06d3981208201
```

- `SESSION_SECRET` 留空时会在 `DATA_DIR` 自动生成 `.session-secret`；生产环境建议显式配置。
- `BOOTSTRAP_ADMIN_PASSWORD` 仅在首次建库时生效；后续密码修改在后台完成。
- `LICENSE_PUBLIC_KEY` 必须与激活码签发私钥对应。
- 试用期由程序与授权配置共同控制，生产环境不得暴露测试绕过开关。

## systemd 服务

`/etc/systemd/system/wuyou.service`：

```ini
[Unit]
Description=Wuyou Aftersale Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/wuyou/app
EnvironmentFile=/opt/wuyou/app/.env
ExecStart=/usr/bin/node apps/api/src/server.js
Restart=always
RestartSec=3
User=www-data
Group=www-data
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo chown -R www-data:www-data /opt/wuyou/data /opt/wuyou/backups
sudo systemctl daemon-reload
sudo systemctl enable --now wuyou
sudo journalctl -u wuyou -f
```

## Nginx 与 HTTPS

```nginx
server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 80m;
    location / {
        proxy_pass http://127.0.0.1:3650;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

配置完成后执行 `nginx -t` 并重载 Nginx；HTTPS 证书由服务器管理员配置。

## 数据、备份与更新

- 数据位于 `DATA_DIR`，包含 `aftersale.db`、`.device-id`、`.session-secret` 与设置。
- 备份位于 `BACKUP_DIR`，服务启动时写入 `startup-*.sqlite`。
- 整机 JSON 备份 / 恢复在后台「数据导出」完成。
- 更新流程为替换源码、按需安装依赖、重启服务。
- 禁止删除 `DATA_DIR`。

裸机版不提供 Docker 一键更新按钮；后台检查更新仅提示版本，实际更新由服务器管理员执行。

## 宝塔面板

1. 创建站点并配置反向代理至 `http://127.0.0.1:3650`。
2. 使用 Supervisor / PM2 / systemd 常驻 Node 进程。
3. 在宝塔内申请并配置 SSL。
4. 确保 Node 运行用户对数据目录具备写权限。

裸机部署需要私有源码或部署包；公开仓仅提供介绍与 compose 模板。
