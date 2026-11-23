# 无忧商服通

![无忧商服通](logo-wordmark.svg)

**售后登记 · 维保流转 · 自费统计 · 客户查询 · 安心保 · 渠道报价 一站式**

![版本](https://img.shields.io/badge/version-1.6.65-blue)
![许可](https://img.shields.io/badge/license-%E4%B9%B0%E6%96%AD%E6%8E%88%E6%9D%83-orange)
![端口](https://img.shields.io/badge/port-3650-green)
![平台](https://img.shields.io/badge/platform-Feiniu%20%2F%20Synology%20%2F%20UGREEN%20%2F%20Ubuntu%20%2F%20Docker%20%2F%20Cloud-lightgrey)

无忧商服通是一款**私有部署的售后登记与维保管理系统**，适合电脑城、维修商、批发商、售后网点与门店使用。它把原本分散在 Excel、纸质单、微信聊天和打印表格里的售后流程，整理成一条可追踪的闭环：

> **收件登记 → 维保中心 → 打印明细 → 返回录入 → 客户取件 → 任意检索 → 自费/保修/报价管理**

业务数据保存在部署方自己的 NAS / 服务器 / 数据库中；支持 Docker Compose、飞牛 FPK、裸机 Node 与云端 Worker 部署，一次性买断授权，后续版本更新免费。

---

## v1.6.46 新增亮点

### 1. 自费维修统计，终于可以事后纠错

在 **自费维修统计 → 最近收费单据** 中，每行新增「编辑」按钮：

- 前台误勾了自费？这里可以直接取消，单据立即退出自费统计；
- 报价报低了或报高了？这里可以直接修改维修费金额；
- 保存后自动同步 `records.is_paid / fee_amount` 与 `extra.finance` 收费快照；
- 任意检索、客户设备档案、订单信息里的自费状态和金额同步更新，不再出现「统计改了、查询还是旧价」；
- 写审计日志，关键改动可追溯。

![自费维修统计编辑](docs/screenshots/paid.png)

### 2. 全流程售后闭环，不再靠记忆和纸质单

- **前台快捷登记**：只负责收件，默认「已收件」，支持多序列号、扫码枪、客户寄来单号、销售日期自动标准化。
- **维保中心**：集中处理待送修单据，支持「送修上家 / 自维保 / 编辑」，客户寄来单号、送修上家、快递单号、寄商家备注统一管理。
- **打印明细**：按上家或维保方式独立成页，默认只打印最新未打印批次，也保留「全部明细 / 历史补打」。
- **返回录入**：按单据 ID 精确定位，避免同序列号串单；提交后自动进入客户取件环节。
- **客户取件**：默认显示未取件，支持「未取件 / 已取件 / 全部」筛选，登记取件按记录 ID 定位。

### 3. 查询与订单信息一致

任意检索可一次匹配客户、型号、上家、联系人、序列号、快递单号、备注及完整维保信息；查询结果里的自费列、收费金额、状态与后台编辑同步。客户设备档案按单位/联系人/电话汇总全年送修设备，适合售后对账和复购沟通。

### 4. 保修、报价、打印、备份都内置

- **安心保 `/cx`**：客户凭 SN / 订单号 / 手机号查保修，提交保修寄送或上门报修；后台审核、处理记录、回寄单号、进度查询完整闭环。
- **渠道报价 `/bj`**：匿名展示零售价，渠道账号按等级展示普通渠道价 / 核心渠道价；账号由后台统一开通。
- **导入导出**：Excel / CSV 售后登记导入、查询结果导出、整机 JSON 备份与恢复。
- **权限与审计**：超级管理员、管理员、登记员、只读角色，权限点可按角色配置，关键操作写审计日志。
- **激活与试用**：15 天试用，Ed25519 离线签名激活码，断网也能校验。

---

## 界面预览

> 以下为 v1.6.46 实际界面截图（演示数据）。

### 首页概览

![首页概览](docs/screenshots/dashboard.png)

### 前台登记

![前台登记](docs/screenshots/register.png)

### 任意检索

![任意检索](docs/screenshots/query.png)

---

## 适用场景

- 电脑城 / 维修店：登记返修件、打印送修明细、跟踪返回和取件；
- 批发商 / 渠道商：按客户等级报价，管理设备保修与售后账单；
- NAS / 私有部署用户：飞牛、群晖、绿联、Ubuntu / Debian、宝塔面板均可部署；
- 需要离线激活、数据自己掌握、不要 SaaS 订阅的团队。

---
## 当前版本

当前交付版本：**1.6.65**。

`xiaoluya/wuyou-aftersale:1.0.0` 与 `:latest` 指向同一份最新镜像；版本与 digest 以公开仓 [version.json](version.json) 为准。

---

## 安装（Docker Compose）

适用环境：飞牛 / 群晖 / 绿联 NAS、Ubuntu / Debian、宝塔面板及支持 Docker Compose v2 的 Linux 主机。

将以下内容保存为 `docker-compose.yml`：

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
      # 后台一键更新需要挂载 Docker Socket；不需要自动更新时可注释此行
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

同目录创建 `.env`；生产环境需覆盖默认管理员密码：

```bash
cat > .env <<EOF
SESSION_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d " \n")
BOOTSTRAP_ADMIN_PASSWORD=Admin@3650
EOF
```

启动命令：

```bash
docker compose up -d
```

浏览器访问 `http://设备IP:3650`。初始账号为 `admin`，初始密码由 `.env` 中的 `BOOTSTRAP_ADMIN_PASSWORD` 指定；未设置 `.env` 时为 `Admin@3650`。首次登录后需修改默认密码。

`/var/run/docker.sock` 挂载用于后台一键更新；挂载后容器具备宿主机 Docker 控制权限。禁用该挂载时，可采用 [install-host-cron.sh](install-host-cron.sh) 或手动执行更新命令。

---

## 手动升级

镜像标签固定为 `xiaoluya/wuyou-aftersale:1.0.0`。本机存在旧 tag 缓存时，`docker compose up -d` 不会自动拉取新镜像。手动升级命令：

```bash
docker compose pull
docker compose up -d --force-recreate
```

若本机仍缓存旧镜像：

```bash
docker rmi xiaoluya/wuyou-aftersale:1.0.0
docker compose pull
docker compose up -d --force-recreate
```

升级后浏览器执行 `Ctrl+F5` 强制刷新。禁止执行 `docker compose down -v`，禁止删除 `./data`、`./backups`；业务数据、账号与激活状态均保存在数据卷中。

镜像 digest 核验：

```bash
docker inspect --format='{{index .RepoDigests 0}}' xiaoluya/wuyou-aftersale:1.0.0
```

---

## 授权与价格

一次性买断 **¥299**，后续所有版本更新免费。首次安装提供 15 天试用；到期后展示购买方式与联系方式，输入激活码后离线激活。整机备份迁移至新设备后，授权状态会按目标设备重新初始化，需使用与目标设备匹配的激活码。

---

## 设备保修查询

访问 `http://设备IP:3650/cx` 或云端域名 `/cx`，无需登录即可通过 SN / 订单号 / 手机号查询保修到期日、剩余天数与设备参数，并可提交保修寄送或上门报修。商家侧在后台「保修设置」录入设备，在「安心保」处理报修单。

---

## 渠道报价系统

访问 `http://设备IP:3650/bj` 或云端域名 `/bj`：匿名访问仅展示商品与零售价；渠道账号登录后按等级展示普通渠道价 / 核心渠道价。渠道账号由管理员在后台「报价系统」开通，不提供自助注册。商品支持本地上传图片或网络图片链接；电脑端与手机端均提供适配展示。

---

## 数据迁移 / 整机备份

旧版本升级、清空重建或跨设备迁移前，需在「数据导出 → 整机数据备份 JSON」下载备份。整机 JSON 覆盖售后单、字典、用户、设置、安心保设备与报修单、报价商品与渠道账号。重建后通过「数据导出 → 整机数据恢复」导入。

Excel / CSV 与表格导入仅处理售后登记，不能替代整机恢复。整机恢复完成后，授权状态会按当前设备重新初始化；激活码不可跨设备直接复制使用。

---

## 其他安装方式

- 安卓 APK / Windows 安装版 / 飞牛 FPK：[Releases](https://github.com/xiaolurenya/wuyou-aftersale/releases/latest)
- 一键脚本：`./install.sh`（仅拉取镜像，不含源码）
- Ubuntu / 宝塔裸机部署说明：[裸机部署](docs/BARE-METAL.md) · [多实例托管架构](docs/MULTI-TENANT-PLAN.md)
- 客户端说明：[docs/CLIENTS.md](docs/CLIENTS.md)

桌面客户端正式交付 Windows 安装版。公开仓不含核心源码；源码位于私有仓。

---

## 文档索引

[安装细节](docs/INSTALL.md) · [常见问题](docs/FAQ.md) · [价格说明](docs/PRICING.md) · [交付镜像说明](docs/DEPLOY-PUBLIC.md) · [更新日志](docs/CHANGELOG.md)


> 说明：`/yt` 服务器专属报价配置页仅在作者 bare 服务器启用；公开 Docker/云端/客户机版本不提供该入口。
