# 🔒 阶段3-锁仓自动触发功能完成报告

**完成时间:** 2025-12-18

---

## ✅ 功能概述

实现了智能锁仓自动触发系统,支持基于利润和价格的自动锁仓,可大幅降低手动监控压力,自动锁定利润或执行止损。

---

## 📊 完成的核心功能

### 1. 数据库扩展 ✅

**文件:** [database/migrations/003_lock_trigger.sql](database/migrations/003_lock_trigger.sql:1)

**新增表:**
- `lock_triggers` - 锁仓触发记录表
- `lock_executions` - 锁仓执行历史表

**扩展字段:**
- `lock_configs` 表增加触发类型、自动执行、移动止损等字段

**新增视图:**
- `v_lock_trigger_summary` - 锁仓触发汇总视图
- `v_active_lock_configs` - 活跃锁仓配置视图

### 2. 锁仓执行引擎 ✅

**文件:** [backend/engines/lock_engine.py](backend/engines/lock_engine.py:1)

**核心功能:**
- 执行锁仓操作(模拟下单)
- 计算锁定利润
- 更新持仓锁定状态
- 记录执行历史
- 错误处理和重试

**关键方法:**
```python
async def execute_lock(
    trigger_id, account_id, symbol, direction,
    lock_volume, trigger_price, method='auto'
) -> Dict[str, Any]
```

### 3. 锁仓触发监控服务 ✅

**文件:** [backend/services/lock_trigger_service.py](backend/services/lock_trigger_service.py:1)

**核心功能:**
- 实时监控所有活跃锁仓配置
- 检查触发条件(利润/价格/止损)
- 创建触发记录
- 自动执行或等待确认
- ntfy通知推送

**支持的触发类型:**
1. **利润触发:** 浮盈达到阈值
2. **价格触发:** 价格到达目标价
3. **止损触发:** 价格触及止损价
4. **移动止损:** 从最高/最低价回落触发(简化实现)

### 4. API端点 ✅

**文件:** [backend/main.py](backend/main.py:320-458)

**新增接口:**

| 方法 | 路径 | 功能 |
|-----|------|------|
| GET | `/api/lock/configs` | 获取锁仓配置列表 |
| POST | `/api/lock/configs` | 创建锁仓配置 |
| PUT | `/api/lock/configs/{id}` | 更新锁仓配置 |
| DELETE | `/api/lock/configs/{id}` | 删除锁仓配置 |
| GET | `/api/lock/triggers` | 获取触发记录 |
| POST | `/api/lock/execute/{id}` | 手动执行锁仓 |
| GET | `/api/lock/executions` | 获取执行历史 |

### 5. 前端锁仓管理页面 ✅

**文件:** [frontend/app/lock/page.tsx](frontend/app/lock/page.tsx:1)

**功能特性:**
- 触发记录实时刷新(10秒)
- 统计卡片(等待确认/已执行/失败)
- 触发记录列表展示
- 手动执行按钮
- 状态徽章(pending/executed/failed/waiting_confirm)

**UI组件:**
- 使用shadcn/ui组件库
- 响应式布局
- 彩色状态标识

### 6. 通知系统 ✅

**文件:** [backend/utils/notification.py](backend/utils/notification.py:1)

**功能:**
- ntfy推送通知
- 触发通知
- 执行完成通知
- 失败告警通知

---

## 🎯 使用场景

### 场景1: 利润锁仓

**需求:** TA2505多仓浮盈达到10000元时,自动锁定80%仓位

**配置:**
```json
{
  "account_id": "xxx",
  "symbol": "CZCE.TA2505",
  "direction": "long",
  "trigger_type": "profit",
  "profit_lock_enabled": true,
  "profit_lock_threshold": 10000,
  "profit_lock_ratio": 0.8,
  "auto_execute": true
}
```

**流程:**
1. 监控服务每秒检查持仓利润
2. 利润达到10000元触发
3. 计算锁定手数 = 当前持仓 × 80%
4. 自动执行反向开仓(锁仓)
5. 推送通知到手机

### 场景2: 价格触发

**需求:** v2505空仓在2800时自动止盈

**配置:**
```json
{
  "account_id": "xxx",
  "symbol": "DCE.v2505",
  "direction": "short",
  "trigger_type": "price",
  "trigger_price": 2800,
  "profit_lock_ratio": 1.0,
  "auto_execute": false
}
```

**流程:**
1. 监控服务检测价格 <= 2800
2. 触发锁仓,状态设为 waiting_confirm
3. 推送通知
4. 用户在前端点击"执行"按钮
5. 系统执行锁仓

### 场景3: 止损

**需求:** TA2505多仓在5400时止损

**配置:**
```json
{
  "account_id": "xxx",
  "symbol": "CZCE.TA2505",
  "direction": "long",
  "trigger_type": "price",
  "stop_loss_price": 5400,
  "profit_lock_ratio": 1.0,
  "auto_execute": true
}
```

**流程:**
1. 监控服务检测价格 <= 5400
2. 触发止损,全部锁仓
3. 自动执行
4. 推送通知

---

## 📚 数据库Schema

### lock_configs 表

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| account_id | UUID | 账户ID |
| symbol | VARCHAR(50) | 合约代码 |
| direction | VARCHAR(10) | long/short |
| trigger_type | VARCHAR(20) | profit/price/time |
| auto_execute | BOOLEAN | 是否自动执行 |
| profit_lock_threshold | DECIMAL | 利润阈值(元) |
| profit_lock_ratio | DECIMAL | 锁定比例(0-1) |
| trigger_price | DECIMAL | 目标价格 |
| stop_loss_price | DECIMAL | 止损价格 |
| trailing_stop | BOOLEAN | 是否移动止损 |
| trailing_distance | DECIMAL | 移动止损距离 |

### lock_triggers 表

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| config_id | UUID | 配置ID |
| trigger_type | VARCHAR(20) | 触发类型 |
| trigger_price | DECIMAL | 触发价格 |
| trigger_profit | DECIMAL | 触发利润 |
| lock_volume | INTEGER | 锁定手数 |
| execution_status | VARCHAR(20) | 执行状态 |
| triggered_at | TIMESTAMP | 触发时间 |
| execution_time | TIMESTAMP | 执行时间 |
| error_message | TEXT | 错误信息 |

### lock_executions 表

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| trigger_id | UUID | 触发ID |
| lock_volume | INTEGER | 锁定手数 |
| lock_price | DECIMAL | 成交价格 |
| locked_profit | DECIMAL | 锁定利润 |
| execution_method | VARCHAR | auto/manual |
| executed_at | TIMESTAMP | 执行时间 |

---

## 🚀 快速启动

### 1. 初始化数据库

```bash
# 执行锁仓功能的数据库迁移
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/003_lock_trigger.sql
```

### 2. 启动锁仓监控服务

```bash
cd backend
python services/lock_trigger_service.py
```

**预期输出:**
```
🔒 锁仓触发监控服务启动
检查 3 个锁仓配置
[触发锁仓] CZCE.TA2505 long - 利润达到阈值: 10500.00 >= 10000.00
[自动执行] 开始执行锁仓: CZCE.TA2505 long 8手
[锁仓执行] 执行成功: CZCE.TA2505 long 8手, 锁定利润: 8400.00元
```

### 3. 访问前端锁仓管理页面

```bash
cd frontend
npm run dev
```

访问 [http://localhost:3000/lock](http://localhost:3000/lock)

---

## 🔧 配置示例

### 创建锁仓配置(API调用)

```bash
curl -X POST http://localhost:8888/api/lock/configs \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "your-account-id",
    "symbol": "CZCE.TA2505",
    "direction": "long",
    "trigger_type": "profit",
    "profit_lock_enabled": true,
    "profit_lock_threshold": 10000,
    "profit_lock_ratio": 0.8,
    "auto_execute": true
  }'
```

### 手动执行锁仓

```bash
curl -X POST http://localhost:8888/api/lock/execute/{trigger_id}
```

---

## ⚠️ 注意事项

### 1. 模拟执行

当前实现是**模拟执行**,实际生产环境需要:
- 集成极星API进行真实下单
- 或通过WebSocket推送指令到极星策略
- 或使用data_pusher推送成交数据

### 2. 风险控制

- 建议先在**非自动模式**测试
- 设置合理的触发阈值
- 监控执行日志
- 异常立即告警

### 3. 性能优化

- 当前1秒检查一次,持仓多时可能有延迟
- 建议使用Realtime或WebSocket实时推送
- 考虑Redis缓存减少数据库查询

---

## 📈 后续优化方向

### 1. 配置管理界面

增加前端配置创建/编辑页面:
- 表单式配置创建
- 配置模板
- 批量配置

### 2. 移动止损完善

完善移动止损逻辑:
- 维护最高价/最低价状态
- 动态调整止损价
- 可视化移动轨迹

### 3. 回测功能

基于历史数据回测锁仓策略:
- 评估锁仓效果
- 优化触发参数
- 计算收益曲线

### 4. 多策略组合

支持多个锁仓策略同时运行:
- 利润锁+止损组合
- 分批锁仓
- 时间衰减锁仓

---

## ✅ 验收清单

- [x] 数据库迁移脚本完成
- [x] 锁仓执行引擎开发完成
- [x] 锁仓触发监控服务完成
- [x] API端点实现完成
- [x] 前端管理页面完成
- [x] 通知系统集成完成
- [ ] 集成测试(需要真实持仓数据)
- [ ] 与极星策略集成(需要极星API)

---

## 🎉 总结

锁仓自动触发功能已完成核心开发,具备:
- ✅ 利润触发
- ✅ 价格触发
- ✅ 止损触发
- ✅ 自动执行/手动确认
- ✅ ntfy通知推送
- ✅ 前端管理界面

系统可以自动监控持仓状态,在满足条件时触发锁仓,大幅降低手动监控压力!

下一步建议:
1. 进行完整集成测试
2. 与极星策略真实集成
3. 开发配置管理界面
4. 实现K线图展示功能

🚀 **阶段3第一个功能完成!**
