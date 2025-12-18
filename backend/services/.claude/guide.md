# 业务服务层 (Services) 指南

> QuantFu 后端的业务服务层,封装各功能模块的业务逻辑

**⚠️ 本文档由 AI 生成 - 最后更新: 2025-12-18**

---

## 📌 模块职责

服务层是 API 层和引擎层之间的业务逻辑封装层。

**职责范围:**
- 封装具体业务功能模块
- 调用引擎层执行核心计算
- 调用工具层进行格式转换和通知
- 提供给 API 层调用的接口
- 处理复杂的业务流程

**不在范围:**
- 不直接提供 HTTP 接口(由 main.py 调用)
- 不实现核心算法(由 engines 负责)
- 不直接操作数据库底层(使用 utils.db)

---

## 📁 文件结构

```
services/
├── __init__.py                   # 模块初始化
├── contract_service.py           # 合约管理服务(17KB, ~500行)
├── kline_service.py              # K线数据服务(7.6KB, ~236行)
├── lock_trigger_service.py       # 锁仓触发服务(10.7KB, ~332行)
├── multi_strategy_service.py     # 多策略管理服务(19KB, ~586行)
├── rollover_service.py           # 换月执行服务(22.7KB, ~703行)
├── rollover_monitor.py           # 换月监控服务(9.3KB, ~288行)
├── strategy_param_service.py     # 策略参数服务(17.2KB, ~532行)
├── tqsdk_service.py              # 天勤连接服务(9.1KB, ~282行)
└── .claude/guide.md              # 本文档
```

---

## ⚙️ 核心服务模块

### 1. 合约管理服务 (ContractService)

**职责**: 合约信息同步、主力合约识别、到期提醒

**主要功能**:
- `sync_contract_info()` - 从天勤同步单个合约信息
- `sync_variety_contracts()` - 同步某品种的所有合约
- `identify_main_contract()` - 识别主力合约(持仓量最大)
- `check_contract_expiry()` - 检查合约到期
- `calculate_margin()` - 计算保证金

**使用示例**:
```python
from services.contract_service import ContractService
from services.tqsdk_service import tq_api
from utils.db import get_supabase_client

service = ContractService(tq_api, get_supabase_client())

# 同步单个合约
contract = await service.sync_contract_info("CZCE.TA2505")

# 同步整个品种
contracts = await service.sync_variety_contracts("CZCE", "TA")

# 计算保证金
margin = await service.calculate_margin(
    account_id="xxx",
    symbol="CZCE.TA2505",
    price=5500.0,
    volume=10,
    direction="long"
)
```

**品种映射**:
```python
variety_mapping = {
    "CZCE": {"TA": "PTA", "MA": "甲醇", "CF": "棉花"},
    "DCE": {"I": "铁矿石", "J": "焦炭", "JM": "焦煤"},
    "SHFE": {"RB": "螺纹钢", "CU": "铜", "AU": "黄金"},
    "INE": {"SC": "原油"},
    "CFFEX": {"IF": "沪深300股指"}
}
```

---

### 2. K线数据服务 (KlineService)

**职责**: 从天勤获取K线和实时行情

**主要功能**:
- `get_klines()` - 获取K线数据
- `get_quote()` - 获取实时行情
- `get_klines_with_positions()` - 获取K线并叠加持仓标记

**K线周期**:
| duration | 周期 |
|----------|------|
| 60 | 1分钟 |
| 300 | 5分钟 |
| 900 | 15分钟 |
| 3600 | 1小时 |
| 86400 | 日线 |

**使用示例**:
```python
from services.kline_service import KlineService

service = KlineService()

# 获取5分钟K线
klines = service.get_klines(
    symbol="CZCE.TA2505",
    duration=300,       # 5分钟
    data_length=100     # 100根K线
)

# K线数据格式
# {
#     "time": 1705308000,      # 时间戳(秒)
#     "open": 5500.0,
#     "high": 5550.0,
#     "low": 5490.0,
#     "close": 5530.0,
#     "volume": 12345
# }

# 获取实时行情
quote = service.get_quote("CZCE.TA2505")

# 获取K线+持仓标记(用于图表)
data = service.get_klines_with_positions(
    symbol="CZCE.TA2505",
    account_id="xxx-uuid",
    duration=300,
    data_length=100
)
# 返回: {klines: [...], markers: [...], position: {...}}

# 关闭连接
service.close()
```

**注意事项**:
- TqSDK 是同步库,使用时会阻塞
- 每次请求创建连接,用完立即关闭
- 连接失败会自动重试

---

### 3. 锁仓触发服务 (LockTriggerService)

**职责**: 监控持仓,检测锁仓条件,触发锁仓执行

**触发类型**:
| 类型 | 说明 | 示例 |
|-----|------|------|
| profit_ratio | 盈利比例 | 达到10%盈利时触发 |
| profit_amount | 盈利金额 | 达到5000元盈利时触发 |
| price_distance | 价格距离 | 距离开仓价100点时触发 |
| time_based | 时间触发 | 持仓超过3天时触发 |
| manual | 手动触发 | 用户主动触发 |

**使用示例**:
```python
from services.lock_trigger_service import LockTriggerService

service = LockTriggerService(supabase)

# 检查所有持仓的锁仓条件
await service.check_all_positions()

# 检查单个持仓
result = await service.check_position_lock(
    account_id="xxx-uuid",
    symbol="ZCE|F|TA|2505",
    current_price=5550.0
)

if result["should_lock"]:
    print(f"触发锁仓: {result['reason']}")
    print(f"锁定手数: {result['lock_volume']}")
```

**锁仓配置示例**:
```python
# 创建锁仓配置
config = {
    "account_id": "xxx-uuid",
    "symbol": "ZCE|F|TA|2505",
    "direction": "long",
    "trigger_type": "profit_ratio",
    "trigger_value": 0.10,          # 10%盈利
    "lock_ratio": 0.50,             # 锁定50%持仓
    "auto_execute": True,           # 自动执行
    "is_enabled": True
}
```

---

### 4. 策略参数服务 (StrategyParamService)

**职责**: 策略参数远程配置、版本控制、模板管理

**主要功能**:
- `create_strategy()` - 创建策略定义
- `add_param_definition()` - 添加参数定义
- `create_instance()` - 创建策略实例
- `set_param()` - 设置单个参数
- `batch_set_params()` - 批量设置参数
- `get_param_history()` - 获取参数变更历史
- `rollback_param()` - 回滚参数到上一版本
- `create_template()` - 创建参数模板
- `apply_template()` - 应用参数模板

**参数类型**:
- `int` - 整数
- `float` - 浮点数
- `bool` - 布尔值
- `string` - 字符串
- `select` - 下拉选择
- `json` - JSON对象

**使用示例**:
```python
from services.strategy_param_service import StrategyParamService

service = StrategyParamService(supabase)

# 1. 创建策略定义
strategy = await service.create_strategy(
    name="grid_trading",
    display_name="网格交易策略",
    version="1.0.0",
    category="套利",
    risk_level="medium"
)

# 2. 添加参数定义
await service.add_param_definition(
    strategy_id=strategy["id"],
    param_key="grid_interval",
    param_name="网格间距",
    param_type="int",
    default_value=50,
    min_value=10,
    max_value=200,
    unit="点",
    description="每个网格之间的价格间距"
)

# 3. 创建策略实例
instance = await service.create_instance(
    strategy_id=strategy["id"],
    account_id="xxx-uuid",
    instance_name="TA2505网格",
    symbols=["ZCE|F|TA|2505"]
)

# 4. 设置参数
await service.set_param(
    instance_id=instance["id"],
    param_key="grid_interval",
    param_value=100,
    changed_by="allen",
    change_reason="市场波动增大,调大网格间距"
)

# 5. 批量设置
await service.batch_set_params(
    instance_id=instance["id"],
    params={
        "grid_interval": 100,
        "order_volume": 2,
        "max_position": 20
    },
    changed_by="allen",
    change_reason="优化参数组合"
)

# 6. 查看变更历史
history = await service.get_param_history(
    instance_id=instance["id"],
    param_key="grid_interval",
    limit=10
)

# 7. 回滚参数
await service.rollback_param(
    instance_id=instance["id"],
    param_key="grid_interval",
    changed_by="allen"
)
```

**参数模板**:
```python
# 创建模板
template = await service.create_template(
    strategy_id=strategy["id"],
    template_name="保守型网格",
    params={
        "grid_interval": 100,
        "order_volume": 1,
        "max_position": 10
    },
    description="适合小资金账户的保守型参数",
    risk_level="low",
    created_by="allen"
)

# 应用模板
await service.apply_template(
    instance_id=instance["id"],
    template_id=template["id"],
    changed_by="allen"
)
```

---

### 5. 换月管理服务 (RolloverService)

**职责**: 合约换月监控、任务创建、自动执行

**换月策略**:
| 策略 | 说明 |
|-----|------|
| auto | 主力合约切换时自动换月 |
| manual | 手动换月 |
| threshold | 持仓量比例阈值触发 |
| time_based | 固定时间触发(到期前N天) |

**主要功能**:
- `create_config()` - 创建换月配置
- `get_configs()` - 获取换月配置
- `create_task()` - 创建换月任务
- `execute_rollover()` - 执行换月
- `update_task_status()` - 更新任务状态

**使用示例**:
```python
from services.rollover_service import RolloverService

service = RolloverService(supabase)

# 创建换月配置
config = await service.create_config(
    account_id="xxx-uuid",
    exchange="CZCE",
    variety_code="TA",
    rollover_strategy="auto",       # 自动换月
    rollover_threshold=0.7,         # 新主力持仓量达到70%时触发
    days_before_expiry=7,           # 到期前7天强制换月
    auto_execute=False,             # 需手动确认
    rollover_ratio=1.0,             # 全部换月
    price_mode="market"             # 市价单
)

# 获取换月任务
tasks = await service.get_tasks(
    account_id="xxx-uuid",
    status="pending"
)

# 执行换月
success = await service.execute_rollover(task_id)
```

**换月流程**:
```
1. 监控主力合约切换
2. 检测到期合约
3. 创建换月任务
4. (可选)等待用户确认
5. 执行换月:
   - 平掉旧合约持仓
   - 开新合约持仓
6. 记录换月结果
7. 更新统计数据
```

---

### 6. 多策略管理服务 (MultiStrategyService)

**职责**: 多策略协同、资源分配、冲突处理

**主要功能**:
- `create_group()` - 创建策略组
- `add_member()` - 添加策略到组
- `remove_member()` - 从组移除策略
- `create_signal()` - 创建交易信号
- `process_signal()` - 处理交易信号
- `check_conflicts()` - 检查策略冲突
- `resolve_conflict()` - 解决冲突
- `get_performance()` - 获取策略性能
- `get_resource_usage()` - 获取资源使用情况

**使用示例**:
```python
from services.multi_strategy_service import MultiStrategyService

service = MultiStrategyService(supabase)

# 创建策略组
group = await service.create_group(
    account_id="xxx-uuid",
    group_name="TA品种组",
    total_capital=1000000.0,        # 总资金100万
    max_position_ratio=0.8,         # 最大持仓80%
    max_risk_per_strategy=0.2,      # 单策略最大风险20%
    allow_opposite_positions=True,  # 允许对冲持仓
    position_conflict_mode="merge"  # 冲突处理:合并信号
)

# 添加策略成员
await service.add_member(
    group_id=group["id"],
    instance_id="strategy1-uuid",
    capital_allocation=500000.0,    # 分配50万资金
    position_limit=10,              # 最大持仓10手
    priority=1                      # 优先级1(最高)
)

# 创建交易信号
signal = await service.create_signal(
    instance_id="strategy1-uuid",
    symbol="ZCE|F|TA|2505",
    signal_type="open",
    direction="long",
    volume=5,
    price=5500.0,
    confidence=0.85,
    strength="strong"
)

# 处理信号(自动检查冲突、资源限制)
success = await service.process_signal(signal["id"])
```

**冲突处理模式**:
- `allow` - 允许冲突,各自执行
- `reject` - 拒绝后来的信号
- `merge` - 合并信号(对冲时抵消)
- `priority` - 按优先级选择

---

### 7. 天勤连接服务 (TqSdkService)

**职责**: 管理天勤API连接,提供全局单例

**使用示例**:
```python
from services.tqsdk_service import tq_api

# 使用全局单例
api = tq_api

# 获取行情
quote = api.get_quote("CZCE.TA2505")

# 获取K线
klines = api.get_kline_serial("CZCE.TA2505", 300, 100)
```

**注意**: 全局单例模式,所有模块共享同一个连接

---

### 8. 换月监控服务 (RolloverMonitor)

**职责**: 后台定时监控合约到期和主力切换

**主要功能**:
- `start()` - 启动监控
- `stop()` - 停止监控
- `check_expiring_contracts()` - 检查到期合约
- `check_main_contract_switch()` - 检查主力切换

**使用示例**:
```python
from services.rollover_monitor import RolloverMonitor

monitor = RolloverMonitor(supabase)

# 启动监控(后台任务)
await monitor.start()

# 停止监控
await monitor.stop()
```

**监控周期**:
- 到期检查: 每天 09:00
- 主力切换检查: 每天 15:00

---

## 🔗 依赖关系

### 服务间依赖

```
ContractService
  └── TqSdkService

KlineService
  └── TqSdkService

LockTriggerService
  └── LockEngine

RolloverService
  └── ContractService

MultiStrategyService
  └── StrategyParamService
```

### 被 API 层调用

所有服务都被 `main.py` 中的 API 路由调用。

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建业务服务层文档 | AI |
| 2025-12-18 | 整理 | 补充各服务模块说明 | AI |

---

## 🎯 最佳实践

### 1. 服务初始化

```python
# ✅ 推荐:注入依赖
from utils.db import get_supabase_client

supabase = get_supabase_client()
service = ContractService(tq_api, supabase)

# ❌ 不推荐:在服务内创建依赖
class MyService:
    def __init__(self):
        self.db = create_client(...)  # 不应在这里创建
```

### 2. 错误处理

```python
# ✅ 推荐:记录日志并抛出异常
try:
    result = await service.do_something()
except Exception as e:
    logger.error(f"操作失败: {e}")
    raise

# ❌ 不推荐:吞掉异常
try:
    result = await service.do_something()
except:
    pass  # 不记录,不处理
```

### 3. 异步操作

```python
# ✅ 推荐:使用 async/await
async def handle_request():
    result = await service.async_method()
    return result

# ❌ 不推荐:阻塞操作
def handle_request():
    result = service.sync_method()  # 阻塞事件循环
    return result
```

---

## ⚠️ 注意事项

### 1. TqSDK 连接

- 同步库,会阻塞
- 用完立即关闭
- 不要在异步环境长期持有连接

### 2. 数据库事务

- 复杂操作使用事务
- 关键操作保证原子性
- 失败时回滚

### 3. 性能优化

- 批量操作优于循环单次操作
- 使用数据库视图简化查询
- 缓存频繁访问的数据

---

## 🐛 常见问题

### Q: 如何添加新的服务模块?

A: 创建新文件并实现服务类:

```python
# services/my_service.py
from typing import Dict, Any
from supabase import Client
import logging

logger = logging.getLogger(__name__)

class MyService:
    """我的服务"""

    def __init__(self, db: Client):
        self.db = db
        self.logger = logger

    async def my_method(self) -> Dict[str, Any]:
        """服务方法"""
        try:
            # 业务逻辑
            result = await self._do_something()
            return result
        except Exception as e:
            self.logger.error(f"操作失败: {e}")
            raise
```

### Q: 服务层应该做什么,不应该做什么?

A:
- ✅ **应该**: 封装业务逻辑、调用引擎、格式转换、数据验证
- ❌ **不应该**: 直接操作 HTTP、实现核心算法、提供 API 接口

---

## 🔗 相关文档

- [后端总体架构](../../.claude/guide.md)
- [数据模型文档](../../models/.claude/guide.md)
- [工具函数文档](../../utils/.claude/guide.md)
- [引擎模块文档](../../engines/.claude/guide.md)

---

**文档维护者**: AI Assistant
**项目负责人**: allen
**最后审核**: 2025-12-18
