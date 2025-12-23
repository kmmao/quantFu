# WebSocket 连接问题排查指南

本文档提供 WebSocket 连接问题的诊断步骤和解决方案,涵盖前端 Supabase Realtime 和后端 FastAPI WebSocket 两个部分。

---

## 目录

1. [WebSocket 连接断开](#1-websocket-连接断开)
2. [连接超时](#2-连接超时)
3. [重连失败](#3-重连失败)
4. [订阅数据不更新](#4-订阅数据不更新)
5. [JWT 签名错误](#5-jwt-签名错误)
6. [内存泄漏](#6-内存泄漏)
7. [快速诊断流程](#7-快速诊断流程)

---

## 1. WebSocket 连接断开

### 症状

- 前端实时数据停止更新
- 持仓价格、浮盈不再变化
- 控制台显示 WebSocket 断开信息

### 可能原因

| 原因 | 说明 |
|------|------|
| 网络不稳定 | WiFi/移动网络切换、网络波动 |
| 服务器重启 | 后端服务或 Supabase 容器重启 |
| 连接超时 | 长时间无数据交换导致连接被关闭 |
| 防火墙拦截 | 企业网络或代理阻止 WebSocket |
| 浏览器后台限制 | 标签页在后台时连接被限制 |

### 前端排查步骤

```bash
# 1. 打开浏览器开发者工具 (F12)
# 2. 切换到 Network 标签 → WS 筛选器
# 3. 查看 WebSocket 连接状态和消息
```

**检查 Supabase Realtime 连接状态:**

```typescript
// 在浏览器控制台执行
import { supabase } from '@/lib/supabase'

// 查看当前 channel 状态
supabase.getChannels().forEach(ch => {
  console.log(`Channel: ${ch.topic}, State: ${ch.state}`)
})
```

### 后端排查步骤

```bash
# 1. 检查后端服务状态
curl http://localhost:8888/health | jq

# 2. 查看后端日志
docker-compose logs -f backend --tail=100

# 3. 检查 Supabase Realtime 服务
docker-compose logs realtime --tail=50
```

### 解决方案

**方案1: 手动刷新页面**

最简单的方式,刷新页面会重新建立所有 WebSocket 连接。

**方案2: 检查并重启 Supabase 服务**

```bash
# 检查 Realtime 服务状态
docker-compose ps realtime

# 如果服务异常,重启
docker-compose restart realtime
```

**方案3: 检查网络配置**

```bash
# 测试 WebSocket 连接 (需要 wscat 工具)
npm install -g wscat
wscat -c ws://localhost:8888/ws/positions

# 如果连接失败,检查防火墙和代理设置
```

---

## 2. 连接超时

### 症状

- 页面一直显示"加载中"
- WebSocket 连接建立失败
- 控制台显示连接超时错误

### 可能原因

| 原因 | 说明 |
|------|------|
| 服务未启动 | 后端服务或 Supabase 未运行 |
| 端口配置错误 | 前端连接地址与后端不匹配 |
| 网络延迟过高 | 连接超过默认超时时间 |
| DNS 解析失败 | 域名无法解析 |

### 前端排查步骤

```bash
# 1. 检查前端环境变量配置
cat frontend/.env.local | grep SUPABASE

# 2. 确认 Supabase URL 可访问
curl -I http://localhost:8000

# 3. 检查前端构建时的环境变量
grep NEXT_PUBLIC frontend/.env*
```

**检查配置文件:**

```typescript
// frontend/lib/supabase.ts 中的配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Anon Key exists:', !!supabaseAnonKey)
```

### 后端排查步骤

```bash
# 1. 检查所有服务状态
docker-compose ps

# 2. 测试后端 WebSocket 端点
curl -v http://localhost:8888/ws/positions

# 3. 检查端口监听
netstat -an | grep 8888
lsof -i :8888
```

### 解决方案

**方案1: 确保所有服务已启动**

```bash
# 启动所有服务
docker-compose up -d

# 等待服务就绪 (约30秒)
sleep 30

# 验证服务状态
docker-compose ps
```

**方案2: 检查前端环境配置**

确保 `frontend/.env.local` 包含正确的配置:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**方案3: 增加连接超时时间**

在 Supabase 客户端配置中增加超时:

```typescript
// frontend/lib/supabase.ts
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    timeout: 30000, // 30秒超时
  },
})
```

---

## 3. 重连失败

### 症状

- WebSocket 断开后无法自动恢复
- 需要手动刷新页面才能重连
- 多次重连尝试都失败

### 可能原因

| 原因 | 说明 |
|------|------|
| JWT Token 过期 | 认证令牌已失效 |
| 连接数限制 | 达到服务器连接上限 |
| 服务器拒绝连接 | IP 被临时封禁或限流 |
| 客户端未正确清理 | 旧连接资源未释放 |

### 前端排查步骤

```typescript
// 在浏览器控制台检查 Token 状态
import { supabase } from '@/lib/supabase'

const session = await supabase.auth.getSession()
if (session.data.session) {
  const exp = session.data.session.expires_at
  console.log('Token expires at:', new Date(exp * 1000))
  console.log('Is expired:', Date.now() > exp * 1000)
}
```

### 后端排查步骤

```bash
# 1. 检查当前 WebSocket 连接数 (需要日志或监控)
docker-compose logs backend | grep "WebSocket"

# 2. 检查 Supabase Realtime 连接数
docker-compose exec realtime sh -c 'netstat -an | grep ESTABLISHED | wc -l'
```

### 解决方案

**方案1: 实现前端自动重连逻辑**

```typescript
// 推荐的订阅实现模式
function subscribeWithRetry(tableName: string, callback: Function) {
  let retryCount = 0
  const maxRetries = 5

  const subscribe = () => {
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          retryCount = 0 // 重置重试计数
        } else if (status === 'CLOSED' && retryCount < maxRetries) {
          retryCount++
          setTimeout(subscribe, 1000 * retryCount) // 指数退避
        }
      })

    return channel
  }

  return subscribe()
}
```

**方案2: 刷新 JWT Token**

```typescript
// 强制刷新会话
await supabase.auth.refreshSession()
```

**方案3: 清理并重建连接**

```typescript
// 移除所有现有 channel 并重新订阅
supabase.removeAllChannels()
// 然后重新调用订阅函数
```

---

## 4. 订阅数据不更新

### 症状

- WebSocket 显示已连接,但数据不实时更新
- 数据库有变化但前端无响应
- 部分表订阅正常,部分不工作

### 可能原因

| 原因 | 说明 |
|------|------|
| Realtime 未开启 | 表未启用 Realtime 功能 |
| 订阅配置错误 | schema/table/event 配置不正确 |
| RLS 策略阻止 | 行级安全策略阻止数据推送 |
| 静默失败 | 订阅回调函数异常但未捕获 |

### 前端排查步骤

```typescript
// 检查订阅状态
const channels = supabase.getChannels()
channels.forEach(ch => {
  console.log(`Topic: ${ch.topic}`)
  console.log(`State: ${ch.state}`)
  console.log(`Bindings: ${JSON.stringify(ch.bindings)}`)
})
```

### 后端排查步骤

```bash
# 1. 检查表是否启用 Realtime
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
"

# 2. 检查 RLS 策略
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
"
```

### 解决方案

**方案1: 为表启用 Realtime**

```sql
-- 在 Supabase Studio SQL Editor 或 psql 中执行
ALTER PUBLICATION supabase_realtime ADD TABLE positions;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE lock_triggers;
```

**方案2: 检查并修正订阅配置**

```typescript
// 正确的订阅配置
const channel = supabase
  .channel('positions-all')
  .on(
    'postgres_changes',
    {
      event: '*',       // INSERT, UPDATE, DELETE
      schema: 'public', // 必须指定 schema
      table: 'positions',
      filter: `account_id=eq.${accountId}` // 可选筛选
    },
    (payload) => {
      console.log('Change received:', payload)
      callback(payload)
    }
  )
  .subscribe()
```

**方案3: 添加订阅错误处理**

```typescript
const channel = supabase
  .channel('positions-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, callback)
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed!')
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Subscription error:', err)
    } else if (status === 'TIMED_OUT') {
      console.error('Subscription timed out')
    }
  })
```

---

## 5. JWT 签名错误

### 症状

- 控制台显示 `ErrorConnectingToWebsocket: {:error, :signature_error}`
- 前端显示 "数据加载失败 TypeError: Failed to fetch"
- Realtime 服务拒绝连接

### 可能原因

| 原因 | 说明 |
|------|------|
| JWT_SECRET 不匹配 | 生成 Token 的密钥与验证密钥不一致 |
| Tenant 配置错误 | realtime vs realtime-dev 配置混淆 |
| API 密钥错误 | 使用了错误的 anon/service key |

### 排查步骤

```bash
# 1. 检查 JWT_SECRET 配置
cat .env | grep JWT_SECRET

# 2. 检查 API 密钥
cat .env | grep ANON_KEY
cat .env | grep SERVICE_KEY

# 3. 验证 JWT Token 有效性
# 复制前端的 anon key,到 jwt.io 解析检查
```

### 解决方案

**方案1: 确保 JWT_SECRET 一致**

所有服务必须使用相同的 JWT_SECRET:

```env
# .env 文件
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters
```

**方案2: 重新生成 API 密钥**

```bash
# 使用与 JWT_SECRET 匹配的密钥重新生成
docker-compose down
# 更新 .env 中的密钥
docker-compose up -d
```

**方案3: 检查 Realtime 服务配置**

```bash
# 查看 Realtime 服务的环境变量
docker-compose exec realtime env | grep -E "(JWT|SECRET|TENANT)"
```

> **注意**: 此问题已记录在 `SUPABASE_REALTIME_FIX_IN_PROGRESS.md`,可能需要额外的配置修复。

---

## 6. 内存泄漏

### 症状

- 页面运行一段时间后变慢
- 浏览器内存持续增长
- 最终导致页面崩溃或无响应

### 可能原因

| 原因 | 说明 |
|------|------|
| Channel 未清理 | 组件卸载时未取消订阅 |
| 重复订阅 | 同一个表创建多个订阅 |
| 回调函数累积 | 事件监听器未正确移除 |

### 排查步骤

```typescript
// 检查当前活跃的 Channel 数量
console.log('Active channels:', supabase.getChannels().length)

// 检查各 Channel 详情
supabase.getChannels().forEach((ch, idx) => {
  console.log(`[${idx}] ${ch.topic} - ${ch.state}`)
})
```

### 解决方案

**方案1: 正确的 React 组件清理模式**

```typescript
// React 组件中的正确订阅模式
useEffect(() => {
  const channel = supabase
    .channel('positions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, handleChange)
    .subscribe()

  // 清理函数 - 组件卸载时调用
  return () => {
    supabase.removeChannel(channel)
  }
}, []) // 依赖项为空数组,只订阅一次
```

**方案2: 使用 unsubscribe 而非重复订阅**

```typescript
// 使用 lib/supabase-helpers.ts 中的订阅函数
import { subscribeToPositions } from '@/lib/supabase-helpers'

useEffect(() => {
  const unsubscribe = subscribeToPositions(accountId, handleChange)

  return () => {
    unsubscribe() // 返回的清理函数
  }
}, [accountId])
```

**方案3: 定期清理无用 Channel**

```typescript
// 清理所有断开的 Channel
function cleanupChannels() {
  const channels = supabase.getChannels()
  channels.forEach(ch => {
    if (ch.state === 'closed' || ch.state === 'errored') {
      supabase.removeChannel(ch)
    }
  })
}

// 定期执行
setInterval(cleanupChannels, 60000) // 每分钟清理一次
```

---

## 7. 快速诊断流程

遇到 WebSocket 问题时,按以下顺序快速排查:

```
1. 检查服务状态
   ↓
2. 检查网络连接
   ↓
3. 检查前端配置
   ↓
4. 检查后端日志
   ↓
5. 检查 JWT/认证
```

### 诊断命令速查

```bash
# 1. 服务健康检查
curl http://localhost:8888/health | jq

# 2. 查看所有容器状态
docker-compose ps

# 3. 查看后端日志
docker-compose logs backend --tail=50

# 4. 查看 Realtime 日志
docker-compose logs realtime --tail=50

# 5. 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"

# 6. 测试 WebSocket 端点
curl -v http://localhost:8888/ws/positions
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| 所有数据不加载 | 服务未启动 | `docker-compose ps` |
| 部分数据不更新 | 订阅配置 | 浏览器 Network → WS |
| 连接反复断开 | 网络/Token | 后端日志 |
| 403 错误 | JWT 问题 | `.env` 配置 |
| 内存持续增长 | 订阅泄漏 | `getChannels().length` |

---

## 相关文档

- [Supabase Realtime 官方文档](https://supabase.com/docs/guides/realtime)
- [SUPABASE_REALTIME_FIX_IN_PROGRESS.md](../../SUPABASE_REALTIME_FIX_IN_PROGRESS.md) - 已知 JWT 问题修复进度
- [项目 API 文档](http://localhost:8888/docs) - 后端接口说明

---

*最后更新: 2024-12-24*
