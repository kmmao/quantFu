# 故障排除指南索引

本目录包含 QuantFu 期货量化管理平台的详细故障排除文档。

## 快速定位问题

| 问题类型 | 参考文档 |
|----------|----------|
| 前端实时数据不更新 | [WebSocket FAQ](WEBSOCKET_FAQ.md) |
| 后端服务无法启动 | [后端服务 FAQ](BACKEND_FAQ.md) |
| 行情数据异常 | [天勤行情 FAQ](TQSDK_FAQ.md) |
| 极星策略推送失败 | [极星数据推送 FAQ](POLAR_DATA_PUSH_FAQ.md) |
| 锁仓功能异常 | [锁仓触发 FAQ](LOCK_TRIGGER_FAQ.md) |
| 换月功能异常 | [换月任务 FAQ](ROLLOVER_FAQ.md) |
| 通知未收到 | [通知服务 FAQ](NOTIFICATION_FAQ.md) |

---

## 文档列表

### 1. [WebSocket FAQ](WEBSOCKET_FAQ.md)
**适用场景**: 前端页面实时数据不更新、连接频繁断开

涵盖问题:
- WebSocket 连接断开
- 连接超时
- 重连失败
- 订阅数据不更新
- JWT 签名错误
- 内存泄漏

---

### 2. [天勤行情 FAQ](TQSDK_FAQ.md)
**适用场景**: 行情价格不更新、显示 NaN 或 0

涵盖问题:
- 天勤连接失败
- 账号未配置/配置错误
- 行情数据不更新
- 合约订阅失败
- 价格显示 NaN 或 0
- 行情服务崩溃
- 连接超时
- 行情数据延迟

---

### 3. [后端服务 FAQ](BACKEND_FAQ.md)
**适用场景**: 后端服务启动失败、API 返回错误

涵盖问题:
- 服务启动失败 (环境变量)
- 服务启动失败 (数据库连接)
- API 返回 500 错误
- API 返回 404 错误
- API 返回 422 参数验证失败
- API 响应缓慢或超时
- 健康检查接口异常

---

### 4. [锁仓触发 FAQ](LOCK_TRIGGER_FAQ.md)
**适用场景**: 锁仓条件满足但未触发、锁仓执行失败

涵盖问题:
- 锁仓自动执行失败
- 触发条件不满足
- 移动止损不触发
- 持仓不足错误
- 触发服务停止
- 通知未收到

---

### 5. [换月任务 FAQ](ROLLOVER_FAQ.md)
**适用场景**: 换月任务卡住、换月提醒未触发

涵盖问题:
- 换月任务执行失败
- 换月任务卡住
- 换月提醒未触发
- 行情数据不足错误
- 重复换月任务
- 换月监控服务停止
- 换月通知未收到

---

### 6. [极星数据推送 FAQ](POLAR_DATA_PUSH_FAQ.md)
**适用场景**: 极星策略成交数据推送失败、持仓对账不一致

涵盖问题:
- 成交数据推送失败 (404/500/422)
- 持仓对账不一致
- 极星策略无法连接后端
- 数据推送成功但前端不显示
- 持仓重建失败

---

### 7. [通知服务 FAQ](NOTIFICATION_FAQ.md)
**适用场景**: 通知发送失败、手机未收到通知

涵盖问题:
- 通知发送失败 (服务器无响应)
- 通知发送失败 (认证错误)
- 通知发送失败 (网络超时)
- 通知发送成功但手机未收到
- 通知内容显示乱码
- 通知发送导致服务卡顿

---

## 通用诊断命令

```bash
# 查看所有服务状态
docker-compose ps

# 查看所有服务日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs [service-name] --tail=50

# 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1"

# 检查环境变量
cat .env | grep [KEY]

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart [service-name]
```

---

## 获取更多帮助

1. 查看 [项目 README](../../README.md) 了解系统架构
2. 检查 [GitHub Issues](https://github.com/allen/quantFu/issues)
3. 提交新 Issue 时请附上:
   - 问题描述
   - 错误日志
   - 复现步骤
   - 环境信息 (Docker 版本、操作系统等)
