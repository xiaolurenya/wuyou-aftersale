# 无忧商服通 · 桌面客户端

Electron 壳。首屏输入「IP:端口」或域名，并填写账号密码；登录成功后自动打开服务网页并保留会话 Cookie。

## 本地运行

```bash
npm install && npm start
```

## 打包

```bash
npm run build:win
npm run build
```

`build:win` 生成 Windows NSIS 安装包；`build` 生成 Windows / macOS / Linux 产物。Windows 安装包建议在 Windows 环境或 GitHub Actions 中构建，产物输出至 `dist/`。
