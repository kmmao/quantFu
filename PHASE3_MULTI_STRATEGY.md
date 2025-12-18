# 阶段3 - 多策略并行管理功能文档

## 功能概述

多策略并行管理功能提供完整的多策略协同运行能力,支持策略组管理、资源分配、信号协调、冲突检测和性能对比分析。

## 核心功能

### 1. 策略组管理

#### 策略组创建
- 设置总资金和持仓比例
- 配置单策略最大风险
- 定义冲突处理模式

#### 成员管理
- 添加/移除策略实例
- 分配资金和持仓限额
- 设置策略优先级

### 2. 信号协调

#### 信号创建
- 策略生成交易信号
- 设置信号置信度和强度
- 配置信号有效期

#### 信号处理
- 检查策略冲突
- 验证资源充足
- 决定执行或拒绝

### 3. 冲突检测

#### 冲突类型
- 对冲持仓: 不同策略开立反向持仓
- 超出限制: 总持仓超过组限制
- 重复信号: 同一合约重复操作

#### 冲突解决
- allow: 允许冲突
- reject: 拒绝新信号
- merge: 合并信号
- priority: 按优先级处理

### 4. 资源监控

#### 资源统计
- 已使用资金
- 已使用保证金
- 总持仓量
- 风险利用率

#### 分配追踪
- 各策略资源使用
- 实时使用率
- 历史趋势

### 5. 性能分析

#### 性能指标
- 交易次数和胜率
- 总盈利和盈亏比
- 夏普比率
- 最大回撤

#### 排名对比
- 盈利排名
- 胜率排名
- 风险调整收益排名

## 数据库设计

### 表结构

#### 1. strategy_groups (策略组表)
```sql
- id: UUID
- account_id: 账户ID
- group_name: 组名称
- description: 描述
- total_capital: 总资金
- max_position_ratio: 最大持仓比例
- max_risk_per_strategy: 单策略最大风险比例
- allow_opposite_positions: 是否允许对冲持仓
- position_conflict_mode: 冲突模式(allow/reject/merge)
- is_active: 是否活跃
```

#### 2. strategy_group_members (策略组成员表)
```sql
- id: UUID
- group_id: 组ID(外键)
- instance_id: 实例ID(外键)
- capital_allocation: 分配资金
- position_limit: 持仓限制
- priority: 优先级
- is_active: 是否活跃
```

#### 3. strategy_performance (策略性能表)
```sql
- id: UUID
- instance_id: 实例ID(外键)
- date: 统计日期
- total_trades: 交易次数
- winning_trades: 盈利次数
- losing_trades: 亏损次数
- gross_profit: 总盈利
- gross_loss: 总亏损
- net_profit: 净盈利
- commission: 手续费
- win_rate: 胜率
- profit_factor: 盈亏比
- sharpe_ratio: 夏普比率
- max_drawdown: 最大回撤
- avg_position_size: 平均持仓量
- max_position_size: 最大持仓量
- position_holding_time_avg: 平均持仓时间
```

#### 4. strategy_signals (策略信号表)
```sql
- id: UUID
- instance_id: 实例ID(外键)
- symbol: 合约代码
- signal_type: 信号类型(open/close/reverse)
- direction: 方向(long/short)
- volume: 数量
- price: 价格
- confidence: 信号置信度(0-1)
- strength: 信号强度(weak/medium/strong)
- status: 状态(pending/executed/rejected/expired)
- rejection_reason: 拒绝原因
- executed_at: 执行时间
- execution_price: 执行价格
- execution_volume: 执行数量
- expires_at: 过期时间
```

#### 5. strategy_conflicts (策略冲突记录表)
```sql
- id: UUID
- group_id: 组ID(外键)
- instance_id_1: 策略1 ID
- instance_id_2: 策略2 ID
- conflict_type: 冲突类型
- symbol: 合约代码
- description: 描述
- resolution: 解决方式
- resolved: 是否已解决
- resolved_at: 解决时间
```

#### 6. resource_usage (资源使用记录表)
```sql
- id: UUID
- group_id: 组ID(外键)
- timestamp: 时间戳
- total_capital_used: 已使用资金
- total_position: 总持仓量
- total_margin_used: 已使用保证金
- total_risk: 总风险
- risk_utilization: 风险利用率
- strategy_breakdown: 各策略分布(JSON)
```

### 视图

#### v_strategy_group_summary
策略组汇总,包含成员数和总盈利

#### v_strategy_instance_detail
策略实例详情,包含组信息和性能指标

#### v_pending_signals
待处理信号视图,包含信号年龄

#### v_strategy_performance_ranking
策略性能排名,按盈利/胜率/夏普排序

### 函数

#### check_strategy_conflicts()
检查策略冲突的数据库函数

## API接口

### 策略组管理接口

#### GET /api/strategy-groups
获取策略组列表

#### POST /api/strategy-groups
创建策略组

**Request Body:**
```json
{
  "account_id": "account123",
  "group_name": "主力组合",
  "description": "主要交易策略组合",
  "total_capital": 1000000,
  "max_position_ratio": 0.8,
  "max_risk_per_strategy": 0.2,
  "allow_opposite_positions": true,
  "position_conflict_mode": "allow"
}
```

#### PUT /api/strategy-groups/{group_id}
更新策略组

#### POST /api/strategy-groups/{group_id}/members
添加策略到组

**Request Body:**
```json
{
  "instance_id": "uuid",
  "capital_allocation": 200000,
  "position_limit": 100,
  "priority": 10
}
```

#### DELETE /api/strategy-groups/{group_id}/members/{instance_id}
从组中移除策略

### 信号管理接口

#### GET /api/strategy-signals
获取交易信号列表

**Query Parameters:**
- `group_id`: 组ID(可选)
- `status`: 状态(可选)

#### POST /api/strategy-signals
创建交易信号

**Request Body:**
```json
{
  "instance_id": "uuid",
  "symbol": "CZCE.TA2505",
  "signal_type": "open",
  "direction": "long",
  "volume": 10,
  "price": 5500.0,
  "confidence": 0.85,
  "strength": "strong",
  "expires_at": "2025-12-18T18:00:00Z"
}
```

#### POST /api/strategy-signals/{signal_id}/process
处理交易信号

### 性能管理接口

#### GET /api/strategy-performance
获取策略性能

**Query Parameters:**
- `instance_id`: 实例ID(可选)
- `start_date`: 开始日期(可选)
- `end_date`: 结束日期(可选)

#### POST /api/strategy-performance
记录策略性能

**Request Body:**
```json
{
  "instance_id": "uuid",
  "date": "2025-12-18",
  "metrics": {
    "total_trades": 10,
    "winning_trades": 7,
    "losing_trades": 3,
    "gross_profit": 15000,
    "gross_loss": 5000,
    "net_profit": 9500,
    "commission": 500,
    "win_rate": 70.0,
    "profit_factor": 3.0,
    "sharpe_ratio": 1.5,
    "max_drawdown": 2000
  }
}
```

#### GET /api/strategy-performance/ranking
获取策略性能排名

**Query Parameters:**
- `days`: 统计天数(默认30)

### 冲突管理接口

#### GET /api/strategy-conflicts
获取策略冲突记录

**Query Parameters:**
- `group_id`: 组ID(必需)
- `resolved`: 是否已解决(可选)

#### POST /api/strategy-conflicts/{conflict_id}/resolve
解决策略冲突

**Request Body:**
```json
{
  "resolution": "allow"
}
```

### 资源监控接口

#### GET /api/resource-usage/{group_id}
获取资源使用情况

**Query Parameters:**
- `hours`: 查询小时数(默认24)

## 后端服务

### MultiStrategyService

多策略管理服务类,负责:
- 策略组管理
- 信号协调
- 冲突检测
- 性能记录
- 资源监控

#### 关键方法

```python
# 创建策略组
async def create_group(
    account_id, group_name, description,
    total_capital, max_position_ratio,
    max_risk_per_strategy, allow_opposite_positions,
    position_conflict_mode
) -> Dict

# 添加策略到组
async def add_member(
    group_id, instance_id,
    capital_allocation, position_limit, priority
) -> Dict

# 创建交易信号
async def create_signal(
    instance_id, symbol, signal_type,
    direction, volume, price,
    confidence, strength, expires_at
) -> Dict

# 处理信号
async def process_signal(signal_id) -> bool

# 记录性能
async def record_performance(
    instance_id, performance_date, metrics
) -> Dict

# 获取性能排名
async def get_performance_ranking(days) -> List

# 获取冲突记录
async def get_conflicts(group_id, resolved) -> List

# 解决冲突
async def resolve_conflict(conflict_id, resolution)
```

### 信号处理流程

```python
async def process_signal(signal_id):
    # 1. 获取信号详情
    signal = get_signal(signal_id)

    # 2. 获取所在组
    group_id = get_group_id(signal.instance_id)

    if not group_id:
        # 不在组中,直接执行
        return execute_signal(signal)

    # 3. 检查冲突
    has_conflict = check_signal_conflict(group_id, signal)
    if has_conflict:
        reject_signal(signal_id, "Conflict")
        return False

    # 4. 检查资源
    has_resources = check_resources(group_id, signal)
    if not has_resources:
        reject_signal(signal_id, "Insufficient resources")
        return False

    # 5. 执行信号
    return execute_signal(signal)
```

## 使用场景

### 场景1: 创建策略组合

```python
# 创建策略组
group = await service.create_group(
    account_id="account123",
    group_name="多品种套利组合",
    description="PTA-MEG套利 + 螺纹钢趋势",
    total_capital=1000000,
    max_position_ratio=0.8,
    allow_opposite_positions=False  # 不允许对冲
)

# 添加策略实例
await service.add_member(
    group_id=group["id"],
    instance_id=pta_meg_instance_id,
    capital_allocation=600000,
    position_limit=200,
    priority=10  # 高优先级
)

await service.add_member(
    group_id=group["id"],
    instance_id=rb_trend_instance_id,
    capital_allocation=400000,
    position_limit=100,
    priority=5
)
```

### 场景2: 策略生成信号

```python
# 策略A生成做多信号
signal_a = await service.create_signal(
    instance_id=strategy_a_instance,
    symbol="CZCE.TA2505",
    signal_type="open",
    direction="long",
    volume=10,
    price=5500.0,
    confidence=0.85,
    strength="strong"
)

# 策略B也生成做多信号(同方向,可能合并)
signal_b = await service.create_signal(
    instance_id=strategy_b_instance,
    symbol="CZCE.TA2505",
    signal_type="open",
    direction="long",
    volume=5,
    confidence=0.70
)
```

### 场景3: 处理信号冲突

```python
# 策略A做多,策略B做空同一合约
signal_conflict = await service.create_signal(
    instance_id=strategy_b_instance,
    symbol="CZCE.TA2505",
    signal_type="open",
    direction="short",  # 反向!
    volume=10
)

# 处理信号时检测到冲突
success = await service.process_signal(signal_conflict["id"])

if not success:
    # 信号被拒绝,查看冲突记录
    conflicts = await service.get_conflicts(group_id, resolved=False)
    # 显示: "对冲持仓冲突: 策略A多头 vs 策略B空头"
```

### 场景4: 性能对比分析

```python
# 记录每日性能
await service.record_performance(
    instance_id=strategy_a_instance,
    performance_date=date.today(),
    metrics={
        "total_trades": 15,
        "winning_trades": 10,
        "net_profit": 12000,
        "win_rate": 66.67,
        "sharpe_ratio": 1.8
    }
)

# 获取排名
ranking = await service.get_performance_ranking(days=30)

# 显示排名:
# 1. 策略A - 盈利: ¥120,000 - 胜率: 66.67% - 夏普: 1.8
# 2. 策略B - 盈利: ¥85,000 - 胜率: 58.33% - 夏普: 1.2
# 3. 策略C - 盈利: ¥45,000 - 胜率: 72.22% - 夏普: 0.9
```

## 冲突检测规则

### 对冲持仓冲突

```sql
-- 检查同一组内是否有反向持仓
SELECT * FROM positions p
JOIN strategy_group_members sgm ON p.account_id = sgm.account_id
WHERE sgm.group_id = :group_id
  AND p.symbol = :symbol
  AND (
    (:direction = 'long' AND p.short_position > 0) OR
    (:direction = 'short' AND p.long_position > 0)
  )
```

### 超限检测

```python
# 检查是否超过组限制
total_position = sum([m.position for m in group.members])
max_allowed = group.total_capital * group.max_position_ratio

if total_position + new_volume > max_allowed:
    # 超限,拒绝
    return False
```

## 性能指标计算

### 胜率
```python
win_rate = (winning_trades / total_trades) * 100
```

### 盈亏比
```python
profit_factor = gross_profit / gross_loss
```

### 夏普比率
```python
sharpe_ratio = (avg_return - risk_free_rate) / std_dev_return
```

## 前端界面(待实现)

### 策略组管理页面
- 组列表
- 成员管理
- 资源分配可视化

### 信号监控页面
- 待处理信号列表
- 信号状态跟踪
- 冲突告警

### 性能对比页面
- 策略性能表格
- 排名图表
- 盈亏曲线对比

### 资源监控页面
- 资源使用仪表盘
- 实时使用率
- 历史趋势图

## 部署和配置

### 1. 运行数据库迁移

```bash
cd database/migrations
psql -h localhost -U postgres -d quantfu -f 007_multi_strategy.sql
```

### 2. 创建策略组

```python
# 为账户创建策略组
group = await service.create_group(
    account_id=account_id,
    group_name="主力组合",
    total_capital=1000000,
    allow_opposite_positions=False
)
```

### 3. 添加策略到组

```python
# 将现有策略实例加入组
await service.add_member(
    group_id=group["id"],
    instance_id=instance_id,
    capital_allocation=500000,
    position_limit=200
)
```

## 注意事项

1. **资源隔离**: 同组策略共享资源配额,需合理分配

2. **冲突策略**: allow_opposite_positions=false时不允许对冲

3. **优先级**: 资源不足时,优先级高的策略优先执行

4. **信号过期**: 设置expires_at避免过期信号执行

5. **性能统计**: 定期记录性能数据用于分析对比

6. **冲突解决**: 及时处理冲突,避免策略受阻

## 后续优化

1. **智能分配**: 基于历史表现动态调整资源分配

2. **风险平衡**: 自动调整各策略权重保持风险平衡

3. **信号合并**: 智能合并同方向信号

4. **A/B测试**: 支持策略参数A/B测试

5. **回测对比**: 对比多策略组合的历史表现

## 技术栈

- **后端**: FastAPI + Supabase
- **数据库**: PostgreSQL (Supabase)
- **通知**: ntfy

## 文件清单

### 数据库
- `database/migrations/007_multi_strategy.sql`

### 后端
- `backend/services/multi_strategy_service.py`
- `backend/main.py` (新增14个API端点)

### 文档
- `PHASE3_MULTI_STRATEGY.md` (本文件)

---

**开发完成时间**: 2025-12-18
**版本**: v1.0
**状态**: 后端完成,前端待实现
