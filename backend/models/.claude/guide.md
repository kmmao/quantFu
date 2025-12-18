# 数据模型层 (Models) 指南

> QuantFu 后端的数据模型定义,使用 Pydantic 进行数据验证和序列化

**⚠️ 本文档由 AI 生成 - 最后更新: 2025-12-18**

---

## 📌 模块职责

数据模型层负责定义所有 API 的请求和响应数据结构。

**职责范围:**
- 定义极星推送数据的模型(成交、持仓快照)
- 定义 API 响应数据模型(持仓、合约、账户等)
- 定义 WebSocket 消息模型
- 提供数据验证和类型检查
- 自动生成 API 文档的 Schema

**不在范围:**
- 不包含业务逻辑
- 不直接操作数据库
- 不处理数据转换(由 Service 层负责)

---

## 📁 文件结构

```
models/
├── __init__.py           # 模块初始化,导出常用模型
├── schemas.py            # 所有 Pydantic 数据模型(158行)
└── .claude/guide.md      # 本文档
```

### 文件说明

- **schemas.py**: 所有数据模型定义,使用 Pydantic BaseModel

---

## ⚙️ 主要数据模型

### 1. 极星推送数据模型

#### TradeEvent - 成交事件

极星策略推送的每笔成交数据。

```python
class TradeEvent(BaseModel):
    """成交事件(极星推送)"""
    account_id: str          # 账户ID(极星账户ID)
    symbol: str              # 合约代码(极星格式: ZCE|F|TA|2505)
    direction: str           # 方向: buy/sell
    offset: str              # 开平: open/close
    volume: int              # 成交手数
    price: float             # 成交价格
    order_id: Optional[str]  # 订单ID
    timestamp: datetime      # 成交时间
    source: str = "polar"    # 数据来源
```

**使用场景**: POST `/api/trades` 接口接收极星成交推送

**示例**:
```python
trade = TradeEvent(
    account_id="85178443",
    symbol="ZCE|F|TA|2505",
    direction="buy",
    offset="open",
    volume=2,
    price=5500.0,
    order_id="ORDER123456",
    timestamp=datetime.now(),
    source="polar"
)
```

**字段约束**:
- `direction`: 必须是 "buy" 或 "sell"
- `offset`: 必须是 "open" 或 "close"
- `volume`: 必须 > 0
- `price`: 必须 > 0

#### PositionSnapshot - 持仓快照

极星定时推送的持仓快照,用于对账。

```python
class PositionSnapshot(BaseModel):
    """持仓快照(极星定时推送,用于对账)"""
    account_id: str          # 账户ID
    symbol: str              # 合约代码
    long_position: int       # 多仓手数
    short_position: int      # 空仓手数
    long_avg_price: float    # 多仓均价
    short_avg_price: float   # 空仓均价
    long_profit: float       # 多仓浮盈
    short_profit: float      # 空仓浮盈
    timestamp: datetime      # 快照时间
```

**使用场景**: POST `/api/position_snapshots` 接口接收持仓快照

**对账逻辑**:
1. 接收极星快照
2. 查询后端计算的持仓
3. 比较 `long_position` 和 `short_position` 是否一致
4. 记录对账结果到 `position_snapshots` 表
5. 不一致时发送告警

---

### 2. API 响应模型

#### Position - 持仓详情

后端返回的持仓信息。

```python
class Position(BaseModel):
    """持仓详情"""
    id: Optional[str]                  # 持仓记录ID
    account_id: str                    # 账户ID
    symbol: str                        # 合约代码
    variety_name: Optional[str]        # 品种名称(如 PTA)
    exchange: Optional[str]            # 交易所(ZCE/DCE/SHFE/INE/CFFEX)

    # 多头持仓
    long_position: int = 0             # 多仓手数
    long_avg_price: Optional[Decimal]  # 多仓均价
    long_profit: Decimal = Decimal('0')# 多仓浮盈

    # 空头持仓
    short_position: int = 0            # 空仓手数
    short_avg_price: Optional[Decimal] # 空仓均价
    short_profit: Decimal = Decimal('0')# 空仓浮盈

    # 锁仓状态
    is_long_locked: bool = False       # 多仓是否锁定
    long_lock_price: Optional[Decimal] # 多仓锁定价格
    is_short_locked: bool = False      # 空仓是否锁定
    short_lock_price: Optional[Decimal]# 空仓锁定价格

    # 实时行情
    last_price: Optional[Decimal]      # 最新价格
    last_update_time: Optional[datetime]# 最后更新时间

    updated_at: Optional[datetime]     # 记录更新时间
```

**使用场景**: GET `/api/positions/{account_id}` 接口返回

**计算逻辑**:
- 持仓数据来自 `v_positions_summary` 视图
- 浮盈 = (最新价 - 均价) × 持仓量 × 合约乘数
- 多仓浮盈正数表示盈利,负数表示亏损
- 空仓浮盈 = (均价 - 最新价) × 持仓量 × 合约乘数

#### Account - 账户信息

```python
class Account(BaseModel):
    """账户信息"""
    id: Optional[str]           # UUID
    account_name: str           # 账户名称
    polar_account_id: str       # 极星账户ID(如 85178443)
    broker: Optional[str]       # 期货公司
    user_id: Optional[str]      # 用户ID
    status: str = "active"      # 状态: active/inactive
    notes: Optional[str]        # 备注
    created_at: Optional[datetime]
```

**使用场景**: 账户管理接口(当前未暴露 API,仅内部使用)

#### Contract - 合约信息

```python
class Contract(BaseModel):
    """合约信息"""
    id: Optional[str]                   # UUID
    variety_code: str                   # 品种代码(如 TA)
    variety_name: Optional[str]         # 品种名称(如 PTA)
    exchange: str                       # 交易所
    polar_symbol: str                   # 极星格式(ZCE|F|TA|2505)
    tqsdk_symbol: str                   # 天勤格式(CZCE.TA2505)
    is_main: bool = False               # 是否主力合约
    contract_month: Optional[str]       # 合约月份(2505)
    expiry_date: Optional[datetime]     # 到期日
    multiplier: Optional[int]           # 合约乘数
    price_tick: Optional[Decimal]       # 最小变动价位
    margin_ratio: Optional[Decimal]     # 保证金比例
```

**使用场景**: GET `/api/contracts` 等合约管理接口

---

### 3. 通用响应模型

#### ResponseModel - 标准响应格式

所有 API 的统一响应格式。

```python
class ResponseModel(BaseModel):
    """通用响应模型"""
    code: int = 200                     # 状态码
    message: str = "success"            # 消息
    data: Optional[dict] = None         # 数据
```

**使用示例**:

```python
# 成功响应
return ResponseModel(
    code=200,
    message="Operation successful",
    data={"id": "123", "result": "ok"}
)

# 错误响应
return ResponseModel(
    code=400,
    message="Invalid parameters",
    data=None
)
```

#### PositionListResponse - 持仓列表响应

```python
class PositionListResponse(BaseModel):
    """持仓列表响应"""
    total: int                  # 总数
    positions: list[Position]   # 持仓列表
```

**使用场景**: GET `/api/positions/{account_id}` 返回

---

### 4. WebSocket 消息模型

#### WSMessage - WebSocket 消息

```python
class WSMessage(BaseModel):
    """WebSocket消息"""
    type: str                           # 消息类型: trade/position/quote/notification
    data: dict                          # 消息数据
    timestamp: datetime                 # 时间戳
```

**消息类型**:
- `trade`: 成交推送
- `position`: 持仓变化推送
- `quote`: 实时行情推送
- `notification`: 系统通知

**使用场景**: WebSocket `/ws/positions` (待实现)

---

## 🔗 依赖关系

### 外部依赖

```python
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional
```

### 被依赖方

- **main.py**: 所有 API 接口使用这些模型
- **engines/position_engine.py**: 使用 Position 模型
- **services/***: 各服务层使用相关模型

---

## 🎯 使用示例

### 1. 在 API 中使用模型

```python
from models.schemas import TradeEvent, ResponseModel, Position

@app.post("/api/trades", response_model=ResponseModel)
async def receive_trade(trade: TradeEvent):
    """接收成交数据"""
    # trade 已自动验证和解析
    print(f"收到成交: {trade.symbol} {trade.direction} {trade.volume}手")

    # 业务处理...

    return ResponseModel(
        code=200,
        message="Trade received",
        data={"trade_id": trade.order_id}
    )
```

### 2. 数据验证

Pydantic 自动验证输入数据:

```python
# 有效数据
trade = TradeEvent(
    account_id="85178443",
    symbol="ZCE|F|TA|2505",
    direction="buy",      # 必须是 buy 或 sell
    offset="open",        # 必须是 open 或 close
    volume=2,             # 必须 > 0
    price=5500.0,         # 必须 > 0
    timestamp=datetime.now()
)

# 无效数据会抛出 ValidationError
try:
    trade = TradeEvent(
        account_id="85178443",
        symbol="ZCE|F|TA|2505",
        direction="invalid",  # ❌ 不是 buy/sell
        offset="open",
        volume=-1,            # ❌ 不是正数
        price=5500.0,
        timestamp=datetime.now()
    )
except ValidationError as e:
    print(e.errors())
```

### 3. 模型转换

```python
# 从数据库查询结果转换为 Position 模型
db_result = supabase.table("positions").select("*").execute()

positions = [Position(**pos) for pos in db_result.data]

# 转换为 JSON
position_json = position.model_dump()

# 转换为 JSON 字符串
position_str = position.model_dump_json()
```

### 4. 自定义验证

```python
from pydantic import BaseModel, Field, field_validator

class TradeEvent(BaseModel):
    volume: int = Field(..., gt=0, description="成交手数")
    price: float = Field(..., gt=0, description="成交价格")

    @field_validator('direction')
    @classmethod
    def validate_direction(cls, v):
        if v not in ['buy', 'sell']:
            raise ValueError('direction must be buy or sell')
        return v
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建数据模型文档 | AI |
| 2025-12-18 | 整理 | 补充模型说明和使用示例 | AI |

---

## 🎯 最佳实践

### 1. 使用 Optional 表示可选字段

```python
class Position(BaseModel):
    id: str                           # 必需字段
    symbol: str                       # 必需字段
    variety_name: Optional[str] = None # 可选字段,默认 None
    last_price: Optional[Decimal]     # 可选字段
```

### 2. 使用 Field 添加约束和文档

```python
from pydantic import Field

class TradeEvent(BaseModel):
    volume: int = Field(..., gt=0, description="成交手数,必须大于0")
    price: float = Field(..., gt=0, description="成交价格,必须大于0")
    direction: str = Field(..., pattern="^(buy|sell)$", description="方向")
```

### 3. 使用 Decimal 处理金额

避免浮点数精度问题:

```python
from decimal import Decimal

class Position(BaseModel):
    long_avg_price: Optional[Decimal]  # ✅ 使用 Decimal
    long_profit: Decimal = Decimal('0')

# 不要使用 float
# long_avg_price: float  # ❌ 可能有精度问题
```

### 4. 提供示例数据

```python
class TradeEvent(BaseModel):
    # ... 字段定义 ...

    class Config:
        json_schema_extra = {
            "example": {
                "account_id": "85178443",
                "symbol": "ZCE|F|TA|2505",
                "direction": "buy",
                "offset": "open",
                "volume": 2,
                "price": 5500.0,
                "timestamp": "2025-01-15T10:30:00"
            }
        }
```

### 5. 模型继承

复用通用字段:

```python
class BaseResponse(BaseModel):
    code: int = 200
    message: str = "success"

class DataResponse(BaseResponse):
    data: dict

class ErrorResponse(BaseResponse):
    error: str
```

---

## ⚠️ 注意事项

### 1. 时间字段处理

- 使用 `datetime` 类型,不要用字符串
- Pydantic 自动处理 ISO 8601 格式转换
- 时区注意:存储时建议使用 UTC

```python
# ✅ 推荐
timestamp: datetime

# ❌ 不推荐
timestamp: str
```

### 2. 数值精度

- 金额使用 `Decimal`,不用 `float`
- 价格、保证金等财务数据都用 `Decimal`
- 手数等整数用 `int`

```python
# ✅ 推荐
price: Decimal
volume: int

# ❌ 不推荐(精度问题)
price: float
```

### 3. 字段命名

- 使用 snake_case(Python 风格)
- 与数据库字段名保持一致
- 避免使用 Python 关键字

```python
# ✅ 推荐
long_position: int
short_avg_price: Decimal

# ❌ 不推荐
longPosition: int  # 不符合 Python 风格
class: str         # 使用了关键字
```

### 4. 默认值

- 可选字段使用 `Optional[Type]`
- 提供合理的默认值
- 必需字段使用 `...` 占位符

```python
# 必需字段
symbol: str = Field(..., description="合约代码")

# 可选字段
variety_name: Optional[str] = None

# 有默认值
status: str = "active"
long_position: int = 0
```

### 5. 模型配置

使用 `Config` 类配置模型行为:

```python
class Position(BaseModel):
    # ... 字段定义 ...

    class Config:
        from_attributes = True  # 允许从 ORM 对象创建
        json_encoders = {       # 自定义 JSON 编码
            Decimal: lambda v: float(v)
        }
```

---

## 🐛 常见问题

### Q: ValidationError: field required

A: 检查是否所有必需字段都提供了值:

```python
# ❌ 缺少必需字段
trade = TradeEvent(
    account_id="85178443"
    # 缺少 symbol, direction, offset, volume, price, timestamp
)

# ✅ 提供所有必需字段
trade = TradeEvent(
    account_id="85178443",
    symbol="ZCE|F|TA|2505",
    direction="buy",
    offset="open",
    volume=2,
    price=5500.0,
    timestamp=datetime.now()
)
```

### Q: 如何处理嵌套模型?

A: 定义子模型并引用:

```python
class Address(BaseModel):
    city: str
    street: str

class User(BaseModel):
    name: str
    address: Address  # 嵌套模型

user = User(
    name="Allen",
    address=Address(city="Shanghai", street="Main St")
)
```

### Q: 如何处理列表字段?

A: 使用 `list[Type]` 语法:

```python
from typing import List

class PositionListResponse(BaseModel):
    total: int
    positions: list[Position]  # Python 3.9+

    # 或使用 typing.List (兼容旧版本)
    # positions: List[Position]
```

### Q: 如何添加自定义验证?

A: 使用 `@field_validator`:

```python
from pydantic import field_validator

class TradeEvent(BaseModel):
    symbol: str
    volume: int

    @field_validator('volume')
    @classmethod
    def volume_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('volume must be positive')
        return v

    @field_validator('symbol')
    @classmethod
    def symbol_must_be_valid_format(cls, v):
        if '|' not in v:
            raise ValueError('symbol must be in Polar format')
        return v
```

### Q: 如何处理枚举类型?

A: 使用 Python Enum:

```python
from enum import Enum

class Direction(str, Enum):
    BUY = "buy"
    SELL = "sell"

class Offset(str, Enum):
    OPEN = "open"
    CLOSE = "close"

class TradeEvent(BaseModel):
    direction: Direction  # 只能是 buy 或 sell
    offset: Offset        # 只能是 open 或 close
```

---

## 🔗 相关文档

- [后端总体架构](../../.claude/guide.md)
- [工具函数文档](../../utils/.claude/guide.md)
- [引擎模块文档](../../engines/.claude/guide.md)
- [业务服务文档](../../services/.claude/guide.md)
- [Pydantic 官方文档](https://docs.pydantic.dev/)

---

**文档维护者**: AI Assistant
**项目负责人**: allen
**最后审核**: 2025-12-18
