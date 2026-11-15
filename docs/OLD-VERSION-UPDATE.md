# 旧版本手动升级说明

旧版本的一键更新依赖两个组成部分：容器内写入更新请求，以及宿主机定时任务执行镜像拉取与容器重建。缺少宿主机定时任务时，后台按钮会停留在等待状态。

## 推荐升级命令

在 compose 目录执行：

```bash
docker rmi xiaoluya/wuyou-aftersale:1.0.0 2>/dev/null || true
docker compose pull
docker compose up -d --force-recreate
```

完成后浏览器执行 `Ctrl+F5` 强制刷新。数据目录 `./data` 保持不变。

## 宿主机定时任务

如需保留旧版一键更新流程，可将 `update-cron.sh` 与 `install-host-cron.sh` 放置到 compose 目录，并通过 `install-host-cron.sh` 安装定时任务。脚本负责更新前备份、拉取镜像、重建容器、校验数据与回写结果。

## 新版 compose

当前 compose 默认挂载 `/var/run/docker.sock`；容器可通过 Docker API 拉取镜像并重建自身。禁用该挂载时，应采用宿主机定时任务或手动升级命令。

## 裸机与托管实例

裸机 / 托管实例由服务器管理员统一执行源码替换、依赖安装与服务重启；后台一键更新按钮不适用于该模式。
