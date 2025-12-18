# Lib 库模块指南

> QuantFu 前端的工具库和配置模块,提供通用工具函数和服务客户端

---

## 📌 模块职责

提供前端应用的核心工具函数、服务客户端配置和类型定义。

**职责范围:**
- Supabase 客户端配置和初始化
- 数据库表的 TypeScript 类型定义
- 通用工具函数 (样式合并等)
- 全局配置和常量

**不在范围:**
- 业务逻辑处理 (应在页面或组件中)
- React 状态管理 (应使用 Hook 或状态管理库)
- UI 组件 (应在 components/ 中)

---

## 📁 文件结构

```
lib/
├── supabase.ts         # Supabase 客户端配置和类型定义
└── utils.ts            # 通用工具函数
```

### 文件说明

- **supabase.ts**: Supabase 客户端配置和所有数据库表的 TypeScript 类型定义
- **utils.ts**: 通用工具函数,目前包含 `cn()` 样式合并函数

---

## ⚙️ 主要功能

### 功能1: Supabase 客户端 (supabase.ts)

**用途**: 配置 Supabase 客户端连接和提供数据库类型定义

#### Supabase 客户端配置

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // 阶段1不需要认证
  },
  realtime: {
    params: {
      eventsPerSecond: 10,  // 实时更新频率
    },
  },
})
```

**配置选项**:
- `auth.persistSession: false` - 阶段1暂不启用会话持久化
- `realtime.eventsPerSecond: 10` - 限制实时事件频率,避免过载

---

#### 数据库类型定义

**核心数据类型**:

##### Account - 交易账户
```typescript
export interface Account {
  id: string
  account_name: string          // 账户名称
  polar_account_id: string      // 极星平台账户ID
  broker: string                // 期货公司
  initial_balance: number       // 初始资金
  status: string                // 账户状态
  created_at: string
  updated_at: string
}
```

##### Contract - 期货合约
```typescript
export interface Contract {
  id: string
  exchange: string              // 交易所
  variety_code: string          // 品种代码
  variety_name: string          // 品种名称
  symbol: string                // 合约代号
  contract_month: string        // 合约月份
  expire_date: string | null    // 到期日
  contract_multiplier: number   // 合约乘数
  price_tick: number            // 最小变动价位
  margin_ratio: number          // 保证金比例
  is_main_contract: boolean     // 是否主力合约
  is_active: boolean            // 是否活跃
  last_price: number | null     // 最新价
  open_interest: number         // 持仓量
  volume: number                // 成交量
  created_at: string
  updated_at: string
}
```

##### Position - 持仓信息
```typescript
export interface Position {
  id: string
  account_id: string
  symbol: string                // 合约代号
  long_position: number         // 多仓手数
  long_avg_price: number        // 多仓均价
  long_profit: number           // 多仓盈亏
  short_position: number        // 空仓手数
  short_avg_price: number       // 空仓均价
  short_profit: number          // 空仓盈亏
  is_long_locked: boolean       // 多仓是否锁定
  is_short_locked: boolean      // 空仓是否锁定
  last_price: number            // 最新价
  updated_at: string
}
```

##### PositionSummary - 持仓汇总视图
```typescript
export interface PositionSummary {
  symbol: string
  variety_name: string
  account_name: string
  long_position: number
  long_avg_price: number
  long_profit: number
  short_position: number
  short_avg_price: number
  short_profit: number
  total_profit: number          // 总盈亏
  net_position: number          // 净持仓
  last_price: number
  updated_at: string
}
```

##### Strategy - 策略定义
```typescript
export interface Strategy {
  id: string
  name: string                  // 策略代码名
  display_name: string          // 显示名称
  version: string               // 版本号
  category: string              // 策略分类
  description: string | null
  author: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

##### StrategyInstance - 策略实例
```typescript
export interface StrategyInstance {
  id: string
  strategy_id: string
  account_id: string
  instance_name: string         // 实例名称
  symbols: string[]             // 交易合约列表
  status: 'stopped' | 'running' | 'paused' | 'error'
  error_message: string | null
  last_heartbeat: string | null // 最后心跳时间
  is_active: boolean
  created_at: string
  updated_at: string

  // 关联查询字段 (可选)
  strategy_name?: string
  strategy_display_name?: string
  group_id?: string
  group_name?: string
  capital_allocation?: number
  position_limit?: number
  win_rate?: number
  today_profit?: number
  today_trades?: number
}
```

##### StrategyGroup - 策略组
```typescript
export interface StrategyGroup {
  id: string
  account_id: string
  group_name: string
  description: string | null
  total_capital: number | null          // 总资金
  max_position_ratio: number            // 最大持仓比例
  max_risk_per_strategy: number         // 单策略最大风险
  allow_opposite_positions: boolean     // 是否允许对手仓
  position_conflict_mode: 'allow' | 'reject' | 'merge'
  is_active: boolean
  created_at: string
  updated_at: string

  // 统计字段 (可选)
  member_count?: number
  running_count?: number
  allocated_capital?: number
  total_profit?: number
}
```

##### StrategySignal - 策略信号
```typescript
export interface StrategySignal {
  id: string
  instance_id: string
  symbol: string
  signal_type: 'open' | 'close' | 'reverse'
  direction: 'long' | 'short'
  volume: number                // 手数
  price: number | null          // 目标价格
  confidence: number            // 置信度 (0-1)
  strength: 'weak' | 'medium' | 'strong'
  status: 'pending' | 'executed' | 'rejected' | 'expired'
  rejection_reason: string | null
  executed_at: string | null
  execution_price: number | null
  expires_at: string | null
  created_at: string
}
```

##### RolloverTask - 换月任务
```typescript
export interface RolloverTask {
  id: string
  config_id: string
  account_id: string
  old_symbol: string            // 旧合约
  new_symbol: string            // 新合约
  trigger_type: 'main_switch' | 'expiry'
  old_position: number          // 旧合约持仓
  target_position: number       // 目标持仓
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  error_message: string | null
  total_cost: number | null
  executed_volume: number | null
  remaining_volume: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}
```

**完整类型列表**: 文件中包含 30+ 个接口,覆盖所有数据库表

---

### 功能2: 工具函数 (utils.ts)

#### cn() - 样式合并函数

**用途**: 合并 Tailwind CSS 类名,自动处理冲突和条件类名

**示例**:
```typescript
import { cn } from '@/lib/utils'

// 基础用法
cn('px-4 py-2', 'bg-blue-500')
// => 'px-4 py-2 bg-blue-500'

// 条件类名
cn('px-4', isActive && 'bg-blue-500')
// => 'px-4 bg-blue-500' (when isActive is true)
// => 'px-4' (when isActive is false)

// 样式冲突解决
cn('px-2', 'px-4')
// => 'px-4' (后者覆盖前者)

// 复杂场景
cn(
  'base-classes',
  variant === 'primary' && 'text-blue-600',
  variant === 'secondary' && 'text-gray-600',
  disabled && 'opacity-50 cursor-not-allowed'
)
```

**技术实现**:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- 使用 `clsx` 处理条件类名和数组
- 使用 `tailwind-merge` 智能合并冲突的 Tailwind 类名

---

## 🔗 依赖关系

### 依赖的包

**supabase.ts**:
- `@supabase/supabase-js@^2.88.0` - Supabase 客户端 SDK

**utils.ts**:
- `clsx@^2.1.1` - 条件类名工具
- `tailwind-merge@^3.4.0` - Tailwind 类名合并

### 被依赖的地方

**supabase.ts**:
- 所有页面组件 (用于数据查询)
- 所有业务组件 (用于数据订阅)
- 类型定义被整个项目使用

**utils.ts**:
- 所有组件 (用于样式合并)
- 特别是 UI 组件库 (components/ui/)

---

## 🎯 使用示例

### 基础使用: 数据查询

```typescript
import { supabase, type PositionSummary } from '@/lib/supabase'

// 查询数据
const fetchPositions = async () => {
  const { data, error } = await supabase
    .from('v_positions_summary')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('查询失败:', error)
    return []
  }

  return data as PositionSummary[]
}
```

### 高级使用: 实时订阅

```typescript
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function RealtimeComponent() {
  const [data, setData] = useState([])

  useEffect(() => {
    // 初始加载
    fetchData()

    // 订阅实时更新
    const channel = supabase
      .channel('my_channel')
      .on('postgres_changes', {
        event: '*',              // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'positions'
      }, (payload) => {
        console.log('数据变化:', payload)
        fetchData()  // 重新获取数据
      })
      .subscribe()

    // 清理订阅
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('positions')
      .select('*')
    setData(data || [])
  }

  return <div>{/* 渲染数据 */}</div>
}
```

### 高级使用: 复杂查询

```typescript
import { supabase } from '@/lib/supabase'

// 条件查询
const fetchFilteredData = async (accountId: string, symbol: string) => {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('account_id', accountId)      // 等于
    .eq('symbol', symbol)
    .gte('long_position', 1)          // 大于等于
    .order('updated_at', { ascending: false })
    .limit(10)

  return data
}

// 关联查询 (通过视图)
const fetchWithJoin = async () => {
  const { data } = await supabase
    .from('v_strategy_instances_with_stats')
    .select('*')
    .eq('status', 'running')

  return data
}

// 聚合查询
const fetchStats = async () => {
  const { data } = await supabase
    .rpc('calculate_portfolio_stats', {
      account_id: 'some-id'
    })

  return data
}
```

### 高级使用: 数据插入和更新

```typescript
import { supabase } from '@/lib/supabase'

// 插入数据
const createStrategy = async (strategyData: Partial<Strategy>) => {
  const { data, error } = await supabase
    .from('strategies')
    .insert(strategyData)
    .select()
    .single()

  if (error) throw error
  return data
}

// 更新数据
const updateInstance = async (instanceId: string, updates: any) => {
  const { data, error } = await supabase
    .from('strategy_instances')
    .update(updates)
    .eq('id', instanceId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 删除数据
const deleteConfig = async (configId: string) => {
  const { error } = await supabase
    .from('lock_configs')
    .delete()
    .eq('id', configId)

  if (error) throw error
}
```

### 高级使用: 样式合并

```typescript
import { cn } from '@/lib/utils'

// 在组件中使用
export default function Button({
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        // 基础样式
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',

        // 变体样式
        variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'outline' && 'border border-gray-300 bg-transparent hover:bg-gray-100',

        // 尺寸样式
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-9 px-3',
        size === 'lg' && 'h-11 px-8',

        // 状态样式
        disabled && 'opacity-50 cursor-not-allowed',

        // 自定义样式
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
}
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建 Supabase 客户端配置 | AI |
| 2025-12-18 | 新增 | 添加所有数据库表的 TypeScript 类型定义 | AI |
| 2025-12-18 | 新增 | 添加 cn() 样式合并工具函数 | AI |
| 2025-12-18 | 配置 | 配置 Realtime 实时订阅参数 | AI |
| 2025-12-18 | 文档 | 创建库模块完整文档 | AI |

---

## 🎯 最佳实践

### 1. Supabase 客户端使用

#### 类型安全
```typescript
// ✅ 使用类型定义
const { data } = await supabase
  .from('positions')
  .select('*')

const positions = data as Position[]

// ❌ 避免 any
const positions: any = data
```

#### 错误处理
```typescript
// ✅ 始终处理错误
const { data, error } = await supabase
  .from('positions')
  .select('*')

if (error) {
  console.error('查询失败:', error)
  // 显示错误提示
  return
}

// ❌ 忽略错误
const { data } = await supabase.from('positions').select('*')
```

#### 实时订阅清理
```typescript
// ✅ 在 useEffect 中清理订阅
useEffect(() => {
  const channel = supabase
    .channel('my_channel')
    .on(...)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])

// ❌ 忘记清理
useEffect(() => {
  supabase.channel('my_channel').on(...).subscribe()
  // 没有清理!
}, [])
```

### 2. 样式合并最佳实践

```typescript
// ✅ 使用 cn() 处理条件和冲突
cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  className
)

// ❌ 手动拼接字符串
`px-4 py-2 ${isActive ? 'bg-blue-500' : ''} ${className}`
```

### 3. 类型导入

```typescript
// ✅ 使用 type 关键字导入类型
import { supabase, type Position, type Account } from '@/lib/supabase'

// ✅ 分组导入
import type { Position, Account, Strategy } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
```

### 4. 环境变量

```typescript
// ✅ 提供默认值 (开发环境)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'

// ⚠️ 生产环境必须设置环境变量
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('未设置 NEXT_PUBLIC_SUPABASE_URL')
}
```

---

## ⚠️ 注意事项

### 1. Supabase 配置

- **环境变量**: 必须在 `.env.local` 中配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Realtime**: 确保 Supabase 项目启用了 Realtime 功能
- **认证**: 阶段1暂时禁用认证 (`persistSession: false`),后续需要启用

### 2. 类型定义

- **同步更新**: 数据库结构变更时必须同步更新类型定义
- **可选字段**: 关联查询的字段标记为可选 (`?`)
- **null 类型**: 数据库可空字段必须定义为 `type | null`

### 3. 性能考虑

- **订阅频率**: Realtime 配置了每秒最多 10 个事件,避免过载
- **查询优化**: 使用 `.select()` 只查询需要的字段
- **分页**: 大数据量使用 `.limit()` 和 `.range()` 分页

### 4. 错误处理

```typescript
// 所有 Supabase 操作都要处理错误
const { data, error } = await supabase.from('table').select()

if (error) {
  console.error('操作失败:', error)
  // 显示用户友好的错误信息
  toast.error('加载数据失败,请重试')
  return
}
```

---

## 🐛 常见问题

### Q: Supabase 连接失败?

**A**: 检查以下几点:
1. `.env.local` 文件是否存在并配置正确
2. Supabase URL 是否可访问 (本地开发为 `http://localhost:8000`)
3. Anon Key 是否正确
4. 浏览器控制台是否有 CORS 错误

```bash
# 本地开发检查 Supabase 是否运行
curl http://localhost:8000/rest/v1/

# 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Q: TypeScript 类型错误?

**A**:
1. 确保从 `@/lib/supabase` 导入类型
2. 数据库表结构变更后更新类型定义
3. 使用类型断言: `data as Position[]`

### Q: Realtime 订阅不工作?

**A**:
1. Supabase Dashboard 中检查表是否启用 Realtime
2. 检查订阅配置是否正确
3. 查看浏览器控制台是否有连接错误
4. 确认 channel 名称唯一

### Q: 如何生成类型定义?

**A**: 使用 Supabase CLI 自动生成:
```bash
# 安装 Supabase CLI
npm install -g supabase

# 生成类型定义
supabase gen types typescript --project-id <project-id> > types/database.ts
```

### Q: cn() 函数不生效?

**A**:
1. 确保安装了 `clsx` 和 `tailwind-merge`
2. Tailwind 配置是否正确
3. 类名是否有拼写错误

---

## 📚 相关文档

- [前端总体架构](../.claude/guide.md)
- [组件模块文档](../components/.claude/guide.md)
- [App Router 文档](../app/.claude/guide.md)
- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**📌 文档状态**: ✅ 已完成
**最后更新**: 2025-12-18
**维护者**: AI Assistant

---

> ⚠️ **AI 生成文档标记**: 本文档由 AI 助手根据实际代码生成,已经过人工审核确认准确性。如发现与实际代码不符,请及时更新。
