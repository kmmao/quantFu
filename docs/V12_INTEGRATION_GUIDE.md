# v12.py 极星策略集成指南

本文档详细说明如何将你的 v12.py 策略与 QuantFu 新平台集成,实现成交数据的自动推送。

---

## ⚠️ 重要说明: v12-fi.py 是什么?

**v12-fi.py 不是一个可以直接运行的完整策略文件!**

它是一个**集成模板**,包含两部分:
1. ✅ **已完成**: QuantFu 数据推送模块 (第1-365行)
2. ❌ **需要你添加**: 你的 v12.py 策略代码 (第392行开始,目前是空的)

### 文件结构:

```
v12-fi.py
├─ [第1-365行] QuantFu 推送模块 (已完成)
│  ├─ class QuantFuPusher
│  ├─ def quantfu_market_order_hook()
│  └─ def quantfu_close_position_hook()
│
└─ [第392行] TODO: 将你的 v12.py 代码粘贴到这里 (需要你添加!)
```

### 使用流程:

```
1. 打开 v12-fi.py,找到第392行
2. 将你的 v12.py 完整代码复制粘贴进来
3. 在 market_order() 和 close_postion() 成交后,添加推送调用
4. 完成!现在你有一个带推送功能的完整策略
```

**如果你还不理解,请先阅读**: [V12_INTEGRATION_VISUAL_GUIDE.md](./V12_INTEGRATION_VISUAL_GUIDE.md)

---

## 📋 集成概述

**目标**: 极星策略每次成交后,自动将成交数据推送到 QuantFu 后端,实现实时持仓监控。

**集成方式**: 使用 `v12-fi.py` 模板,在原有策略基础上增加数据推送功能。

**影响范围**:
- ✅ 不改变策略交易逻辑
- ✅ 不影响策略性能
- ✅ 纯推送功能,无反向控制
- ✅ 推送失败不影响策略运行

---

## 🚀 快速开始 (3步集成)

### Step 1: 复制 v12-fi.py 模板

```bash
cd /Users/allen/Documents/GitHub/quantFu/archived

# v12-fi.py 已经创建好,包含完整的推送模块
```

### Step 2: 将你的 v12.py 代码合并进来

打开 `v12-fi.py`,找到底部的这一行:

```python
# ==================== 原 v12.py 代码开始 ====================

# TODO: 将你的 v12.py 完整代码粘贴到这里
```

**方式A: 直接复制**(推荐)

1. 打开你的 `v12.py`
2. 复制从 `import talib` 开始的所有代码
3. 粘贴到 `v12-fi.py` 的 TODO 位置

**方式B: 使用 import**

```python
# 在 v12-fi.py 中添加
from v12 import *
```

### Step 3: 添加推送调用

在以下2个位置添加推送代码:

#### 位置1: `market_order()` 函数 (开仓成功后)

找到 `market_order()` 函数中成交成功的地方,添加:

```python
def market_order(context, content, market_order_type, order_num=0):
    # ... 原有下单逻辑 ...

    # 假设下单成功后有这样的代码:
    if order_result == "成功":  # 根据实际情况修改判断条件
        filled_price = ...  # 获取成交价格
        order_id = ...      # 获取订单号

        # ========== 添加这段代码 ==========
        try:
            quantfu_market_order_hook(
                account_id="85178443",  # 替换为你的实际账户ID
                symbol=content['symbol'],
                direction=market_order_type,
                volume=order_num,
                price=filled_price,
                order_id=order_id,
                commission=order_num * 5  # 手续费,根据实际情况
            )
        except Exception as e:
            print(f"[QuantFu] 推送失败但不影响交易: {e}")
        # ==================================
```

#### 位置2: `close_postion()` 函数 (平仓成功后)

找到 `close_postion()` 函数中成交成功的地方,添加:

```python
def close_postion(context, content, market_order_type, order_num, loss_profit_type):
    # ... 原有平仓逻辑 ...

    if close_result == "成功":
        filled_price = ...
        order_id = ...

        # ========== 添加这段代码 ==========
        try:
            quantfu_close_position_hook(
                account_id="85178443",  # 替换为你的实际账户ID
                symbol=content['symbol'],
                direction=market_order_type,  # closelong/closeshort
                volume=order_num,
                price=filled_price,
                order_id=order_id,
                commission=order_num * 5
            )
        except Exception as e:
            print(f"[QuantFu] 推送失败但不影响交易: {e}")
        # ==================================
```

---

## ⚙️ 配置环境变量

### 方式1: 在极星应用中配置

如果极星支持环境变量,添加:

```bash
QUANTFU_API_URL=http://localhost:8888
QUANTFU_API_KEY=your-api-key-from-env
QUANTFU_ENABLE=true
```

### 方式2: 直接在代码中配置

修改 `v12-fi.py` 的全局推送器创建部分:

```python
# 找到这一行:
quantfu_pusher = QuantFuPusher(
    enable=os.getenv('QUANTFU_ENABLE', 'true').lower() == 'true'
)

# 改为:
quantfu_pusher = QuantFuPusher(
    api_url="http://localhost:8888",      # QuantFu 后端地址
    api_key="your-api-key",               # API密钥
    enable=True                            # 启用推送
)
```

### 方式3: 在策略初始化时配置

```python
# 在策略的 initialize() 或 __init__() 函数中:
def initialize(context):
    # ... 原有初始化代码 ...

    # 配置 QuantFu 推送
    global quantfu_pusher
    quantfu_pusher = QuantFuPusher(
        api_url="http://192.168.1.100:8888",  # 如果后端在其他机器
        api_key="your-api-key",
        enable=True
    )
```

---

## 🧪 测试集成

### 1. 启动 QuantFu 后端

```bash
cd /Users/allen/Documents/GitHub/quantFu
./scripts/start.sh
```

验证后端运行:
```bash
curl http://localhost:8888/health
# 应该返回: {"status":"healthy",...}
```

### 2. 测试推送功能

在 v12-fi.py 中添加测试代码:

```python
if __name__ == "__main__":
    # 测试推送器
    print("测试 QuantFu 推送...")

    # 测试成交推送
    result = quantfu_pusher.push_trade(
        account_id="85178443",
        symbol="ZCE|F|TA|2505",
        direction="buy",
        offset="open",
        volume=1,
        price=5500.0,
        order_id="TEST001"
    )

    if result:
        print("✓ 推送测试成功!")
    else:
        print("✗ 推送测试失败,请检查后端服务")

    # 查看统计
    stats = quantfu_pusher.get_stats()
    print(f"推送统计: {stats}")
```

运行测试:
```bash
cd archived
python v12-fi.py
```

### 3. 验证数据

在 QuantFu 前端查看:
```
http://localhost:3000
```

或通过API查询:
```bash
curl http://localhost:8888/api/positions/你的账户UUID
```

---

## 📊 完整集成示例

以下是一个完整的集成示例:

```python
# v12-fi.py 示例

# ... QuantFu 推送模块代码(已包含在模板中) ...

# ==================== 原 v12.py 代码 ====================

import talib
from datetime import datetime
# ... 其他 imports ...

# 你的策略参数
account_id = "85178443"  # 极星账户ID

def market_order(context, content, market_order_type, order_num=0):
    """开仓函数"""
    # 原有下单逻辑
    order = context.insert_market_order(
        symbol=content['symbol'],
        direction=market_order_type,
        volume=order_num
    )

    # 等待成交
    while order.status != 'filled':
        time.sleep(0.1)

    # 成交后获取信息
    filled_price = order.avg_fill_price
    order_id = order.order_id

    # ========== QuantFu 推送 ==========
    try:
        quantfu_market_order_hook(
            account_id=account_id,
            symbol=content['symbol'],
            direction=market_order_type,
            volume=order_num,
            price=filled_price,
            order_id=order_id,
            commission=calculate_commission(order_num)
        )
    except Exception as e:
        print(f"[QuantFu] 推送失败: {e}")
    # =================================

    # 原有后续逻辑
    print(f"开仓成功: {content['symbol']} {market_order_type} {order_num}手")
    return order


def close_postion(context, content, market_order_type, order_num, loss_profit_type):
    """平仓函数"""
    # 原有平仓逻辑
    order = context.insert_market_order(
        symbol=content['symbol'],
        direction=market_order_type,
        volume=order_num
    )

    # 等待成交
    while order.status != 'filled':
        time.sleep(0.1)

    filled_price = order.avg_fill_price
    order_id = order.order_id

    # ========== QuantFu 推送 ==========
    try:
        quantfu_close_position_hook(
            account_id=account_id,
            symbol=content['symbol'],
            direction=market_order_type,
            volume=order_num,
            price=filled_price,
            order_id=order_id,
            commission=calculate_commission(order_num)
        )
    except Exception as e:
        print(f"[QuantFu] 推送失败: {e}")
    # =================================

    print(f"平仓成功: {content['symbol']} {market_order_type} {order_num}手")
    return order


def on_bar(context, bar):
    """主策略逻辑"""
    # 你的原有策略代码
    # ...

    # 如果满足开仓条件
    if should_open_long:
        market_order(context, content, 'buy', 2)

    # 如果满足平仓条件
    if should_close_long:
        close_postion(context, content, 'closelong', 2, 'profit')


# 策略启动
if __name__ == "__main__":
    # 配置推送器
    quantfu_pusher = QuantFuPusher(
        api_url="http://localhost:8888",
        api_key="your-api-key",
        enable=True
    )

    # 启动策略
    run_strategy()
```

---

## 🔍 故障排查

### 问题1: 推送失败 "Connection refused"

**原因**: QuantFu 后端未启动

**解决**:
```bash
cd /Users/allen/Documents/GitHub/quantFu
./scripts/start.sh

# 验证
curl http://localhost:8888/health
```

### 问题2: 推送失败 "HTTP 401"

**原因**: API密钥不正确

**解决**:
1. 检查 `.env` 文件中的 `POLAR_API_KEY`
2. 确保 v12-fi.py 中的 `api_key` 与后端配置一致

### 问题3: 推送成功但前端看不到数据

**原因**: 账户ID不匹配

**解决**:
1. 检查数据库中的账户UUID:
```bash
docker exec -it quantfu_postgres psql -U postgres -d postgres
SELECT id, polar_account_id FROM accounts;
```

2. 确保推送的 `account_id` (极星账户ID) 能匹配到数据库中的记录

### 问题4: 推送超时

**原因**: 网络延迟或后端处理慢

**解决**:
1. 增加超时时间:
```python
# 在 push_trade() 中修改
timeout=10  # 从5秒改为10秒
```

2. 或者使用异步推送(不阻塞交易):
```python
import threading

def async_push_trade(*args, **kwargs):
    thread = threading.Thread(
        target=quantfu_pusher.push_trade,
        args=args,
        kwargs=kwargs
    )
    thread.start()

# 使用时
async_push_trade(account_id=..., symbol=...)
```

---

## 📈 高级功能

### 每日持仓快照推送

在策略的每日收盘或启动时推送快照:

```python
def push_daily_snapshot(context):
    """推送每日持仓快照"""
    positions = []

    # 遍历所有持仓
    for symbol, position in context.positions.items():
        positions.append({
            "symbol": symbol,
            "long_position": position.long_position,
            "long_avg_price": position.long_avg_price,
            "short_position": position.short_position,
            "short_avg_price": position.short_avg_price
        })

    # 推送快照
    quantfu_daily_snapshot_hook(
        account_id=account_id,
        positions=positions
    )

# 在策略中调用
def on_close(context):
    """收盘时调用"""
    push_daily_snapshot(context)
```

### 批量推送历史成交

如果需要补推历史数据:

```python
def push_historical_trades(trades):
    """批量推送历史成交"""
    for trade in trades:
        quantfu_pusher.push_trade(
            account_id=trade['account_id'],
            symbol=trade['symbol'],
            direction=trade['direction'],
            offset=trade['offset'],
            volume=trade['volume'],
            price=trade['price'],
            order_id=trade['order_id']
        )
        time.sleep(0.1)  # 避免请求过快

    print(f"批量推送完成: {len(trades)} 条")
```

### 推送统计监控

定期输出推送统计:

```python
def log_quantfu_stats():
    """输出推送统计"""
    stats = quantfu_pusher.get_stats()
    print(f"[QuantFu] 推送统计: {stats}")

# 在策略中每小时调用一次
def on_bar(context, bar):
    if bar.datetime.minute == 0:  # 每小时
        log_quantfu_stats()
```

---

## ✅ 集成检查清单

完成集成后,按此清单验证:

- [ ] **代码集成**: 已将推送模块集成到 v12-fi.py
- [ ] **开仓推送**: market_order() 中已添加推送调用
- [ ] **平仓推送**: close_postion() 中已添加推送调用
- [ ] **配置检查**: API地址和密钥已正确配置
- [ ] **后端启动**: QuantFu 后端服务正常运行
- [ ] **测试推送**: 手动测试推送功能正常
- [ ] **实盘验证**: 实盘运行后前端能看到数据
- [ ] **异常处理**: 推送失败不影响策略运行
- [ ] **日志输出**: 能看到推送成功/失败的日志

---

## 📞 技术支持

**遇到问题?**

1. 查看后端日志: `tail -f logs/backend.log`
2. 查看极星日志: (策略输出中的 `[QuantFu]` 开头的行)
3. 提交Issue: [GitHub Issues](https://github.com/allen/quantFu/issues)

**需要示例?**

完整示例代码在:
- 推送模块: `archived/v12-fi.py`
- 集成指南: 本文档

---

**集成完成后,你就可以在 QuantFu 前端实时监控持仓了!** 🎉
