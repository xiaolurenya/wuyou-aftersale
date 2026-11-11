# 无忧售后助手

一款直接装在你自己设备上的售后登记管理软件。数据自己掌握，一次买断，后续更新免费。

![版本](https://img.shields.io/badge/version-v1.0.0-blue)
![许可](https://img.shields.io/badge/license-Proprietary-orange)
![端口](https://img.shields.io/badge/port-3650-green)
![平台](https://img.shields.io/badge/platform-Feiniu%20%2F%20Synology%20%2F%20UGREEN-lightgrey)

---

## 亮点

- **登记快**：日期自动填当天，型号 / 上家 / 送修单位可下拉可手输、自动建档；序列号支持一单多台、批量粘贴、扫码枪直连
- **找得到**：任意检索一个框匹配上家、型号、单位、联系人、序列号、快递单号；几十万条数据走索引，不卡顿、不漏单
- **返修省心**：扫码定位原单 → 一键批量填返回日期、状态、快递单号；换新只记新序列号，旧序列号永久保留
- **客户档案**：同一个单位/个人全年送修的所有设备，点一次全查出来
- **打印明细**：按上家汇总未返回机器，A4 版式可调，附返回地址与快递公司（单号自动识别）
- **权限清晰**：超级管理员 / 管理员 / 登记员 / 只读，13 个权限点逐项可配
- **授权简单**：15 天试用 → 到期弹作者微信收款码与联系方式 → 粘贴激活码离线激活 → 永久使用，换版本不再收费
- **数据稳**：每日备份 + 整机迁移包（NAS 坏了换台设备即可恢复，激活码不失效）；云端版数据托管在 Supabase
- **多端可用**：浏览器 / 安卓 APP / 电脑客户端，输 IP:端口 或域名 + 账号密码自动连接

---

## 安装（Docker Compose）

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
      TRIAL_DAYS: "15"
      TRIAL_BYPASS: "0"
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

> 飞牛用户也可以直接装套件包：[下载 .fpk](<downloads/无忧售后助手-1.0.0-x86_64.fpk>)，在「套件中心 → 手动安装」导入。
> 升级：`docker compose pull && docker compose up -d`，数据卷不动、激活码不失效。

---

## 其他安装方式

| 方式 | 说明 |
|---|---|
| 飞牛 fpk | [downloads/无忧售后助手-1.0.0-x86_64.fpk](<downloads/无忧售后助手-1.0.0-x86_64.fpk>) |
| 云端版（免安装） | 浏览器直接打开，手机电脑自适应 |
| 安卓 APP / 电脑客户端 | 输 `IP:端口` 或域名 + 账号密码自动连接；工程见 [客户端说明](<docs/CLIENTS.md>) |
| 一键脚本 | `./install.sh` |

---

## 授权与价格

一次性买断 **¥199**，后续所有版本更新免费。首次免费试用 15 天，到期弹窗展示作者收款二维码与联系方式，输入激活码后离线激活（断网可用）。

源码私有，公开仓仅提供介绍与编译后的交付镜像，不含任何源代码。

---

更多：[安装细节](<docs/INSTALL.md>) · [常见问题](<docs/FAQ.md>) · [价格说明](<docs/PRICING.md>) · [交付镜像说明](<docs/DEPLOY-PUBLIC.md>) · [更新日志](<docs/CHANGELOG.md>)
