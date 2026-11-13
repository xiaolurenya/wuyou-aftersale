# 无忧商服通

![无忧商服通](<logo-wordmark.svg>)

一款装在你自己设备上的售后登记管理软件：飞牛 / 群晖 / 绿联 NAS、Ubuntu 服务器、宝塔面板均可部署。数据自己掌握，一次买断，后续更新免费。

![版本](https://img.shields.io/badge/version-v1.6.7-blue)
![许可](https://img.shields.io/badge/license-Proprietary-orange)
![端口](https://img.shields.io/badge/port-3650-green)
![平台](https://img.shields.io/badge/platform-Feiniu%20%2F%20Synology%20%2F%20UGREEN%20%2F%20Ubuntu%20%2F%20%E5%AE%9D%E5%A1%94-lightgrey)

---

## 亮点

- **登记快**：日期自动填当天，型号 / 上家 / 送修单位可下拉可手输、自动建档；序列号支持一单多台、批量粘贴、扫码枪直连
- **找得到**：任意检索一个框匹配上家、型号、单位、联系人、序列号、快递单号；几十万条数据走索引，不卡顿、不漏单
- **返修省心**：扫码定位原单 → 一键批量填返回日期、状态、快递单号；换新只记新序列号，旧序列号永久保留
- **客户档案**：同一个单位/个人全年送修的所有设备，点一次全查出来
- **打印明细**：按上家汇总未返回机器，A4 版式可调，附返回地址与快递公司（单号自动识别）
- **权限清晰**：超级管理员 / 管理员 / 登记员 / 只读，13 个权限点逐项可配
- **授权简单**：15 天试用 → 到期弹作者微信收款码与联系方式 → 粘贴激活码离线激活 → 永久使用，换版本不再收费
- **数据稳**：每日备份 + 整机迁移包（NAS 坏了换台设备即可恢复，激活码不失效）
- **多端可用**：浏览器 / 安卓 APP / 电脑客户端，输 IP:端口 或域名 + 账号密码自动连接
- **安心保**：用户自助 `/cx` 查保修到期，可提交保修寄送 / 一键上门报修；商家后台审核、填处理记录、回寄单号，客户能实时看到进度
- **渠道报价系统**：`/bj` 匿名看零售价，渠道账号登录后按等级看普通 / 核心渠道价；账号仅管理员开通，商品支持图片与详细信息
- **手机自适应**：查询页、后台、报价页手机浏览器均适配

---

## 安装（Docker Compose）

> **支持环境**：飞牛 / 群晖 / 绿联 NAS、Ubuntu / Debian 服务器、**宝塔面板**（安装 Docker 管理器后按下面方式创建容器）均可。只要是能跑 Docker Compose v2 的 Linux，步骤完全一样。

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

同目录建 `.env`（**务必改掉默认密码**）：

```bash
printf 'SESSION_SECRET=%s\nBOOTSTRAP_ADMIN_PASSWORD=改成你的密码\n' "$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" > .env
```

然后一行启动：

```bash
docker compose up -d
```

打开 `http://设备IP:3650`，用 `admin` + 你设的密码登录。

**默认账号密码**：`admin` / `Admin@3650`（首次登录后请在「系统设置 → 人员账号」修改）。若按上面生成了 `.env`，则以 `.env` 里 `BOOTSTRAP_ADMIN_PASSWORD` 为准。

## 自动检查更新

后台侧边栏同一行显示当前版本与「检查更新」；作者推送新镜像后自动弹窗，点「立即更新」会**自动下载镜像、重建容器并刷新页面**，无需用户敲命令。原理与 AIStream 相同：容器在数据卷写更新请求，宿主机 cron 每分钟执行 `docker compose pull && up -d`。**首次安装时在 compose 目录执行一次**：`(crontab -l 2>/dev/null; echo "* * * * * /bin/sh $(pwd)/update-cron.sh") | crontab -`；pull 失败不会动旧容器，数据卷不碰。

---

## 升级（重要：不能直接 up -d）

镜像标签是固定的 `xiaoluya/wuyou-aftersale:1.0.0`，**`docker compose up -d` 不会自动拉新镜像**，本机缓存旧 tag 时会一直用旧版。每次升级必须：

```bash
docker compose pull && docker compose up -d --force-recreate
```

如果之前已经缓存过旧镜像、pull 后仍显示旧界面，强制删本地旧 tag 再拉：

```bash
docker rmi xiaoluya/wuyou-aftersale:1.0.0
docker compose pull && docker compose up -d --force-recreate
```

升级完成后浏览器 **Ctrl+F5 / Ctrl+Shift+R** 清一次静态缓存（首页已带 `?v=` 版本号，正常会自动更新）。不要执行 `docker compose down -v`，不要删 `./data`、`./backups`，数据、账号、激活状态都在卷里，升级不会丢。

验证是否最新：

```bash
docker inspect --format='{{index .RepoDigests 0}}' xiaoluya/wuyou-aftersale:1.0.0
```

浏览器打开后 **Ctrl+F5** 强刷一次；左侧应能看到「💼 报价系统」，`/bj` 是渠道报价前台。

---

## 其他安装方式

| 方式 | 下载 / 说明 |
|---|---|
| 安卓 APP | [Releases 下载 APK](<https://github.com/xiaolurenya/wuyou-aftersale/releases>) |
| 电脑客户端 | [Releases 下载 Windows 安装包 / Linux AppImage](<https://github.com/xiaolurenya/wuyou-aftersale/releases>) |
| 一键脚本 | `./install.sh` |
| Ubuntu / 宝塔 | 同一份 `docker-compose.yml`；宝塔在「Docker → 容器编排」粘贴即可 |

客户端装好后：输入 `IP:端口`（如 `192.168.1.10:3650` 不勾 HTTPS）或域名（勾 HTTPS）+ 账号密码 → 自动连接后台，下次打开免输。
工程源码在本仓库 [`android/`](<android/>) 与 [`desktop/`](<desktop/>)；打 `v*` tag 会自动构建并发布到 Releases。详见 [客户端说明](<docs/CLIENTS.md>)。

[Releases](<https://github.com/xiaolurenya/wuyou-aftersale/releases/tag/v1.0.3>) 现有可直接下载：`WuyouAftersale-1.0.3-Feiniu.fpk`（官方 fnpack 打包）、`WuyouAftersale-1.6.5-Android.apk`、`WuyouAftersale-1.6.5-Windows-Setup.exe`（电脑端仅提供安装版，不再提供绿色版 / AppImage）。

---

## 设备保修查询（给用户用）
打开 `http://设备IP:3650/cx`（或云端域名 `/cx`，原 `/warranty.html` 仍兼容），无需登录，输入设备 **SN / 订单号 / 手机号** 即可查询保修到期日、剩余天数与设备参数；可提交「保修寄送」或「一键上门保修」，并查看处理记录。
商家在后台「⚙ 保修设置」录入设备与参数，在「🛡 安心保」处理用户报修/寄送单；登录页也有用户查询入口。

---

## 授权与价格

一次性买断 **¥199**，后续所有版本更新免费。首次免费试用 15 天，到期弹窗展示作者收款二维码与联系方式，输入激活码后离线激活（断网可用）。

源码私有，公开仓仅提供介绍与编译后的交付镜像，不含任何源代码。

---

## 渠道报价系统（给用户看价）

打开 `http://设备IP:3650/bj`（云端 `https://xlry.cc.cd/bj`）：匿名只显示商品与**零售价**；渠道账号由管理员在后台「💼 报价系统」开通（不能自助注册），登录后按等级显示**普通渠道价 / 核心渠道价**。商品支持本地上传图片或网络图片链接，点卡片看完整详情。

---

## 数据迁移 / 整机备份

旧版本升级、清空重建前，请在「数据导出 → 整机数据备份 JSON」下载备份（含售后单、字典、用户、设置、安心保设备与报修单、报价商品与渠道账号）。重建后在「数据导出 → 整机数据恢复」选择该 JSON 一键恢复。**Excel / CSV 与表格导入只处理售后登记，不能恢复整机数据。**

---

## 当前交付镜像

`xiaoluya/wuyou-aftersale:1.0.0` 与 `:latest` 指向同一份最新镜像，当前版本与 digest 以公开仓 `version.json` 为准（每次镜像推送自动发布）。飞牛用户也可在 Releases 下载 `WuyouAftersale-1.0.3-Feiniu.fpk`（官方 fnpack 打包），在应用中心「手动安装」导入。

---

单据「进度时间线」已补「品牌」显示（与前台登记一致）；其他：[安装细节](<docs/INSTALL.md>) · [常见问题](<docs/FAQ.md>) · [价格说明](<docs/PRICING.md>) · [交付镜像说明](<docs/DEPLOY-PUBLIC.md>) · [更新日志](<docs/CHANGELOG.md>)
