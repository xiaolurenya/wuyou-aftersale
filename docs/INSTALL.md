# 安装说明（飞牛 / 群晖 / 绿联 NAS）

本文档说明 Docker Compose 部署流程。软件默认使用宿主端口 3650；公开仓库仅提供文档、compose 模板与安装脚本，不包含核心源码、激活码或私有部署包。

## 准备条件

1. NAS 或服务器需支持 Docker 与 Docker Compose v2。
2. 访问终端与 NAS 需处于同一网络，或已配置可直达的域名 / 反向代理。
3. 准备独立的数据目录与备份目录。示例路径为 `/vol1/docker/aftersale`，实际路径以设备存储卷为准。
4. 使用公开仓提供的 [docker-compose.yml](../docker-compose.yml) 与 [.env.example](../.env.example) 模板。

## 通用 compose 模板

```yaml
services:
  aftersale:
    image: xiaoluya/wuyou-aftersale:1.0.0
    container_name: aftersale
    restart: unless-stopped
    ports:
      - "3650:3650"
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      TZ: Asia/Shanghai
      PORT: "3650"
      DATA_DIR: /app/data
      BACKUP_DIR: /app/backups
      NODE_ENV: production
      SESSION_SECRET: "${SESSION_SECRET:-}"
      BOOTSTRAP_ADMIN_USER: "admin"
      BOOTSTRAP_ADMIN_PASSWORD: "${BOOTSTRAP_ADMIN_PASSWORD:-Admin@3650}"
      LICENSE_PUBLIC_KEY: "${LICENSE_PUBLIC_KEY:-8385f7824215f272745c17fb60c39c39fd96b2deafbada3ba1d06d3981208201}"
      CF_CONFIG_URL: "https://as.xlry.cc.cd/v1/config"
    healthcheck:
      test: ["CMD","node","-e","fetch('http://127.0.0.1:3650/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

`./data` 保存 SQLite、设备指纹、会话密钥与系统设置；`./backups` 保存自动备份与迁移包。升级、重装时不得删除或清空这两个目录。

## 飞牛 NAS

1. 在系统设置中启用 Docker 与 Compose 功能。
2. 在文件管理中创建数据目录，例如 `/vol1/docker/aftersale`。
3. 将 compose 文件与 `.env` 放入该目录。
4. 在终端进入目录并执行 `docker compose up -d`。
5. 浏览器访问 `http://设备IP:3650`。

## 群晖 NAS（DSM）

1. DSM 7.x 安装 Container Manager；较旧版本使用 Docker 套件。
2. 在 File Station 中创建 `docker/aftersale` 目录。
3. 将 compose 文件与 `.env` 放入该目录。
4. 通过 Container Manager「项目」创建，或在 SSH 中执行 `docker compose up -d`。
5. 防火墙放行 TCP 3650 后访问 `http://设备IP:3650`。

## 绿联 NAS

1. 在应用中心启用 Docker / 容器相关组件。
2. 在文件管理中创建数据目录。
3. 将 compose 文件与 `.env` 放入该目录。
4. 在终端进入目录并执行 `docker compose up -d`。
5. 浏览器访问 `http://设备IP:3650`；无法访问时检查防火墙与端口映射。

## 首次登录

1. 打开 `http://设备IP:3650`，使用 `admin` 与 `.env` 中指定的初始密码登录。
2. 首次登录后需修改默认密码。
3. 按岗位创建独立账号并配置角色权限。
4. 首次安装提供 15 天试用；到期后按界面展示的方式获取激活码。

## 网络与防火墙

- 默认端口为 TCP 3650；修改 `ports` 左侧宿主端口后，需同步调整防火墙与访问地址。
- 同一局域网内的电脑、平板可通过浏览器访问同一地址并按账号并行使用。
- 不建议将 3650 直接暴露至公网；外网访问需结合 VPN、反向代理与 HTTPS。
- 激活校验采用 Ed25519 离线签名，断网环境可完成校验；联网主要用于获取激活码、联系方式与下载新镜像。

## 升级

1. 升级前在系统内导出整机 JSON 备份，并复制数据目录与备份目录。
2. 在 compose 目录执行：

```bash
docker compose pull
docker compose up -d --force-recreate
```

3. 浏览器执行 `Ctrl+F5` 强制刷新，并核对版本号与历史单据。

升级过程中不得执行 `docker compose down -v`，不得删除 `./data`、`./backups`。

## 卸载与保留数据

- 仅停止服务时执行 `docker compose down`；容器移除后，主机目录数据仍保留。
- 彻底卸载前需完成整机 JSON 备份与目录级复制，确认备份可读取后再删除容器与 compose 文件。
- 更换 NAS、重装系统或迁移数据盘前，需先完成备份并确认目标设备的激活码处理方式。

---

相关文档：[常见问题](FAQ.md) · [价格与授权](PRICING.md) · [项目介绍](../README.md)
