# 故障排除指南索引

本目录包含 QuantFu 期货量化管理平台的详细故障排除文档。

---

## 🚀 30秒快速诊断

**遇到问题?按顺序执行以下命令:**

```bash
# 第1步: 检查服务状态 (所有服务应该是 Up 状态)
docker-compose ps

# 第2步: 快速健康检查 (应该返回 {"status":"healthy"})
curl -s localhost:8888/health | jq

# 第3步: 检查最近错误日志
docker-compose logs --tail=20 | grep -E "(ERROR|Exception|failed)"
```

**根据结果选择下一步:**
- 服务未启动 → [启动问题排查](#1-后端服务-faq)
- 健康检查失败 → [后端服务 FAQ](BACKEND_FAQ.md)
- 日志有错误 → 根据错误类型查看对应 FAQ

---

## 📋 问题诊断检查清单

### 基础检查 (必做)

- [ ] **服务运行**: `docker-compose ps` 显示所有服务 `Up`
- [ ] **健康检查**: `curl localhost:8888/health` 返回 `healthy`
- [ ] **数据库连接**: `docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1"` 返回 `1`
- [ ] **环境变量**: `.env` 文件存在且包含 `SUPABASE_KEY`、`DATABASE_URL`

### 按问题类型的检查清单

<details>
<summary><strong>🔌 连接问题检查清单</strong></summary>

- [ ] Docker 容器都在运行
- [ ] 端口未被占用 (5432, 8888, 3000, 3001)
- [ ] 网络可达 (可以 ping localhost)
- [ ] 环境变量配置正确
- [ ] 数据库已初始化
- [ ] JWT 密钥配置正确
</details>

<details>
<summary><strong>📊 数据问题检查清单</strong></summary>

- [ ] accounts 表有对应的账户记录
- [ ] contracts 表有合约映射
- [ ] trades 表有最近的成交记录
- [ ] positions 表数据与 trades 计算一致
- [ ] position_snapshots 对账状态正常
</details>

<details>
<summary><strong>💹 行情问题检查清单</strong></summary>

- [ ] TQSDK_ACCOUNT 和 TQSDK_PASSWORD 环境变量已设置
- [ ] 天勤账号密码正确
- [ ] 当前是交易时段 (日盘/夜盘)
- [ ] 合约代码格式正确 (CZCE.TA2505 格式)
- [ ] 合约未到期
</details>

<details>
<summary><strong>⚙️ 功能问题检查清单</strong></summary>

**锁仓功能:**
- [ ] lock_configs 表有启用的配置
- [ ] 配置的 is_enabled = true
- [ ] 触发阈值设置合理
- [ ] 持仓方向与配置匹配

**换月功能:**
- [ ] rollover_configs 表有启用的配置
- [ ] 配置的 is_enabled = true
- [ ] 品种有持仓
- [ ] 监控服务正在运行

**通知服务:**
- [ ] NTFY_URL 环境变量已设置
- [ ] ntfy 服务器可达
- [ ] 手机客户端已订阅正确的 topic
</details>

---

## 🔀 诊断决策树

```
症状是什么?
│
├─► 服务无法启动
│   ├─► 看到 ValidationError → 环境变量缺失 → 检查 .env 文件
│   ├─► 数据库连接失败 → PostgreSQL 未启动 → docker-compose up postgres
│   └─► 端口占用 → lsof -i :PORT → 关闭占用进程或换端口
│
├─► 页面加载但数据为空
│   ├─► 所有页面都空 → 数据库无数据 → 运行 seed SQL
│   ├─► 只有某页面空 → 对应表无数据 → 检查该表
│   └─► 刷新后有数据 → 可能是缓存问题 → 清除浏览器缓存
│
├─► 实时数据不更新
│   ├─► 所有实时数据 → WebSocket 连接问题 → 查看 [WebSocket FAQ](WEBSOCKET_FAQ.md)
│   ├─► 只有行情 → 天勤服务问题 → 查看 [天勤行情 FAQ](TQSDK_FAQ.md)
│   └─► 只有持仓 → 极星推送问题 → 查看 [极星数据推送 FAQ](POLAR_DATA_PUSH_FAQ.md)
│
├─► API 调用报错
│   ├─► 500 错误 → 服务器内部错误 → 查看后端日志
│   ├─► 404 错误 → 资源不存在 → 检查账户/合约是否存在
│   ├─► 422 错误 → 参数格式错误 → 检查请求参数
│   └─► 超时/无响应 → 服务可能卡住 → 重启后端服务
│
└─► 业务功能异常
    ├─► 锁仓不触发 → 查看 [锁仓触发 FAQ](LOCK_TRIGGER_FAQ.md)
    ├─► 换月不提醒 → 查看 [换月任务 FAQ](ROLLOVER_FAQ.md)
    └─► 通知收不到 → 查看 [通知服务 FAQ](NOTIFICATION_FAQ.md)
```

---

## 🎯 快速定位问题

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

## 📚 文档列表

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
