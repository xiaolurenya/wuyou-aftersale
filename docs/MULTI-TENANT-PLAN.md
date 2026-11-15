# 多实例托管架构说明

当前交付架构为单租户：每个部署实例独立持有数据库、账号、设置与授权状态。代码层未内置 `tenant_id / org_id` 路由隔离，因此单个进程与单个数据库不具备多客户数据隔离能力。

## 一客户一实例

一台云服务器可运行多个独立 Node 进程，每个客户配置：

- 独立应用目录：`/srv/wuyou/customerA/app`
- 独立数据目录：`/srv/wuyou/customerA/data`
- 独立备份目录：`/srv/wuyou/customerA/backups`
- 独立端口：`3651 / 3652 / 3653…`
- 独立 systemd 单元：`wuyou@customerA.service`
- 独立 Nginx `server_name` 与 SSL 证书
- 独立后台账号、激活码与设备指纹

隔离边界由进程、数据目录、端口与域名共同构成。

## systemd 模板

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

每个实例需配置不同 `PORT`、`DATA_DIR`、`BACKUP_DIR`、`SESSION_SECRET` 与初始管理员密码。

## 交付方式

| 客户环境 | 推荐交付 |
| --- | --- |
| 已有 NAS / 飞牛 | FPK 或 Docker Compose |
| 普通云服务器且不采用 Docker | systemd + Nginx 裸机实例 |
| 无服务器 | 一客户一实例托管，并提供网址与账号 |
| 大规模 SaaS | 需进行多租户重构 |

## 实施注意事项

1. Docker 一键更新按钮仅适用于 Docker 实例；托管多实例需由服务器统一更新。
2. 每个实例必须使用独立备份目录。
3. 每个实例必须使用独立设备指纹与激活码。
4. 每次升级需更新静态资源版本参数或通知客户端强制刷新。
5. 源码可共享为只读目录，但 `node_modules`、`DATA_DIR`、`BACKUP_DIR` 与 `.env` 必须按实例隔离。
6. 部署包与私有源码不得进入公开仓。

真正「一个数据库多客户」的 SaaS 架构需要所有业务表增加租户标识，并改造登录、会话、权限、设置、授权、备份、审计、报价账号与安心保流程，属于独立阶段的系统重构。
