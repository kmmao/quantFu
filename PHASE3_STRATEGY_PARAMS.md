# 阶段3 - 策略参数远程配置功能文档

## 功能概述

策略参数远程配置功能提供完整的策略参数动态管理能力,支持策略定义、实例管理、参数配置、变更历史和模板管理。

## 核心功能

### 1. 策略定义管理

#### 策略创建
- 策略名称和版本管理
- 策略分类和风险等级
- 策略参数定义

#### 参数定义
- 参数类型: int/float/string/bool/json
- 参数验证: 最小值、最大值、正则表达式
- 参数分组和显示顺序
- 默认值设置

### 2. 策略实例管理

#### 实例创建
- 基于策略定义创建实例
- 绑定账户和合约
- 自动初始化默认参数

#### 实例状态管理
- 状态: stopped/running/paused/error
- 心跳监控
- 启停控制

#### 统计信息
- 总交易次数
- 总盈亏
- 胜率

### 3. 参数配置管理

#### 参数设置
- 单个参数设置
- 批量参数设置
- 参数验证
- 即时生效

#### 参数查询
- 获取当前参数
- 查看参数详情
- 参数定义关联

### 4. 参数变更历史

#### 历史记录
- 自动记录所有参数变更
- 记录修改人和修改原因
- 记录旧值和新值
- 应用状态追踪

#### 参数回滚
- 一键回滚到上一个版本
- 保留完整回滚历史

### 5. 参数模板管理

#### 模板创建
- 预设参数组合
- 风险等级标识
- 公开/私有模板

#### 模板应用
- 一键应用到实例
- 使用次数统计
- 热门模板排序

### 6. 参数通知

#### 变更通知
- 运行中实例参数变更时发送通知
- 包含旧值和新值对比
- ntfy推送

## 数据库设计

### 表结构

#### 1. strategies (策略定义表)
```sql
- id: UUID
- name: 策略名称(唯一)
- display_name: 显示名称
- description: 策略描述
- version: 策略版本
- category: 策略分类(trend/arbitrage/grid等)
- risk_level: 风险等级(low/medium/high)
- is_active: 是否活跃
- created_by: 创建人
```

#### 2. strategy_param_definitions (参数定义表)
```sql
- id: UUID
- strategy_id: 策略ID(外键)
- param_key: 参数键名
- param_name: 参数显示名称
- description: 参数描述
- param_type: 参数类型(int/float/string/bool/json)
- default_value: 默认值(JSON字符串)
- min_value: 最小值
- max_value: 最大值
- allowed_values: 允许值列表
- is_required: 是否必填
- validation_regex: 验证正则
- display_order: 显示顺序
- group_name: 参数分组
- unit: 单位
```

#### 3. strategy_instances (策略实例表)
```sql
- id: UUID
- strategy_id: 策略ID(外键)
- account_id: 账户ID
- instance_name: 实例名称
- symbols: 运行的合约列表
- status: 状态(stopped/running/paused/error)
- is_enabled: 是否启用
- started_at: 启动时间
- stopped_at: 停止时间
- last_heartbeat: 最后心跳时间
- error_message: 错误信息
- total_trades: 总交易次数
- total_profit: 总盈亏
- win_rate: 胜率
```

#### 4. strategy_param_configs (参数配置表)
```sql
- id: UUID
- instance_id: 实例ID(外键)
- param_key: 参数键名
- param_value: 参数值(JSON字符串)
- version: 配置版本
- is_active: 是否当前生效
- effective_at: 生效时间
- applied_at: 实际应用时间
- changed_by: 修改人
- change_reason: 修改原因
```

#### 5. strategy_param_history (参数变更历史表)
```sql
- id: UUID
- instance_id: 实例ID(外键)
- param_key: 参数键名
- old_value: 旧值
- new_value: 新值
- changed_by: 修改人
- change_reason: 修改原因
- change_type: 变更类型(manual/auto/rollback)
- applied: 是否已应用
- applied_at: 应用时间
```

#### 6. strategy_param_templates (参数模板表)
```sql
- id: UUID
- strategy_id: 策略ID(外键)
- template_name: 模板名称
- description: 模板描述
- params: 参数JSON
- template_type: 模板类型(official/custom)
- risk_level: 风险等级
- usage_count: 使用次数
- is_public: 是否公开
- created_by: 创建人
```

### 视图

#### v_active_strategy_instances
活跃策略实例视图,包含策略信息和心跳状态

#### v_current_strategy_params
当前生效参数配置视图,关联参数定义信息

#### v_strategy_param_change_stats
参数变更统计视图,统计变更次数和最后变更时间

### 触发器

#### trigger_record_param_change
参数配置变更时自动记录到历史表

## API接口

### 策略定义接口

#### GET /api/strategies
获取策略列表

**Query Parameters:**
- `is_active`: 是否活跃(可选)

#### POST /api/strategies
创建策略定义

**Request Body:**
```json
{
  "name": "grid_strategy",
  "display_name": "网格策略",
  "version": "1.0.0",
  "description": "震荡行情网格交易策略",
  "category": "grid",
  "risk_level": "medium"
}
```

#### GET /api/strategies/{strategy_id}/params
获取策略的参数定义列表

#### POST /api/strategies/{strategy_id}/params
添加参数定义

**Request Body:**
```json
{
  "param_key": "grid_size",
  "param_name": "网格大小",
  "param_type": "int",
  "default_value": 10,
  "min_value": 5,
  "max_value": 50,
  "description": "网格数量",
  "is_required": true,
  "group_name": "基础参数",
  "unit": "个",
  "display_order": 1
}
```

### 策略实例接口

#### GET /api/strategy-instances
获取策略实例列表

**Query Parameters:**
- `account_id`: 账户ID(可选)
- `status`: 状态(可选)

#### POST /api/strategy-instances
创建策略实例

**Request Body:**
```json
{
  "strategy_id": "uuid",
  "account_id": "account123",
  "instance_name": "TA网格01",
  "symbols": ["CZCE.TA2505", "CZCE.TA2509"]
}
```

#### PUT /api/strategy-instances/{instance_id}/status
更新实例状态

**Request Body:**
```json
{
  "status": "running",
  "error_message": "可选错误信息"
}
```

#### POST /api/strategy-instances/{instance_id}/heartbeat
更新心跳时间(策略程序定期调用)

### 参数配置接口

#### GET /api/strategy-instances/{instance_id}/params
获取实例的当前参数配置

**Response:**
```json
{
  "code": 200,
  "data": {
    "params": {
      "grid_size": 10,
      "price_interval": 50,
      "max_position": 100
    },
    "details": [
      {
        "param_key": "grid_size",
        "param_name": "网格大小",
        "param_type": "int",
        "param_value": "10",
        "unit": "个",
        "group_name": "基础参数"
      }
    ]
  }
}
```

#### PUT /api/strategy-instances/{instance_id}/params/{param_key}
设置单个参数

**Request Body:**
```json
{
  "param_value": 20,
  "changed_by": "admin",
  "change_reason": "调整网格密度"
}
```

#### PUT /api/strategy-instances/{instance_id}/params
批量设置参数

**Request Body:**
```json
{
  "params": {
    "grid_size": 15,
    "price_interval": 60,
    "max_position": 120
  },
  "changed_by": "admin",
  "change_reason": "优化策略参数"
}
```

### 参数历史接口

#### GET /api/strategy-instances/{instance_id}/params/history
获取参数变更历史

**Query Parameters:**
- `param_key`: 参数键名(可选)
- `limit`: 返回记录数(默认50)

**Response:**
```json
{
  "code": 200,
  "data": {
    "history": [
      {
        "param_key": "grid_size",
        "old_value": "10",
        "new_value": "15",
        "changed_by": "admin",
        "change_reason": "调整网格密度",
        "created_at": "2025-12-18T10:00:00Z"
      }
    ]
  }
}
```

#### POST /api/strategy-instances/{instance_id}/params/{param_key}/rollback
回滚参数到上一个版本

**Request Body:**
```json
{
  "changed_by": "admin"
}
```

### 参数模板接口

#### GET /api/strategy-templates
获取参数模板列表

**Query Parameters:**
- `strategy_id`: 策略ID(可选)

#### POST /api/strategy-templates
创建参数模板

**Request Body:**
```json
{
  "strategy_id": "uuid",
  "template_name": "保守型",
  "description": "低风险保守参数配置",
  "params": {
    "grid_size": 20,
    "price_interval": 30,
    "max_position": 50
  },
  "risk_level": "low",
  "created_by": "admin"
}
```

#### POST /api/strategy-instances/{instance_id}/apply-template/{template_id}
应用参数模板

**Request Body:**
```json
{
  "changed_by": "admin"
}
```

## 后端服务

### StrategyParamService

策略参数管理服务类,负责:
- 策略定义管理
- 策略实例管理
- 参数配置管理
- 参数验证
- 参数模板管理
- 参数历史管理

#### 关键方法

```python
# 创建策略定义
async def create_strategy(name, display_name, version, ...) -> Dict

# 添加参数定义
async def add_param_definition(strategy_id, param_key, param_name, param_type, ...) -> Dict

# 创建策略实例
async def create_instance(strategy_id, account_id, instance_name, symbols) -> Dict

# 更新实例状态
async def update_instance_status(instance_id, status, error_message)

# 更新心跳
async def update_heartbeat(instance_id)

# 获取参数配置
async def get_params(instance_id) -> Dict[str, Any]

# 设置单个参数
async def set_param(instance_id, param_key, param_value, changed_by, change_reason) -> Dict

# 批量设置参数
async def batch_set_params(instance_id, params, changed_by, change_reason) -> List

# 创建参数模板
async def create_template(strategy_id, template_name, params, ...) -> Dict

# 应用参数模板
async def apply_template(instance_id, template_id, changed_by)

# 获取参数历史
async def get_param_history(instance_id, param_key, limit) -> List

# 回滚参数
async def rollback_param(instance_id, param_key, changed_by)
```

### 参数验证

自动验证:
- 类型验证: int/float/string/bool
- 范围验证: min_value/max_value
- 必填验证: is_required
- 正则验证: validation_regex

## 使用场景

### 场景1: 创建策略和参数定义

```python
# 1. 创建策略定义
strategy = await service.create_strategy(
    name="grid_strategy",
    display_name="网格策略",
    version="1.0.0",
    category="grid",
    risk_level="medium"
)

# 2. 添加参数定义
await service.add_param_definition(
    strategy_id=strategy["id"],
    param_key="grid_size",
    param_name="网格大小",
    param_type="int",
    default_value=10,
    min_value=5,
    max_value=50
)

await service.add_param_definition(
    strategy_id=strategy["id"],
    param_key="price_interval",
    param_name="价格间隔",
    param_type="float",
    default_value=50.0,
    min_value=10.0,
    unit="元"
)
```

### 场景2: 创建实例并配置参数

```python
# 1. 创建策略实例
instance = await service.create_instance(
    strategy_id=strategy_id,
    account_id="account123",
    instance_name="TA网格01",
    symbols=["CZCE.TA2505"]
)

# 2. 修改参数(已自动初始化默认值)
await service.set_param(
    instance_id=instance["id"],
    param_key="grid_size",
    param_value=15,
    changed_by="trader01",
    change_reason="增加网格密度提高盈利频率"
)
```

### 场景3: 策略程序获取和更新参数

```python
# 策略程序中获取参数
params = await service.get_params(instance_id)
grid_size = params["grid_size"]
price_interval = params["price_interval"]

# 定期发送心跳
await service.update_heartbeat(instance_id)

# 更新状态
await service.update_instance_status(instance_id, "running")
```

### 场景4: 使用参数模板

```python
# 1. 创建模板
template = await service.create_template(
    strategy_id=strategy_id,
    template_name="激进型",
    params={
        "grid_size": 30,
        "price_interval": 20,
        "max_position": 200
    },
    risk_level="high"
)

# 2. 应用到实例
await service.apply_template(
    instance_id=instance_id,
    template_id=template["id"],
    changed_by="trader01"
)
```

### 场景5: 参数回滚

```python
# 查看历史
history = await service.get_param_history(instance_id, "grid_size")

# 回滚到上一个版本
await service.rollback_param(
    instance_id=instance_id,
    param_key="grid_size",
    changed_by="trader01"
)
```

## 集成示例

### 策略程序集成

```python
import asyncio
from strategy_param_service import StrategyParamService

class GridStrategy:
    def __init__(self, instance_id):
        self.instance_id = instance_id
        self.service = StrategyParamService(supabase)
        self.params = {}

    async def init(self):
        # 获取参数配置
        self.params = await self.service.get_params(self.instance_id)
        print(f"策略参数: {self.params}")

        # 更新状态为运行中
        await self.service.update_instance_status(self.instance_id, "running")

    async def run(self):
        while True:
            # 定期重新加载参数(支持热更新)
            self.params = await self.service.get_params(self.instance_id)

            # 执行策略逻辑
            await self.execute_strategy()

            # 发送心跳
            await self.service.update_heartbeat(self.instance_id)

            await asyncio.sleep(1)

    async def execute_strategy(self):
        # 使用参数
        grid_size = self.params["grid_size"]
        price_interval = self.params["price_interval"]

        # 策略逻辑...
        pass

# 启动策略
strategy = GridStrategy(instance_id="uuid")
await strategy.init()
await strategy.run()
```

## 前端界面(待实现)

### 策略管理页面
- 策略列表
- 参数定义管理
- 创建/编辑策略

### 实例管理页面
- 实例列表
- 状态监控
- 创建/删除实例

### 参数配置页面
- 参数列表(分组显示)
- 参数编辑表单
- 批量修改
- 模板应用

### 参数历史页面
- 变更时间线
- 对比视图
- 一键回滚

## 部署和配置

### 1. 运行数据库迁移

```bash
cd database/migrations
psql -h localhost -U postgres -d quantfu -f 005_strategy_params.sql
```

### 2. 初始化策略定义

创建示例脚本初始化常用策略:

```python
# init_strategies.py
from services.strategy_param_service import StrategyParamService

async def init_grid_strategy():
    service = StrategyParamService(supabase)

    # 创建网格策略
    strategy = await service.create_strategy(
        name="grid_strategy",
        display_name="网格策略",
        version="1.0.0",
        description="震荡行情网格交易策略",
        category="grid",
        risk_level="medium"
    )

    # 添加参数定义
    params_def = [
        {"param_key": "grid_size", "param_name": "网格大小", "param_type": "int", "default_value": 10, "min_value": 5, "max_value": 50, "unit": "个"},
        {"param_key": "price_interval", "param_name": "价格间隔", "param_type": "float", "default_value": 50.0, "min_value": 10.0, "unit": "元"},
        {"param_key": "max_position", "param_name": "最大持仓", "param_type": "int", "default_value": 100, "min_value": 10, "unit": "手"},
    ]

    for param_def in params_def:
        await service.add_param_definition(
            strategy_id=strategy["id"],
            **param_def
        )
```

## 注意事项

1. **参数类型**: 所有参数值在数据库中以JSON字符串存储,读取时需要解析

2. **参数验证**: 设置参数时会自动验证类型和范围,验证失败会抛出异常

3. **版本控制**: 每次参数修改会增加版本号,旧版本保留但设为非活跃

4. **心跳监控**: 策略程序应定期(建议10秒)发送心跳,用于判断程序是否存活

5. **热更新**: 策略程序应定期(建议1分钟)重新加载参数配置,实现参数热更新

6. **通知**: 只有运行中(status=running)的实例参数变更时才发送通知

7. **回滚限制**: 回滚仅支持回到上一个版本,不支持跳跃回滚

## 后续优化

1. **参数校验规则**: 支持更复杂的校验规则,如参数间依赖关系

2. **参数对比**: 对比不同实例或不同版本的参数差异

3. **参数推荐**: 基于历史表现推荐参数配置

4. **A/B测试**: 支持同一策略的多参数组对比测试

5. **参数优化**: 集成参数自动优化算法

6. **权限控制**: 不同用户对参数的修改权限控制

## 技术栈

- **后端**: FastAPI + Supabase
- **数据库**: PostgreSQL (Supabase)
- **通知**: ntfy

## 文件清单

### 数据库
- `database/migrations/005_strategy_params.sql`

### 后端
- `backend/services/strategy_param_service.py`
- `backend/main.py` (新增16个API端点)

### 文档
- `PHASE3_STRATEGY_PARAMS.md` (本文件)

---

**开发完成时间**: 2025-12-18
**版本**: v1.0
**状态**: 后端完成,前端待实现
