# Components 组件模块指南

> QuantFu 前端的所有 React 组件,包括基础 UI 组件和业务功能组件

---

## 📌 模块职责

负责提供可复用的 React 组件,分为基础 UI 组件和业务功能组件。

**职责范围:**
- 基础 UI 组件 (按钮、卡片、对话框、表单等)
- 业务功能组件 (导航栏、图表、对话框等)
- 组件的样式和交互逻辑
- 组件的 Props 接口和类型定义

**不在范围:**
- 数据获取逻辑 (应在页面层处理)
- 业务规则判断 (应在服务层或页面层处理)
- 路由跳转逻辑 (应在页面层处理)

---

## 📁 文件结构

```
components/
├── ui/                                 # 基础 UI 组件 (shadcn/ui)
│   ├── badge.tsx                       # 徽章组件
│   ├── button.tsx                      # 按钮组件
│   ├── card.tsx                        # 卡片组件
│   ├── dialog.tsx                      # 对话框组件
│   ├── input.tsx                       # 输入框组件
│   ├── label.tsx                       # 标签组件
│   ├── switch.tsx                      # 开关组件
│   └── table.tsx                       # 表格组件
├── Navigation.tsx                      # 顶部导航栏组件
├── KLineChart.tsx                      # K线图表组件
├── MarginCalculator.tsx                # 保证金计算器组件
├── CreateInstanceDialog.tsx            # 创建策略实例对话框
├── InstanceParamsDialog.tsx            # 策略实例参数配置对话框
├── ParamHistoryDialog.tsx              # 参数历史记录对话框
├── CreateGroupDialog.tsx               # 创建策略组对话框
├── GroupSettingsDialog.tsx             # 策略组设置对话框
├── GroupMembersDialog.tsx              # 策略组成员管理对话框
├── CreateRolloverTaskDialog.tsx        # 创建换月任务对话框
├── RolloverTaskDetailDialog.tsx        # 换月任务详情对话框
└── LockConfigDialog.tsx                # 锁仓配置对话框
```

### 文件分类说明

**基础 UI 组件 (ui/)**:
- 来自 shadcn/ui 组件库
- 高度可定制的无障碍组件
- 基于 Radix UI 构建
- 使用 Tailwind CSS 样式

**布局组件**:
- `Navigation.tsx`: 应用顶部导航栏,包含所有页面链接

**可视化组件**:
- `KLineChart.tsx`: 基于 lightweight-charts 的K线图表
- `MarginCalculator.tsx`: 期货保证金计算工具

**业务对话框组件**:
- 策略管理相关: `CreateInstanceDialog`, `InstanceParamsDialog`, `ParamHistoryDialog`
- 策略组相关: `CreateGroupDialog`, `GroupSettingsDialog`, `GroupMembersDialog`
- 换月相关: `CreateRolloverTaskDialog`, `RolloverTaskDetailDialog`
- 锁仓相关: `LockConfigDialog`

---

## ⚙️ 主要功能

### 功能1: Navigation - 顶部导航栏

**用途**: 提供应用的主导航,支持页面切换和路由高亮

**示例**:
```typescript
// app/layout.tsx
import Navigation from '@/components/Navigation'

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )
}
```

**Props**: 无 (内部使用 `usePathname` 获取当前路由)

**特性**:
- 自动高亮当前页面
- 响应式布局
- 图标 + 文字导航
- 使用 `lucide-react` 图标库

---

### 功能2: KLineChart - K线图表组件

**用途**: 使用 lightweight-charts 展示期货合约的K线图和成交量

**示例**:
```typescript
import KLineChart from '@/components/KLineChart'

const klineData = [
  {
    time: 1700000000,
    open: 3000,
    high: 3100,
    low: 2950,
    close: 3050,
    volume: 12345
  },
  // ... more data
]

const markers = [
  {
    time: 1700000000,
    position: 'belowBar',
    color: '#2196F3',
    shape: 'arrowUp',
    text: '买入',
  }
]

<KLineChart
  data={klineData}
  markers={markers}
  height={400}
/>
```

**Props**:
- `data: KLineData[]` - K线数据数组
  - `time`: Unix 时间戳
  - `open`: 开盘价
  - `high`: 最高价
  - `low`: 最低价
  - `close`: 收盘价
  - `volume`: 成交量
- `markers?: Marker[]` - 交易标记点 (可选)
- `height?: number` - 图表高度,默认 400px

**特性**:
- K线和成交量双图表
- 支持交易标记点
- 响应式自适应窗口大小
- 涨跌颜色区分 (绿涨红跌)
- 鼠标十字线交互

---

### 功能3: Dialog 系列 - 业务对话框组件

#### CreateInstanceDialog - 创建策略实例

**用途**: 创建新的策略实例,配置策略、账户、合约等

**示例**:
```typescript
import CreateInstanceDialog from '@/components/CreateInstanceDialog'

const [open, setOpen] = useState(false)

<CreateInstanceDialog
  open={open}
  onOpenChange={setOpen}
  onInstanceCreated={() => {
    // 刷新列表
    fetchInstances()
  }}
/>
```

**Props**:
- `open: boolean` - 对话框是否打开
- `onOpenChange: (open: boolean) => void` - 状态变更回调
- `onInstanceCreated: () => void` - 实例创建成功回调

---

#### InstanceParamsDialog - 参数配置

**用途**: 配置策略实例的运行参数

**Props**:
- `open: boolean` - 对话框是否打开
- `onOpenChange: (open: boolean) => void` - 状态变更回调
- `instance: StrategyInstance` - 要配置的实例
- `onParamsUpdated: () => void` - 参数更新成功回调

---

#### ParamHistoryDialog - 参数历史

**用途**: 查看策略实例的参数变更历史

**Props**:
- `open: boolean` - 对话框是否打开
- `onOpenChange: (open: boolean) => void` - 状态变更回调
- `instance: StrategyInstance` - 要查看的实例

---

### 功能4: UI 组件库 (ui/)

#### Button - 按钮组件

**示例**:
```typescript
import { Button } from '@/components/ui/button'

<Button variant="default">默认按钮</Button>
<Button variant="outline">轮廓按钮</Button>
<Button variant="destructive">危险按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>
```

**变体 (variant)**:
- `default` - 默认蓝色主题
- `outline` - 轮廓样式
- `destructive` - 红色危险按钮
- `ghost` - 透明背景
- `secondary` - 次要按钮
- `link` - 链接样式

**尺寸 (size)**:
- `default` - 默认尺寸
- `sm` - 小尺寸
- `lg` - 大尺寸
- `icon` - 图标按钮

---

#### Card - 卡片组件

**示例**:
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述</CardDescription>
  </CardHeader>
  <CardContent>
    卡片内容
  </CardContent>
</Card>
```

---

#### Dialog - 对话框组件

**示例**:
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>对话框标题</DialogTitle>
      <DialogDescription>对话框描述</DialogDescription>
    </DialogHeader>
    <div>
      {/* 内容 */}
    </div>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>关闭</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

#### Table - 表格组件

**示例**:
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>列1</TableHead>
      <TableHead>列2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>数据1</TableCell>
      <TableCell>数据2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

#### Badge - 徽章组件

**示例**:
```typescript
import { Badge } from '@/components/ui/badge'

<Badge variant="default">默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="destructive">危险</Badge>
<Badge variant="outline">轮廓</Badge>
```

---

## 🔗 依赖关系

### 依赖的模块

- `@/lib/utils` - cn() 样式合并工具函数
- `@/lib/supabase` - Supabase 客户端和类型定义
- `next/link` - Next.js 路由链接
- `next/navigation` - usePathname 等路由 Hook
- `lucide-react` - 图标库
- `@radix-ui/*` - UI 组件基础库
- `lightweight-charts` - 图表库 (仅 KLineChart)

### 被依赖的地方

**Navigation.tsx**:
- `app/layout.tsx` - 所有页面的根布局

**UI 组件 (ui/)**:
- 被所有页面和业务组件使用

**KLineChart.tsx**:
- `app/chart/page.tsx` - K线图表页面

**业务对话框组件**:
- `app/strategies/page.tsx` - 策略管理页面
- `app/strategy-groups/page.tsx` - 策略组管理页面
- `app/rollover-tasks/page.tsx` - 换月任务页面
- `app/lock-config/page.tsx` - 锁仓配置页面

---

## 🎯 使用示例

### 基础使用: 创建新的业务组件

```typescript
// components/MyFeatureComponent.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MyFeatureComponentProps {
  data: any[]
  onAction: (id: string) => void
}

export default function MyFeatureComponent({
  data,
  onAction
}: MyFeatureComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>功能标题</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map(item => (
          <div key={item.id} className="flex items-center justify-between">
            <span>{item.name}</span>
            <Badge>{item.status}</Badge>
            <Button onClick={() => onAction(item.id)}>
              操作
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

### 高级使用: 创建对话框组件

```typescript
// components/MyDialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormData) => Promise<void>
}

export default function MyDialog({
  open,
  onOpenChange,
  onSubmit
}: MyDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    value: ''
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
      // 重置表单
      setFormData({ name: '', value: '' })
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>对话框标题</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value
              })}
            />
          </div>
          <div>
            <Label htmlFor="value">数值</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({
                ...formData,
                value: e.target.value
              })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '提交中...' : '确认'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 高级使用: 带状态管理的图表组件

```typescript
// components/AdvancedChart.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import KLineChart from '@/components/KLineChart'
import { Button } from '@/components/ui/button'

interface AdvancedChartProps {
  symbol: string
}

export default function AdvancedChart({ symbol }: AdvancedChartProps) {
  const [klineData, setKlineData] = useState([])
  const [markers, setMarkers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [symbol])

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/kline/${symbol}`)
      const data = await response.json()
      setKlineData(data.klines)
      setMarkers(data.trades)
    } catch (error) {
      console.error('获取图表数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{symbol}</h3>
        <Button onClick={fetchChartData} variant="outline">
          刷新
        </Button>
      </div>
      <KLineChart
        data={klineData}
        markers={markers}
        height={500}
      />
    </div>
  )
}
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建基础 UI 组件库 (shadcn/ui) | AI |
| 2025-12-18 | 新增 | 添加 Navigation 导航栏组件 | AI |
| 2025-12-18 | 新增 | 添加 KLineChart 图表组件 | AI |
| 2025-12-18 | 新增 | 添加策略管理相关对话框组件 | AI |
| 2025-12-18 | 新增 | 添加策略组管理相关对话框组件 | AI |
| 2025-12-18 | 新增 | 添加换月和锁仓相关对话框组件 | AI |
| 2025-12-18 | 文档 | 创建组件模块完整文档 | AI |

---

## 🎯 最佳实践

### 1. 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **Props 类型化**: 必须定义 TypeScript 接口
- **可复用性**: 避免硬编码,通过 Props 传递数据
- **无副作用**: 组件不应直接修改外部状态

### 2. 客户端组件标记

```typescript
// 需要交互的组件必须标记 'use client'
'use client'

import { useState } from 'react'

export default function InteractiveComponent() {
  const [count, setCount] = useState(0)
  // ...
}
```

### 3. 样式规范

```typescript
// 使用 cn() 合并 Tailwind 类名
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === 'primary' && "primary-classes"
)} />
```

### 4. 事件处理

```typescript
// 使用箭头函数或 useCallback
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependencies])

<Button onClick={handleClick}>点击</Button>
```

### 5. 条件渲染

```typescript
// 简单条件使用 &&
{isVisible && <Component />}

// 复杂条件使用三元运算符
{status === 'loading' ? <Spinner /> : <Content />}

// 多条件使用函数
const renderContent = () => {
  if (status === 'loading') return <Spinner />
  if (status === 'error') return <Error />
  return <Content />
}
```

### 6. 组件导出

```typescript
// 默认导出组件本身
export default function MyComponent() {}

// 具名导出 Props 类型 (可选,供其他组件引用)
export type MyComponentProps = {
  // ...
}
```

---

## ⚠️ 注意事项

### 1. 客户端 vs 服务端组件

- **默认是服务端组件**: 不需要 `'use client'`
- **需要交互才用客户端**: 使用 useState、useEffect 等 Hook 时需要 `'use client'`
- **UI 组件是客户端组件**: 基础 UI 组件都已标记 `'use client'`

### 2. 组件命名规范

- **文件名**: PascalCase (例: `CreateInstanceDialog.tsx`)
- **组件名**: 与文件名一致
- **Props 类型**: 组件名 + Props (例: `CreateInstanceDialogProps`)

### 3. Props 设计

```typescript
// ✅ 好的设计
interface Props {
  data: User[]              // 明确的类型
  onSubmit: (id: string) => void  // 明确的回调签名
  disabled?: boolean        // 可选参数用 ?
}

// ❌ 不好的设计
interface Props {
  data: any                 // 避免 any
  callback: Function        // 避免 Function
  flag: boolean             // 命名不明确
}
```

### 4. 性能优化

- **避免内联函数**: 在 Props 中使用 useCallback
- **避免内联对象**: 使用 useMemo 或提取到外部
- **列表使用 key**: 必须提供稳定的 key 值

```typescript
// ❌ 不好的写法
<Button onClick={() => handleClick(item.id)} />
{items.map(item => <Item data={{ id: item.id }} />)}

// ✅ 好的写法
const handleClick = useCallback((id) => {}, [])
<Button onClick={() => handleClick(item.id)} />

const itemData = useMemo(() => ({ id: item.id }), [item.id])
<Item data={itemData} />
```

### 5. 样式冲突

- **使用 cn() 函数**: 避免直接拼接类名
- **避免硬编码尺寸**: 使用响应式单位
- **遵循设计系统**: 使用 Tailwind 主题色

---

## 🐛 常见问题

### Q: 组件样式不生效?

**A**: 检查以下几点:
1. 是否使用 `cn()` 函数合并类名
2. Tailwind 类名是否正确
3. 是否有样式冲突 (使用浏览器开发者工具检查)
4. 组件库样式是否正确导入

### Q: 'use client' 应该放在哪里?

**A**:
- 放在文件最顶部 (第一行)
- 只在需要客户端特性的组件中使用
- 使用了 React Hook 的组件必须标记
- UI 组件库 (ui/) 已经标记,无需重复

### Q: 如何在组件中使用 Supabase?

**A**:
```typescript
'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('table').select('*')
      setData(data || [])
    }
    fetchData()
  }, [])

  // ...
}
```

### Q: Dialog 对话框如何控制显示?

**A**:
```typescript
// 父组件中
const [open, setOpen] = useState(false)

<Button onClick={() => setOpen(true)}>打开对话框</Button>

<MyDialog
  open={open}
  onOpenChange={setOpen}  // Dialog 会调用这个函数来关闭
/>
```

### Q: 如何自定义 UI 组件样式?

**A**:
```typescript
// 使用 className 覆盖
<Button className="bg-red-500 hover:bg-red-600">
  自定义颜色
</Button>

// 或者修改 components/ui/button.tsx 中的变体
```

### Q: 组件之间如何通信?

**A**:
1. **父子组件**: 通过 Props 传递数据和回调
2. **兄弟组件**: 提升状态到共同父组件
3. **跨层级**: 使用 Context 或状态管理库 (Zustand)
4. **全局状态**: 使用 Zustand store

---

## 📚 相关文档

- [前端总体架构](../.claude/guide.md)
- [库模块文档](../lib/.claude/guide.md)
- [App Router 文档](../app/.claude/guide.md)
- [shadcn/ui 官方文档](https://ui.shadcn.com)
- [Radix UI 文档](https://www.radix-ui.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**📌 文档状态**: ✅ 已完成
**最后更新**: 2025-12-18
**维护者**: AI Assistant

---

> ⚠️ **AI 生成文档标记**: 本文档由 AI 助手根据实际代码生成,已经过人工审核确认准确性。如发现与实际代码不符,请及时更新。
