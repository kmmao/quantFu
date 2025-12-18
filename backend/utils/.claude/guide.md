# 工具函数层 (Utils) 指南

> QuantFu 后端的通用工具函数,提供数据库连接、合约格式转换、消息通知等基础功能

**⚠️ 本文档由 AI 生成 - 最后更新: 2025-12-18**

---

## 📌 模块职责

工具函数层提供可复用的基础功能,供其他模块调用。

**职责范围:**
- 数据库连接管理(Supabase 客户端)
- 合约代码格式转换(极星 ↔ 天勤)
- 消息推送(ntfy 通知)
- 日志记录(Logger 配置)

**不在范围:**
- 不包含业务逻辑
- 不直接操作业务数据
- 不提供 API 接口

---

## 📁 文件结构

```
utils/
├── __init__.py           # 模块初始化
├── db.py                 # 数据库连接工具(45行)
├── contract_mapper.py    # 合约格式转换(224行)
├── notification.py       # 消息通知(59行)
└── .claude/guide.md      # 本文档
```

### 文件说明

- **db.py**: Supabase 客户端单例,数据库连接测试
- **contract_mapper.py**: 极星和天勤合约格式互相转换
- **notification.py**: ntfy 消息推送
- **__init__.py**: 导出常用函数

---

## ⚙️ 主要功能

### 1. 数据库连接 (db.py)

#### get_supabase_client()

获取 Supabase 客户端单例。

**用途**: 所有模块通过此函数获取数据库客户端

**特点**:
- 单例模式,全局只创建一个客户端实例
- 自动从环境变量读取配置
- 线程安全

**示例**:
```python
from utils.db import get_supabase_client

# 获取客户端
supabase = get_supabase_client()

# 查询数据
result = supabase.table("accounts").select("*").execute()
print(result.data)

# 插入数据
supabase.table("trades").insert({
    "account_id": "xxx",
    "symbol": "ZCE|F|TA|2505",
    "volume": 2
}).execute()
```

#### test_connection()

测试数据库连接是否正常。

**返回**: `bool` - 连接是否成功

**示例**:
```python
from utils.db import test_connection

if await test_connection():
    print("✅ 数据库连接正常")
else:
    print("❌ 数据库连接失败")
```

---

### 2. 合约格式转换 (contract_mapper.py)

#### ContractMapper 类

提供极星和天勤两种合约格式的互相转换。

**合约格式对比**:

| 交易所 | 极星格式 | 天勤格式 | 说明 |
|--------|---------|---------|------|
| 郑商所 | ZCE\|F\|TA\|2505 | CZCE.TA2505 | 品种大写 |
| 大商所 | DCE\|Z\|I\|2505 | DCE.i2505 | 品种小写 |
| 上期所 | SHFE\|F\|RB\|2505 | SHFE.rb2505 | 品种小写 |
| 能源中心 | INE\|F\|SC\|2505 | INE.sc2505 | 品种小写 |
| 中金所 | CFFEX\|Z\|IF\|2505 | CFFEX.IF2505 | 品种大写 |

#### polar_to_tqsdk()

极星格式 → 天勤格式

**用途**: 需要调用天勤 API 时转换合约代码

**参数**:
- `polar_symbol: str` - 极星格式合约代码

**返回**: `str` - 天勤格式合约代码

**示例**:
```python
from utils.contract_mapper import ContractMapper

# 郑商所
tqsdk = ContractMapper.polar_to_tqsdk("ZCE|F|TA|2505")
print(tqsdk)  # CZCE.TA2505

# 上期所
tqsdk = ContractMapper.polar_to_tqsdk("SHFE|F|RB|2505")
print(tqsdk)  # SHFE.rb2505

# 大商所
tqsdk = ContractMapper.polar_to_tqsdk("DCE|Z|I|2505")
print(tqsdk)  # DCE.i2505
```

#### tqsdk_to_polar()

天勤格式 → 极星格式

**用途**: 从天勤获取数据后转换为极星格式存储

**参数**:
- `tqsdk_symbol: str` - 天勤格式合约代码
- `contract_type: str` - 合约类型(F=期货, O=期权, Z=其他),默认 "F"

**返回**: `str` - 极星格式合约代码

**示例**:
```python
# 天勤 → 极星
polar = ContractMapper.tqsdk_to_polar("CZCE.TA2505")
print(polar)  # ZCE|F|TA|2505

polar = ContractMapper.tqsdk_to_polar("SHFE.rb2505")
print(polar)  # SHFE|F|RB|2505
```

#### parse_polar_symbol()

解析极星合约代码为各部分。

**返回**: `Dict[str, str]` - 包含 exchange, contract_type, variety, month

**示例**:
```python
parts = ContractMapper.parse_polar_symbol("ZCE|F|TA|2505")
print(parts)
# {
#     "exchange": "ZCE",
#     "contract_type": "F",
#     "variety": "TA",
#     "month": "2505"
# }
```

#### 辅助函数

```python
# 提取品种代码
variety = ContractMapper.extract_variety_code("ZCE|F|TA|2505")
print(variety)  # TA

# 提取月份
month = ContractMapper.extract_month("ZCE|F|TA|2505")
print(month)  # 2505

# 提取交易所
exchange = ContractMapper.extract_exchange("ZCE|F|TA|2505")
print(exchange)  # ZCE
```

---

### 3. 消息通知 (notification.py)

#### send_notification()

通过 ntfy 发送消息推送。

**用途**:
- 锁仓触发通知
- 持仓对账不一致告警
- 换月提醒
- 系统异常告警

**参数**:
- `title: str` - 通知标题
- `message: str` - 通知内容
- `priority: str` - 优先级(min/low/default/high/urgent),默认 "default"
- `tags: Optional[str]` - 标签(如 "warning,lock")

**返回**: `bool` - 是否发送成功

**示例**:
```python
from utils.notification import send_notification

# 基础通知
await send_notification(
    title="持仓变化",
    message="TA2505 多仓增加 2手"
)

# 高优先级告警
await send_notification(
    title="持仓对账失败",
    message="TA2505 持仓不一致,请检查",
    priority="urgent",
    tags="warning,position"
)

# 锁仓通知
await send_notification(
    title="锁仓触发",
    message="TA2505 多仓锁定 5手 @5550,锁定利润 2500元",
    priority="high",
    tags="lock,profit"
)
```

**配置**:
在 `.env` 中配置 ntfy 服务器地址:
```env
NTFY_URL=https://ntfy.zmddg.com/claude
```

---

## 🔗 依赖关系

### 外部依赖

```python
# db.py
from supabase import create_client, Client
from config import settings

# contract_mapper.py
import re

# notification.py
import requests
import os
```

### 被依赖方

所有模块都依赖 utils:

```
main.py
  └── utils.db (数据库连接)
  └── utils.contract_mapper (格式转换)

engines/position_engine.py
  └── utils.db
  └── utils.contract_mapper

services/*
  └── utils.db
  └── utils.notification
```

---

## 🎯 使用示例

### 完整示例:查询持仓并发送通知

```python
from utils.db import get_supabase_client
from utils.contract_mapper import ContractMapper
from utils.notification import send_notification

async def check_position_and_notify(account_id: str, polar_symbol: str):
    """查询持仓并发送通知"""

    # 1. 获取数据库客户端
    supabase = get_supabase_client()

    # 2. 查询持仓
    result = supabase.table("positions")\
        .select("*")\
        .eq("account_id", account_id)\
        .eq("symbol", polar_symbol)\
        .single()\
        .execute()

    position = result.data

    # 3. 转换合约格式(用于显示)
    tqsdk_symbol = ContractMapper.polar_to_tqsdk(polar_symbol)
    variety = ContractMapper.extract_variety_code(polar_symbol)

    # 4. 计算盈亏
    total_profit = position['long_profit'] + position['short_profit']

    # 5. 发送通知
    await send_notification(
        title=f"{variety} 持仓情况",
        message=f"""
合约: {tqsdk_symbol}
多仓: {position['long_position']}手 @{position['long_avg_price']}
空仓: {position['short_position']}手 @{position['short_avg_price']}
总盈亏: {total_profit:.2f}元
        """.strip(),
        priority="default",
        tags="position,report"
    )
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建工具函数文档 | AI |
| 2025-12-18 | 整理 | 补充使用示例和注意事项 | AI |

---

## 🎯 最佳实践

### 1. 数据库连接

```python
# ✅ 推荐:使用单例客户端
from utils.db import get_supabase_client

supabase = get_supabase_client()
result = supabase.table("accounts").select("*").execute()

# ❌ 不推荐:重复创建客户端
from supabase import create_client
supabase = create_client(url, key)  # 每次都创建新实例
```

### 2. 合约格式转换

```python
# ✅ 推荐:使用 ContractMapper
from utils.contract_mapper import ContractMapper

tqsdk_symbol = ContractMapper.polar_to_tqsdk(polar_symbol)

# ❌ 不推荐:手动拼接字符串
tqsdk_symbol = polar_symbol.replace("|", ".").replace("ZCE", "CZCE")  # 逻辑不完整
```

### 3. 错误处理

```python
# ✅ 推荐:处理转换异常
try:
    tqsdk_symbol = ContractMapper.polar_to_tqsdk(polar_symbol)
except ValueError as e:
    print(f"合约格式错误: {e}")
    return None

# ❌ 不推荐:不处理异常
tqsdk_symbol = ContractMapper.polar_to_tqsdk(polar_symbol)  # 可能抛出异常
```

### 4. 通知发送

```python
# ✅ 推荐:检查发送结果
success = await send_notification("标题", "内容")
if not success:
    logger.warning("通知发送失败")

# ❌ 不推荐:忽略发送结果
await send_notification("标题", "内容")  # 不知道是否成功
```

---

## ⚠️ 注意事项

### 1. Supabase 客户端

- 单例模式,全局只有一个实例
- 线程安全,可在多线程环境使用
- 不需要手动关闭连接

### 2. 合约格式

- **存储使用极星格式**:因为数据来自极星
- **调用天勤 API 时转换**:临时转换,不存储
- **交易所代码注意**:
  - 极星郑商所用 `ZCE`,天勤用 `CZCE`
  - 其他交易所代码一致

### 3. 品种代码大小写

- 郑商所(CZCE):天勤用大写(TA, MA)
- 大商所(DCE):天勤用小写(i, j, jm)
- 上期所(SHFE):天勤用小写(rb, cu, au)
- 中金所(CFFEX):天勤用大写(IF, IC, IH)
- 能源中心(INE):天勤用小写(sc, nr)

### 4. 合约类型

- `F` = 期货(Futures)
- `O` = 期权(Options)
- `Z` = 其他

**注意**: 大商所和郑商所的期货使用 `Z`,不用 `F`

### 5. ntfy 通知

- 优先级:min < low < default < high < urgent
- 标签用逗号分隔:"warning,lock"
- 超时时间 5 秒(避免阻塞)
- 发送失败不影响业务流程

### 6. 月份代码

- 标准格式:YYMM(如 2505 表示 2025年5月)
- 郑商所特殊:有时用 3 位数(如 605),需转为 2605

---

## 🐛 常见问题

### Q: ValueError: Invalid polar symbol format

A: 检查极星格式是否正确:

```python
# ✅ 正确格式
"ZCE|F|TA|2505"  # 4个部分,用|分隔

# ❌ 错误格式
"ZCETA2505"      # 缺少分隔符
"ZCE|TA|2505"    # 缺少合约类型
```

### Q: 为什么郑商所转换后是 CZCE?

A: 天勤使用 CZCE,极星使用 ZCE。`ContractMapper` 自动处理这个差异:

```python
# 极星 → 天勤
ContractMapper.polar_to_tqsdk("ZCE|F|TA|2505")
# 输出: "CZCE.TA2505"  (ZCE 变成 CZCE)

# 天勤 → 极星
ContractMapper.tqsdk_to_polar("CZCE.TA2505")
# 输出: "ZCE|F|TA|2505"  (CZCE 变成 ZCE)
```

### Q: 数据库连接测试失败怎么办?

A: 检查以下配置:

```bash
# 1. 检查环境变量
cat .env | grep SUPABASE

# 2. 确认 Supabase URL 和 Key 正确
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=your_anon_key

# 3. 测试连接
python -c "
from utils.db import test_connection
import asyncio
print(asyncio.run(test_connection()))
"
```

### Q: ntfy 通知发送失败?

A: 可能原因:

1. **NTFY_URL 配置错误**:检查 `.env` 中的 URL
2. **网络问题**:确认能访问 ntfy 服务器
3. **超时**:ntfy 服务器响应慢,5秒超时

```python
# 测试 ntfy 连接
import requests

response = requests.post(
    "https://ntfy.zmddg.com/claude",
    data="测试消息".encode("utf-8"),
    headers={"Title": "测试"},
    timeout=5
)
print(f"状态码: {response.status_code}")
```

### Q: 如何添加新的工具函数?

A: 在 `utils/` 目录下创建新文件:

```python
# utils/my_util.py
"""我的工具函数"""

def my_function(param: str) -> str:
    """
    功能说明

    Args:
        param: 参数说明

    Returns:
        返回值说明
    """
    # 实现逻辑
    return result
```

然后在 `utils/__init__.py` 中导出:

```python
from .my_util import my_function

__all__ = ['my_function']
```

### Q: ContractMapper 支持哪些交易所?

A: 支持国内所有期货交易所:

- ✅ 郑州商品交易所(ZCE/CZCE)
- ✅ 大连商品交易所(DCE)
- ✅ 上海期货交易所(SHFE)
- ✅ 上海国际能源交易中心(INE)
- ✅ 中国金融期货交易所(CFFEX)

---

## 🔗 相关文档

- [后端总体架构](../../.claude/guide.md)
- [数据模型文档](../../models/.claude/guide.md)
- [引擎模块文档](../../engines/.claude/guide.md)
- [业务服务文档](../../services/.claude/guide.md)
- [Supabase Python 文档](https://supabase.com/docs/reference/python/introduction)

---

**文档维护者**: AI Assistant
**项目负责人**: allen
**最后审核**: 2025-12-18
