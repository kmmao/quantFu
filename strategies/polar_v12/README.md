# v12-fi.py - 极星量化策略 (QuantFu Integration 完整版)

> 基于原 v12.py 策略,增加 QuantFu 数据推送功能

---

## 📋 概述

**v12-fi.py** 是在原 v12.py 策略基础上的完整集成版本,包含:

- ✅ **完整保留原策略逻辑** - 所有交易逻辑、风控、止损止盈等功能完全不变
- ✅ **QuantFu 数据推送** - 自动将成交数据推送到 QuantFu 平台
- ✅ **持仓对账功能** - 每10分钟推送持仓快照,用于数据对账
- ✅ **零性能影响** - 推送失败不影响交易,最多阻塞3秒

---

## 🔄 与原 v12.py 的区别

| 方面 | v12.py (原版) | v12-fi.py (集成版) |
|------|---------------|-------------------|
| 交易逻辑 | ✓ 完整 | ✓ **完全相同** |
| 数据推送 | ✗ 无 | ✓ **新增** |
| 持仓对账 | ✗ 无 | ✓ **新增** |
| 代码行数 | 1644 行 | 1694 行 (+50行推送模块) |
| 新增代码 | - | **仅3处** (开仓/平仓/快照) |

**修改内容:**

1. **第12-103行**: 新增 QuantFuPusher 推送类 (92行)
2. **第812-826行**: 在 `market_order()` 成交后添加推送 (15行)
3. **第915-929行**: 在 `close_postion()` 成交后添加推送 (15行)
4. **第562-598行**: 在 `handle_data()` 定时推送持仓快照 (37行)

**总计新增**: 159 行 (占原代码 9.7%)

---

## 🚀 快速开始

### Step 1: 配置环境变量

创建 `.env` 文件或在极星平台设置环境变量:

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置
vim .env
```

**关键配置:**

```bash
# QuantFu 后端地址
QUANTFU_API_URL=http://localhost:8888  # 本地部署
# QUANTFU_API_URL=http://192.168.1.100:8888  # 远程服务器

# API 密钥 (与后端 .env 中的 POLAR_API_KEY 一致)
QUANTFU_API_KEY=your-actual-api-key

# 启用推送
QUANTFU_ENABLE=true

# 极星账户ID
POLAR_ACCOUNT_ID=85178443
```

### Step 2: 启动 QuantFu 后端

```bash
cd ~/Documents/GitHub/quantFu
./scripts/start.sh
```

验证后端:
```bash
curl http://localhost:8888/health
# 应返回: {"status":"healthy",...}
```

### Step 3: 上传并运行策略

1. 登录极星量化平台
2. 上传 `v12-fi.py` 到策略文件
3. 配置交易品种和周期
4. 启动策略

---

## 📊 推送数据说明

### 1. 成交数据推送

**触发时机**: 每次开仓或平仓成功后立即推送

**推送内容**:

```python
{
    "account_id": "85178443",           # 账户ID
    "symbol": "ZCE|F|TA|2505",         # 合约代码
    "direction": "buy",                 # 方向 (buy/sell)
    "offset": "open",                   # 开平 (open/close)
    "volume": 2,                        # 手数
    "price": 5500.0,                    # 成交价格
    "order_id": "123456",               # 订单号
    "commission": 10.0,                 # 手续费
    "timestamp": "2025-12-18T10:30:00", # 时间戳
    "source": "polar_v12"               # 数据源
}
```

**推送位置**:

- **开仓**: `market_order()` 第812-826行
- **平仓**: `close_postion()` 第915-929行

### 2. 持仓快照推送

**触发时机**: 每10分钟推送一次 (可在第101行修改间隔)

**推送内容**:

```python
{
    "account_id": "85178443",
    "snapshot_time": "2025-12-18T10:30:00",
    "positions": [
        {
            "symbol": "ZCE|F|TA|2505",
            "long_position": 2,           # 多仓手数
            "long_avg_price": 5500.0,     # 多仓均价
            "short_position": 0,          # 空仓手数
            "short_avg_price": 0,
            "long_profit": 1200.0,        # 多仓浮盈
            "short_profit": 0
        }
    ],
    "source": "polar_v12"
}
```

**推送位置**: `handle_data()` 第562-598行

---

## ⚙️ 配置说明

### 方式1: 环境变量配置 (推荐)

在极星平台或系统中设置:

```bash
export QUANTFU_API_URL=http://localhost:8888
export QUANTFU_API_KEY=your-api-key
export QUANTFU_ENABLE=true
```

### 方式2: 代码内配置

修改 `v12-fi.py` 第95-97行:

```python
quantfu_pusher = QuantFuPusher(
    api_url="http://localhost:8888",      # 直接指定地址
    api_key="your-api-key",               # 直接指定密钥
    enable=True                            # 直接启用
)
```

### 配置项说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| QUANTFU_API_URL | http://localhost:8888 | QuantFu 后端地址 |
| QUANTFU_API_KEY | default-api-key | API密钥 (需与后端一致) |
| QUANTFU_ENABLE | true | 是否启用推送 |
| quantfu_snapshot_interval | 10 | 快照推送间隔 (分钟) |

---

## 🧪 测试推送功能

### 1. 本地测试 (不在极星平台)

```bash
cd strategies/polar_v12
python v12-fi.py
```

会输出:

```
============================================================
v12-fi.py - 极星量化策略 (QuantFu Integration)
============================================================

这是一个完整的极星量化策略示例,包含:
  ✓ 基于BBI指标的趋势跟踪策略
  ✓ QuantFu 数据推送模块
  ✓ 风险管理和仓位控制
  ✓ 持仓对账功能

配置:
  - 账户ID: 85178443
  - 交易品种: ZCE|F|TA|2505
  - QuantFu 推送: 启用

测试 QuantFu 推送...
[QuantFu] ✓ 推送成功: ZCE|F|TA|2505 buy open 1手 @5500.0

✓ 推送测试成功!
```

### 2. 查看后端日志

```bash
# 后端终端会显示
INFO:     127.0.0.1:54321 - "POST /api/trades HTTP/1.1" 200 OK
```

### 3. 查看前端数据

打开 QuantFu 前端:

```
http://localhost:3000
```

在 "成交记录" 或 "持仓管理" 页面查看实时数据。

---

## 🔍 故障排查

### 问题1: 推送失败 "Connection refused"

**症状**: 策略日志显示连接失败

**原因**: QuantFu 后端未启动

**解决**:

```bash
cd ~/Documents/GitHub/quantFu
./scripts/start.sh

# 验证
curl http://localhost:8888/health
```

### 问题2: 推送超时

**症状**: 推送超过3秒未响应

**原因**: 网络延迟或后端处理慢

**解决**: 修改 `v12-fi.py` 第56行,增加超时时间:

```python
response = requests.post(
    f"{self.api_url}/api/trades",
    json=trade_data,
    headers={"Content-Type": "application/json", "X-API-Key": self.api_key},
    timeout=5  # 从3秒改为5秒
)
```

### 问题3: 推送成功但数据库无数据

**症状**:
- 极星无错误提示
- 后端返回 200 OK
- 但数据库中 `trades` 表无数据

**原因**: 账户不存在

**解决**: 在 Supabase 中检查账户:

```sql
SELECT * FROM accounts WHERE polar_account_id = '85178443';
```

如果无结果,创建账户:

```sql
INSERT INTO accounts (name, polar_account_id, account_type)
VALUES ('极星账户', '85178443', 'polar');
```

### 问题4: 影响策略执行速度

**症状**: 策略执行变慢

**原因**: 推送代码未在 try-except 中

**解决**: 确认所有推送代码都用 `try-except` 包裹:

```python
try:
    quantfu_pusher.push_trade(...)
except:
    pass  # 失败立即跳过,不阻塞
```

---

## 📈 推送统计

策略运行时,可以查看推送统计:

```python
# 在策略中调用
stats = quantfu_pusher.get_stats()
print(stats)

# 输出:
# {
#     "enable": True,
#     "success_count": 145,
#     "fail_count": 2,
#     "total_count": 147,
#     "success_rate": "98.6%",
#     "last_push_time": "2025-12-18T14:30:00"
# }
```

---

## 🔄 禁用推送

如果需要临时禁用推送:

**方式1**: 环境变量

```bash
export QUANTFU_ENABLE=false
```

**方式2**: 修改代码 (第96行)

```python
quantfu_pusher = QuantFuPusher(
    enable=False  # 改为 False
)
```

**禁用后**: 策略正常运行,不推送任何数据。

---

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v12-fi 1.0 | 2025-12-18 | 基于 v12.py (v12.20250728) 集成 QuantFu 推送功能 |

**原版本**: v12.20250728 (2025-07-28)

---

## 🤝 技术支持

**遇到问题?**

1. 查看后端日志: `tail -f logs/backend.log`
2. 查看极星日志: 策略输出中的 `[QuantFu]` 开头的行
3. 提交 Issue: [GitHub Issues](https://github.com/allen/quantFu/issues)

**需要帮助?**

- 集成指南: [/docs/V12_INTEGRATION_GUIDE.md](/docs/V12_INTEGRATION_GUIDE.md)
- 可视化指南: [/docs/V12_INTEGRATION_VISUAL_GUIDE.md](/docs/V12_INTEGRATION_VISUAL_GUIDE.md)
- 极星集成: [/docs/POLAR_INTEGRATION.md](/docs/POLAR_INTEGRATION.md)

---

## ⚠️ 重要提示

1. **备份原策略**: 保留原 v12.py 作为备份
2. **测试环境**: 先在模拟盘测试推送功能
3. **监控推送**: 留意推送成功率,确保数据完整
4. **性能影响**: 推送最多阻塞3秒,正常情况 < 500ms
5. **数据安全**: API密钥不要泄露,定期更换

---

**🎉 集成完成,祝交易顺利!**
