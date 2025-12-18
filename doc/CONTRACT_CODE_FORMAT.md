# 合约代码格式说明文档

## 概述

本系统支持两种合约代码格式：
- **极星格式**：用于极星量化平台
- **TQSDK格式**：用于TQSDK免费行情服务

系统后端会自动处理两种格式之间的转换，前端用户无需手动转换。

## 格式详解

### 1. 极星格式

**格式规则**：`交易所|合约类型|品种代码|月份`

**示例**：
```
SHFE|F|RB|2505    # 上期所 螺纹钢 2025年5月
DCE|F|M|2601      # 大商所 豆粕 2026年1月
CZCE|F|SR|2509    # 郑商所 白糖 2025年9月
INE|F|SC|2512     # 能源中心 原油 2025年12月
```

**字段说明**：
- **交易所**（4个字母）：
  - `SHFE` - 上海期货交易所
  - `DCE` - 大连商品交易所
  - `CZCE` - 郑州商品交易所
  - `INE` - 上海国际能源交易中心

- **合约类型**（1个字母）：
  - `F` - 期货合约（Futures）
  - `O` - 期权合约（Options）
  - `Z` - 其他期货品种

- **品种代码**（大写字母）：
  - 上期所/大商所：通常2个字母，如 `RB`（螺纹钢）、`M`（豆粕）
  - 郑商所：1-2个字母，可能大写，如 `SR`（白糖）、`TA`（PTA）

- **月份代码**（4位数字）：
  - 格式：`YYMM`
  - 示例：`2505`表示2025年5月

### 2. TQSDK格式

**格式规则**：`交易所.品种代码+月份`

**示例**：
```
SHFE.rb2505    # 上期所 螺纹钢 2025年5月
DCE.m2601      # 大商所 豆粕 2026年1月
CZCE.SR2509    # 郑商所 白糖 2025年9月（注意大写）
INE.sc2512     # 能源中心 原油 2025年12月
```

**字段说明**：
- **交易所**（4个字母）：同极星格式

- **品种代码**（小写字母，郑商所除外）：
  - 上期所/大商所：小写字母，如 `rb`、`m`、`cu`
  - 郑商所：**大写字母**，如 `SR`、`TA`、`AP`

- **月份代码**（4位数字）：直接拼接在品种代码后，格式同极星

### 3. 格式对比表

| 项目 | 极星格式 | TQSDK格式 | 说明 |
|------|---------|-----------|------|
| 分隔符 | 竖线 `\|` | 点号 `.` | 主要区别 |
| 合约类型 | 包含 | 不包含 | 极星有 `F/O/Z` |
| 品种大小写 | 大写 | 小写（郑商所除外） | 注意转换 |
| 示例 | `SHFE\|F\|RB\|2505` | `SHFE.rb2505` | 同一合约 |

## 转换规则

### 极星 → TQSDK

1. 提取交易所代码：`SHFE`
2. 提取品种代码并转小写：`RB` → `rb`（郑商所保持大写）
3. 提取月份代码：`2505`
4. 拼接：`SHFE.rb2505`

**代码示例**：
```python
# 极星格式
epolestar_symbol = "SHFE|F|RB|2505"

# 转换为TQSDK格式
parts = epolestar_symbol.split("|")
exchange = parts[0]  # SHFE
variety = parts[2].lower()  # rb
month = parts[3]  # 2505

tqsdk_symbol = f"{exchange}.{variety}{month}"  # SHFE.rb2505
```

### TQSDK → 极星

1. 分离交易所和合约：`SHFE` + `rb2505`
2. 从合约中提取品种和月份：`rb` + `2505`
3. 品种转大写：`rb` → `RB`
4. 添加合约类型（默认`F`）：`SHFE|F|RB|2505`

**代码示例**：
```python
# TQSDK格式
tqsdk_symbol = "SHFE.rb2505"

# 转换为极星格式
exchange, contract = tqsdk_symbol.split(".")  # SHFE, rb2505

# 使用正则分离品种和月份
import re
match = re.match(r'^([a-zA-Z]+)(\d+)$', contract)
variety = match.group(1).upper()  # RB
month = match.group(2)  # 2505

epolestar_symbol = f"{exchange}|F|{variety}|{month}"  # SHFE|F|RB|2505
```

## 特殊情况

### 郑商所品种

郑商所品种代码在两种格式中都保持**大写**：

| 极星格式 | TQSDK格式 | 品种 |
|---------|-----------|------|
| `CZCE\|F\|SR\|2505` | `CZCE.SR2505` | 白糖 |
| `CZCE\|F\|TA\|2509` | `CZCE.TA2509` | PTA |
| `CZCE\|F\|AP\|2510` | `CZCE.AP2510` | 苹果 |

### 期权合约

极星格式包含合约类型字段，可以区分期权：

```
SHFE|O|cu2505C60000|2505    # 铜期权
```

TQSDK格式需要通过品种代码判断：
```
SHFE.cu2505C60000    # 铜期权
```

## 系统集成

### 后端自动转换

后端已实现格式转换工具 `symbol_converter.py`，提供以下函数：

- `epolestar_to_tqsdk(symbol)` - 极星→TQSDK
- `tqsdk_to_epolestar(symbol)` - TQSDK→极星
- `normalize_symbol(symbol, target_format)` - 自动识别并转换
- `parse_tqsdk_symbol(symbol)` - 解析TQSDK格式
- `parse_epolestar_symbol(symbol)` - 解析极星格式

### API 接口使用

1. **TQSDK品种配置**：使用TQSDK格式
   ```
   POST /api/v1/agents/tqsdk/symbols
   {
     "symbols": ["SHFE.rb2505", "DCE.m2601"]
   }
   ```

2. **极星持仓数据**：使用极星格式
   ```
   GET /api/v1/trading/positions
   返回：symbol = "SHFE|F|RB|2505"
   ```

3. **格式自动适配**：后端API会根据数据源自动使用正确格式

## 最佳实践

1. **前端展示**：根据数据来源使用原始格式
2. **用户输入**：提供格式提示和验证
3. **数据存储**：统一使用TQSDK格式（更简洁）
4. **API交互**：后端自动处理转换，前端无需关心

## 常见问题

**Q: 为什么需要两种格式？**
A: 极星和TQSDK是两个独立的系统，各自有自己的命名规范。我们的系统需要同时对接两者。

**Q: 我应该使用哪种格式？**
A: 在TQSDK品种配置中使用TQSDK格式，在极星策略中使用极星格式。后端会自动转换。

**Q: 转换工具在哪里？**
A: 后端：`backend/app/utils/symbol_converter.py`

**Q: 如何验证格式正确性？**
A: 前端输入框有格式验证，后端API也会验证格式。

## 参考资料

- 极星API手册：`doc/api_manual.md`
- TQSDK官方文档：https://doc.shinnytech.com/tqsdk/latest/
- 格式转换工具代码：`backend/app/utils/symbol_converter.py`

---

**最后更新**: 2025-12-16
**文档版本**: 1.0
