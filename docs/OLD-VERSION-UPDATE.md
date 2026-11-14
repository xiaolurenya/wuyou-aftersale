# 旧版本（如 v1.6.8）一键更新点不动

## 结论

一键更新成功需要两端配合：

1. 容器里：`POST /api/app/update` 写 `DATA_DIR/.wuyou-update-request`
2. 宿主机：**每分钟 crontab 运行 `update-cron.sh`**，看到请求后 `docker pull + docker compose up -d --force-recreate`，并回写 `.wuyou-update-result`

如果宿主机没有安装这个 cron，容器只写请求文件，结果文件永远不出现，前端就会一直显示「等待宿主机更新任务…」。本机昨晚成功，是因为本机 crontab 和脚本都在；客户机器上没有这一步就会卡住。

## 旧版本最快的恢复办法（不用点弹窗）

在 compose 目录执行：

```bash
docker rmi xiaoluya/wuyou-aftersale:1.0.0 2>/dev/null || true
docker compose pull
docker compose up -d --force-recreate
```

然后 Ctrl+F5。数据卷 `./data` 不动，账号和登记不会丢。

## 让以后「点按钮」也能自动更新

把公开仓的 `update-cron.sh` 放到 compose 目录，装一次 cron：

```bash
cd /你的/compose目录
chmod +x ./update-cron.sh
( crontab -l 2>/dev/null | grep -v 'update-cron.sh' ; echo "* * * * * /bin/sh $(pwd)/update-cron.sh" ) | crontab -
```

如果 compose 目录和数据目录不在默认位置：

```bash
( crontab -l 2>/dev/null | grep -v 'update-cron.sh' ; echo "* * * * * WUYOU_COMPOSE_DIR=$(pwd) WUYOU_DATA=$(pwd)/data /bin/sh $(pwd)/update-cron.sh" ) | crontab -
```

再回到后台点「立即更新」。脚本会：
- 更新前自动备份 `aftersale.db`
- 拉镜像、重建容器
- 更新后校验 users / records / license_state；异常自动回滚
- 回写结果，前端自动刷新

## 为什么本地 NAS 成功、客户不成功

本地 NAS 上我配置过 crontab、修过 `update-cron.sh`、加过 requestId/结果文件；这些都在**宿主机**，不会随 Docker 镜像自动发给客户。客户只拉了镜像，没有装 cron，所以按钮看起来「没反应」。

## 托管/裸机版注意

不用 Docker 的托管版不要开这个按钮，应由服务器管理员统一：

```bash
cd /opt/wuyou/app
# 覆盖新源码
npm ci
sudo systemctl restart wuyou
```

```

## 镜像内置脚本

新镜像里已带 `/app/update-cron.sh` 和 `/app/install-host-cron.sh`。首次安装可在宿主机执行：

```bash
docker cp aftersale:/app/update-cron.sh ./update-cron.sh
docker cp aftersale:/app/install-host-cron.sh ./install-host-cron.sh
sudo sh ./install-host-cron.sh
```

容器不能替宿主机自动写 crontab；这一步只需跑一次。
