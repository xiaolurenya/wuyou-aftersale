# 交付镜像说明

公开仓库不包含核心源代码，仅提供：

- 项目介绍与文档
- `docker-compose.yml`：引用 `xiaoluya/wuyou-aftersale:1.0.0` 编译镜像
- `install.sh`：一键拉取镜像并启动
- `.env.example`：环境变量模板

## 快速安装

```bash
git clone https://github.com/xiaolurenya/wuyou-aftersale.git
cd wuyou-aftersale
cp .env.example .env
docker compose up -d
```

生产环境需修改 `.env` 中的默认管理员密码。飞牛 / 群晖 / 绿联的 Container Manager 可直接导入 `docker-compose.yml` 创建项目。

## 源码边界

核心源码、激活码签名库与发码后台位于私有仓库。公开镜像只包含运行所需产物，不包含 `.js` 源码、私钥或测试激活码。

## 授权

- 首次安装提供 15 天试用，到期后展示购买方式与联系方式。
- 一次性买断 ¥299，输入激活码后永久使用。
- 后续所有版本更新免费，数据目录保持不变。

## 安全边界

离线激活所需验签公钥随镜像分发；公钥可公开且无法反推私钥。授权安全性依赖 Ed25519 私钥隔离、发码后台访问控制与吊销列表机制。任何离线客户端授权方案均无法阻止对本机副本的逆向修改，该限制属于离线授权的固有边界。
