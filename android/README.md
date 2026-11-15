# 无忧商服通 · 安卓客户端

原生 WebView 壳。首屏输入「IP:端口」或域名，并填写账号密码；登录成功后自动打开服务网页并保留会话 Cookie。

## 构建 APK

使用 Android Studio 打开本目录（Gradle 8.5 / AGP 8.5.2 / JDK 17 及以上）：

```text
Build → Generate Signed Bundle / APK → APK
```

命令行构建（需 Android SDK）：

```bash
./gradlew assembleRelease
# 产物：app/build/outputs/apk/release/app-release.apk
```

## 连接配置

- 局域网：`192.168.x.x:3650`，关闭 HTTPS。
- 云端：`xlry.cc.cd`，启用 HTTPS。
- 连接配置保存在本地，下次启动自动进入。

本工程不包含 Android SDK；APK 需在 Android Studio 或 CI 环境构建。
