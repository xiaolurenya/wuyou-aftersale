# 无忧商服通

![无忧商服通](<logo-wordmark.svg>)

一款装在自己设备上的售后登记管理软件：飞牛 / 群晖 / 绿联 NAS、Ubuntu / Debian 服务器、宝塔面板均可部署。数据自己掌握，一次买断，后续更新免费。

![版本](https://img.shields.io/badge/version-v1.6.28-blue)
![许可](https://img.shields.io/badge/license-Proprietary-orange)
![端口](https://img.shields.io/badge/port-3650-green)
![平台](https://img.shields.io/badge/platform-Feiniu%20%2F%20Synology%20%2F%20UGREEN%20%2F%20Ubuntu%20%2F%20%E5%AE%9D%E5%A1%94-lightgrey)

---

## 亮点

- **售后登记**：日期自动填当天，型号 / 上家 / 送修单位可下拉可手输、自动建档；序列号支持一单多台、批量粘贴、扫码枪直连
- **任意检索**：一个搜索框匹配上家、型号、单位、联系人、序列号、快递单号；索引查询，不漏单
- **返回录入**：扫码定位原单 → 批量填返回日期、状态、返回快递单号；换新只记新序列号，旧序列号保留
- **打印明细**：按上家汇总、每个上家单独一页；日期区间同时匹配登记日或返回日，已返回含换新
- **权限与账号**：超级管理员 / 管理员 / 登记员 / 只读，权限点逐项可配
- **授权**：15 天试用 → 到期展示收款码与联系方式 → 粘贴激活码离线激活 → 永久使用，后续版本不再收费
- **数据安全**：每日备份 + 整机迁移 JSON；NAS 坏了换设备也能恢复
- **安心保**：`/cx` 用户自助查保修到期，可提交保修寄送 / 一键上门报修；商家后台审核、处理记录、回寄单号、进度查询
- **渠道报价**：`/bj` 匿名看零售价，渠道账号登录后按等级看普通 / 核心渠道价；账号仅管理员开通
- **客户端**：浏览器 / 安卓 APP / Windows 安装版，输 IP:端口 或域名 + 账号密码自动连接
- **手机自适应**：查询页、后台、报价前台手机浏览器均适配

---

## 安装（Docker Compose，推荐）

> 支持：飞牛 / 群晖 / 绿联 NAS、Ubuntu / Debian、宝塔面板（安装 Docker 管理器后创建容器编排）。只要是能跑 Docker Compose v2 的 Linux，步骤一样。

把下面内容存为 `docker-compose.yml`：

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
      # 一键更新需要：容器内自动拉镜像并重建；如不需要可注释此行
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      TZ: Asia/Shanghai
      PORT: "3650"
      DATA_DIR: /app/data
      NODE_ENV: production
      SESSION_SECRET: "${SESSION_SECRET:-}"
      BOOTSTRAP_ADMIN_USER: "admin"
      BOOTSTRAP_ADMIN_PASSWORD: "${BOOTSTRAP_ADMIN_PASSWORD:-Admin@3650}"
      CF_CONFIG_URL: "https://as.xlry.cc.cd/v1/config"
    healthcheck:
      test: ["CMD","node","-e","fetch('http://127.0.0.1:3650/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

> `/var/run/docker.sock` 挂载用于后台「一键更新」自动拉镜像并重建容器；如不需要自动更新，可注释这一行，改用 [install-host-cron.sh](<install-host-cron.sh>) 或手动 `docker compose pull`。挂载 docker.sock 等于把 Docker 控制权授予该容器，请按需选择。

同目录建 `.env`（**务必改掉默认密码**）：

```bash
printf 'SESSION_SECRET=%s\nBOOTSTRAP_ADMIN_PASSWORD=改成你的密码\n' "$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" > .env
```

一行启动：

```bash
docker compose up -d
```

打开 `http://设备IP:3650`，用 `admin` + 你设的密码登录。

**默认账号密码**：`admin` / `Admin@3650`；若按上面生成了 `.env`，以 `BOOTSTRAP_ADMIN_PASSWORD` 为准。首次登录后请在「系统设置 → 人员账号」修改。

---

## 检查更新 / 一键更新

后台侧边栏显示当前版本与「检查更新」。作者推送新镜像后会提示新版本。

新版 compose 默认挂载 `docker.sock`，点「立即更新」后容器会通过 Docker API 自动拉镜像、创建更新助手、重建自身，完成后页面刷新；数据卷不删、账号与登记不丢。

老版本或不想开放 `docker.sock` 的部署，可在宿主机 compose 目录执行一次：

```bash
docker cp aftersale:/app/update-cron.sh ./update-cron.sh
docker cp aftersale:/app/install-host-cron.sh ./install-host-cron.sh
sudo sh ./install-host-cron.sh
```

详见 [旧版本更新说明](<docs/OLD-VERSION-UPDATE.md>)。

---

## 手动升级

镜像标签固定为 `xiaoluya/wuyou-aftersale:1.0.0`，本机缓存旧 tag 时 `docker compose up -d` 不会自动拉新镜像。手动升级执行：

```bash
docker compose pull && docker compose up -d --force-recreate
```

若本地仍缓存旧镜像：

```bash
docker rmi xiaoluya/wuyou-aftersale:1.0.0
docker compose pull && docker compose up -d --force-recreate
```

升级后浏览器 **Ctrl+F5** 强刷一次。不要执行 `docker compose down -v`，不要删 `./data`、`./backups`；数据、账号、激活状态都在卷里。

验证镜像 digest：

```bash
docker inspect --format='{{index .RepoDigests 0}}' xiaoluya/wuyou-aftersale:1.0.0
```

---

## 其他安装方式

- 安卓 APP / Windows 安装版 / 飞牛 FPK：[Releases](<https://github.com/xiaolurenya/wuyou-aftersale/releases/tag/v1.0.3>)
- 一键脚本：`./install.sh`（仅拉镜像，不含源码）
- Ubuntu / 宝塔裸机部署思路：[裸机部署](<docs/BARE-METAL.md>) · [多客户托管规划](<docs/MULTI-TENANT-PLAN.md>)
- 客户端说明：[docs/CLIENTS.md](<docs/CLIENTS.md>)

> 电脑端仅提供 Windows 安装版，不再提供绿色版 / AppImage。公开仓不含核心源码；源码在私有仓。

---

## 设备保修查询（给用户用）

打开 `http://设备IP:3650/cx`（或云端域名 `/cx`），无需登录，输入设备 **SN / 订单号 / 手机号** 可查保修到期日、剩余天数与设备参数；可提交「保修寄送」「一键上门保修」并查看处理记录。商家在后台「保修设置」录入设备，在「安心保」处理报修单。

---

## 授权与价格

一次性买断 **¥199**，后续所有版本更新免费。首次免费试用 15 天，到期弹窗展示作者收款二维码与联系方式，输入激活码后离线激活（断网可用）。

---

## 渠道报价系统（给用户看价）

打开 `http://设备IP:3650/bj`（云端 `https://xlry.cc.cd/bj`）：匿名只显示商品与 **零售价**；渠道账号由管理员在后台「报价系统」开通（不能自助注册），登录后按等级显示 **普通渠道价 / 核心渠道价**。商品支持本地上传图片或网络图片链接；电脑端点卡片不弹详情，手机端点小卡查看详情。

---

## 数据迁移 / 整机备份

旧版本升级、清空重建前，请在「数据导出 → 整机数据备份 JSON」下载备份（含售后单、字典、用户、设置、安心保设备与报修单、报价商品与渠道账号）。重建后在「数据导出 → 整机数据恢复」选择该 JSON 一键恢复。**Excel / CSV 与表格导入只处理售后登记，不能恢复整机数据。**

---

## 当前交付镜像

`xiaoluya/wuyou-aftersale:1.0.0` 与 `:latest` 指向同一份最新镜像，当前版本与 digest 以公开仓 [version.json](<version.json>) 为准（每次镜像推送自动发布）。飞牛用户可在 Releases 下载 `WuyouAftersale-1.0.3-Feiniu.fpk`（官方 fnpack 打包），在应用中心「手动安装」导入。

---

其他文档：[安装细节](<docs/INSTALL.md>) · [常见问题](<docs/FAQ.md>) · [价格说明](<docs/PRICING.md>) · [交付镜像说明](<docs/DEPLOY-PUBLIC.md>) · [更新日志](<docs/CHANGELOG.md>)
