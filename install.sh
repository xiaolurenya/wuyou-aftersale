#!/usr/bin/env bash
# 售后管理系统 · 一键安装（只拉镜像，不含源码）
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
command -v docker >/dev/null || { echo "请先安装 Docker / Container Manager"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "需要 Docker Compose v2"; exit 1; }
mkdir -p data backups
if [ ! -f .env ]; then
  SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  printf 'SESSION_SECRET=%s\nBOOTSTRAP_ADMIN_PASSWORD=Admin@3650\nTRIAL_BYPASS=0\n' "$SECRET" > .env
  echo "已生成 .env（请修改默认管理员密码）"
fi
echo "端口 3650 检查："; (ss -ltnp 2>/dev/null | grep -q ':3650 ' && echo '  警告：3650 已占用') || echo '  空闲'
docker compose pull && docker compose up -d
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo '设备IP')
echo ""
echo "============ 安装完成 ============"
echo "本机：  http://127.0.0.1:3650"
echo "局域网：http://$IP:3650"
echo "账号：  admin / 你在 .env 里设的密码"
echo "数据：  $HERE/data   （请定期备份）"
echo "升级：  docker compose pull && docker compose up -d"
echo "================================="
