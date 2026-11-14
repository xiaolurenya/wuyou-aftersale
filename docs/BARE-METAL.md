# 云服务器裸机部署（不用 Docker）

> 适用：Ubuntu 22.04/24.04、Debian 12、宝塔/普通云服务器。
> 注意：这里部署的是 **NAS/本地版 Node 程序**（Fastify + SQLite），不是 https://xlry.cc.cd 那个 Cloudflare Worker 版。前端页面、后台接口、数据库都由同一个 Node 进程提供，Nginx 只做反向代理和 HTTPS。

## 一、能像普通网站一样跑吗

可以，但**不能只放 HTML**。必须有：

1. Node.js 22+（推荐 24 LTS）
2. 项目源码或交付包：私有仓库 `xiaolurenya/wuyou-aftersale-src`，或作者提供的部署包
3. 常驻 Node 进程：`node apps/api/src/server.js`
4. Nginx 反向代理到 `127.0.0.1:3650`
5. 可写数据目录 `./data`：SQLite、设备指纹、会话密钥、设置都在这里

端口默认 `3650`，可改 `PORT`。程序监听 `0.0.0.0`，适合 Nginx 反代，不建议裸奔公网端口。

## 二、目录与权限

```bash
sudo mkdir -p /opt/wuyou/{app,data,backups}
sudo chown -R $USER:$USER /opt/wuyou
cd /opt/wuyou/app
# 放私有源码/交付包到这里
```

必须存在：

```
apps/api/src/server.js
apps/web/public/            # 前端静态页
packages/shared/            # 共享代码
node_modules/               # 依赖
deploy/keys/public.hex      # 激活公钥文件
VERSION
```

## 三、安装依赖

```bash
cd /opt/wuyou/app
node -v                    # >= 22
npm ci                     # 或 npm install --omit=dev
```

`better-sqlite3`、`argon2` 是原生模块。若服务器架构与交付包预编译不一致：

```bash
sudo apt install -y build-essential python3
npm rebuild better-sqlite3 argon2
```

## 四、环境变量

新建 `/opt/wuyou/app/.env`：

```bash
PORT=3650
NODE_ENV=production
TZ=Asia/Shanghai
DATA_DIR=/opt/wuyou/data
SESSION_SECRET=改成一串32位以上随机字符
BOOTSTRAP_ADMIN_USER=admin
BOOTSTRAP_ADMIN_PASSWORD=改成你的密码
CF_CONFIG_URL=https://as.xlry.cc.cd/v1/config
LICENSE_PUBLIC_KEY=填作者提供的激活公钥hex
```

说明：

- `SESSION_SECRET` 留空时程序会在 `DATA_DIR` 自动生成 `.session-secret`，但建议自己写死。
- `BOOTSTRAP_ADMIN_PASSWORD` **只在第一次建库时生效**，之后改密码要在「系统设置 → 人员账号」里改。
- `LICENSE_PUBLIC_KEY` 必须和激活码签发私钥对应；不填会导致离线激活校验失败。
- 试用期 15 天由程序内置，不要再暴露 `TRIAL_BYPASS` 给用户。

## 五、首次启动

```bash
cd /opt/wuyou/app
set -a; . ./.env; set +a
node apps/api/src/server.js
```

看到 `[售后管理系统] 已启动 http://0.0.0.0:3650` 后，打开 `http://服务器IP:3650`，用 `admin` + 你设的密码登录。首次启动会自动建库、建管理员、生成设备指纹。

## 六、systemd 常驻（推荐）

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

如果用 `www-data`：

```bash
sudo chown -R www-data:www-data /opt/wuyou/data /opt/wuyou/backups
sudo systemctl daemon-reload
sudo systemctl enable --now wuyou
sudo journalctl -u wuyou -f
```

## 七、Nginx + 域名 + HTTPS

`/etc/nginx/sites-available/wuyou.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 80m;   # 上门保修附件最大约 50MB

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

```bash
sudo ln -s /etc/nginx/sites-available/wuyou.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

之后入口：

- 后台：`https://your-domain.com/`
- 用户保修查询：`https://your-domain.com/cx`
- 渠道报价：`https://your-domain.com/bj`

## 八、数据、备份与更新

- 数据全在 `DATA_DIR`：`aftersale.db / .device-id / .session-secret / settings.json`
- 备份放 `/opt/wuyou/backups`，程序启动会写 `startup-*.sqlite`
- 整机 JSON 备份/恢复在后台「数据导出」，跨 NAS/云端通用
- 升级：替换源码 → `npm ci`（依赖有变化时）→ `systemctl restart wuyou`
- **不要删 `./data`**

裸机版没有 Docker 一键更新按钮；更新用「替换源码 + 重启服务」。后台「检查更新」只提示版本，真正动作需要你在服务器执行：

```bash
cd /opt/wuyou/app
# 覆盖新源码
npm ci
sudo systemctl restart wuyou
```

## 九、不装 Docker 时的差异

| 项目 | Docker 交付 | 裸机 |
|---|---|---|
| 运行 | 镜像 + compose | Node 进程 + systemd |
| 更新 | 后台一键更新（cron 拉镜像） | 替换源码 + 重启 |
| 数据卷 | `./data:/app/data` | `DATA_DIR` 指向真实目录 |
| 端口 | 3650 | 3650，Nginx 反代 |
| 激活 | 环境变量/公钥 | 同样需要 `LICENSE_PUBLIC_KEY` |
| 附件 | 数据目录 | 数据目录，Nginx 放开 `client_max_body_size` |

## 十、宝塔面板

1. 网站 → 添加站点，纯静态即可，不开 PHP
2. 「反向代理」目标 URL 填 `http://127.0.0.1:3650`
3. 用「Supervisor / PM2 / systemd」常驻 `node apps/api/src/server.js`
4. SSL 在宝塔里申请
5. 数据目录给运行 Node 的用户写权限

> 仍需要私有源码/部署包。公开仓 `xiaolurenya/wuyou-aftersale` 只有介绍和 compose，不含可运行源码。
