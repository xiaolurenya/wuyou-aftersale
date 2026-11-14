#!/bin/sh
# 在宿主机安装无忧一键更新 cron
# 用法：在 compose 目录执行： sudo sh ./install-host-cron.sh
# 也可由镜像里复制出来： docker cp aftersale:/app/install-host-cron.sh ./install-host-cron.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/update-cron.sh"
[ -f "$SCRIPT" ] || { echo "缺少 update-cron.sh：请把公开仓/镜像里的 update-cron.sh 放到 $HERE"; exit 1; }
chmod +x "$SCRIPT"
LINE="* * * * * WUYOU_COMPOSE_DIR=$HERE WUYOU_DATA=$HERE/data /bin/sh $SCRIPT"
( crontab -l 2>/dev/null | grep -v 'update-cron.sh' ; echo "$LINE" ) | crontab -
echo "已安装宿主机 cron："
crontab -l 2>/dev/null | grep 'update-cron.sh'
echo "以后后台点「立即更新」即可自动拉镜像并重建；数据卷不会删除。"
echo "注意：容器本身不能替宿主机装 cron，这一步必须在宿主机跑一次。"
