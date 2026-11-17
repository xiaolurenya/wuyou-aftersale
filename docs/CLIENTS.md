# 客户端与安装包

## 飞牛 FPK（v1.6.39）

飞牛 NAS 可通过 Docker Compose 安装，或在 Releases 下载 `WuyouAftersale-1.6.39-Feiniu.fpk` 手动安装。安装包包含 compose、图标与安装脚本，并自动拉取交付镜像。

## 安卓客户端

完整 Android 工程位于 [android/](../android/)。首屏输入服务地址与账号密码，调用 `/api/auth/login` 后打开后台网页；连接配置保存在本地。

构建方式：Android Studio 打开工程后生成签名 APK，或由 CI 自动构建。

## 桌面客户端

完整 Electron 工程位于 [desktop/](../desktop/)。登录逻辑与安卓客户端一致，支持通过 `npm install && npm start` 本地运行，并通过 `npm run build:win` 生成 Windows 安装包。

正式交付以 [Releases](https://github.com/xiaolurenya/wuyou-aftersale/releases) 中的 APK / EXE / FPK 为准。


> v1.6.39 飞牛包固定使用最新 Docker Hub digest，公开包不提供 `/yt`，售后新流程闭环与云端/Docker 一致。
