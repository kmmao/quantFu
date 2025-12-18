# 阶段3 - 合约管理功能文档

## 功能概述

合约管理功能提供完整的期货合约信息查询、主力合约监控、到期提醒和保证金计算功能。

## 核心功能

### 1. 合约信息管理

#### 合约同步
- **自动同步**: 从TqSDK获取合约最新数据
- **批量同步**: 支持按品种批量同步所有月份合约
- **数据更新**: 实时更新价格、持仓量、成交量等市场数据

#### 合约信息包含
- 基本信息: 交易所、品种、合约月份
- 交易规格: 合约乘数、最小变动价位、保证金比例
- 价格限制: 涨跌停价
- 市场数据: 最新价、结算价、持仓量、成交量
- 到期信息: 到期日、首次通知日、最后交易日

### 2. 主力合约监控

#### 主力合约识别
- **识别规则**: 持仓量最大的合约为主力合约
- **自动更新**: 定期扫描并更新主力合约标记
- **切换记录**: 记录主力合约切换历史

#### 主力切换监控
- **换月指数**: 计算公式
  ```
  换月指数 = (新合约持仓量 / 旧合约持仓量) × 0.7 + (新合约成交量 / 旧合约成交量) × 0.3
  ```
- **切换通知**: 主力合约切换时发送ntfy通知
- **历史记录**: 保存所有切换记录供回溯分析

### 3. 合约到期提醒

#### 提醒配置
- **提前天数**: 可配置提前几天提醒(默认7天)
- **多账户支持**: 每个账户可单独配置提醒
- **开关控制**: 可随时启用/禁用提醒

#### 提醒机制
- **自动检查**: 定期扫描即将到期的合约
- **智能提醒**: 24小时内不重复提醒
- **提醒内容**: 合约代码、品种名称、到期天数

### 4. 保证金计算器

#### 计算功能
- **实时计算**: 根据合约信息实时计算所需保证金
- **计算公式**:
  ```
  合约价值 = 价格 × 手数 × 合约乘数
  所需保证金 = 合约价值 × 保证金比例
  ```
- **历史记录**: 保存所有计算记录

#### 显示信息
- 合约价值
- 所需保证金
- 合约乘数
- 保证金比例

## 数据库设计

### 表结构

#### 1. contracts (合约信息表)
```sql
- id: UUID 主键
- exchange: 交易所代码
- variety_code: 品种代码
- variety_name: 品种名称
- symbol: 合约代码
- contract_month: 合约月份
- expire_date: 到期日
- first_notice_date: 首次通知日
- last_trade_date: 最后交易日
- contract_multiplier: 合约乘数
- price_tick: 最小变动价位
- margin_ratio: 保证金比例
- price_limit_up/down: 涨跌停价
- last_price: 最新价
- settlement_price: 结算价
- open_interest: 持仓量
- volume: 成交量
- is_main_contract: 是否主力合约
- is_active: 是否活跃
- trading_status: 交易状态
```

#### 2. main_contract_switches (主力合约切换历史表)
```sql
- id: UUID 主键
- exchange: 交易所代码
- variety_code: 品种代码
- variety_name: 品种名称
- old_main_contract: 旧主力合约
- new_main_contract: 新主力合约
- switch_date: 切换时间
- old_open_interest: 旧主力持仓量
- new_open_interest: 新主力持仓量
- old_volume: 旧主力成交量
- new_volume: 新主力成交量
- rollover_index: 换月指数
- notification_sent: 通知状态
```

#### 3. contract_expiry_alerts (合约到期提醒配置表)
```sql
- id: UUID 主键
- account_id: 账户ID
- symbol: 合约代码
- alert_days_before: 提前几天提醒
- alert_enabled: 是否启用提醒
- last_alert_time: 上次提醒时间
- alert_count: 提醒次数
```

#### 4. margin_calculations (保证金计算历史表)
```sql
- id: UUID 主键
- account_id: 账户ID
- symbol: 合约代码
- price: 价格
- volume: 手数
- direction: 方向
- contract_multiplier: 合约乘数
- margin_ratio: 保证金比例
- required_margin: 所需保证金
- contract_value: 合约价值
```

### 视图

#### v_active_contracts
活跃合约视图,包含到期天数计算

#### v_main_contracts
主力合约视图,只显示标记为主力的合约

#### v_expiring_contracts
即将到期合约视图,30天内到期的合约

#### v_contract_expiry_reminders
到期提醒视图,关联合约信息和提醒配置

## API接口

### 合约查询接口

#### GET /api/contracts/list
获取合约列表

**Query Parameters:**
- `exchange`: 交易所代码(可选)
- `variety_code`: 品种代码(可选)
- `is_main`: 是否主力合约(可选)
- `is_active`: 是否活跃(默认true)

#### GET /api/contracts/main
获取所有主力合约

#### GET /api/contracts/expiring
获取即将到期的合约

**Query Parameters:**
- `days`: 多少天内到期(默认30天)

### 合约同步接口

#### POST /api/contracts/sync/{symbol}
同步单个合约信息

**Path Parameters:**
- `symbol`: 合约代码(TqSDK格式,如CZCE.TA2505)

#### POST /api/contracts/sync-variety/{exchange}/{variety_code}
同步某个品种的所有合约

**Path Parameters:**
- `exchange`: 交易所代码(CZCE/DCE/SHFE/INE/CFFEX)
- `variety_code`: 品种代码(如TA, I, RB)

### 主力切换接口

#### GET /api/contracts/main-switches
获取主力合约切换历史

**Query Parameters:**
- `exchange`: 交易所代码(可选)
- `variety_code`: 品种代码(可选)
- `limit`: 返回记录数(默认50)

### 到期提醒接口

#### GET /api/contracts/expiry-alerts
获取到期提醒配置

**Query Parameters:**
- `account_id`: 账户ID(可选)

#### POST /api/contracts/expiry-alerts
创建到期提醒配置

**Request Body:**
```json
{
  "account_id": "账户ID",
  "symbol": "合约代码",
  "alert_days_before": 7,
  "alert_enabled": true
}
```

#### PUT /api/contracts/expiry-alerts/{alert_id}
更新到期提醒配置

#### DELETE /api/contracts/expiry-alerts/{alert_id}
删除到期提醒配置

### 保证金计算接口

#### POST /api/contracts/calculate-margin
计算保证金

**Request Body:**
```json
{
  "account_id": "账户ID",
  "symbol": "合约代码",
  "price": 5500.0,
  "volume": 10,
  "direction": "long"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Margin calculated successfully",
  "data": {
    "contract_value": 550000.0,
    "required_margin": 55000.0,
    "margin_ratio": 0.1,
    "contract_multiplier": 10
  }
}
```

## 后端服务

### ContractService

合约管理服务类,负责:
- 合约信息同步
- 主力合约识别
- 主力切换监控
- 到期提醒检查
- 保证金计算

#### 关键方法

```python
# 同步单个合约信息
async def sync_contract_info(symbol: str) -> Optional[Dict[str, Any]]

# 同步品种所有合约
async def sync_variety_contracts(exchange: str, variety_code: str) -> List[Dict[str, Any]]

# 识别主力合约
async def identify_main_contract(exchange: str, variety_code: str) -> Optional[str]

# 更新主力合约标记
async def update_main_contract(exchange: str, variety_code: str) -> Optional[Dict[str, Any]]

# 检查到期提醒
async def check_expiry_alerts()

# 计算保证金
async def calculate_margin(
    account_id: str,
    symbol: str,
    price: float,
    volume: int,
    direction: str = "long"
) -> Dict[str, Any]

# 监控主力合约(定时任务)
async def monitor_main_contracts()

# 启动监控服务
async def start_monitoring(interval: int = 3600)
```

### 品种映射

内置支持的期货品种:

**郑商所(CZCE)**: TA(PTA), MA(甲醇), CF(棉花), SR(白糖), OI(菜油), RM(菜粕), FG(玻璃)

**大商所(DCE)**: I(铁矿石), J(焦炭), JM(焦煤), M(豆粕), Y(豆油), P(棕榈油), A(豆一), B(豆二), C(玉米)

**上期所(SHFE)**: RB(螺纹钢), HC(热轧卷板), CU(铜), AL(铝), ZN(锌), PB(铅), NI(镍), AU(黄金), AG(白银), RU(橡胶), FU(燃油)

**能源中心(INE)**: SC(原油), NR(20号胶)

**中金所(CFFEX)**: IF(沪深300股指), IC(中证500股指), IH(上证50股指)

## 前端界面

### 合约管理页面 (/contracts)

#### 四个标签页

1. **主力合约**: 显示所有品种的主力合约
2. **即将到期**: 显示30天内到期的合约
3. **全部合约**: 显示所有活跃合约
4. **切换历史**: 显示主力合约切换记录

#### 功能特性

- 实时刷新
- 交易所徽章
- 到期天数标识(颜色区分)
- 单个合约同步
- 保证金计算器入口

### 保证金计算器组件

弹窗式计算器,包含:
- 账户ID输入
- 合约代码输入
- 价格和手数输入
- 方向选择(做多/做空)
- 实时计算结果显示
- 计算历史保存

## 使用场景

### 场景1: 查看主力合约
1. 进入合约管理页面
2. 默认显示主力合约标签页
3. 查看各品种主力合约的最新价、持仓量等信息

### 场景2: 监控合约到期
1. 切换到"即将到期"标签页
2. 查看30天内到期的合约列表
3. 根据到期天数(颜色标识)决定是否需要换月

### 场景3: 计算保证金
1. 点击"保证金计算"按钮
2. 输入账户ID、合约代码、价格和手数
3. 选择方向(做多/做空)
4. 点击"计算"查看所需保证金

### 场景4: 查看主力切换历史
1. 切换到"切换历史"标签页
2. 查看历史主力合约切换记录
3. 分析换月指数和持仓量变化

## 部署和配置

### 1. 运行数据库迁移

```bash
cd database/migrations
psql -h localhost -U postgres -d quantfu -f 004_contract_management.sql
```

### 2. 启动合约监控服务

```python
# 在后端主程序中添加
from services.contract_service import ContractService

contract_service = ContractService(tq_api, supabase)

# 后台启动监控任务
asyncio.create_task(contract_service.start_monitoring(interval=3600))
```

### 3. 配置提醒

通过API或数据库直接配置到期提醒:

```python
# 为账户添加到期提醒
await contract_service.create_expiry_alert(
    account_id="账户ID",
    symbol="CZCE.TA2505",
    alert_days_before=7,
    alert_enabled=True
)
```

## 监控频率

- **主力合约监控**: 建议每小时运行一次
- **到期提醒检查**: 建议每小时运行一次
- **合约信息同步**: 主力合约监控时自动同步

## 通知设置

主力合约切换和到期提醒都会通过ntfy发送通知:

**主力切换通知格式:**
```
标题: 主力合约切换: PTA
内容: CZCE.TA2505 → CZCE.TA2509
     换月指数: 0.85
```

**到期提醒通知格式:**
```
标题: 合约即将到期: PTA
内容: 合约 CZCE.TA2505 将在 7 天后到期
     请及时平仓或换月
```

## 注意事项

1. **TqSDK限制**:
   - 免费版有15分钟延迟
   - 连接数限制为3个
   - 需要实盘账户才能获取完整数据

2. **合约月份构造**:
   - 当前实现是根据当前月份推算未来12个月
   - 实际上每个品种的上市月份可能不同
   - 建议根据实际需求调整

3. **主力合约识别**:
   - 目前仅基于持仓量判断
   - 可以根据需要添加成交量等其他因素

4. **性能优化**:
   - 合约数据可以缓存
   - 避免频繁请求TqSDK
   - 使用异步IO提高并发性能

## 后续优化

1. **更多合约信息**:
   - 限价类型
   - 交易手续费
   - 交割方式

2. **高级筛选**:
   - 按持仓量排序
   - 按成交量排序
   - 自定义筛选条件

3. **图表展示**:
   - 持仓量趋势图
   - 主力切换时间线
   - 换月指数变化图

4. **批量操作**:
   - 批量添加到期提醒
   - 批量同步合约信息

## 技术栈

- **后端**: FastAPI + TqSDK + Supabase
- **前端**: Next.js 15 + TypeScript + shadcn/ui
- **数据库**: PostgreSQL (Supabase)
- **通知**: ntfy

## 文件清单

### 数据库
- `database/migrations/004_contract_management.sql`

### 后端
- `backend/services/contract_service.py`
- `backend/main.py` (新增11个API端点)

### 前端
- `frontend/app/contracts/page.tsx`
- `frontend/components/MarginCalculator.tsx`
- `frontend/lib/supabase.ts` (扩展类型定义)

### 文档
- `PHASE3_CONTRACT.md` (本文件)

---

**开发完成时间**: 2025-12-18
**版本**: v1.0
