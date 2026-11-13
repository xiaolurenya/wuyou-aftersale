#!/bin/sh
# 无忧商服通 一键更新握手任务（宿主机侧，crontab 每分钟调起）
# 容器写 DATA/.wuyou-update-request → 本脚本 pull + up -d → 回写 .wuyou-update-result
# 安全：pull 失败绝不动容器；数据卷全程不碰；不加 down -v
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB="${WUYOU_COMPOSE_DIR:-$SCRIPT_DIR}"
DATA="${WUYOU_DATA:-$WEB/data}"
REQ="$DATA/.wuyou-update-request"
RES="$DATA/.wuyou-update-result"
LOG=/tmp/wuyou-update.log
[ -f "$REQ" ] || exit 0
[ -f "$RES.lock" ] && exit 0
touch "$RES.lock" 2>/dev/null || exit 0
trap 'rm -f "$RES.lock"' EXIT INT TERM
echo "{\"ok\":null,\"startedAt\":\"$(date +%s)\",\"msg\":\"正在下载新镜像…\"}" > "$RES"
echo "==== $(date '+%F %T') 收到更新请求 ====" >> "$LOG"
cd "$WEB" 2>/dev/null || {
  echo "{\"ok\":false,\"finishedAt\":\"$(date +%s)\",\"msg\":\"compose 目录 $WEB 不存在，容器未动\"}" > "$RES"
  rm -f "$REQ"; exit 1
}
PULL="docker pull xiaoluya/wuyou-aftersale:1.0.0"
command -v timeout >/dev/null 2>&1 && PULL="timeout 240 docker pull xiaoluya/wuyou-aftersale:1.0.0"
if $PULL >> "$LOG" 2>&1 && docker compose up -d --force-recreate >> "$LOG" 2>&1; then
  NEWV=$(docker compose exec -T aftersale cat /app/VERSION 2>/dev/null | tr -d ' \r\n')
  echo "{\"ok\":true,\"finishedAt\":\"$(date +%s)\",\"to\":\"$NEWV\",\"msg\":\"更新完成，当前 v$NEWV\"}" > "$RES"
  echo "==== $(date '+%F %T') 更新完成 v$NEWV ====" >> "$LOG"
else
  echo "{\"ok\":false,\"finishedAt\":\"$(date +%s)\",\"msg\":\"pull/up 失败或超时，旧容器未受影响；详见 $LOG\"}" > "$RES"
  echo "==== $(date '+%F %T') 更新失败，容器未动 ====" >> "$LOG"
fi
rm -f "$REQ"
