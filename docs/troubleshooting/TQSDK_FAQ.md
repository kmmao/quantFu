# 天勤行情服务问题排查指南

本文档提供天勤TqSDK行情服务相关问题的诊断步骤和解决方案，涵盖连接问题、行情订阅、数据更新等常见场景。

---

## 目录

1. [天勤连接失败](#1-天勤连接失败)
2. [天勤账号未配置](#2-天勤账号未配置)
3. [行情数据不更新](#3-行情数据不更新)
4. [合约订阅失败](#4-合约订阅失败)
5. [价格显示NaN或0](#5-价格显示nan或0)
6. [行情服务崩溃](#6-行情服务崩溃)
7. [连接超时](#7-连接超时)
8. [行情数据延迟](#8-行情数据延迟)
9. [快速诊断流程](#9-快速诊断流程)

---

## 1. 天勤连接失败

### 症状

- 后端启动日志显示 "天勤API连接失败"
- 健康检查 API 返回 tqsdk 状态为 `error`
- 所有行情相关功能不可用
- 持仓浮盈显示为 0 或不更新

### 可能原因

| 原因 | 说明 |
|------|------|
| 账号密码错误 | 天勤账号或密码填写不正确 |
| 网络问题 | 无法访问天勤服务器 |
| 天勤服务维护 | 天勤官方服务器维护中 |
| 账号被锁定 | 登录错误次数过多导致账号锁定 |
| 环境变量未设置 | TQSDK_ACCOUNT 或 TQSDK_PASSWORD 未配置 |

### 排查步骤

```bash
# 1. 检查环境变量配置
cat backend/.env | grep -E "(TQSDK_ACCOUNT|TQSDK_PASSWORD)"

# 2. 测试天勤连接（使用测试脚本）
cd backend
python -c "
from tqsdk import TqApi, TqAuth
from config import settings
print(f'账号: {settings.tqsdk_account}')
print(f'密码: {\"*\" * len(settings.tqsdk_password) if settings.tqsdk_password else \"未设置\"}')
try:
    api = TqApi(auth=TqAuth(settings.tqsdk_account, settings.tqsdk_password), web_gui=False)
    print('连接成功!')
    api.close()
except Exception as e:
    print(f'连接失败: {e}')
"

# 3. 检查后端服务日志
docker-compose logs backend --tail=100 | grep -E "(天勤|tqsdk|TqApi)"

# 4. 检查健康状态
curl http://localhost:8888/health | jq .components.tqsdk
```

### 解决方案

**方案1: 配置正确的天勤账号**

在 `backend/.env` 中配置：

```env
# 天勤账号（手机号或邮箱）
TQSDK_ACCOUNT=your-phone-or-email

# 天勤密码
TQSDK_PASSWORD=your-password
```

> **注意**: 环境变量名是 `TQSDK_ACCOUNT`，而非 `TQSDK_USER`（测试脚本可能使用不同变量名）。

**方案2: 注册天勤账号**

如果没有天勤账号：
1. 访问 https://www.shinnytech.com/tianqin 注册免费账号
2. 免费版有每日调用次数限制，但足够开发和小规模使用
3. 使用手机号或邮箱注册

**方案3: 使用模拟账号测试**

天勤提供公共模拟账号用于测试：

```env
# 使用快期模拟账号（仅用于测试）
TQSDK_ACCOUNT=快期模拟
TQSDK_PASSWORD=123456
```

**方案4: 检查网络连通性**

```bash
# 从容器内测试网络
docker-compose exec backend ping -c 3 openmd.shinnytech.com

# 检查防火墙是否阻止
telnet openmd.shinnytech.com 7777
```

**方案5: 重启后端服务**

```bash
docker-compose restart backend

# 或完全重启
docker-compose down && docker-compose up -d
```

---

## 2. 天勤账号未配置

### 症状

- 健康检查显示 `tqsdk: not_configured`
- 后端服务正常启动但无行情功能
- 日志显示 "天勤账号未配置，行情服务跳过"

### 可能原因

| 原因 | 说明 |
|------|------|
| 环境变量缺失 | .env 文件中未设置 TQSDK_ACCOUNT |
| 变量名错误 | 使用了错误的变量名（如 TQSDK_USER） |
| .env 文件未加载 | Docker 未正确加载环境变量文件 |

### 排查步骤

```bash
# 1. 检查 .env 文件是否存在
ls -la backend/.env

# 2. 检查环境变量内容
cat backend/.env | grep TQSDK

# 3. 检查 Docker 容器内的环境变量
docker-compose exec backend env | grep TQSDK

# 4. 检查配置加载
docker-compose exec backend python -c "
from config import settings
print(f'tqsdk_account: {settings.tqsdk_account}')
print(f'tqsdk_password: {\"已设置\" if settings.tqsdk_password else \"未设置\"}')
"
```

### 解决方案

**方案1: 添加必要的环境变量**

编辑 `backend/.env`：

```env
# 天勤配置（行情服务需要）
TQSDK_ACCOUNT=your-tianqin-account
TQSDK_PASSWORD=your-tianqin-password
```

**方案2: 确保 Docker 正确加载环境变量**

检查 `docker-compose.yml` 中的 env_file 配置：

```yaml
services:
  backend:
    env_file:
      - ./backend/.env  # 确保路径正确
```

**方案3: 跳过天勤服务（临时方案）**

如果暂时不需要行情功能，系统会自动跳过天勤服务启动，其他功能仍可正常使用。

---

## 3. 行情数据不更新

### 症状

- 持仓页面的价格和浮盈停止变化
- `last_update_time` 长时间未更新
- 后端日志无价格更新记录

### 可能原因

| 原因 | 说明 |
|------|------|
| 行情循环停止 | market_data_loop 异常退出 |
| 连接断开 | 天勤连接丢失但未自动重连 |
| 非交易时段 | 当前时间无行情推送 |
| 合约未订阅 | contracts 表为空或订阅失败 |
| 数据库更新失败 | Supabase 写入异常 |

### 排查步骤

```bash
# 1. 检查后端服务状态
curl http://localhost:8888/health | jq

# 2. 查看行情循环日志
docker-compose logs backend --tail=200 | grep -E "(行情|📈|📊|price)"

# 3. 检查持仓更新时间
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, last_price, last_update_time,
       NOW() - last_update_time as time_since_update
FROM positions
WHERE long_position > 0 OR short_position > 0
ORDER BY last_update_time DESC;
"

# 4. 检查订阅的合约数量
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT COUNT(*) as contract_count FROM contracts;
"

# 5. 检查是否在交易时段
date  # 期货交易时段: 9:00-15:00, 21:00-次日02:30
```

### 解决方案

**方案1: 重启后端服务**

```bash
# 重启服务以重建连接
docker-compose restart backend
```

**方案2: 检查合约表数据**

```sql
-- 查看合约表内容
SELECT polar_symbol, tqsdk_symbol FROM contracts;

-- 如果为空，需要添加合约映射
INSERT INTO contracts (polar_symbol, tqsdk_symbol, multiplier, exchange)
VALUES
  ('ZCE|F|TA|2505', 'CZCE.TA2505', 5, 'CZCE'),
  ('SHFE|F|RB|2505', 'SHFE.rb2505', 10, 'SHFE');
```

**方案3: 手动触发行情同步**

```bash
# 调用 API 获取行情快照
curl "http://localhost:8888/api/tqsdk/quote/CZCE.TA2505" | jq
```

**方案4: 检查数据库连接**

```bash
# 测试数据库连接
curl http://localhost:8888/health | jq .components.database
```

---

## 4. 合约订阅失败

### 症状

- 部分合约无行情数据
- 后端日志显示 "订阅失败 {合约}: ..."
- `subscribe_contracts_from_db` 返回的订阅数小于合约总数

### 可能原因

| 原因 | 说明 |
|------|------|
| 合约代码格式错误 | tqsdk_symbol 格式不正确 |
| 合约已到期 | 订阅了已到期的旧合约 |
| 合约不存在 | 输入了不存在的合约代码 |
| 交易所代码错误 | 交易所代码映射错误（如 ZCE vs CZCE） |

### 排查步骤

```bash
# 1. 查看订阅失败的合约
docker-compose logs backend --tail=100 | grep "订阅失败"

# 2. 检查合约表的格式
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT polar_symbol, tqsdk_symbol,
       CASE
         WHEN tqsdk_symbol ~ '^[A-Z]+\.[a-zA-Z]+[0-9]{4}$' THEN 'OK'
         ELSE 'FORMAT_ERROR'
       END as format_check
FROM contracts;
"

# 3. 测试单个合约订阅
curl "http://localhost:8888/api/tqsdk/quote/CZCE.TA2505" | jq

# 4. 验证合约是否有效
docker-compose exec backend python -c "
from tqsdk import TqApi, TqAuth
from config import settings
api = TqApi(auth=TqAuth(settings.tqsdk_account, settings.tqsdk_password))
quote = api.get_quote('CZCE.TA2505')
print(f'最新价: {quote.last_price}')
api.close()
"
```

### 解决方案

**方案1: 修正合约格式**

天勤合约格式规则：

| 交易所 | 极星格式 | 天勤格式 | 说明 |
|--------|---------|---------|------|
| 郑商所 | ZCE\|F\|TA\|2505 | CZCE.TA2505 | ZCE→CZCE，品种大写 |
| 上期所 | SHFE\|F\|RB\|2505 | SHFE.rb2505 | 品种小写 |
| 大商所 | DCE\|F\|V\|2505 | DCE.v2505 | 品种小写 |
| 中金所 | CFFEX\|F\|IF\|2505 | CFFEX.IF2505 | 品种大写 |
| 能源中心 | INE\|F\|SC\|2505 | INE.sc2505 | 品种小写 |

```sql
-- 修正郑商所合约格式
UPDATE contracts
SET tqsdk_symbol = REPLACE(tqsdk_symbol, 'ZCE.', 'CZCE.')
WHERE tqsdk_symbol LIKE 'ZCE.%';
```

**方案2: 更新到期合约**

```sql
-- 查找可能到期的合约
SELECT * FROM contracts
WHERE tqsdk_symbol LIKE '%2412' OR tqsdk_symbol LIKE '%2501';

-- 更新到新合约
UPDATE contracts
SET tqsdk_symbol = 'CZCE.TA2505',
    polar_symbol = 'ZCE|F|TA|2505'
WHERE tqsdk_symbol = 'CZCE.TA2501';
```

**方案3: 使用合约转换API**

```bash
# 测试合约格式转换
curl "http://localhost:8888/api/contracts/convert/polar-to-tqsdk?polar_symbol=ZCE|F|TA|2505"
```

---

## 5. 价格显示NaN或0

### 症状

- 前端显示 `NaN` 或价格为 `0`
- 浮盈计算结果异常
- 部分合约有价格，部分显示异常

### 可能原因

| 原因 | 说明 |
|------|------|
| 非交易时段 | 当前无成交，价格为空 |
| 合约无成交 | 冷门合约当天无成交数据 |
| 数据尚未到达 | 刚订阅，还未收到行情 |
| 合约已停牌 | 合约暂停交易 |
| 数据类型问题 | 数据库字段类型不匹配 |

### 排查步骤

```bash
# 1. 直接查询天勤原始数据
curl "http://localhost:8888/api/tqsdk/quote/CZCE.TA2505" | jq

# 2. 检查数据库中的价格数据
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, last_price,
       CASE
         WHEN last_price IS NULL THEN 'NULL'
         WHEN last_price = 0 THEN 'ZERO'
         WHEN last_price != last_price THEN 'NaN'
         ELSE 'OK'
       END as price_status
FROM positions;
"

# 3. 检查当前是否为交易时段
# 日盘: 9:00-11:30, 13:30-15:00
# 夜盘: 21:00-次日02:30 (部分品种)
date "+%H:%M"

# 4. 检查天勤返回的原始quote对象
docker-compose exec backend python -c "
from tqsdk import TqApi, TqAuth
from config import settings
import math
api = TqApi(auth=TqAuth(settings.tqsdk_account, settings.tqsdk_password))
quote = api.get_quote('CZCE.TA2505')
api.wait_update()
print(f'last_price: {quote.last_price}')
print(f'is_nan: {math.isnan(quote.last_price) if quote.last_price else \"None\"}')
print(f'bid/ask: {quote.bid_price1}/{quote.ask_price1}')
api.close()
"
```

### 解决方案

**方案1: 等待交易时段**

期货交易时段外，行情数据为空是正常的。

**方案2: 使用结算价替代**

非交易时段可以使用前一交易日结算价：

```sql
-- 如果最新价为空，使用结算价
UPDATE positions
SET last_price = COALESCE(
  (SELECT pre_settlement FROM market_data WHERE symbol = positions.symbol),
  last_price
)
WHERE last_price IS NULL OR last_price = 0;
```

**方案3: 前端处理NaN**

确保前端正确处理空值：

```typescript
// 前端显示逻辑
const displayPrice = (price: number | null) => {
  if (price === null || price === 0 || Number.isNaN(price)) {
    return '--';  // 或显示 "非交易时段"
  }
  return price.toFixed(2);
};
```

**方案4: 检查合约乘数**

浮盈计算需要正确的合约乘数：

```sql
-- 检查合约乘数
SELECT polar_symbol, multiplier FROM contracts;

-- 修正乘数
UPDATE contracts SET multiplier = 5 WHERE polar_symbol LIKE '%TA%';  -- PTA乘数是5
UPDATE contracts SET multiplier = 10 WHERE polar_symbol LIKE '%RB%'; -- 螺纹钢乘数是10
```

---

## 6. 行情服务崩溃

### 症状

- 服务运行后突然无任何行情更新
- 后端日志显示 "行情循环错误" 后无更多日志
- 需要手动重启才能恢复
- 连续多次崩溃

### 可能原因

| 原因 | 说明 |
|------|------|
| api.wait_update() 阻塞 | 连接异常导致永久等待 |
| 内存不足 | 订阅合约过多导致内存溢出 |
| 网络断开 | 网络中断且无自动重连 |
| 未处理异常 | 代码中的未捕获异常 |

代码位置：`backend/services/tqsdk_service.py` 第 170-212 行

```python
async def market_data_loop(self):
    while self.running:
        try:
            self.api.wait_update()  # 可能永久阻塞
            # ...
        except Exception as e:
            print(f"❌ 行情循环错误: {e}")
            await asyncio.sleep(5)  # 出错后等待5秒再继续
```

### 排查步骤

```bash
# 1. 检查服务是否仍在运行
docker-compose ps backend

# 2. 查看最后的错误日志
docker-compose logs backend --tail=200 | grep -E "(错误|Error|Exception|❌)"

# 3. 检查内存使用
docker stats quantfu_backend --no-stream

# 4. 检查订阅合约数量
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT COUNT(*) as total_contracts FROM contracts;
"
```

### 解决方案

**方案1: 重启后端服务**

```bash
# 简单重启
docker-compose restart backend

# 如果问题持续，完全重建
docker-compose down
docker-compose up -d --build backend
```

**方案2: 减少订阅合约数量**

如果订阅合约过多，可以只订阅活跃合约：

```sql
-- 只保留有持仓的合约
DELETE FROM contracts
WHERE polar_symbol NOT IN (
  SELECT DISTINCT symbol FROM positions
  WHERE long_position > 0 OR short_position > 0
);
```

**方案3: 增加错误恢复机制**

当前版本的 market_data_loop 有基本的错误恢复（5秒后重试），但建议：
- 监控连续失败次数
- 超过阈值后重建连接
- 添加日志告警

**方案4: 设置服务自动重启**

在 `docker-compose.yml` 中配置自动重启：

```yaml
services:
  backend:
    restart: unless-stopped  # 或 always
```

---

## 7. 连接超时

### 症状

- 后端启动时长时间卡住
- 日志显示 "正在连接天勤服务..." 后无响应
- 最终显示连接超时错误
- 其他服务正常但天勤不可用

### 可能原因

| 原因 | 说明 |
|------|------|
| 网络延迟高 | 到天勤服务器的网络延迟过高 |
| DNS 解析失败 | 无法解析天勤服务器域名 |
| 防火墙阻止 | 网络防火墙阻止连接 |
| 代理配置 | 代理服务器不支持 WebSocket |
| 天勤服务器繁忙 | 高峰时段服务器负载高 |

### 排查步骤

```bash
# 1. 测试网络延迟
ping openmd.shinnytech.com

# 2. 测试端口连通性
nc -zv openmd.shinnytech.com 7777
# 或
telnet openmd.shinnytech.com 7777

# 3. 检查 DNS 解析
nslookup openmd.shinnytech.com

# 4. 检查是否有代理
echo $HTTP_PROXY $HTTPS_PROXY

# 5. 从容器内测试
docker-compose exec backend ping -c 3 openmd.shinnytech.com
```

### 解决方案

**方案1: 使用备用服务器**

天勤有多个服务器，可以尝试切换：

```python
# 在代码中指定备用地址（需要修改代码）
api = TqApi(
    auth=TqAuth(account, password),
    url="wss://openmd.shinnytech.com/t/md/front/mobile"  # 默认地址
)
```

**方案2: 配置代理**

如果需要通过代理访问：

```env
# backend/.env
HTTP_PROXY=http://proxy:port
HTTPS_PROXY=http://proxy:port
```

**方案3: 增加连接超时**

天勤 SDK 默认超时较长，如果网络不稳定，可以在启动脚本中设置：

```bash
# 启动时设置超时（秒）
export TQ_CONNECT_TIMEOUT=30
```

**方案4: 使用本地模拟**

如果无法连接天勤服务器，可以：
1. 使用历史数据进行开发测试
2. 配置手动输入价格模式
3. 等待网络恢复后再启动行情服务

---

## 8. 行情数据延迟

### 症状

- 行情价格与其他软件不一致
- 价格更新明显滞后
- 波动剧烈时延迟更明显
- 浮盈计算与实际有出入

### 可能原因

| 原因 | 说明 |
|------|------|
| 网络延迟 | 网络传输延迟 |
| 更新频率限制 | 代码中有 sleep 延迟 |
| 数据库写入延迟 | 大量更新导致数据库响应慢 |
| 前端刷新频率 | WebSocket 或轮询间隔过长 |
| 天勤推送频率 | 免费版可能有频率限制 |

### 排查步骤

```bash
# 1. 对比天勤原始数据与数据库
curl "http://localhost:8888/api/tqsdk/quote/CZCE.TA2505" | jq .last_price

docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT last_price, last_update_time FROM positions WHERE symbol = 'ZCE|F|TA|2505';
"

# 2. 检查更新间隔
docker-compose logs backend --tail=50 | grep "📈" | tail -5

# 3. 检查代码中的延迟设置
# tqsdk_service.py line 204: await asyncio.sleep(0.5)

# 4. 测量端到端延迟
time curl "http://localhost:8888/api/tqsdk/quote/CZCE.TA2505"
```

### 解决方案

**方案1: 优化更新频率**

当前代码中 `market_data_loop` 有 0.5 秒的休眠（`await asyncio.sleep(0.5)`），可以根据需要调整：

```python
# backend/services/tqsdk_service.py
await asyncio.sleep(0.1)  # 减少到0.1秒
```

> **注意**: 更新过于频繁可能增加数据库负载和 API 调用次数。

**方案2: 使用 WebSocket 推送**

确保前端使用 Supabase Realtime 订阅，而非轮询：

```typescript
// 订阅持仓变化
subscribeToPositions(accountId, (payload) => {
  // 实时接收更新
  console.log('Position updated:', payload);
});
```

**方案3: 检查天勤版本**

天勤免费版可能有频率限制，考虑升级专业版：
- 专业版支持更高频率的数据推送
- 支持更多并发订阅

**方案4: 使用本地缓存**

对于不需要毫秒级精度的场景，可以接受一定延迟：

```typescript
// 前端显示时标注更新时间
<span>{price} <small>(更新于 {formatTime(lastUpdateTime)})</small></span>
```

---

## 9. 快速诊断流程

遇到天勤行情问题时，按以下顺序快速排查：

```
1. 检查账号配置
   ↓
2. 测试网络连接
   ↓
3. 验证合约格式
   ↓
4. 检查服务状态
   ↓
5. 查看后端日志
```

### 诊断命令速查

```bash
# 1. 检查天勤配置
cat backend/.env | grep TQSDK

# 2. 健康检查
curl http://localhost:8888/health | jq .components.tqsdk

# 3. 测试行情获取
curl "http://localhost:8888/api/tqsdk/quote/CZCE.TA2505" | jq

# 4. 查看服务日志
docker-compose logs backend --tail=100 | grep -E "(天勤|tqsdk|行情)"

# 5. 检查合约表
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT polar_symbol, tqsdk_symbol FROM contracts LIMIT 10;
"

# 6. 检查持仓更新时间
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, last_price, last_update_time FROM positions
WHERE long_position > 0 OR short_position > 0;
"

# 7. 重启服务
docker-compose restart backend
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| 健康检查 tqsdk: error | 连接失败 | `.env` 配置 |
| 健康检查 tqsdk: not_configured | 未配置账号 | 环境变量 |
| 价格全为0或NaN | 非交易时段/订阅失败 | 交易时段+合约格式 |
| 部分合约无数据 | 合约格式错误 | `contracts` 表 |
| 价格停止更新 | 行情循环崩溃 | 后端日志 |
| 数据明显延迟 | 网络/更新频率 | 对比原始行情 |
| 启动时卡住 | 连接超时 | 网络连通性 |

### 合约格式速查

| 交易所 | 极星前缀 | 天勤前缀 | 品种大小写 | 示例 |
|--------|---------|---------|-----------|------|
| 郑商所 | ZCE | CZCE | 大写 | CZCE.TA2505 |
| 上期所 | SHFE | SHFE | 小写 | SHFE.rb2505 |
| 大商所 | DCE | DCE | 小写 | DCE.v2505 |
| 中金所 | CFFEX | CFFEX | 大写 | CFFEX.IF2505 |
| 能源中心 | INE | INE | 小写 | INE.sc2505 |

### 交易时段参考

| 时段 | 时间 | 说明 |
|------|------|------|
| 日盘上午 | 9:00 - 11:30 | 10:15-10:30 休息 |
| 日盘下午 | 13:30 - 15:00 | - |
| 夜盘 | 21:00 - 次日02:30 | 部分品种，具体以交易所公告为准 |

---

## 已知限制

### 当前版本的限制

1. **无自动重连机制**
   - 连接断开后需要手动重启服务
   - 建议配置 Docker 自动重启

2. **单例连接状态可能过期**
   - `_is_connected` 标志不会在连接异常断开时自动更新
   - 可能出现"已连接"但实际无法获取数据的情况

3. **订阅失败无重试**
   - 失败的合约不会自动重新订阅
   - 需要手动修正合约格式后重启服务

4. **环境变量名称不一致**
   - 服务使用 `TQSDK_ACCOUNT`
   - 部分测试脚本使用 `TQSDK_USER`
   - 建议同时设置两个变量

### 最佳实践建议

1. **定期检查服务状态**：使用 `/health` API 监控天勤连接状态
2. **配置自动重启**：在 docker-compose.yml 中设置 `restart: unless-stopped`
3. **合约格式验证**：添加新合约前先用 API 测试格式是否正确
4. **非交易时段处理**：前端应对非交易时段的空数据做友好提示

---

## 相关文档

- [WebSocket 问题排查](./WEBSOCKET_FAQ.md)
- [锁仓触发问题排查](./LOCK_TRIGGER_FAQ.md)
- [换月任务问题排查](./ROLLOVER_FAQ.md)
- [项目 API 文档](http://localhost:8888/docs) - 后端接口说明
- [天勤官方文档](https://doc.shinnytech.com/tqsdk/latest/)

---

*最后更新: 2025-12-24*
