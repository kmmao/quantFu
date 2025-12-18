# 极星量化API集成指南

本文档说明如何将 QuantFu 后端与极星量化策略进行实际交易集成。

---

## 📋 概述

QuantFu 已移除所有模拟订单代码,需要根据极星API文档完成以下3个接口的集成:

1. **锁仓下单** - `backend/engines/lock_engine.py:_execute_lock_order()`
2. **换月平仓** - `backend/services/rollover_service.py:_close_old_position()`
3. **换月开仓** - `backend/services/rollover_service.py:_open_new_position()`
4. **策略信号执行** - `backend/services/multi_strategy_service.py:_execute_signal()`

---

## 🔌 集成方式

根据极星策略的实际情况,选择以下3种集成方式之一:

### 方式1: 极星提供HTTP API (推荐)

**适用场景**: 极星策略提供RESTful API接口

**优点**:
- 实现简单
- 同步调用,易于错误处理
- 可直接获取订单ID和成交结果

**实现示例**:

```python
import requests
import os

def call_polar_api(endpoint: str, data: dict) -> dict:
    """调用极星API"""
    response = requests.post(
        f"{os.getenv('POLAR_API_URL')}/{endpoint}",
        json=data,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": os.getenv("POLAR_API_KEY")
        },
        timeout=30
    )

    if response.status_code != 200:
        raise Exception(f"极星API调用失败: {response.status_code} {response.text}")

    return response.json()
```

**环境变量配置**:

```env
# .env
POLAR_API_URL=http://极星服务器地址:端口
POLAR_API_KEY=your-polar-api-key
```

---

### 方式2: 通过WebSocket推送指令

**适用场景**: 极星策略监听WebSocket,接收交易指令

**优点**:
- 实时性好
- 双向通信
- 适合复杂交互

**实现示例**:

```python
import asyncio
import websockets
import json

class PolarWebSocketClient:
    def __init__(self, url: str, api_key: str):
        self.url = url
        self.api_key = api_key
        self.ws = None

    async def connect(self):
        """连接到极星WebSocket"""
        self.ws = await websockets.connect(
            self.url,
            extra_headers={"X-API-Key": self.api_key}
        )

    async def send_order(self, order_data: dict) -> dict:
        """发送订单指令"""
        await self.ws.send(json.dumps({
            "action": "order",
            "data": order_data
        }))

        # 等待确认
        response = await self.ws.recv()
        return json.loads(response)
```

---

### 方式3: 数据库轮询 (不推荐)

**适用场景**: 极星策略轮询数据库,发现待执行任务后自行下单

**缺点**:
- 实时性差
- 无法直接获取订单结果
- 需要额外的状态同步机制

**实现思路**:
1. QuantFu写入任务到专用表(如`pending_orders`)
2. 极星策略轮询该表
3. 极星下单后更新状态
4. QuantFu再次查询获取结果

---

## 🔧 具体集成步骤

### 1. 锁仓下单集成

**文件**: `backend/engines/lock_engine.py`

**函数**: `_execute_lock_order()`

**当前状态**: 抛出 `NotImplementedError`

**集成代码示例**:

```python
async def _execute_lock_order(
    self, account_id: str, symbol: str, direction: str, volume: int, price: float
) -> Dict[str, Any]:
    """执行锁仓订单 - 调用极星API"""
    logger.info(f"[锁仓下单] {symbol} {direction} {volume}手 @{price}")

    try:
        # 方式1: HTTP API
        response = requests.post(
            f"{os.getenv('POLAR_API_URL')}/api/order",
            json={
                "account_id": account_id,
                "symbol": symbol,
                "direction": direction,  # buy/sell
                "volume": volume,
                "order_type": "market",  # 或 "limit"
                "price": price if order_type == "limit" else None,
                "source": "lock_engine"
            },
            headers={"X-API-Key": os.getenv("POLAR_API_KEY")},
            timeout=30
        )

        if response.status_code != 200:
            raise Exception(f"下单失败: {response.text}")

        result = response.json()
        order_id = result["order_id"]

        # 等待成交(可选,根据极星API是否支持同步等待)
        # filled = await self._wait_for_fill(order_id)

        logger.info(f"[锁仓下单成功] 订单号: {order_id}")

        return {
            "success": True,
            "order_id": order_id
        }

    except Exception as e:
        logger.error(f"[锁仓下单失败] {e}")
        raise
```

**测试方法**:

```bash
# 1. 配置环境变量
export POLAR_API_URL=http://极星地址
export POLAR_API_KEY=your-key

# 2. 启动后端
cd backend
uvicorn main:app --reload --port 8888

# 3. 触发锁仓(通过前端或API)
curl -X POST http://localhost:8888/api/lock/triggers/{trigger_id}/execute \
  -H "Content-Type: application/json"
```

---

### 2. 换月平仓集成

**文件**: `backend/services/rollover_service.py`

**函数**: `_close_old_position()`

**当前状态**: 抛出 `NotImplementedError`

**集成代码示例**:

```python
async def _close_old_position(self, task: Dict[str, Any]) -> bool:
    """平掉旧合约持仓 - 调用极星API"""
    try:
        self.logger.info(
            f"平旧仓: {task['old_symbol']} {task['direction']} {task['rollover_volume']}手"
        )

        # 确定平仓方向
        close_direction = "sell" if task["direction"] == "long" else "buy"

        # 调用极星API
        response = requests.post(
            f"{os.getenv('POLAR_API_URL')}/api/close_position",
            json={
                "account_id": task["account_id"],
                "symbol": task["old_symbol"],
                "direction": close_direction,
                "volume": task["rollover_volume"],
                "order_type": "market"  # 换月建议使用市价单
            },
            headers={"X-API-Key": os.getenv("POLAR_API_KEY")},
            timeout=30
        )

        if response.status_code != 200:
            raise Exception(f"平仓失败: {response.text}")

        order_result = response.json()

        # 记录执行详情
        execution_data = {
            "task_id": task["id"],
            "step_type": "close",
            "symbol": task["old_symbol"],
            "direction": close_direction,
            "volume": order_result["volume"],
            "price": order_result["avg_price"],
            "commission": order_result["commission"],
            "polar_order_id": order_result["order_id"]
        }
        self.db.table("rollover_executions").insert(execution_data).execute()

        # 更新任务平仓信息
        self.db.table("rollover_tasks").update({
            "close_volume": order_result["volume"],
            "close_avg_price": order_result["avg_price"],
            "close_cost": order_result["commission"]
        }).eq("id", task["id"]).execute()

        self.logger.info(f"平旧仓成功: {order_result['order_id']}")
        return True

    except Exception as e:
        self.logger.error(f"平旧仓失败: {e}")
        return False
```

---

### 3. 换月开仓集成

**文件**: `backend/services/rollover_service.py`

**函数**: `_open_new_position()`

**当前状态**: 抛出 `NotImplementedError`

**集成代码示例**:

```python
async def _open_new_position(self, task: Dict[str, Any]) -> bool:
    """开立新合约持仓 - 调用极星API"""
    try:
        self.logger.info(
            f"开新仓: {task['new_symbol']} {task['direction']} {task['rollover_volume']}手"
        )

        # 确定开仓方向
        open_direction = "buy" if task["direction"] == "long" else "sell"

        # 调用极星API
        response = requests.post(
            f"{os.getenv('POLAR_API_URL')}/api/open_position",
            json={
                "account_id": task["account_id"],
                "symbol": task["new_symbol"],
                "direction": open_direction,
                "volume": task["rollover_volume"],
                "order_type": "market"
            },
            headers={"X-API-Key": os.getenv("POLAR_API_KEY")},
            timeout=30
        )

        if response.status_code != 200:
            raise Exception(f"开仓失败: {response.text}")

        order_result = response.json()

        # 记录执行详情
        execution_data = {
            "task_id": task["id"],
            "step_type": "open",
            "symbol": task["new_symbol"],
            "direction": open_direction,
            "volume": order_result["volume"],
            "price": order_result["avg_price"],
            "commission": order_result["commission"],
            "polar_order_id": order_result["order_id"]
        }
        self.db.table("rollover_executions").insert(execution_data).execute()

        # 计算换月总成本
        close_cost = task.get("close_cost", 0)
        open_cost = order_result["commission"]
        close_price = task.get("close_avg_price", 0)
        open_price = order_result["avg_price"]
        price_diff = open_price - close_price

        # 获取合约乘数
        contract = self.db.table("contracts")\
            .select("multiplier")\
            .eq("polar_symbol", task["new_symbol"])\
            .single()\
            .execute()
        multiplier = contract.data["multiplier"] if contract.data else 10

        rollover_cost = close_cost + open_cost + (price_diff * task["rollover_volume"] * multiplier)

        # 更新任务开仓信息
        self.db.table("rollover_tasks").update({
            "open_volume": order_result["volume"],
            "open_avg_price": order_result["avg_price"],
            "open_cost": order_result["commission"],
            "price_diff": price_diff,
            "rollover_cost": rollover_cost
        }).eq("id", task["id"]).execute()

        self.logger.info(f"开新仓成功: {order_result['order_id']}, 换月成本: {rollover_cost:.2f}元")
        return True

    except Exception as e:
        self.logger.error(f"开新仓失败: {e}")
        return False
```

---

### 4. 策略信号执行集成

**文件**: `backend/services/multi_strategy_service.py`

**函数**: `_execute_signal()`

**当前状态**: 抛出 `NotImplementedError`

**集成代码示例**:

```python
async def _execute_signal(self, signal: Dict[str, Any]) -> bool:
    """执行策略信号 - 调用极星API"""
    try:
        self.logger.info(
            f"执行信号: {signal['signal_type']} {signal['symbol']} "
            f"{signal['direction']} {signal['volume']}"
        )

        # 调用极星API
        response = requests.post(
            f"{os.getenv('POLAR_API_URL')}/api/order",
            json={
                "account_id": signal["account_id"],
                "symbol": signal["symbol"],
                "signal_type": signal["signal_type"],  # open/close/reverse
                "direction": signal["direction"],      # buy/sell
                "volume": signal["volume"],
                "price": signal.get("price"),          # None表示市价
                "strategy_instance_id": signal["instance_id"]
            },
            headers={"X-API-Key": os.getenv("POLAR_API_KEY")},
            timeout=30
        )

        if response.status_code != 200:
            raise Exception(f"信号执行失败: {response.text}")

        order_result = response.json()

        # 更新信号执行状态
        self.db.table("strategy_signals").update({
            "status": "executed",
            "executed_at": datetime.now().isoformat(),
            "execution_price": order_result["avg_price"],
            "execution_volume": order_result["volume"],
            "polar_order_id": order_result["order_id"]
        }).eq("id", signal["id"]).execute()

        self.logger.info(f"信号执行成功: {order_result['order_id']}")
        return True

    except Exception as e:
        self.logger.error(f"信号执行失败: {e}")
        return False
```

---

## 📝 极星API规范建议

如果极星策略需要新增HTTP API,建议遵循以下规范:

### 1. 下单接口

```
POST /api/order
Content-Type: application/json
X-API-Key: your-api-key

{
  "account_id": "账户UUID",
  "symbol": "ZCE|F|TA|2505",
  "direction": "buy",        // buy/sell
  "volume": 2,
  "order_type": "market",    // market/limit
  "price": 5500.0,          // limit单必填
  "source": "lock_engine"   // 订单来源标识
}

Response:
{
  "success": true,
  "order_id": "ORD20251218001",
  "status": "filled",        // pending/partial/filled/cancelled
  "volume": 2,
  "avg_price": 5505.0,
  "commission": 10.0,
  "timestamp": "2025-12-18T10:30:00Z"
}
```

### 2. 平仓接口

```
POST /api/close_position
Content-Type: application/json
X-API-Key: your-api-key

{
  "account_id": "账户UUID",
  "symbol": "ZCE|F|TA|2505",
  "direction": "sell",       // 平多用sell,平空用buy
  "volume": 2,
  "order_type": "market"
}

Response: (同上)
```

### 3. 订单查询接口

```
GET /api/order/{order_id}
X-API-Key: your-api-key

Response:
{
  "order_id": "ORD20251218001",
  "status": "filled",
  "filled_volume": 2,
  "avg_price": 5505.0,
  "commission": 10.0
}
```

---

## ✅ 集成测试清单

完成集成后,按以下清单进行测试:

### 基础测试

- [ ] **环境变量配置**: `POLAR_API_URL`, `POLAR_API_KEY` 已设置
- [ ] **API连通性**: `curl http://极星地址/health` 返回200
- [ ] **API认证**: 使用错误API Key返回401

### 功能测试

- [ ] **锁仓下单**:
  - [ ] 触发锁仓,订单成功提交到极星
  - [ ] 极星返回订单ID
  - [ ] 成交后trades表有记录
  - [ ] lock_executions表有执行记录
  - [ ] 持仓状态正确更新

- [ ] **换月平仓**:
  - [ ] 创建换月任务
  - [ ] 执行任务,旧合约平仓成功
  - [ ] rollover_executions表有close记录
  - [ ] rollover_tasks表close字段更新

- [ ] **换月开仓**:
  - [ ] 平仓完成后自动开新仓
  - [ ] rollover_executions表有open记录
  - [ ] rollover_tasks表open字段更新
  - [ ] 换月成本计算正确

- [ ] **策略信号**:
  - [ ] 创建策略信号
  - [ ] 信号执行成功
  - [ ] strategy_signals表状态更新
  - [ ] trades表有成交记录

### 异常测试

- [ ] **网络超时**: 极星服务停止时,QuantFu返回友好错误
- [ ] **订单失败**: 极星返回失败时,状态正确记录
- [ ] **部分成交**: 极星部分成交时,数量正确记录
- [ ] **重复执行**: 同一任务不会重复下单

---

## 🔍 调试技巧

### 1. 启用详细日志

```python
# backend/utils/logger.py
import logging

logging.basicConfig(
    level=logging.DEBUG,  # 改为DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### 2. 查看请求响应

```python
# 在API调用前后添加日志
logger.debug(f"请求极星API: {url}")
logger.debug(f"请求数据: {json.dumps(data, indent=2)}")

response = requests.post(url, json=data, ...)

logger.debug(f"响应状态: {response.status_code}")
logger.debug(f"响应内容: {response.text}")
```

### 3. 使用Postman测试

```bash
# 先用Postman测试极星API是否正常
POST http://极星地址/api/order
Headers:
  Content-Type: application/json
  X-API-Key: your-key
Body:
{
  "account_id": "test",
  "symbol": "ZCE|F|TA|2505",
  "direction": "buy",
  "volume": 1,
  "order_type": "market"
}
```

---

## 📞 技术支持

**集成遇到问题?**

1. 查看后端日志: `tail -f logs/backend.log`
2. 查看极星日志: (根据极星部署方式)
3. 提交Issue: [GitHub Issues](https://github.com/allen/quantFu/issues)

**需要示例代码?**

所有集成点的TODO注释中都有详细的代码示例,直接取消注释并修改即可。

---

**集成完成后,记得更新 [PROJECT_STATUS.md](PROJECT_STATUS.md) 的进度!** 🎉
