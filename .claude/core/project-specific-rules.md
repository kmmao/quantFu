# QuantFu 项目特定规则

> 记录 QuantFu 项目开发过程中的实际规则和技术决策

---

## 📋 使用说明

### 何时记录规则?

**只有当用户明确说 "记录这个规则" 或 "以后都按这个规则" 时才记录。**

不自动触发 (已删除"连续3次"、"重复模式"等模糊判断)。

### 记录格式

```markdown
## [规则类别]

### [规则名称]

**制定时间**: YYYY-MM-DD
**适用范围**: [模块/功能/全局]
**规则内容**: [具体规则描述]
**示例**: [代码示例]
**原因**: [为什么制定这个规则]
```

---

## 🔧 1. 非侵入式集成模式

### 第三方策略集成必须保持原逻辑不变

**制定时间**: 2025-12-18
**适用范围**: strategies/ 目录下所有策略集成

**规则内容**:
- 集成第三方策略时,**绝对禁止**修改原有交易逻辑
- 只能在成功后添加推送/记录代码
- 所有新增代码必须用 try-except 包裹
- 推送失败不能影响原策略执行

**示例**:
```python
# ✅ 正确做法
if ret_enter == 0 or ret_enter == -2:
    order_trade_count += order_num  # 原有逻辑不变
    PlotText(...)                   # 原有逻辑不变

    # 新增推送功能
    try:
        quantfu_pusher.push_trade(...)
    except:
        pass  # 失败不影响交易

# ❌ 错误做法
if ret_enter == 0 or ret_enter == -2:
    result = quantfu_pusher.push_trade(...)  # 错误! 改变了逻辑
    if result:  # 错误! 推送结果影响了交易
        order_trade_count += order_num
```

**原因**:
- 保证交易安全,原策略已经过充分验证
- 推送功能不应成为交易的阻塞点
- 便于回滚和维护

---

## 📊 2. 数据推送格式规范

### 成交和持仓数据的标准格式

**制定时间**: 2025-12-18
**适用范围**: 所有策略推送到 QuantFu 后端的数据

**成交数据格式**:
```python
{
    "account_id": str,        # 账户ID (必需)
    "symbol": str,            # 合约代码 (必需)
    "direction": str,         # buy/sell (必需)
    "offset": str,            # open/close (必需)
    "volume": int,            # 手数 (必需)
    "price": float,           # 成交价格 (必需)
    "timestamp": str,         # ISO格式时间 (必需)
    "source": str,            # 数据源标识 (必需)
    "order_id": str,          # 订单号 (可选)
    "commission": float       # 手续费 (可选)
}
```

**持仓快照格式**:
```python
{
    "account_id": str,
    "snapshot_time": str,     # ISO格式时间
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

**原因**: 统一数据格式,便于后端解析和扩展

---

## 📁 3. 策略目录结构规范

### 策略模块的标准目录结构

**制定时间**: 2025-12-18
**适用范围**: strategies/ 目录下所有策略

**目录结构**:
```
strategies/
└── strategy_name/
    ├── strategy.py          # 主策略文件 (必需)
    ├── .env.example         # 配置模板 (必需)
    ├── README.md            # 用户使用手册 (必需)
    ├── QUICKSTART.md        # 快速入门指南 (推荐)
    ├── CHANGELOG.md         # 详细修改日志 (推荐)
    └── .claude/
        └── guide.md         # 开发者指南 (必需)
```

**文档要求**:
- **README.md**: 包含配置说明、使用方法、故障排查
- **QUICKSTART.md**: 5分钟快速上手
- **CHANGELOG.md**: 详细代码对比
- **guide.md**: 模块职责、函数说明、依赖关系

**原因**: 保持策略模块结构一致,提供完整的用户和开发者文档

---

## 🔐 4. 配置管理规范

### 策略配置的优先级和安全性

**制定时间**: 2025-12-18
**适用范围**: 所有策略配置

**配置优先级** (从高到低):
1. 显式传参
2. 环境变量
3. 代码默认值

**示例**:
```python
api_url = (
    explicit_param                      # 1. 显式传参
    or os.getenv('QUANTFU_API_URL')     # 2. 环境变量
    or 'http://localhost:8888'          # 3. 默认值
)
```

**安全规范**:
- ❌ 禁止硬编码 API 密钥
- ✅ 必须通过环境变量或外部配置传入
- ✅ 上传到第三方平台的代码中不能包含敏感信息

**原因**: 灵活配置,适应不同环境,保护敏感信息安全

---

## 🧪 5. 推送保护机制规范

### 推送失败保护的标准实现

**制定时间**: 2025-12-18
**适用范围**: 所有数据推送功能

**必需的保护机制**:
1. try-except 包裹所有推送调用
2. 设置超时时间 (推荐 3秒)
3. 失败静默处理,不打印敏感日志
4. 失败不影响主流程

**标准实现**:
```python
# 调用方
try:
    quantfu_pusher.push_trade(...)
except:
    pass  # 静默失败,不影响交易

# 推送类内部
def push_trade(self, ...):
    try:
        response = requests.post(
            ...,
            timeout=3  # 3秒超时
        )
        if response.status_code == 200:
            self.success_count += 1
            return True
        else:
            self.fail_count += 1
            return False
    except:
        self.fail_count += 1
        return False
```

**原因**: 交易安全第一,推送功能不能成为单点故障

---

## 🔷 6. 后端 API 开发规范

### FastAPI 路由和服务设计规范

**制定时间**: 2025-12-18
**适用范围**: backend/ 目录下所有 API 代码

**目录结构规范**:
```
backend/
├── main.py              # FastAPI 主应用
├── config.py            # 配置管理
├── models/              # 数据模型
│   └── schemas.py       # Pydantic 模型
├── engines/             # 核心引擎 (业务逻辑)
│   ├── position_engine.py
│   └── lock_engine.py
├── services/            # 服务层 (外部调用)
│   ├── contract_service.py
│   ├── kline_service.py
│   └── rollover_service.py
└── utils/               # 工具函数
    ├── db.py
    └── notification.py
```

**层次职责**:
1. **main.py** - 路由定义,请求响应处理
2. **engines/** - 核心业务逻辑 (持仓计算、锁仓逻辑)
3. **services/** - 外部调用封装 (数据库、第三方 API)
4. **utils/** - 纯工具函数,无业务逻辑

**API 路由规范**:
- 使用 RESTful 风格
- 路由格式: `/api/{resource}` 或 `/api/{resource}/{id}`
- 所有 API 返回统一的 `ResponseModel`
- 异常统一使用 `HTTPException`

**示例**:
```python
from models.schemas import ResponseModel, TradeEvent

@app.post("/api/trades", response_model=ResponseModel)
async def create_trade(trade: TradeEvent):
    try:
        # 调用引擎层处理业务逻辑
        result = position_engine.process_trade(trade)
        return ResponseModel(
            success=True,
            message="成交记录创建成功",
            data=result
        )
    except ValueError as e:
        # 业务异常
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 系统异常
        raise HTTPException(status_code=500, detail=str(e))
```

**数据库操作规范**:
- 使用 Supabase client 异步操作
- 所有数据库操作必须有异常处理
- 使用事务处理关联操作

**异常处理规范**:
- 业务异常: 400 (Bad Request)
- 未授权: 401 (Unauthorized)
- 禁止访问: 403 (Forbidden)
- 资源不存在: 404 (Not Found)
- 系统异常: 500 (Internal Server Error)

**原因**:
- 保持代码结构清晰
- 便于测试和维护
- 统一错误处理

---

## 🎨 7. 前端 UI 组件库规范

### shadcn/ui 组件集成和使用规范

**制定时间**: 2025-12-22
**适用范围**: frontend/ 目录下所有 UI 组件开发

**组件库选型**: shadcn/ui (基于 Radix UI + Tailwind CSS)

**核心原则**:
1. **优先使用 shadcn/ui 组件** - 不要自己造轮子
2. **通过 CLI 添加组件** - 使用 `npx shadcn@latest add [component]`
3. **保持组件一致性** - 所有 UI 组件风格统一
4. **充分利用定制颜色** - 使用期货交易专用颜色系统

**已集成组件**:
- **基础组件**: button, card, badge, input, label, textarea, separator
- **表单组件**: select, switch, dialog
- **数据展示**: table, tabs, skeleton, toast, progress
- **导航组件**: dropdown-menu, breadcrumb, accordion
- **图表组件**: chart (基于 Recharts)
- **提示组件**: alert, toaster

**添加新组件的步骤**:
```bash
# 1. 检查组件是否存在
ls frontend/components/ui/

# 2. 使用 CLI 添加
cd frontend
npx shadcn@latest add [component-name] --yes

# 3. 验证导入路径
# 确保可以从 @/components/ui/[component-name] 导入
```

**期货交易专用颜色**:
```typescript
// Tailwind 配置中已添加
colors: {
  profit: 'hsl(var(--profit))',   // 盈利绿色
  loss: 'hsl(var(--loss))',       // 亏损红色
  warning: 'hsl(var(--warning))'  // 警告橙色
}

// CSS 变量定义
:root {
  --profit: 142 71% 45%;
  --loss: 0 84% 60%;
  --warning: 38 92% 50%;
}

// 使用示例
<div className="text-profit">+1234.56</div>
<div className="text-loss">-987.65</div>
<div className="bg-warning">警告</div>
```

**原因**:
- shadcn/ui 组件可复制可定制,完全掌控
- 基于 Radix UI,无障碍性优秀
- 与 Tailwind CSS 深度集成
- 避免重复造轮子,提高开发效率

---

## 🖥️ 8. 前端架构和代码规范

### Next.js 15 + React 组件架构规范

**制定时间**: 2025-12-18
**适用范围**: frontend/ 目录下所有代码

**目录结构**:
```
frontend/
├── app/                 # Next.js App Router
│   ├── page.tsx        # 首页
│   ├── layout.tsx      # 根布局
│   ├── contracts/      # 合约管理页面
│   ├── lock/           # 锁仓页面
│   └── strategies/     # 策略管理页面
├── components/          # 共享组件
└── lib/                 # 工具函数
```

**组件规范**:
1. 使用 TypeScript 严格模式
2. 优先使用 React Server Components
3. 组件文件名使用 PascalCase: `ContractList.tsx`
4. 页面文件使用 `page.tsx`

**Server Components vs Client Components**:
- **Server Components** (默认):
  - 数据获取
  - 访问后端资源
  - 保持敏感信息在服务器
- **Client Components** (添加 `'use client'`):
  - 交互功能 (onClick, onChange)
  - 使用 useState, useEffect
  - 使用浏览器 API

**示例**:
```tsx
// app/contracts/page.tsx (Server Component - 获取数据)
export default async function ContractsPage() {
  const res = await fetch(`${process.env.API_URL}/api/contracts`, {
    cache: 'no-store'
  })
  const contracts = await res.json()

  return <ContractList contracts={contracts} />
}

// components/ContractList.tsx (Client Component - 交互)
'use client'
import { useState } from 'react'

interface Contract {
  id: string
  symbol: string
}

export function ContractList({ contracts }: { contracts: Contract[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div>
      {contracts.map(c => (
        <div key={c.id} onClick={() => setSelected(c.id)}>
          {c.symbol}
        </div>
      ))}
    </div>
  )
}
```

**状态管理策略**:
- 简单状态: `useState`
- 跨组件状态: Context API
- 服务器数据: Server Components
- 表单状态: React Hook Form

**样式规范**:
- 使用 Tailwind CSS utility classes
- 避免自定义 CSS (除非必要)
- 响应式设计使用 Tailwind 断点:
  - `sm:` (640px)
  - `md:` (768px)
  - `lg:` (1024px)
  - `xl:` (1280px)

**API 调用规范**:
```tsx
// Server Component 中
const data = await fetch(url, { cache: 'no-store' })

// Client Component 中 (如需要)
useEffect(() => {
  fetch('/api/contracts')
    .then(r => r.json())
    .then(setContracts)
}, [])
```

**原因**:
- 充分利用 Next.js 15 的 Server Components 优势
- 保持代码风格一致
- 提升性能和 SEO

---

## 📌 规则变更记录

| 日期 | 规则 | 变更类型 | 说明 |
|------|------|---------|------|
| 2025-12-18 | 非侵入式集成模式 | 新增 | v12-fi 集成经验总结 |
| 2025-12-18 | 数据推送格式规范 | 新增 | 统一推送数据格式 |
| 2025-12-18 | 策略目录结构规范 | 新增 | strategies/ 目录规范 |
| 2025-12-18 | 配置管理规范 | 新增 | 配置优先级和安全性 |
| 2025-12-18 | 推送保护机制规范 | 新增 | 推送失败保护标准 |
| 2025-12-18 | 后端 API 开发规范 | 新增 | FastAPI 路由和服务设计 |
| 2025-12-18 | 前端架构和代码规范 | 新增 | Next.js 15 + React 组件规范 |
| 2025-12-22 | 前端 UI 组件库规范 | 新增 | shadcn/ui 集成和使用规范 |
| 2025-12-18 | AI 代码标记规范 | 删除 | 过度侵入,已移除 |

---

**最后更新**: 2025-12-22
**规则总数**: 8 条实际规则
**覆盖范围**: strategies/ (5条) + backend/ (1条) + frontend/ (2条)
**状态**: ✅ 已启用
