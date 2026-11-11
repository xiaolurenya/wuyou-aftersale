# 交付镜像说明（公开仓库）

本仓库**不含任何源代码**，只提供：

- 项目介绍与文档
- `docker-compose.yml`：引用 `xiaoluya/wuyou-aftersale:1.0.0` 编译后的镜像
- `install.sh`：一键拉取镜像并启动
- `.env.example`：配置模板

## 用户怎么装
```bash
git clone https://github.com/OWNER/aftersale-intro.git
cd aftersale-intro
cp .env.example .env     # 改默认密码
chmod +x install.sh && ./install.sh
```
或直接在飞牛 / 群晖 / 绿联的 Container Manager 里用 `docker-compose.yml` 创建项目。

## 源码在哪
**核心源码、激活码签名库、发码后台全部在私有仓库 `aftersale-app`**，不对外公开。
镜像由私有仓的 CI 构建后推送到 GHCR；用户拿到的是编译产物，不含 `.js` 源码、不含私钥、不含测试激活码。

## 授权
- 首次免费试用 15 天，到期弹窗展示作者微信收款码与联系方式
- 一次性买断 ¥199，输入激活码后永久使用
- 后续所有版本更新免费，数据卷不动、激活码不失效

## 安全边界（如实说明）
离线激活需要把**验签公钥**随镜像分发，因此公钥必然可被取得（公钥本来就可公开，无法反推私钥）。
真正的安全来自：Ed25519 私钥只存私有仓/发码后台、镜像不含源码与调试映射、发码与吊销全在作者侧。
任何客户端离线授权方案都无法阻止攻击者修改自己机器上的副本跳过校验，这是行业固有边界，不是本仓库分层的缺陷。
