# v12-fi.py 快速入门 (5分钟上手)

> 最快方式启动 QuantFu 集成版极星策略

---

## ⚡ 1分钟理解

**v12-fi.py 是什么?**

就是你的原 **v12.py** + **QuantFu 数据推送**

```
v12-fi.py = v12.py (原策略) + 数据推送到 QuantFu 平台
```

**改了什么?**

- ✅ **交易逻辑**: 100% 不变
- ✅ **新增功能**: 成交后自动推送数据
- ✅ **代码量**: +167 行 (仅占 10%)

**为什么要用?**

在 QuantFu 前端实时看到:
- 成交记录
- 持仓明细
- 盈亏分析
- 风险指标

---

## 🚀 3步启动

### Step 1: 启动 QuantFu 后端 (30秒)

```bash
cd /Users/allen/Documents/GitHub/quantFu
./scripts/start.sh
```

等待输出:

```
✓ Supabase 已启动
✓ 后端已启动 (http://localhost:8888)
✓ 前端已启动 (http://localhost:3000)
```

### Step 2: 配置环境变量 (1分钟)

在极星平台或本地设置:

```bash
export QUANTFU_API_URL=http://localhost:8888
export QUANTFU_API_KEY=default-api-key  # 与后端 .env 一致
export QUANTFU_ENABLE=true
export POLAR_ACCOUNT_ID=85178443  # 你的极星账户ID
```

**或者直接修改代码** (第95-97行):

```python
quantfu_pusher = QuantFuPusher(
    api_url="http://localhost:8888",
    api_key="default-api-key",
    enable=True
)
```

### Step 3: 上传并运行 (1分钟)

1. 登录极星量化平台
2. 上传 `v12-fi.py`
3. 选择交易品种
4. 启动策略

**完成!** 策略运行时会自动推送数据到 QuantFu。

---

## 📊 查看数据

打开浏览器:

```
http://localhost:3000
```

你会看到:
- **成交记录**: 实时成交数据
- **持仓管理**: 当前持仓明细
- **盈亏分析**: 盈亏曲线图

---

## 🧪 快速测试

### 测试推送功能

在本地运行(不需要极星平台):

```bash
cd strategies/polar_v12
python v12-fi.py
```

应该看到:

```
[QuantFu] ✓ 推送成功: ZCE|F|TA|2505 buy open 1手 @5500.0
✓ 推送测试成功!
```

### 验证后端

```bash
curl http://localhost:8888/health
```

应返回:

```json
{"status":"healthy","timestamp":"2025-12-18T..."}
```

---

## 🔍 常见问题 (1分钟排查)

### Q1: 推送失败?

**检查后端是否启动:**

```bash
curl http://localhost:8888/health
```

如果连接失败,运行:

```bash
cd /Users/allen/Documents/GitHub/quantFu
./scripts/start.sh
```

### Q2: 推送成功但前端无数据?

**检查账户是否存在:**

打开 Supabase Studio:

```
http://localhost:54323
```

查询 `accounts` 表,确认你的账户ID存在。

### Q3: 想禁用推送?

设置环境变量:

```bash
export QUANTFU_ENABLE=false
```

或修改代码第96行:

```python
quantfu_pusher = QuantFuPusher(enable=False)
```

---

## 📖 深入了解

- **完整文档**: [README.md](README.md)
- **修改详情**: [CHANGELOG.md](CHANGELOG.md)
- **集成指南**: [/docs/V12_INTEGRATION_GUIDE.md](/docs/V12_INTEGRATION_GUIDE.md)

---

## ⚠️ 重要提示

1. **备份原策略**: 保留 v12.py 作为备份
2. **先测试**: 在模拟盘测试后再用于实盘
3. **监控推送**: 留意推送成功率

---

## 💡 核心概念

### 推送时机

| 事件 | 推送内容 | 时机 |
|------|----------|------|
| 开仓成功 | 成交数据 | 立即 |
| 平仓成功 | 成交数据 | 立即 |
| 定时任务 | 持仓快照 | 每10分钟 |

### 推送保护

所有推送都有保护:

```python
try:
    推送数据
except:
    pass  # 失败不影响交易
```

- 超时: 3秒
- 失败: 跳过
- 影响: 零

---

## 🎯 下一步

1. ✅ 策略已运行
2. ✅ 数据已推送
3. ✅ 前端已显示

**现在你可以**:
- 在前端监控持仓
- 分析交易数据
- 设置风控规则
- 查看盈亏曲线

---

**🎉 恭喜!你已经成功集成 QuantFu 数据推送!**

有问题? 查看 [README.md](README.md) 或提交 [Issue](https://github.com/allen/quantFu/issues)
