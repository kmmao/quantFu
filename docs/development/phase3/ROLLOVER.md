# 阶段3 - 换月自动执行功能文档

## 功能概述

换月自动执行功能提供完整的期货合约换月管理能力,支持主力合约切换触发、到期自动换月、手动换月和换月统计分析。

## 核心功能

### 1. 换月配置管理

#### 配置项
- **换月策略**: auto(自动) / manual(手动) / threshold(阈值)
- **换月阈值**: 基于换月指数触发(默认0.7)
- **到期天数**: 提前几天换月(默认7天)
- **触发条件**: 主力切换触发 / 到期触发
- **执行方式**: 自动执行 / 手动确认
- **换月比例**: 换月持仓的比例(0-1)
- **价格模式**: market(市价) / limit(限价) / optimal(最优价)

### 2. 换月任务管理

#### 任务触发
- **主力切换触发**: 监控主力合约切换,自动创建换月任务
- **到期触发**: 监控合约到期日,提前创建换月任务
- **手动创建**: 用户手动创建换月任务

#### 任务状态
- pending: 待执行
- executing: 执行中
- completed: 已完成
- failed: 失败
- cancelled: 已取消

### 3. 换月执行

#### 执行流程
1. **平旧仓**: 平掉旧合约持仓
2. **开新仓**: 开立新合约持仓
3. **记录执行**: 记录每一步的执行详情

#### 执行模式
- **自动执行**: 满足条件立即执行
- **手动执行**: 需要用户确认后执行

### 4. 换月统计

#### 统计维度
- 按账户统计
- 按品种统计
- 按月份统计

#### 统计指标
- 换月次数(总数/自动/手动)
- 换月成本(总成本/平均成本)
- 成功率

### 5. 换月通知

#### 通知时机
- 任务创建时
- 任务完成时
- 任务失败时

#### 通知内容
- 合约切换信息
- 持仓和换月数量
- 成本统计

## 数据库设计

### 表结构

#### 1. rollover_configs (换月配置表)
```sql
- id: UUID
- account_id: 账户ID
- variety_code: 品种代码
- exchange: 交易所代码
- rollover_strategy: 换月策略(auto/manual/threshold)
- rollover_threshold: 换月阈值
- days_before_expiry: 到期前多少天换月
- trigger_on_main_switch: 主力切换时触发
- auto_execute: 是否自动执行
- rollover_ratio: 换月比例
- price_mode: 价格模式(market/limit/optimal)
- price_slippage: 价格滑点容忍度
- is_enabled: 是否启用
```

#### 2. rollover_tasks (换月任务表)
```sql
- id: UUID
- config_id: 配置ID(外键)
- account_id: 账户ID
- old_symbol: 旧合约
- new_symbol: 新合约
- variety_name: 品种名称
- direction: 持仓方向(long/short)
- old_position: 旧合约持仓量
- rollover_volume: 计划换月数量
- trigger_type: 触发类型(main_switch/expiry/manual)
- trigger_time: 触发时间
- rollover_index: 触发时的换月指数
- status: 状态(pending/executing/completed/failed/cancelled)
- execution_mode: 执行模式(auto/manual)
- close_volume: 已平仓数量
- open_volume: 已开仓数量
- close_avg_price: 平仓均价
- open_avg_price: 开仓均价
- close_cost: 平仓成本
- open_cost: 开仓成本
- price_diff: 价差
- rollover_cost: 换月总成本
- started_at: 开始时间
- completed_at: 完成时间
- execution_duration_ms: 执行时长
- error_message: 错误信息
- retry_count: 重试次数
```

#### 3. rollover_executions (换月执行记录表)
```sql
- id: UUID
- task_id: 任务ID(外键)
- step_type: 步骤类型(close/open)
- symbol: 合约代码
- direction: 方向
- volume: 数量
- price: 价格
- polar_order_id: 极星订单ID
- order_status: 订单状态
- commission: 手续费
- executed_at: 执行时间
```

#### 4. rollover_statistics (换月统计表)
```sql
- id: UUID
- account_id: 账户ID
- variety_code: 品种代码
- year_month: 统计月份(YYYY-MM)
- total_rollovers: 总换月次数
- auto_rollovers: 自动换月次数
- manual_rollovers: 手动换月次数
- total_cost: 总成本
- avg_cost: 平均成本
- success_count: 成功次数
- failed_count: 失败次数
- success_rate: 成功率
```

### 视图

#### v_pending_rollover_tasks
待执行换月任务视图,包含配置信息

#### v_rollover_task_summary
换月任务汇总视图,包含完成率计算

#### v_rollover_configs_summary
换月配置汇总视图,包含任务统计

### 触发器

#### trigger_update_rollover_statistics
任务完成或失败时自动更新统计数据

## API接口

### 配置管理接口

#### GET /api/rollover/configs
获取换月配置列表

**Query Parameters:**
- `account_id`: 账户ID(可选)

#### POST /api/rollover/configs
创建换月配置

**Request Body:**
```json
{
  "account_id": "account123",
  "exchange": "CZCE",
  "variety_code": "TA",
  "rollover_strategy": "auto",
  "rollover_threshold": 0.7,
  "days_before_expiry": 7,
  "auto_execute": false,
  "rollover_ratio": 1.0,
  "price_mode": "market"
}
```

#### PUT /api/rollover/configs/{config_id}
更新换月配置

#### DELETE /api/rollover/configs/{config_id}
删除换月配置

### 任务管理接口

#### GET /api/rollover/tasks
获取换月任务列表

**Query Parameters:**
- `account_id`: 账户ID(可选)
- `status`: 状态(可选)
- `limit`: 返回记录数(默认50)

**Response:**
```json
{
  "code": 200,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "account_id": "account123",
        "variety_name": "PTA",
        "old_symbol": "CZCE.TA2505",
        "new_symbol": "CZCE.TA2509",
        "direction": "long",
        "old_position": 100,
        "rollover_volume": 100,
        "close_volume": 100,
        "open_volume": 100,
        "status": "completed",
        "trigger_type": "main_switch",
        "rollover_cost": 1050.00,
        "trigger_time": "2025-12-18T10:00:00Z",
        "completed_at": "2025-12-18T10:05:00Z",
        "completion_rate": 100.00
      }
    ]
  }
}
```

#### POST /api/rollover/tasks
手动创建换月任务

**Request Body:**
```json
{
  "config_id": "uuid",
  "account_id": "account123",
  "old_symbol": "CZCE.TA2505",
  "new_symbol": "CZCE.TA2509",
  "variety_name": "PTA",
  "direction": "long",
  "old_position": 100,
  "rollover_volume": 100,
  "trigger_type": "manual"
}
```

#### POST /api/rollover/tasks/{task_id}/execute
执行换月任务

#### POST /api/rollover/tasks/{task_id}/cancel
取消换月任务

### 统计接口

#### GET /api/rollover/statistics
获取换月统计

**Query Parameters:**
- `account_id`: 账户ID(可选)
- `year_month`: 统计月份YYYY-MM(可选)

**Response:**
```json
{
  "code": 200,
  "data": {
    "statistics": [
      {
        "account_id": "account123",
        "variety_code": "TA",
        "year_month": "2025-12",
        "total_rollovers": 5,
        "auto_rollovers": 3,
        "manual_rollovers": 2,
        "total_cost": 5250.00,
        "avg_cost": 1050.00,
        "success_count": 5,
        "failed_count": 0,
        "success_rate": 100.00
      }
    ]
  }
}
```

## 后端服务

### RolloverService

换月执行服务类,负责:
- 换月配置管理
- 换月任务创建
- 换月执行
- 主力切换监控
- 到期合约监控
- 待执行任务处理

#### 关键方法

```python
# 创建换月配置
async def create_config(
    account_id, exchange, variety_code,
    rollover_strategy, rollover_threshold,
    days_before_expiry, auto_execute, **kwargs
) -> Dict

# 获取配置列表
async def get_configs(account_id) -> List[Dict]

# 创建换月任务
async def create_task(
    config_id, account_id, old_symbol, new_symbol,
    variety_name, direction, old_position,
    rollover_volume, trigger_type, rollover_index
) -> Dict

# 获取待执行任务
async def get_pending_tasks() -> List[Dict]

# 更新任务状态
async def update_task_status(task_id, status, error_message, **kwargs)

# 执行换月
async def execute_rollover(task_id) -> bool

# 检查主力切换
async def check_main_contract_switches()

# 检查到期合约
async def check_expiring_contracts()

# 处理待执行任务
async def process_pending_tasks()

# 启动监控服务
async def start_monitoring(interval=300)
```

### 换月执行流程

```python
async def execute_rollover(task_id):
    # 1. 更新状态为执行中
    update_task_status(task_id, "executing")

    # 2. 平旧仓
    close_success = await _close_old_position(task)
    if not close_success:
        update_task_status(task_id, "failed")
        return False

    # 3. 开新仓
    open_success = await _open_new_position(task)
    if not open_success:
        update_task_status(task_id, "failed")
        return False

    # 4. 更新状态为已完成
    update_task_status(task_id, "completed")

    # 5. 发送完成通知
    send_notification(...)

    return True
```

## 使用场景

### 场景1: 配置自动换月

```python
# 为账户配置PTA品种的自动换月
config = await service.create_config(
    account_id="account123",
    exchange="CZCE",
    variety_code="TA",
    rollover_strategy="auto",         # 自动策略
    rollover_threshold=0.7,           # 换月指数阈值
    trigger_on_main_switch=True,      # 主力切换触发
    auto_execute=False,               # 需要手动确认
    rollover_ratio=1.0                # 全部换月
)
```

### 场景2: 监控触发换月任务

```python
# 监控服务检测到主力切换
# 自动创建换月任务

# 用户收到通知:
# "换月任务创建: PTA
#  合约: CZCE.TA2505 → CZCE.TA2509
#  持仓: 100 手
#  换月: 100 手
#  触发: main_switch"
```

### 场景3: 执行换月任务

```python
# 获取待执行任务
tasks = await service.get_pending_tasks()

# 对于auto_execute=True的任务,自动执行
for task in tasks:
    if task["auto_execute"]:
        await service.execute_rollover(task["id"])

# 对于auto_execute=False的任务,需要手动确认
# 用户在前端点击"执行"按钮后:
await service.execute_rollover(task_id)

# 执行流程:
# 1. 平仓旧合约 CZCE.TA2505 多头 100手
# 2. 开仓新合约 CZCE.TA2509 多头 100手
# 3. 记录成本和价差
# 4. 发送完成通知
```

### 场景4: 查看换月统计

```python
# 查看本月换月统计
stats = await service.get_statistics(
    account_id="account123",
    year_month="2025-12"
)

# 统计显示:
# 总换月次数: 5次
# 自动换月: 3次
# 手动换月: 2次
# 总成本: 5250元
# 平均成本: 1050元/次
# 成功率: 100%
```

## 监控机制

### 监控循环

```python
async def start_monitoring(interval=300):
    """
    启动监控服务
    interval: 监控间隔(秒), 默认5分钟
    """
    while True:
        # 1. 检查主力合约切换
        await check_main_contract_switches()

        # 2. 检查到期合约
        await check_expiring_contracts()

        # 3. 处理待执行任务
        await process_pending_tasks()

        await asyncio.sleep(interval)
```

### 触发条件判断

**主力切换触发:**
```python
# 检查是否满足换月阈值
if rollover_index >= config["rollover_threshold"]:
    # 创建换月任务
    create_task(...)
```

**到期触发:**
```python
# 检查是否到达换月日期
days_to_expiry = (expire_date - today).days
if days_to_expiry <= config["days_before_expiry"]:
    # 创建换月任务
    create_task(...)
```

## 成本计算

### 换月总成本

```python
rollover_cost = close_cost + open_cost + price_diff_cost

where:
- close_cost = 平仓手续费
- open_cost = 开仓手续费
- price_diff_cost = (新合约价格 - 旧合约价格) × 数量 × 合约乘数
```

### 成本优化策略

1. **最优价模式**: 等待更好的价格时机
2. **限价模式**: 设置价格上下限
3. **市价模式**: 立即成交,不考虑价差

## 注意事项

1. **模拟执行**: 当前实现是模拟版本,实际需要调用极星API或TqSDK下单

2. **价格获取**: 需要实时获取旧合约和新合约的最新价格

3. **订单管理**: 需要跟踪订单状态,处理部分成交、撤单等情况

4. **错误处理**:
   - 平仓失败时不应开新仓
   - 支持任务重试
   - 记录详细错误信息

5. **资金检查**: 执行前检查账户可用资金是否足够

6. **滑点控制**: 根据price_slippage设置价格容忍度

7. **并发控制**: 同一账户同一品种不应有多个进行中的换月任务

## 前端界面(待实现)

### 换月配置页面
- 配置列表
- 创建/编辑配置
- 启用/禁用配置

### 换月任务页面
- 任务列表(待执行/执行中/已完成)
- 任务详情
- 执行/取消按钮
- 执行进度

### 换月统计页面
- 统计图表
- 成本分析
- 成功率趋势

## 部署和配置

### 1. 运行数据库迁移

```bash
cd database/migrations
psql -h localhost -U postgres -d quantfu -f 006_rollover_execution.sql
```

### 2. 启动换月监控服务

```python
# 在后端主程序中添加
from services.rollover_service import RolloverService

rollover_service = RolloverService(supabase)

# 后台启动监控任务
asyncio.create_task(rollover_service.start_monitoring(interval=300))
```

### 3. 创建换月配置

```python
# 为主要品种创建配置
varieties = [
    {"exchange": "CZCE", "variety_code": "TA"},
    {"exchange": "DCE", "variety_code": "I"},
    {"exchange": "SHFE", "variety_code": "RB"},
]

for variety in varieties:
    await rollover_service.create_config(
        account_id=account_id,
        **variety,
        rollover_strategy="auto",
        rollover_threshold=0.7,
        auto_execute=False  # 初期建议手动确认
    )
```

## 后续优化

1. **智能换月时机**: 基于历史数据和市场状态选择最佳换月时机

2. **分批换月**: 支持分多次逐步换月,降低市场冲击

3. **对冲策略**: 先开新仓再平旧仓,或使用套利单

4. **成本预估**: 执行前预估换月成本

5. **回测分析**: 分析不同换月策略的历史表现

6. **多账户协同**: 多个账户统一换月,降低成本

7. **风险控制**: 换月前后的风险度监控

## 技术栈

- **后端**: FastAPI + Supabase
- **数据库**: PostgreSQL (Supabase)
- **通知**: ntfy

## 文件清单

### 数据库
- `database/migrations/006_rollover_execution.sql`

### 后端
- `backend/services/rollover_service.py`
- `backend/main.py` (新增9个API端点)

### 文档
- `PHASE3_ROLLOVER.md` (本文件)

---

**开发完成时间**: 2025-12-18
**版本**: v1.0
**状态**: 后端完成,前端待实现
