# QuantFu 前端模块指南

> QuantFu 期货量化管理平台的前端应用,基于 Next.js 15 构建的现代化 Web 应用

---

## 📌 模块职责

QuantFu 前端负责期货交易管理平台的用户界面和交互逻辑。

**职责范围:**
- 持仓监控实时展示与数据可视化
- 策略实例管理和参数配置
- 锁仓管理和换月任务监控
- 合约信息查看和保证金计算
- 策略组管理和资源监控
- K线图表展示和交易信号监控

**不在范围:**
- 交易策略的执行逻辑 (由后端 Python 服务处理)
- 数据存储和业务逻辑 (由 Supabase 和后端 API 处理)
- 行情数据获取 (由极星量化平台 SDK 处理)

---

## 📁 文件结构

```
frontend/
├── app/                        # Next.js 15 App Router
│   ├── layout.tsx              # 根布局组件,包含导航栏
│   ├── page.tsx                # 首页 - 持仓监控
│   ├── globals.css             # 全局样式
│   ├── strategies/             # 策略实例管理页面
│   ├── strategy-groups/        # 策略组管理页面
│   ├── signals/                # 信号监控页面
│   ├── lock/                   # 锁仓管理页面
│   ├── lock-config/            # 锁仓配置页面
│   ├── contracts/              # 合约管理页面
│   ├── chart/                  # K线图表页面
│   ├── rollover-tasks/         # 换月任务页面
│   ├── rollover-stats/         # 换月统计页面
│   ├── performance/            # 性能对比页面
│   ├── resources/              # 资源监控页面
│   └── conflicts/              # 冲突管理页面
├── components/                 # React 组件
│   ├── ui/                     # 基础 UI 组件 (shadcn/ui)
│   │   ├── button.tsx          # 按钮组件
│   │   ├── card.tsx            # 卡片组件
│   │   ├── dialog.tsx          # 对话框组件
│   │   ├── input.tsx           # 输入框组件
│   │   ├── label.tsx           # 标签组件
│   │   ├── switch.tsx          # 开关组件
│   │   ├── table.tsx           # 表格组件
│   │   └── badge.tsx           # 徽章组件
│   ├── Navigation.tsx          # 顶部导航栏
│   ├── KLineChart.tsx          # K线图表组件
│   ├── MarginCalculator.tsx    # 保证金计算器
│   ├── CreateInstanceDialog.tsx            # 创建策略实例对话框
│   ├── InstanceParamsDialog.tsx            # 实例参数配置对话框
│   ├── ParamHistoryDialog.tsx              # 参数历史对话框
│   ├── CreateGroupDialog.tsx               # 创建策略组对话框
│   ├── GroupSettingsDialog.tsx             # 策略组设置对话框
│   ├── GroupMembersDialog.tsx              # 策略组成员对话框
│   ├── CreateRolloverTaskDialog.tsx        # 创建换月任务对话框
│   ├── RolloverTaskDetailDialog.tsx        # 换月任务详情对话框
│   └── LockConfigDialog.tsx                # 锁仓配置对话框
├── lib/                        # 工具库和配置
│   ├── supabase.ts             # Supabase 客户端和类型定义
│   └── utils.ts                # 工具函数 (cn 等)
├── public/                     # 静态资源
│   ├── manifest.json           # PWA 配置文件
│   └── icons/                  # 应用图标
├── next.config.ts              # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 项目依赖
```

---

## ⚙️ 主要功能

### 功能1: 持仓监控实时展示

**用途**: 实时展示期货持仓数据,包括盈亏、持仓量等关键指标

**示例**:
```typescript
// app/page.tsx
const [positions, setPositions] = useState<PositionSummary[]>([])

// 订阅实时更新
const channel = supabase
  .channel('positions_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'positions'
  }, (payload) => {
    fetchPositions()
  })
  .subscribe()
```

**技术特性**:
- 使用 Supabase Realtime 订阅数据库变更
- 30秒定时刷新作为备用机制
- 自动计算总盈亏和持仓统计

---

### 功能2: K线图表可视化

**用途**: 使用 lightweight-charts 展示期货合约的K线图

**示例**:
```typescript
import KLineChart from '@/components/KLineChart'

<KLineChart
  data={klineData}
  markers={tradeMarkers}
  height={400}
/>
```

**组件特性**:
- 支持K线和成交量双图表
- 支持交易标记点显示
- 响应式自适应窗口大小
- 自定义颜色主题

---

### 功能3: 策略实例管理

**用途**: 管理策略实例的启动、停止、参数配置等

**示例**:
```typescript
// 修改实例状态
const handleStatusChange = async (instanceId: string, status: string) => {
  const response = await fetch(`/api/strategy-instances/${instanceId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
}
```

**页面特性**:
- 实例状态实时监控 (运行中/已停止/异常)
- 心跳检测机制 (超过5分钟无心跳标记为异常)
- 参数配置和历史记录查看
- 今日盈亏和交易统计

---

### 功能4: 策略组管理

**用途**: 管理策略组,配置资金分配和风险控制

**示例**:
```typescript
// 策略组配置
interface StrategyGroup {
  id: string
  group_name: string
  total_capital: number
  max_position_ratio: number
  position_conflict_mode: 'allow' | 'reject' | 'merge'
}
```

**功能特性**:
- 策略组成员管理
- 资金分配和持仓限制
- 冲突处理模式配置
- 运行统计和性能监控

---

## 🔗 依赖关系

### 核心依赖

**框架与库**:
- `next@^15.1.6` - Next.js 15 框架 (App Router)
- `react@^18.3.1` - React 18
- `typescript@^5.7.2` - TypeScript 类型系统

**UI 组件库**:
- `@radix-ui/*` - 无障碍的 UI 组件基础
- `tailwindcss@^3.4.17` - 工具优先的 CSS 框架
- `lucide-react@^0.561.0` - 图标库
- `class-variance-authority@^0.7.1` - 组件变体管理

**数据与状态**:
- `@supabase/supabase-js@^2.88.0` - Supabase 客户端
- `@tanstack/react-query@^5.90.12` - 服务端状态管理
- `zustand@^5.0.9` - 客户端状态管理

**图表与可视化**:
- `lightweight-charts@^5.1.0` - 高性能金融图表库

**工具库**:
- `date-fns@^4.1.0` - 日期处理
- `clsx@^2.1.1` / `tailwind-merge@^3.4.0` - 样式合并工具

**PWA 支持**:
- `next-pwa@^5.6.0` - PWA 支持插件

### 被依赖的服务

- **Supabase PostgreSQL** - 数据存储和实时订阅
- **后端 FastAPI** - RESTful API 服务
- **极星量化平台** - 行情数据和交易执行

---

## 🎯 使用示例

### 基础使用: 创建新页面

```typescript
// app/new-page/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function NewPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')

    if (!error) setData(data || [])
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">新页面标题</h1>
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

### 高级使用: 实时数据订阅

```typescript
// 订阅数据库表变更
useEffect(() => {
  const channel = supabase
    .channel('table_changes')
    .on('postgres_changes', {
      event: '*',              // 监听所有事件 (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'table_name'
    }, (payload) => {
      console.log('数据变化:', payload)
      fetchData()  // 重新获取数据
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### 高级使用: 创建对话框组件

```typescript
// components/CustomDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CustomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export default function CustomDialog({
  open,
  onOpenChange,
  onSubmit
}: CustomDialogProps) {
  const handleSubmit = async () => {
    // 处理提交逻辑
    await onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>对话框标题</DialogTitle>
        </DialogHeader>
        {/* 表单内容 */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 初始创建前端项目 | AI |
| 2025-12-18 | 新增 | 添加持仓监控、策略管理等核心功能页面 | AI |
| 2025-12-18 | 新增 | 集成 Supabase Realtime 实时数据订阅 | AI |
| 2025-12-18 | 新增 | 添加 K线图表和保证金计算器组件 | AI |
| 2025-12-18 | 文档 | 创建前端模块完整文档 | AI |

---

## 🎯 最佳实践

### 1. 组件设计原则

- **优先使用服务端组件**: 默认使用服务端组件,仅在需要交互时使用 `'use client'`
- **组件职责单一**: 每个组件只负责一个功能
- **Props 类型化**: 所有 Props 必须定义 TypeScript 接口
- **可复用性**: 业务组件抽象为可复用的功能组件

### 2. 数据获取策略

- **实时数据**: 使用 Supabase Realtime 订阅
- **静态数据**: 使用 Server Components 在服务端获取
- **缓存策略**: 使用 TanStack Query 管理客户端缓存
- **错误处理**: 所有数据获取都要有错误处理和加载状态

### 3. 样式规范

- **使用 Tailwind CSS**: 优先使用 Tailwind 工具类
- **组件变体**: 使用 `class-variance-authority` 管理组件变体
- **响应式设计**: 使用 `md:` `lg:` 等断点实现响应式
- **颜色系统**: 使用语义化颜色 (primary, destructive, muted 等)

### 4. 性能优化

- **图片优化**: 使用 `next/image` 组件
- **代码分割**: 动态导入大型组件 `dynamic(() => import())`
- **虚拟滚动**: 长列表使用虚拟滚动
- **防抖节流**: 搜索和滚动事件使用防抖/节流

### 5. 类型安全

- **严格模式**: 使用 TypeScript strict 模式
- **类型导入**: 从 `@/lib/supabase.ts` 导入数据库类型
- **避免 any**: 尽量避免使用 `any` 类型
- **类型推断**: 利用 TypeScript 类型推断能力

---

## ⚠️ 注意事项

### 开发环境配置

1. **环境变量**: 复制 `.env.example` 为 `.env.local` 并配置 Supabase 连接信息
2. **Node 版本**: 建议使用 Node.js 18+ 版本
3. **包管理器**: 使用 npm 安装依赖

### Supabase 连接

1. **Realtime 订阅**: 确保 Supabase 项目启用了 Realtime 功能
2. **Row Level Security**: 阶段1暂时禁用 RLS,后续启用时需要配置访问策略
3. **连接池限制**: 注意 Supabase 免费版的连接数限制

### Next.js 15 特性

1. **App Router**: 使用 App Router,不使用 Pages Router
2. **Server Components**: 默认是服务端组件,需要交互时添加 `'use client'`
3. **Metadata API**: 使用新的 Metadata API 配置 SEO 信息

### 浏览器兼容性

1. **现代浏览器**: 支持 Chrome、Firefox、Safari、Edge 最新版本
2. **移动端**: 支持 iOS Safari 和 Android Chrome
3. **PWA**: 可安装为渐进式 Web 应用

---

## 🐛 常见问题

### Q: Supabase Realtime 订阅不触发更新?

**A**: 检查以下几点:
1. Supabase 项目是否启用了 Realtime 功能
2. 数据库表是否发布了 Realtime 事件 (在 Supabase Dashboard 中配置)
3. 订阅的表名和 schema 是否正确
4. 浏览器控制台是否有连接错误

```typescript
// 检查订阅状态
const channel = supabase.channel('test')
channel.subscribe((status) => {
  console.log('订阅状态:', status)
})
```

### Q: 组件样式不生效?

**A**: 检查以下几点:
1. 是否在 `app/layout.tsx` 中导入了 `globals.css`
2. Tailwind 配置文件是否正确
3. 使用 `cn()` 函数合并样式时是否冲突
4. 组件库样式是否被覆盖

### Q: TypeScript 类型错误?

**A**:
1. 确保从 `@/lib/supabase.ts` 导入正确的类型定义
2. 数据库表结构变更后,需要更新类型定义
3. 使用 Supabase CLI 可以自动生成类型: `supabase gen types typescript`

### Q: 构建或部署失败?

**A**:
1. 检查环境变量是否配置正确
2. 运行 `npm run lint` 检查代码规范
3. 运行 `npm run build` 本地测试构建
4. 查看构建日志中的具体错误信息

### Q: 页面加载很慢?

**A**:
1. 检查是否使用了服务端组件 (避免不必要的客户端渲染)
2. 大型组件使用动态导入 `dynamic()`
3. 图片使用 `next/image` 组件优化
4. 数据库查询是否有索引

---

## 📚 相关文档

- [组件模块文档](../components/.claude/guide.md)
- [库模块文档](../lib/.claude/guide.md)
- [App Router 文档](../app/.claude/guide.md)
- [Next.js 15 官方文档](https://nextjs.org/docs)
- [Supabase 官方文档](https://supabase.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**📌 文档状态**: ✅ 已完成
**最后更新**: 2025-12-18
**维护者**: AI Assistant

---

> ⚠️ **AI 生成文档标记**: 本文档由 AI 助手根据实际代码生成,已经过人工审核确认准确性。如发现与实际代码不符,请及时更新。
