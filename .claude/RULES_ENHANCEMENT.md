# project-specific-rules.md 完善建议

> 分析当前规则覆盖情况,提出补充建议

---

## 📊 当前规则覆盖分析

### ✅ 已覆盖的领域

| 规则 | 覆盖范围 | 完善度 |
|------|---------|--------|
| 1. 非侵入式集成模式 | strategies/ 集成 | ⭐⭐⭐⭐⭐ 非常完善 |
| 2. 数据推送格式规范 | API 数据格式 | ⭐⭐⭐⭐⭐ 非常完善 |
| 3. 策略目录结构规范 | strategies/ 目录 | ⭐⭐⭐⭐⭐ 非常完善 |
| 4. 配置管理规范 | 环境变量和安全 | ⭐⭐⭐⭐⭐ 非常完善 |
| 5. 推送保护机制规范 | 错误处理 | ⭐⭐⭐⭐⭐ 非常完善 |

### ❌ 缺失的领域

根据项目结构 (backend/ + frontend/ + strategies/),缺少:

1. **Backend API 开发规范** (backend/)
   - FastAPI 路由设计
   - 服务层和引擎层职责
   - 异常处理规范
   - 数据库操作规范

2. **Frontend 组件开发规范** (frontend/)
   - Next.js 15 最佳实践
   - Server Components vs Client Components
   - 状态管理策略
   - 样式规范

3. **API 接口规范**
   - WebSocket 通信规范
   - 实时数据推送格式
   - API 版本管理

4. **测试规范**
   - 单元测试要求
   - 集成测试要求
   - 测试覆盖率目标

---

## 🎯 建议新增的规则

### 6. 后端 API 开发规范

```markdown
## 🔷 6. 后端 API 开发规范

### FastAPI 路由和服务设计规范

**制定时间**: 2025-12-18
**适用范围**: backend/ 目录下所有 API 代码

**目录结构规范**:
\`\`\`
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
\`\`\`

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
\`\`\`python
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
\`\`\`

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
```

---

### 7. 前端组件开发规范

```markdown
## 🎨 7. 前端组件开发规范

### Next.js 15 + React 组件规范

**制定时间**: 2025-12-18
**适用范围**: frontend/ 目录下所有组件代码

**目录结构**:
\`\`\`
frontend/
├── app/                 # Next.js App Router
│   ├── page.tsx        # 首页
│   ├── layout.tsx      # 根布局
│   ├── contracts/      # 合约管理页面
│   ├── lock/           # 锁仓页面
│   └── strategies/     # 策略管理页面
├── components/          # 共享组件
└── lib/                 # 工具函数
\`\`\`

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
\`\`\`tsx
// app/contracts/page.tsx (Server Component - 获取数据)
export default async function ContractsPage() {
  const res = await fetch(\`\${API_URL}/api/contracts\`, {
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
  // ...
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
\`\`\`

**状态管理策略**:
- 简单状态: `useState`
- 跨组件状态: Context API
- 服务器数据: Server Components 或 React Query
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
\`\`\`tsx
// Server Component 中
const data = await fetch(url, { cache: 'no-store' })

// Client Component 中
const { data, isLoading } = useQuery({
  queryKey: ['contracts'],
  queryFn: () => fetch('/api/contracts').then(r => r.json())
})
\`\`\`

**原因**:
- 充分利用 Next.js 15 的 Server Components 优势
- 保持代码风格一致
- 提升性能和 SEO
```

---

### 8. WebSocket 通信规范

```markdown
## 🔗 8. WebSocket 实时通信规范

### FastAPI WebSocket + 前端订阅模式

**制定时间**: 2025-12-18
**适用范围**: 后端 WebSocket 路由和前端实时数据订阅

**后端 WebSocket 规范**:
\`\`\`python
@app.websocket("/ws/positions")
async def websocket_positions(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # 发送持仓更新
            positions = position_engine.get_all_positions()
            await websocket.send_json({
                "type": "positions_update",
                "data": positions,
                "timestamp": datetime.now().isoformat()
            })
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
\`\`\`

**消息格式**:
\`\`\`json
{
  "type": "positions_update | trade_event | lock_trigger",
  "data": {},
  "timestamp": "ISO 8601 格式"
}
\`\`\`

**前端订阅规范**:
\`\`\`tsx
'use client'
import { useEffect, useState } from 'react'

export function PositionMonitor() {
  const [positions, setPositions] = useState([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8888/ws/positions')

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'positions_update') {
        setPositions(message.data)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => ws.close()
  }, [])

  return <div>{/* 渲染 positions */}</div>
}
\`\`\`

**原因**:
- 统一实时数据推送格式
- 前端订阅模式一致
- 便于调试和监控
```

---

### 9. 测试规范

```markdown
## 🧪 9. 测试规范

### 测试金字塔和覆盖率要求

**制定时间**: 2025-12-18
**适用范围**: 所有代码

**测试金字塔**:
1. **单元测试** (70%) - 测试单个函数/方法
2. **集成测试** (20%) - 测试模块间交互
3. **E2E 测试** (10%) - 测试完整用户流程

**后端测试规范**:
\`\`\`python
# backend/tests/test_position_engine.py
import pytest
from engines.position_engine import PositionEngine

def test_process_trade():
    engine = PositionEngine()
    trade = TradeEvent(
        symbol="IF2503",
        direction="buy",
        volume=1,
        price=4000.0
    )
    result = engine.process_trade(trade)
    assert result["success"] is True
\`\`\`

**前端测试规范**:
\`\`\`tsx
// __tests__/ContractList.test.tsx
import { render, screen } from '@testing-library/react'
import { ContractList } from '@/components/ContractList'

test('renders contract list', () => {
  const contracts = [{ id: '1', symbol: 'IF2503' }]
  render(<ContractList contracts={contracts} />)
  expect(screen.getByText('IF2503')).toBeInTheDocument()
})
\`\`\`

**覆盖率要求**:
- 核心业务逻辑 (engines/): ≥ 80%
- API 路由 (main.py): ≥ 70%
- 前端组件: ≥ 60%
- 工具函数 (utils/): ≥ 80%

**原因**:
- 保证代码质量
- 防止回归错误
- 便于重构
```

---

## 📝 建议的更新流程

### 1. 立即补充 (建议)
- ✅ 规则 6: 后端 API 开发规范
- ✅ 规则 7: 前端组件开发规范

### 2. 按需补充 (可选)
- 规则 8: WebSocket 通信规范 (如果经常用)
- 规则 9: 测试规范 (如果要求测试覆盖率)

### 3. 动态补充
- 开发过程中遇到重复问题 → 记录规则
- 你明确说 "记录这个规则" → 记录规则

---

## 💡 是否补充规则的判断标准

### ✅ 应该补充规则的情况
1. **重复出现的问题** - 连续 2 次以上犯同样的错
2. **架构相关决策** - 影响整个项目的设计
3. **团队协作需要** - 多人开发需要统一规范
4. **安全性要求** - 必须遵守的安全规则

### ❌ 不需要补充规则的情况
1. **显而易见的约定** - 如"变量命名用小写"
2. **一次性的特殊处理** - 不会重复的临时方案
3. **个人偏好** - 不影响功能的代码风格

---

## 🎯 我的建议

**对于你的项目,建议补充:**

1. **规则 6: 后端 API 开发规范** ⭐⭐⭐⭐⭐ (强烈建议)
   - 你的 backend/ 目录结构已经很清晰了
   - 记录下来可以保持一致性

2. **规则 7: 前端组件开发规范** ⭐⭐⭐⭐ (建议)
   - Next.js 15 的 Server Components 是核心
   - 记录下来避免混用 Server/Client 组件

3. **规则 8: WebSocket 规范** ⭐⭐⭐ (可选)
   - 如果你经常用 WebSocket,建议记录

4. **规则 9: 测试规范** ⭐⭐ (看需求)
   - 如果要求测试覆盖率,建议记录

---

**是否需要我帮你补充这些规则到 project-specific-rules.md?**
