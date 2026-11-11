# 无忧售后助手 · 桌面客户端

Electron 壳：输入「IP:端口」或「域名」+ 账号密码 → 调用 `/api/auth/login` → 成功后自动打开服务器网页（会话 Cookie 保留）。

## 运行
```bash
npm install && npm start
```

## 打包
```bash
npm run build:win   # Windows NSIS 安装 exe + 便携版（需 Windows 或 CI）
npm run build       # win + mac + linux
```
产物在 `dist/`。Linux 下可直接出 AppImage/deb；**exe 需 Windows 环境**，已配 GitHub Actions `.github/workflows/build-desktop.yml` 在 windows-latest 构建。

> 本机能写全工程与 CI，但没有 Wine/MSVC，不会假装直接产出 .exe。
