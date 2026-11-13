# 客户端与安装包

## 飞牛 fpk（推荐 NAS 用户）
飞牛 NAS 可用 Docker Compose 安装（见 README），或在 Releases 下载 `WuyouAftersale-1.0.3-Feiniu.fpk` 手动安装。
包内已含 compose、图标与安装脚本，自动拉取 Docker Hub 的交付镜像。

## 安卓 APP
完整 Android 工程在本仓库 [`android/`](<../android/>)：首屏输 `IP:端口` 或域名 + 账号密码 → 自动登录后台，配置本地记住。
用 Android Studio 打开 → Build → Generate Signed APK；或由 CI 自动产出。

## 电脑客户端
完整 Electron 工程在本仓库 [`desktop/`](<../desktop/>)：同样的登录连接逻辑，
`npm install && npm start` 运行，`npm run build:win` 出 Windows 安装包（CI 在 windows-latest 自动构建）。

> 用户直接去 [Releases](<https://github.com/xiaolurenya/wuyou-aftersale/releases>) 下载 APK / EXE / AppImage；打 `v*` tag 会自动构建上传。
