# ntfy 通知服务问题排查指南

本文档提供 ntfy 通知发送失败相关问题的诊断步骤和解决方案，涵盖配置错误、网络问题和服务端问题。

---

## 目录

1. [通知发送失败 - 服务器无响应](#1-通知发送失败---服务器无响应)
2. [通知发送失败 - 认证错误](#2-通知发送失败---认证错误)
3. [通知发送失败 - 网络超时](#3-通知发送失败---网络超时)
4. [通知发送成功但手机未收到](#4-通知发送成功但手机未收到)
5. [通知内容显示乱码](#5-通知内容显示乱码)
6. [通知发送导致服务卡顿](#6-通知发送导致服务卡顿)
7. [快速诊断流程](#7-快速诊断流程)

---

## 1. 通知发送失败 - 服务器无响应

### 症状

- 后端日志显示 `[通知] 发送异常: Connection refused`
- 通知发送返回 `False`
- 锁仓/换月触发通知未收到
- 日志显示 `ConnectionError` 或 `MaxRetryError`

### 可能原因

| 原因 | 说明 |
|------|------|
| ntfy 服务器不可达 | 自建服务器宕机或公共服务不可用 |
| NTFY_URL 配置错误 | URL 格式错误或指向无效地址 |
| DNS 解析失败 | 无法解析 ntfy 服务器域名 |
| 防火墙/安全组阻止 | 出站请求被阻止 |

### 排查步骤

```bash
# 1. 检查当前配置的 NTFY_URL
cat backend/.env | grep NTFY_URL

# 2. 在后端容器内测试 ntfy 服务连通性
docker-compose exec backend curl -v https://ntfy.zmddg.com/test

# 3. 测试 DNS 解析
docker-compose exec backend nslookup ntfy.zmddg.com

# 4. 测试直接发送通知
docker-compose exec backend curl -X POST \
  "https://ntfy.zmddg.com/test" \
  -H "Title: 测试通知" \
  -d "测试消息内容"

# 5. 查看后端日志中的通知错误
docker-compose logs backend | grep -E "\[通知\]"
```

### 解决方案

**方案1: 检查并修正 NTFY_URL 配置**

```env
# backend/.env
# 使用自建 ntfy 服务器
NTFY_URL=https://ntfy.zmddg.com/your-topic

# 或使用官方公共服务
NTFY_URL=https://ntfy.sh/your-unique-topic
```

**方案2: 使用公共 ntfy 服务**

如果自建服务器不可用，可以临时切换到官方服务：

```env
# 切换到官方 ntfy.sh
NTFY_URL=https://ntfy.sh/quantfu-alerts-YOUR-RANDOM-STRING
```

> **注意**: 公共服务的 topic 名称任何人都可以订阅，建议使用随机字符串保护隐私。

**方案3: 检查网络出站规则**

```bash
# 检查容器网络配置
docker network inspect quantfu_default

# 测试从容器访问外网
docker-compose exec backend curl -I https://example.com

# 如果无法访问外网，检查 Docker 网络配置
docker network ls
```

**方案4: 检查自建 ntfy 服务器状态**

```bash
# 如果使用自建服务器，检查服务状态
ssh your-server "systemctl status ntfy"
ssh your-server "docker ps | grep ntfy"

# 检查 ntfy 服务器日志
ssh your-server "journalctl -u ntfy --tail=50"
```

### 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Connection refused` | 服务器未运行或端口错误 | 检查服务器状态和端口 |
| `Name or service not known` | DNS 解析失败 | 检查域名或使用 IP |
| `Connection reset by peer` | 连接被服务器重置 | 检查服务器配置和限流 |
| `SSL: CERTIFICATE_VERIFY_FAILED` | SSL 证书问题 | 更新证书或临时使用 HTTP |

---

## 2. 通知发送失败 - 认证错误

### 症状

- 后端日志显示 `[通知] 发送失败: 401` 或 `403`
- 通知返回 HTTP 401 Unauthorized
- 通知返回 HTTP 403 Forbidden

### 可能原因

| 原因 | 说明 |
|------|------|
| ntfy 服务器启用了认证 | 需要提供用户名密码或 token |
| Topic 被保护 | 该 topic 仅限授权用户发布 |
| Token 过期或无效 | 使用的认证 token 已失效 |

### 排查步骤

```bash
# 1. 测试无认证发送
curl -X POST https://ntfy.zmddg.com/test -d "test"

# 2. 如果返回 401/403，服务器需要认证
# 查看响应头获取认证要求
curl -v -X POST https://ntfy.zmddg.com/test -d "test" 2>&1 | grep -E "(401|403|WWW-Authenticate)"

# 3. 测试带认证发送
curl -X POST https://ntfy.zmddg.com/test \
  -u "username:password" \
  -d "test"

# 或使用 token
curl -X POST https://ntfy.zmddg.com/test \
  -H "Authorization: Bearer your-token" \
  -d "test"
```

### 解决方案

**方案1: 配置认证信息（当前版本不支持）**

当前 `notification.py` 不支持认证，如果 ntfy 服务器需要认证，需要：

1. 关闭服务器端认证（不推荐）
2. 为特定 topic 禁用认证
3. 修改代码添加认证支持（需要开发）

**方案2: 在 ntfy 服务器配置无认证 topic**

```yaml
# ntfy 服务器 server.yml
auth-default-access: deny-all
auth-file: /etc/ntfy/user.db

# 为特定 topic 允许匿名写入
allow-anonymous-topics:
  - quantfu-alerts
```

**方案3: 切换到不需要认证的 topic**

```env
# backend/.env
# 使用官方公共服务（无需认证）
NTFY_URL=https://ntfy.sh/quantfu-alerts-YOUR-RANDOM-STRING
```

---

## 3. 通知发送失败 - 网络超时

### 症状

- 后端日志显示 `[通知] 发送异常: Read timed out`
- 通知发送耗时超过 5 秒后失败
- 服务响应变慢

### 可能原因

| 原因 | 说明 |
|------|------|
| ntfy 服务器响应慢 | 服务器负载高或网络拥塞 |
| 网络延迟高 | 跨境访问或网络质量差 |
| 消息体过大 | 消息内容超出限制 |

### 当前超时配置

```python
# backend/utils/notification.py
response = requests.post(
    NTFY_URL,
    data=message.encode("utf-8"),
    headers=headers,
    timeout=5,  # 5 秒超时
)
```

### 排查步骤

```bash
# 1. 测试 ntfy 服务器响应时间
time curl -X POST https://ntfy.zmddg.com/test -d "test"

# 2. 测试网络延迟
docker-compose exec backend ping -c 5 ntfy.zmddg.com

# 3. 检查消息大小
# ntfy 默认限制消息大小为 4KB

# 4. 查看超时日志
docker-compose logs backend | grep -E "(timed out|timeout)"
```

### 解决方案

**方案1: 使用更近的 ntfy 服务器**

```env
# 如果使用海外 ntfy.sh 响应慢，改用自建或国内服务器
NTFY_URL=https://ntfy.zmddg.com/your-topic
```

**方案2: 减小消息体**

确保通知消息简洁，避免包含过多数据：

```python
# 示例：简化通知内容
# 不推荐：包含完整持仓数据
message = f"锁仓触发: {symbol}, 价格: {price}, 当前持仓: {positions}..."

# 推荐：只包含关键信息
message = f"锁仓触发: {symbol} @ {price}"
```

**方案3: 异步发送通知（需要代码修改）**

当前实现使用同步 `requests.post`，可能阻塞事件循环。未来可考虑使用 `aiohttp` 异步发送。

---

## 4. 通知发送成功但手机未收到

### 症状

- 后端日志显示 `[通知] 发送成功`
- API 调用返回成功
- 但手机 ntfy 客户端未收到推送

### 可能原因

| 原因 | 说明 |
|------|------|
| Topic 不匹配 | 手机订阅的 topic 与后端配置不同 |
| 手机客户端问题 | 客户端未正确订阅或被系统限制 |
| 通知被静默 | 优先级设置为 min/low 被手机过滤 |
| 时区问题 | 勿扰模式期间通知被延迟 |

### 排查步骤

```bash
# 1. 确认后端配置的 NTFY_URL 和 topic
cat backend/.env | grep NTFY_URL
# 输出示例: NTFY_URL=https://ntfy.zmddg.com/quantfu-alerts

# 2. 手动发送测试通知
curl -X POST https://ntfy.zmddg.com/quantfu-alerts \
  -H "Title: 测试通知" \
  -H "Priority: high" \
  -H "Tags: warning" \
  -d "这是一条测试消息 $(date)"

# 3. 检查 ntfy 服务器日志（如果是自建）
ssh your-server "docker logs ntfy --tail=20"

# 4. 在浏览器验证 topic
# 访问 https://ntfy.zmddg.com/quantfu-alerts 查看历史消息
```

### 解决方案

**方案1: 确认手机订阅正确的 topic**

1. 打开 ntfy 手机客户端
2. 确认订阅的 topic 名称与 `NTFY_URL` 中的 topic 一致
3. 如果不一致，重新订阅正确的 topic

**方案2: 检查手机通知权限**

iOS:
1. 设置 → 通知 → ntfy
2. 确保"允许通知"已开启
3. 检查"通知分组"和"显示预览"设置

Android:
1. 设置 → 应用 → ntfy → 通知
2. 确保通知已启用
3. 检查电池优化是否限制了后台运行

**方案3: 使用高优先级通知**

```python
# 发送高优先级通知确保能收到
await send_notification(
    title="重要通知",
    message="内容",
    priority="high",  # 使用 high 或 urgent
    tags="warning"
)
```

**方案4: 使用 ntfy Web 界面验证**

访问 `https://ntfy.zmddg.com/your-topic` 查看历史消息，确认通知确实发送成功。

---

## 5. 通知内容显示乱码

### 症状

- 手机收到通知但中文显示为乱码
- 特殊字符（如 emoji）显示异常
- 标题或内容部分丢失

### 可能原因

| 原因 | 说明 |
|------|------|
| 编码问题 | 消息未正确使用 UTF-8 编码 |
| 特殊字符 | 标题中包含换行符或特殊字符 |
| Header 长度限制 | HTTP 标题长度超出限制 |

### 当前编码处理

```python
# backend/utils/notification.py
response = requests.post(
    NTFY_URL,
    data=message.encode("utf-8"),  # 消息体使用 UTF-8 编码
    headers=headers,               # 标题未指定编码
    timeout=5,
)
```

### 排查步骤

```bash
# 1. 测试中文通知
curl -X POST https://ntfy.zmddg.com/test \
  -H "Title: 中文标题测试" \
  -d "中文内容测试：锁仓触发 TA2505"

# 2. 检查特殊字符处理
curl -X POST https://ntfy.zmddg.com/test \
  -H "Title: 测试换行" \
  -d $'第一行\n第二行\n第三行'

# 3. 查看后端日志中的通知内容
docker-compose logs backend | grep "\[通知\]"
```

### 解决方案

**方案1: 确保消息内容简洁**

避免在通知中使用复杂的特殊字符：

```python
# 不推荐
title = "🚨 警告：锁仓触发\n请检查"

# 推荐
title = "锁仓触发警告"
```

**方案2: 使用 Tags 代替 Emoji**

ntfy 支持 Tags 功能，会自动显示为图标：

```python
await send_notification(
    title="锁仓触发",
    message="TA2505 触达锁仓价格",
    priority="high",
    tags="warning,lock"  # 使用 tags 而不是在标题中放 emoji
)
```

**常用 Tags 对照表**

| Tag | 图标 | 说明 |
|-----|------|------|
| `warning` | ⚠️ | 警告 |
| `rotating_light` | 🚨 | 紧急警报 |
| `white_check_mark` | ✅ | 成功 |
| `x` | ❌ | 失败 |
| `moneybag` | 💰 | 金融相关 |
| `chart` | 📈 | 图表/趋势 |

---

## 6. 通知发送导致服务卡顿

### 症状

- 发送通知时其他 API 响应变慢
- 后端服务间歇性卡顿
- 多个请求同时超时

### 根本原因

```python
# backend/utils/notification.py 当前实现
async def send_notification(...) -> bool:
    # 使用同步的 requests.post 在 async 函数中
    # 这会阻塞整个事件循环！
    response = requests.post(
        NTFY_URL,
        data=message.encode("utf-8"),
        headers=headers,
        timeout=5,  # 最多阻塞 5 秒
    )
```

**问题说明**: 虽然函数声明为 `async`，但内部使用了同步的 `requests.post()`，这会阻塞整个事件循环，导致其他请求无法处理。

### 排查步骤

```bash
# 1. 监控 API 响应时间
time curl http://localhost:8888/api/positions/85178443

# 2. 查看是否有通知正在发送
docker-compose logs backend --tail=10 | grep "\[通知\]"

# 3. 检查是否有大量通知积压
docker-compose logs backend | grep "\[通知\]" | wc -l
```

### 解决方案

**方案1: 减少通知发送频率**

在业务逻辑层面控制通知频率，避免短时间内发送大量通知：

```python
# 示例：添加通知去重和限流
last_notification_time = {}

async def should_send_notification(key: str, min_interval: int = 60) -> bool:
    """检查是否应该发送通知（防止重复）"""
    now = time.time()
    if key in last_notification_time:
        if now - last_notification_time[key] < min_interval:
            return False
    last_notification_time[key] = now
    return True
```

**方案2: 忽略通知发送结果**

如果通知不是关键功能，可以不等待发送结果：

```python
# 在业务代码中，不 await 通知结果
asyncio.create_task(send_notification(title, message))
```

> **注意**: 这样做会丢失发送失败的错误信息

**方案3: 使用线程池执行同步调用（需要代码修改）**

未来可以优化为：

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

async def send_notification_async(...):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _sync_send, ...)
```

---

## 7. 快速诊断流程

遇到通知问题时，按以下顺序快速排查：

```
1. 检查 NTFY_URL 配置
   ↓
2. 测试网络连通性
   ↓
3. 手动发送测试通知
   ↓
4. 检查手机客户端订阅
   ↓
5. 查看后端日志
```

### 诊断命令速查

```bash
# 1. 查看当前 NTFY_URL 配置
cat backend/.env | grep NTFY_URL

# 2. 测试 ntfy 服务器连通性
docker-compose exec backend curl -v https://ntfy.zmddg.com/test

# 3. 发送测试通知
curl -X POST https://ntfy.zmddg.com/YOUR-TOPIC \
  -H "Title: 测试" \
  -H "Priority: high" \
  -d "测试消息 $(date)"

# 4. 查看通知相关日志
docker-compose logs backend | grep "\[通知\]"

# 5. 检查通知发送统计
docker-compose logs backend | grep -E "\[通知\] 发送(成功|失败|异常)" | tail -20
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| 所有通知都失败 | 配置错误/服务器不可达 | `NTFY_URL` 配置 |
| 间歇性失败 | 网络不稳定/超时 | 网络延迟和超时设置 |
| 发送成功但未收到 | Topic 不匹配 | 手机订阅的 topic |
| 内容乱码 | 编码问题 | 消息中的特殊字符 |
| 服务卡顿 | 同步阻塞 | 通知发送频率 |
| 401/403 错误 | 认证问题 | ntfy 服务器认证配置 |

### 环境变量配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NTFY_URL` | ntfy 服务器地址和 topic | `https://ntfy.zmddg.com/claude` |

### 通知优先级说明

| 优先级 | 说明 | 手机表现 |
|--------|------|---------|
| `min` | 最低 | 无声音/震动，可能被过滤 |
| `low` | 低 | 无声音，仅显示 |
| `default` | 默认 | 正常通知 |
| `high` | 高 | 有声音和震动 |
| `urgent` | 紧急 | 持续提醒直到查看 |

### 手动测试通知

```bash
# 发送各种优先级的测试通知
for priority in min low default high urgent; do
  curl -X POST https://ntfy.zmddg.com/YOUR-TOPIC \
    -H "Title: ${priority} 优先级测试" \
    -H "Priority: $priority" \
    -d "测试 $priority 优先级通知"
  sleep 2
done
```

---

## 已知限制

### 当前版本的设计限制

1. **同步阻塞调用**
   - `notification.py` 使用 `requests.post` 同步方法
   - 在 `async` 函数中会阻塞事件循环
   - 每次发送最多阻塞 5 秒

2. **无重试机制**
   - 通知发送失败后不会自动重试
   - 调用方需要自行处理重试逻辑

3. **无认证支持**
   - 当前版本不支持 ntfy 服务器认证
   - 必须使用允许匿名发布的 topic

4. **无消息队列**
   - 通知直接同步发送
   - 无法处理通知积压
   - 高频通知可能影响性能

5. **配置方式不一致**
   - 使用 `os.getenv()` 而非统一的 `settings` 对象
   - 与其他配置项的加载方式不同

### 最佳实践建议

1. **通知配置检查**
   - 启动后发送测试通知确认配置正确
   - 在手机上确认能收到通知

2. **控制通知频率**
   - 避免短时间内发送大量通知
   - 对重复事件进行去重

3. **使用适当的优先级**
   - 普通信息用 `default`
   - 重要警告用 `high`
   - 仅在紧急情况使用 `urgent`

4. **保持消息简洁**
   - 标题控制在 20 字以内
   - 消息控制在 200 字以内
   - 避免使用复杂的特殊字符

5. **监控通知状态**
   - 定期检查日志中的发送状态
   - 关注失败和异常的通知

---

## 相关文档

- [后端服务问题排查](./BACKEND_FAQ.md)
- [锁仓触发问题排查](./LOCK_TRIGGER_FAQ.md)
- [换月任务问题排查](./ROLLOVER_FAQ.md)
- [ntfy 官方文档](https://docs.ntfy.sh/)
- [ntfy GitHub](https://github.com/binwiederhier/ntfy)

---

*最后更新: 2025-12-24*
