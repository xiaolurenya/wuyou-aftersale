# 客户端与安装包

## NAS 安装（推荐）
- **飞牛 fpk**：`无忧售后助手-1.0.0-x86_64.fpk`，在飞牛「套件中心 → 手动安装」导入
- 或用本仓库 `docker-compose.yml` / `install.sh`，一行命令拉镜像

## 安卓 APP
安卓工程在私有仓 `android/`，用 Android Studio 打开 → Build → Generate Signed APK。
首屏输入 `IP:端口` 或 `域名` + 账号密码 → 自动连接后台。
也可由 CI（`.github/workflows/build-clients.yml`）在 `ubuntu-latest` 自动产出 APK。

## 电脑客户端
Electron 工程在私有仓 `desktop/`：
```bash
npm install && npm start          # 本机运行
npm run build:win                # Windows 安装包（需 Windows）
```
CI 在 `windows-latest` 自动产出 `.exe`；Linux 可出 AppImage/deb。

## 云端版（免安装）
直接打开 `https://xlry.cc.cd`，用浏览器即可，手机/电脑自适应。

## 登录方式
所有客户端统一：填**服务器地址**（局域网 `192.168.x.x:3650` 或域名 `xlry.cc.cd`）+ 账号密码 → 自动登录。
配置会被记住，下次打开直接进主界面。
