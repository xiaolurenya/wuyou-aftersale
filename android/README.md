# 无忧售后助手 · 安卓客户端

原生 WebView 壳：首屏输入「IP:端口」或「域名」+ 账号密码 → 自动调用 `/api/auth/login` → 成功后打开服务器网页（会话 Cookie 自动带上）。

## 构建 APK
用 **Android Studio** 打开本目录（Gradle 8.5 / AGP 8.5.2 / JDK 17+）：
```
Build → Generate Signed Bundle / APK → APK
```
或命令行（需本机装 Android SDK）：
```bash
./gradlew assembleRelease
# 产物：app/build/outputs/apk/release/app-release.apk
```

## 使用
- 局域网：`192.168.x.x:3650`，不勾 HTTPS
- 云端：`xlry.cc.cd`，勾「使用 HTTPS」
- 勾选信息会被记住，下次打开自动进入

> 本工程不包含 Android SDK，无法在纯 Node 环境直接产出 .apk；需在 Android Studio 或 CI(ubuntu-latest + android-actions/setup-android) 构建。
