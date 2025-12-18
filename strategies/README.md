# QuantFu 策略目录

> 存放所有交易策略的集成版本

---

## 📂 目录结构

```
strategies/
├── polar_v12/              # 极星 v12 策略 (QuantFu 集成版)
│   ├── v12-fi.py          # 主策略文件
│   ├── README.md          # 使用手册
│   ├── QUICKSTART.md      # 快速入门
│   ├── CHANGELOG.md       # 修改日志
│   ├── SUMMARY.md         # 项目总结
│   └── .env.example       # 配置模板
│
└── (未来策略目录)
    ├── polar_v13/         # 极星 v13 策略
    ├── custom_strategy1/  # 自定义策略1
    └── ...
```

---

## 🎯 策略列表

### 1. polar_v12 - 极星 v12 策略 (QuantFu 集成版)

**状态**: ✅ 已完成

**说明**: 基于原 v12.py 策略,增加 QuantFu 数据推送功能

**特点**:
- ✅ 完整保留原策略逻辑
- ✅ 自动推送成交数据
- ✅ 定时推送持仓快照
- ✅ 推送失败不影响交易

**快速开始**: [polar_v12/QUICKSTART.md](polar_v12/QUICKSTART.md)

**详细文档**: [polar_v12/README.md](polar_v12/README.md)

---

## 📚 策略集成规范

所有策略集成到 QuantFu 平台时,应遵循以下规范:

### 1. 目录结构

每个策略应有独立目录,包含:

```
strategy_name/
├── strategy.py          # 主策略文件
├── README.md            # 使用手册
├── QUICKSTART.md        # 快速入门
├── CHANGELOG.md         # 修改日志
├── .env.example         # 配置模板
└── tests/               # 测试文件 (可选)
    └── test_strategy.py
```

### 2. 命名规范

- **目录名**: 小写字母+下划线,如 `polar_v12`, `custom_strategy1`
- **文件名**: 描述性命名,如 `v12-fi.py` (fi = QuantFu Integration)
- **类名**: PascalCase,如 `QuantFuPusher`
- **函数名**: snake_case,如 `push_trade`

### 3. 集成方式

#### 方式A: 非侵入式集成 (推荐)

在原策略基础上添加推送模块,不修改原有逻辑。

**示例**: polar_v12

**优点**:
- 原逻辑 100% 不变
- 推送失败不影响交易
- 易于维护和回滚

**实现**:

```python
# 1. 添加推送模块
class QuantFuPusher:
    def push_trade(self, ...):
        try:
            # 推送逻辑
        except:
            pass  # 失败不影响交易

# 2. 在成交后调用
def market_order(...):
    # 原有下单逻辑
    if 成交成功:
        try:
            quantfu_pusher.push_trade(...)
        except:
            pass
```

#### 方式B: 策略包装器

将原策略作为库导入,在外层添加推送逻辑。

**优点**:
- 原策略完全不动
- 可以同时运行多个版本

**缺点**:
- 需要暴露策略接口
- 稍微复杂一点

**实现**:

```python
# wrapper.py
from original_strategy import Strategy

class QuantFuStrategy(Strategy):
    def __init__(self):
        super().__init__()
        self.pusher = QuantFuPusher()

    def on_trade(self, trade):
        super().on_trade(trade)
        self.pusher.push_trade(trade)
```

### 4. 推送数据格式

所有策略推送的数据应遵循统一格式:

#### 成交数据

```python
{
    "account_id": str,      # 账户ID
    "symbol": str,          # 合约代码
    "direction": str,       # 方向 (buy/sell)
    "offset": str,          # 开平 (open/close)
    "volume": int,          # 手数
    "price": float,         # 成交价格
    "order_id": str,        # 订单号 (可选)
    "commission": float,    # 手续费 (可选)
    "timestamp": str,       # 时间戳 (ISO格式)
    "source": str           # 数据源标识
}
```

#### 持仓快照

```python
{
    "account_id": str,
    "snapshot_time": str,   # ISO格式时间
    "positions": [
        {
            "symbol": str,
            "long_position": int,
            "long_avg_price": float,
            "short_position": int,
            "short_avg_price": float,
            "long_profit": float,
            "short_profit": float
        }
    ],
    "source": str
}
```

### 5. 配置规范

#### 环境变量

所有策略应支持以下环境变量:

```bash
QUANTFU_API_URL=http://localhost:8888  # QuantFu 后端地址
QUANTFU_API_KEY=your-api-key           # API密钥
QUANTFU_ENABLE=true                     # 是否启用推送
```

#### .env.example 模板

每个策略目录应包含 `.env.example`:

```bash
# QuantFu 推送配置
QUANTFU_API_URL=http://localhost:8888
QUANTFU_API_KEY=your-api-key-from-backend
QUANTFU_ENABLE=true

# 策略特定配置
STRATEGY_PARAM_1=value1
STRATEGY_PARAM_2=value2
```

### 6. 文档规范

#### README.md (必需)

包含:
- 策略概述
- 快速开始 (3步以内)
- 配置说明
- 推送数据说明
- 故障排查
- API参考

#### QUICKSTART.md (推荐)

简洁的快速入门指南,5分钟内上手。

#### CHANGELOG.md (推荐)

记录所有修改:
- 相对原策略的变化
- 代码统计
- 测试结果

---

## 🔧 开发新策略集成

### Step 1: 创建目录

```bash
mkdir strategies/your_strategy_name
cd strategies/your_strategy_name
```

### Step 2: 复制模板

```bash
# 复制 polar_v12 作为模板
cp -r ../polar_v12/.env.example .
cp -r ../polar_v12/README.md .
```

### Step 3: 添加推送模块

从 `polar_v12/v12-fi.py` 复制推送模块 (第12-103行)。

### Step 4: 集成推送调用

在策略的成交成功位置添加:

```python
try:
    quantfu_pusher.push_trade(
        account_id=your_account_id,
        symbol=symbol,
        direction=direction,
        offset=offset,
        volume=volume,
        price=price
    )
except:
    pass
```

### Step 5: 测试

```bash
python your_strategy.py
```

### Step 6: 编写文档

按照规范编写 README.md 和其他文档。

---

## 🧪 测试规范

### 单元测试

每个策略应有基本测试:

```python
# tests/test_pusher.py
def test_push_trade():
    pusher = QuantFuPusher(enable=True)
    result = pusher.push_trade(
        account_id="test",
        symbol="TEST",
        direction="buy",
        offset="open",
        volume=1,
        price=100.0
    )
    assert result == True
```

### 集成测试

- [ ] 推送成功
- [ ] 推送失败不影响交易
- [ ] 超时保护生效
- [ ] 禁用推送功能正常

---

## 📊 策略对比

| 策略 | 状态 | 原策略行数 | 集成版行数 | 增量 | 推送功能 |
|------|------|-----------|-----------|------|---------|
| polar_v12 | ✅ 完成 | 1,644 | 1,811 | +167 (+10.2%) | ✓ |
| polar_v13 | ⏳ 计划中 | - | - | - | - |
| custom_1 | ⏳ 计划中 | - | - | - | - |

---

## 🚀 快速集成指南

### 对于极星策略

1. **复制模板**: `cp -r polar_v12 your_strategy`
2. **替换策略**: 用你的策略替换主文件
3. **添加推送**: 在3个位置添加推送调用
4. **配置环境**: 设置环境变量
5. **测试运行**: 验证推送功能

### 对于其他平台策略

1. **了解接口**: 确认策略的成交回调函数
2. **复制推送模块**: 从 polar_v12 复制 QuantFuPusher 类
3. **添加推送**: 在成交回调中调用推送
4. **适配数据格式**: 将平台数据格式转换为 QuantFu 格式
5. **测试验证**: 确保推送正常

---

## 📞 技术支持

**遇到问题?**

1. 查看策略的 README.md
2. 查看策略的 QUICKSTART.md
3. 查看 [QuantFu 集成指南](/docs/V12_INTEGRATION_GUIDE.md)
4. 提交 [GitHub Issue](https://github.com/allen/quantFu/issues)

**需要示例?**

- **完整示例**: [polar_v12/v12-fi.py](polar_v12/v12-fi.py)
- **推送模块**: polar_v12/v12-fi.py 第12-103行
- **集成位置**: 查看 CHANGELOG.md

---

## 🎯 未来计划

- [ ] 支持更多极星策略版本
- [ ] 支持其他量化平台策略
- [ ] 策略模板生成器
- [ ] 自动化测试框架
- [ ] CI/CD 集成

---

## 📝 贡献指南

欢迎贡献新的策略集成!

### 贡献流程

1. Fork 项目
2. 创建策略分支: `git checkout -b strategy/your_strategy`
3. 按规范开发策略集成
4. 提交 Pull Request

### 代码审查标准

- ✅ 遵循集成规范
- ✅ 包含完整文档
- ✅ 通过测试
- ✅ 推送失败不影响交易

---

**最后更新**: 2025-12-18
