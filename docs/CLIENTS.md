# 客户端与安装包

## 飞牛 fpk（推荐 NAS 用户）
[下载 无忧售后助手-1.0.0-x86_64.fpk](<../downloads/无忧售后助手-1.0.0-x86_64.fpk>) → 飞牛「套件中心 → 手动安装」导入。
包内已含 compose、图标与安装脚本，自动拉取 Docker Hub 的交付镜像。

## 安卓 APP
完整 Android 工程在私有源码仓 `android/`：首屏输 `IP:端口` 或域名 + 账号密码 → 自动登录后台，配置本地记住。
用 Android Studio 打开 → Build → Generate Signed APK；或由 CI 自动产出。

## 电脑客户端
完整 Electron 工程在私有源码仓 `desktop/`：同样的登录连接逻辑，
`npm install && npm start` 运行，`npm run build:win` 出 Windows 安装包（CI 在 windows-latest 自动构建）。

## 云端版
浏览器直接打开已部署域名即可，无需安装，手机 / 电脑自适应。

> 三个客户端的**工程源码**属于私有仓；公开仓提供可直接安装的 fpk 成品与交付镜像。
