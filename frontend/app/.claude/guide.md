# App Router 模块指南

> QuantFu 前端的 Next.js 15 App Router 页面模块,包含所有业务页面和路由

---

## 📌 模块职责

负责应用的所有页面和路由,使用 Next.js 15 的 App Router 架构。

**职责范围:**
- 定义应用的所有路由和页面
- 页面级的数据获取和状态管理
- 布局组件和元数据配置
- 页面间的导航和参数传递

**不在范围:**
- 可复用组件 (应放在 components/ 中)
- 数据类型定义 (应放在 lib/ 中)
- 工具函数 (应放在 lib/ 中)

---

## 📁 文件结构

```
app/
├── layout.tsx                  # 根布局 - 包含导航栏和全局样式
├── page.tsx                    # 首页 - 持仓监控
├── globals.css                 # 全局样式文件
├── strategies/
│   └── page.tsx                # 策略实例管理页面
├── strategy-groups/
│   └── page.tsx                # 策略组管理页面
├── signals/
│   └── page.tsx                # 信号监控页面
├── performance/
│   └── page.tsx                # 性能对比页面
├── resources/
│   └── page.tsx                # 资源监控页面
├── conflicts/
│   └── page.tsx                # 冲突管理页面
├── lock/
│   └── page.tsx                # 锁仓管理页面
├── lock-config/
│   └── page.tsx                # 锁仓配置页面
├── contracts/
│   └── page.tsx                # 合约管理页面
├── chart/
│   └── page.tsx                # K线图表页面
├── rollover-tasks/
│   └── page.tsx                # 换月任务页面
└── rollover-stats/
    └── page.tsx                # 换月统计页面
```

### 路由映射

| 路由 | 文件 | 功能 | 图标 |
|------|------|------|------|
| `/` | `page.tsx` | 持仓监控首页 | LayoutDashboard |
| `/strategies` | `strategies/page.tsx` | 策略实例管理 | Activity |
| `/strategy-groups` | `strategy-groups/page.tsx` | 策略组管理 | Users |
| `/signals` | `signals/page.tsx` | 信号监控 | Zap |
| `/performance` | `performance/page.tsx` | 性能对比 | Trophy |
| `/resources` | `resources/page.tsx` | 资源监控 | DollarSign |
| `/conflicts` | `conflicts/page.tsx` | 冲突管理 | AlertTriangle |
| `/lock` | `lock/page.tsx` | 锁仓管理 | Lock |
| `/lock-config` | `lock-config/page.tsx` | 锁仓配置 | Settings |
| `/contracts` | `contracts/page.tsx` | 合约管理 | FileText |
| `/chart` | `chart/page.tsx` | K线图表 | BarChart3 |
| `/rollover-tasks` | `rollover-tasks/page.tsx` | 换月任务 | ArrowRightLeft |
| `/rollover-stats` | `rollover-stats/page.tsx` | 换月统计 | TrendingUp |

---

## ⚙️ 主要功能

### 功能1: layout.tsx - 根布局

**用途**: 应用的根布局组件,包含导航栏、全局样式和元数据配置

**代码**:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "期货量化管理平台 - QuantFu",
  description: "期货持仓监控与管理系统",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuantFu",
  },
};

export const viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
```

**特性**:
- 使用 Inter 字体 (Google Fonts)
- 配置 PWA 元数据和图标
- 全局导航栏
- 响应式布局容器

---

### 功能2: page.tsx - 持仓监控首页

**用途**: 实时展示期货持仓数据,包括盈亏、持仓量等关键指标

**核心功能**:
1. **数据获取**: 从 Supabase 查询持仓汇总视图
2. **实时订阅**: 订阅 positions 表变更
3. **定时刷新**: 30秒定时刷新作为备用
4. **统计计算**: 总盈亏、品种数量、净持仓统计

**代码示例**:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase, type PositionSummary } from '@/lib/supabase'

export default function Home() {
  const [positions, setPositions] = useState<PositionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from('v_positions_summary')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error) setPositions(data || [])
  }

  useEffect(() => {
    fetchPositions()

    // 实时订阅
    const channel = supabase
      .channel('positions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'positions'
      }, () => fetchPositions())
      .subscribe()

    // 定时刷新
    const interval = setInterval(fetchPositions, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  // 计算统计
  const totalProfit = positions.reduce((sum, pos) => sum + (pos.total_profit || 0), 0)

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* 统计卡片和持仓列表 */}
    </main>
  )
}
```

**页面结构**:
- 页面标题和刷新按钮
- 3个统计卡片 (总盈亏、持仓品种、净持仓)
- 持仓明细表格

---

### 功能3: strategies/page.tsx - 策略实例管理

**用途**: 管理策略实例的启动、停止、参数配置等

**核心功能**:
1. **实例列表**: 展示所有策略实例
2. **状态控制**: 启动/暂停/停止实例
3. **心跳监控**: 检测实例是否正常运行
4. **参数配置**: 打开参数配置和历史对话框
5. **统计展示**: 今日盈亏、交易笔数、胜率

**状态管理**:
```typescript
// 实例状态
type InstanceStatus = 'stopped' | 'running' | 'paused' | 'error'

// 状态控制
const handleStatusChange = async (instanceId: string, status: string) => {
  await fetch(`/api/strategy-instances/${instanceId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
  fetchInstances()  // 刷新列表
}
```

**心跳检测**:
```typescript
const getStatusBadge = (instance: StrategyInstance) => {
  const now = new Date()
  const lastHeartbeat = instance.last_heartbeat ? new Date(instance.last_heartbeat) : null
  const minutesSinceHeartbeat = lastHeartbeat
    ? Math.floor((now.getTime() - lastHeartbeat.getTime()) / 60000)
    : null

  // 超过5分钟没有心跳,标记为异常
  if (instance.status === 'running' && minutesSinceHeartbeat && minutesSinceHeartbeat > 5) {
    return <Badge variant="destructive">异常 (无心跳 {minutesSinceHeartbeat}分钟)</Badge>
  }

  // ... 其他状态
}
```

**页面结构**:
- 页面标题和创建按钮
- 6个统计卡片 (总数、运行中、停止、异常、今日盈亏、今日交易)
- 实例卡片列表 (包含状态、操作按钮、统计信息)

---

### 功能4: strategy-groups/page.tsx - 策略组管理

**用途**: 管理策略组,配置资金分配和风险控制

**核心功能**:
1. **策略组列表**: 展示所有策略组
2. **成员管理**: 查看和编辑策略组成员
3. **资金分配**: 配置总资金和单策略限额
4. **风险控制**: 配置持仓比例和冲突处理
5. **统计监控**: 已分配资金、运行策略数、总盈亏

**冲突处理模式**:
```typescript
type ConflictMode = 'allow' | 'reject' | 'merge'

// allow: 允许对手仓
// reject: 拒绝对手仓信号
// merge: 合并为净持仓
```

**页面结构**:
- 页面标题和创建按钮
- 策略组卡片列表
- 每个卡片包含: 基本信息、成员列表、统计数据、操作按钮

---

### 功能5: signals/page.tsx - 信号监控

**用途**: 实时监控策略产生的交易信号

**核心功能**:
1. **信号列表**: 展示所有交易信号
2. **状态过滤**: 待执行/已执行/已拒绝/已过期
3. **实时更新**: 订阅信号表变更
4. **信号详情**: 显示置信度、强度、目标价格等

**信号类型**:
```typescript
type SignalType = 'open' | 'close' | 'reverse'
type SignalStatus = 'pending' | 'executed' | 'rejected' | 'expired'
type SignalStrength = 'weak' | 'medium' | 'strong'
```

---

### 功能6: contracts/page.tsx - 合约管理

**用途**: 管理期货合约信息,包括主力合约标记和到期监控

**核心功能**:
1. **合约列表**: 展示所有期货合约
2. **主力标记**: 标记主力合约
3. **到期监控**: 显示距离到期天数
4. **合约搜索**: 按品种、交易所筛选
5. **保证金计算**: 集成保证金计算器

**页面结构**:
- 搜索和筛选工具栏
- 合约列表表格
- 保证金计算器侧边栏

---

### 功能7: chart/page.tsx - K线图表

**用途**: 展示期货合约的K线图表和交易标记

**核心功能**:
1. **K线展示**: 使用 KLineChart 组件展示
2. **交易标记**: 在图表上标记买卖点
3. **合约切换**: 切换不同合约的图表
4. **时间周期**: 切换不同时间周期 (1分钟、5分钟、日线等)

**数据格式**:
```typescript
interface KLineData {
  time: number        // Unix 时间戳
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface TradeMarker {
  time: number
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown'
  text: string
}
```

---

### 功能8: rollover-tasks/page.tsx - 换月任务

**用途**: 管理期货合约换月任务

**核心功能**:
1. **任务列表**: 展示所有换月任务
2. **任务创建**: 创建新的换月任务
3. **执行监控**: 监控任务执行进度
4. **任务详情**: 查看任务详细信息和执行步骤

**任务状态**:
```typescript
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
```

---

## 🔗 依赖关系

### 依赖的模块

- `@/components/*` - 所有组件 (Navigation、Dialog、UI等)
- `@/lib/supabase` - Supabase 客户端和类型定义
- `@/lib/utils` - cn() 工具函数
- `next/font/google` - Google 字体
- `next/navigation` - usePathname 等路由 Hook
- `date-fns` - 日期格式化
- `lucide-react` - 图标

### 被依赖的地方

- 无 (App Router 是应用的最外层)

---

## 🎯 使用示例

### 基础使用: 创建新页面

```typescript
// app/new-page/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    // 数据获取逻辑
  }, [])

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">页面标题</h1>
      <Card>
        <CardHeader>
          <CardTitle>卡片标题</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 内容 */}
        </CardContent>
      </Card>
    </main>
  )
}
```

### 高级使用: 带实时订阅的页面

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase, type StrategyInstance } from '@/lib/supabase'

export default function RealtimePage() {
  const [instances, setInstances] = useState<StrategyInstance[]>([])

  useEffect(() => {
    fetchData()

    // 实时订阅
    const channel = supabase
      .channel('instances_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'strategy_instances'
      }, (payload) => {
        console.log('数据变化:', payload)
        fetchData()
      })
      .subscribe()

    // 定时刷新 (备用)
    const interval = setInterval(fetchData, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('strategy_instances')
      .select('*')
    setInstances(data || [])
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* 渲染数据 */}
    </main>
  )
}
```

### 高级使用: 带对话框的页面

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import CreateDialog from '@/components/CreateDialog'

export default function PageWithDialog() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [data, setData] = useState([])

  const handleCreate = async (newData: any) => {
    // 创建逻辑
    await fetch('/api/resource', {
      method: 'POST',
      body: JSON.stringify(newData)
    })
    fetchData()  // 刷新列表
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">页面标题</h1>
        <Button onClick={() => setDialogOpen(true)}>
          创建
        </Button>
      </div>

      {/* 列表 */}

      <CreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </main>
  )
}
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建根布局和首页 | AI |
| 2025-12-18 | 新增 | 添加策略管理页面 (strategies, strategy-groups) | AI |
| 2025-12-18 | 新增 | 添加信号和性能监控页面 (signals, performance) | AI |
| 2025-12-18 | 新增 | 添加资源和冲突管理页面 (resources, conflicts) | AI |
| 2025-12-18 | 新增 | 添加锁仓管理页面 (lock, lock-config) | AI |
| 2025-12-18 | 新增 | 添加合约和图表页面 (contracts, chart) | AI |
| 2025-12-18 | 新增 | 添加换月管理页面 (rollover-tasks, rollover-stats) | AI |
| 2025-12-18 | 文档 | 创建 App Router 模块完整文档 | AI |

---

## 🎯 最佳实践

### 1. 页面结构规范

```typescript
// 统一的页面结构
export default function Page() {
  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* 页面标题区 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">页面标题</h1>
        {/* 操作按钮 */}
      </div>

      {/* 统计卡片区 (可选) */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {/* 统计卡片 */}
      </div>

      {/* 主内容区 */}
      <Card>
        <CardHeader>
          <CardTitle>内容标题</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 主要内容 */}
        </CardContent>
      </Card>
    </main>
  )
}
```

### 2. 数据获取模式

```typescript
'use client'

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('table')
        .select('*')

      if (error) {
        console.error('获取数据失败:', error)
        return
      }

      setData(data || [])
    } catch (err) {
      console.error('获取数据异常:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return <main>{/* 渲染数据 */}</main>
}
```

### 3. 实时订阅模式

```typescript
useEffect(() => {
  // 初始加载
  fetchData()

  // 订阅实时更新
  const channel = supabase
    .channel('unique_channel_name')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name'
    }, (payload) => {
      console.log('数据变化:', payload)
      fetchData()
    })
    .subscribe()

  // 定时刷新 (备用机制)
  const interval = setInterval(fetchData, 30000)

  // 清理
  return () => {
    supabase.removeChannel(channel)
    clearInterval(interval)
  }
}, [])
```

### 4. 元数据配置

```typescript
// page.tsx 或 layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '页面标题 - QuantFu',
  description: '页面描述',
}
```

### 5. 响应式设计

```typescript
// 使用 Tailwind 断点
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 移动端1列,平板2列,桌面3列 */}
</div>

<div className="p-4 md:p-8">
  {/* 移动端小内边距,桌面端大内边距 */}
</div>
```

---

## ⚠️ 注意事项

### 1. 客户端组件标记

- **默认服务端组件**: 不需要标记 `'use client'`
- **需要交互时标记**: 使用 useState、useEffect 等 Hook 时必须标记
- **标记位置**: 文件最顶部第一行

### 2. 数据获取

- **初始加载**: 在 useEffect 中调用
- **实时订阅**: 配合 useEffect 的清理函数
- **错误处理**: 始终处理错误和加载状态

### 3. 性能优化

- **避免过度渲染**: 使用 useMemo、useCallback
- **分页加载**: 大数据量使用分页
- **懒加载**: 大型组件使用 dynamic import

### 4. 路由和导航

```typescript
// 使用 Link 组件
import Link from 'next/link'
<Link href="/strategies">策略管理</Link>

// 编程式导航
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/strategies')
```

---

## 🐛 常见问题

### Q: 'use client' 应该放在哪里?

**A**: 放在文件最顶部第一行,在所有 import 之前。

### Q: 如何在页面之间传递数据?

**A**:
1. **URL 参数**: 使用 searchParams (推荐)
2. **路由参数**: 使用动态路由 `[id]`
3. **状态管理**: 使用 Zustand 全局状态
4. **本地存储**: 使用 localStorage (少用)

```typescript
// 方法1: URL 参数
router.push('/strategies?id=123')

// 方法2: 动态路由
// app/strategies/[id]/page.tsx
export default function Page({ params }: { params: { id: string } }) {
  // params.id
}
```

### Q: 页面加载很慢怎么办?

**A**:
1. 检查是否使用了服务端组件 (避免客户端渲染)
2. 数据查询优化 (只查询需要的字段)
3. 图片优化 (使用 next/image)
4. 代码分割 (使用 dynamic import)

### Q: 实时订阅不更新?

**A**:
1. 检查订阅配置 (表名、schema)
2. Supabase Dashboard 检查 Realtime 是否启用
3. 浏览器控制台查看连接错误
4. 确认 channel 名称唯一

### Q: 如何调试页面?

**A**:
```typescript
// 添加日志
console.log('数据:', data)

// 使用 React DevTools
// 安装浏览器扩展: React Developer Tools

// 检查 Supabase 连接
supabase.auth.getSession().then(console.log)
```

---

## 📚 相关文档

- [前端总体架构](../.claude/guide.md)
- [组件模块文档](../components/.claude/guide.md)
- [库模块文档](../lib/.claude/guide.md)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

**📌 文档状态**: ✅ 已完成
**最后更新**: 2025-12-18
**维护者**: AI Assistant

---

> ⚠️ **AI 生成文档标记**: 本文档由 AI 助手根据实际代码生成,已经过人工审核确认准确性。如发现与实际代码不符,请及时更新。
