# 一台云服务器分发多个客户 / 无服务器客户方案（规划）

> 现状：当前代码是**单租户**。每个部署实例一套 SQLite 数据库、一套账号、一套激活状态、一套设置；代码里没有 `tenant_id / org_id / domain` 字段，登录也不按域名识别。
> 所以「一个进程 + 一个数据库 + 多客户共用」现在**做不到**，会串数据、串账号、串激活码。

## 一、不改架构也能马上做：一客户一实例

一台云服务器可以跑多个 Node 进程，每个客户：

- 独立目录：`/srv/wuyou/customerA/app`（源码可共享只读，数据必须独立）
- 独立数据目录：`/srv/wuyou/customerA/data`（`DATA_DIR`）
- 独立备份目录：`/srv/wuyou/customerA/backups`（`BACKUP_DIR`）
- 独立端口：`3651 / 3652 / 3653…`（`PORT`）
- 独立 systemd：`wuyou@customerA.service`
- 独立 Nginx `server_name` + SSL
- 独立后台账号、独立激活码、独立设备指纹

隔离是靠「进程 + 数据目录 + 端口 + 域名」实现的，不是靠代码里租户字段。

### 示例 systemd 模板

`/etc/systemd/system/wuyou@.service`：

```ini
[Unit]
Description=Wuyou instance %i
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/wuyou/%i/app
EnvironmentFile=/srv/wuyou/%i/.env
ExecStart=/usr/bin/node apps/api/src/server.js
Restart=always
RestartSec=3
User=www-data
Group=www-data
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

客户 .env：

```bash
PORT=3651
DATA_DIR=/srv/wuyou/customerA/data
BACKUP_DIR=/srv/wuyou/customerA/backups
SESSION_SECRET=每客户不同
BOOTSTRAP_ADMIN_USER=admin
BOOTSTRAP_ADMIN_PASSWORD=每客户不同
CF_CONFIG_URL=https://as.xlry.cc.cd/v1/config
LICENSE_PUBLIC_KEY=作者公钥
```

Nginx：

```nginx
server {
  listen 80;
  server_name a.your-domain.com;
  client_max_body_size 80m;
  location / { proxy_pass http://127.0.0.1:3651; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
}
```

### 可直接做的自动化

写一个 `add-customer.sh <客户代号> <域名> <端口>`：
1. 建目录、生成独立 `.env`
2. 软链共享源码到 `app`（或复制一份）
3. 注册 `systemctl enable --now wuyou@<代号>`
4. 写 Nginx 配置 + certbot
5. 输出访问地址、初始账号、数据目录
6. 写入 `customers.json` 清单，方便批量备份/升级

这样你在一台云服务器上可以开很多客户，**不依赖 Docker、不用每客户一个 CF 账号**。

### 容量参考

Node + SQLite 单实例内存通常几十 MB；主要瓶颈是 CPU、磁盘 IO、备份空间、域名证书数量，不是「Docker 容器个数」。开 20～50 个小客户实例在一台 2C4G 云服务器上通常可行，但要压测和限制备份并发。

## 二、没有服务器的客户，怎么办

有三条路，按推荐顺序：

### A. 你托管（最符合你这次思路）
你用自己的云服务器给客户开一个「独立实例 + 子域名」，客户只拿网址和账号。
- 优点：客户零部署；你统一升级/备份；不要求客户有 NAS/CF/Docker
- 缺点：你要承担服务器、备份、HTTPS、可用性与数据隔离责任
- 收费可以按「托管年费」而不是只卖软件

### B. 云端多租户 SaaS（需要改代码）
一个 Worker/Node + 一个 PostgreSQL/Supabase，按域名或登录账号区分租户：
- 所有业务表加 `tenant_id`
- 登录、会话、权限、设置、激活、备份、审计、报价账号、安心保单全部带租户条件
- 后台所有查询/写入强制注入 `tenant_id`
- 激活码绑定租户，不再只绑定设备指纹
- 备份/恢复、整机 JSON 导出也按租户切
- 这是**重构**，不是加一个字段就完事；当前所有 SQL、RPC、前端缓存键都要改
- 优点：真正一个服务多客户，资源最省
- 缺点：开发量大、隔离风险高，一处漏 `tenant_id` 就串数据

### C. 客户自己的 NAS / 飞牛 / Docker
适合已有设备的客户，继续用现在的 fpk / compose / 一键更新方案。

## 三、混合售卖建议

| 客户类型 | 交付 |
|---|---|
| 有 NAS / 飞牛 | fpk 或 Docker Compose |
| 有普通云服务器、不要 Docker | 裸机 systemd + Nginx（[BARE-METAL.md](<BARE-METAL.md>)） |
| 什么都没有 | 你托管：一客户一实例 + 子域名 |
| 以后量大 | 再考虑 SaaS 多租户重构 |

## 四、现在必须先处理的几个坑

1. **后台「一键更新」是给 Docker 实例用的**：它会在 `DATA_DIR` 写更新请求，宿主机 cron 拉镜像重建。托管多实例时不能让所有实例共用同一个 `/api/app/update` 流程；托管版应关闭/隐藏该按钮，由你在服务器统一 `git pull && npm ci && systemctl restart wuyou@*`。
2. **备份目录要独立**：每个客户设自己的 `BACKUP_DIR`，否则 `startup-*.sqlite` 会混。
3. **设备指纹/激活**：每个客户独立 `.device-id`，激活码按客户实例签发，不能共用。
4. **静态资源缓存**：每次升级给客户域名加 `?v=` 版本号，或统一重启后让客户强刷。
5. **源码共享**：可以共享一份只读源码，但 `node_modules`、`DATA_DIR`、`BACKUP_DIR`、`.env` 必须独立/按实例配置。
6. **公开仓不能放源码**：托管部署包放私有仓或服务器内部，不进 `xiaolurenya/wuyou-aftersale`。

## 五、结论

「一台云服务器多分发几个用户」这个思路**可以先落地**：用**一客户一实例**（裸机 Node + 独立数据 + 子域名），不用 Docker、不用客户有 CF、不用改造成多租户。

真正「一个数据库多客户」的 SaaS 是第二阶段重构，风险和工作量都大；先把托管脚本、备份、监控、升级流程跑顺，比现在直接改所有 SQL 更稳。
