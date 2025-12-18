# Supabase 前端使用指南

## 🎯 快速开始

### 1. 启动测试页面

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000/test-supabase 测试 Supabase 连接

### 2. 基础配置

环境变量已配置在 `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 📚 使用方法

### 方法 1: 直接使用 Supabase 客户端

```typescript
import { supabase } from '@/lib/supabase'

// 查询数据
const { data, error } = await supabase
  .from('accounts')
  .select('*')
  .eq('status', 'active')

if (error) console.error(error)
else console.log(data)
```

### 方法 2: 使用助手函数 (推荐)

```typescript
import { getActiveAccounts, createAccount } from '@/lib/supabase-helpers'

// 获取活跃账户
const accounts = await getActiveAccounts()

// 创建新账户
const newAccount = await createAccount({
  account_name: '测试账户',
  polar_account_id: 'POLAR_123',
  broker: '测试券商',
  initial_balance: 100000
})
```

### 方法 3: 使用 React Query Hooks (最佳实践)

```typescript
'use client'

import { useActiveAccounts, useCreateAccount } from '@/lib/supabase-queries'

export default function AccountsPage() {
  // 自动管理加载、错误、缓存状态
  const { data: accounts, isLoading, error } = useActiveAccounts()
  const createMutation = useCreateAccount()

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      account_name: '新账户',
      broker: '测试券商',
      initial_balance: 100000
    })
  }

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <div>
      <button onClick={handleCreate}>创建账户</button>
      {accounts?.map(account => (
        <div key={account.id}>{account.account_name}</div>
      ))}
    </div>
  )
}
```

## 🔄 实时订阅

### 订阅持仓变化

```typescript
import { useEffect } from 'react'
import { subscribeToPositions } from '@/lib/supabase-helpers'

useEffect(() => {
  const unsubscribe = subscribeToPositions(accountId, (payload) => {
    console.log('持仓变化:', payload)
    // 更新 UI
  })

  return unsubscribe // 组件卸载时取消订阅
}, [accountId])
```

### 订阅策略信号

```typescript
import { subscribeToStrategySignals } from '@/lib/supabase-helpers'

useEffect(() => {
  const unsubscribe = subscribeToStrategySignals(instanceId, (payload) => {
    if (payload.eventType === 'INSERT') {
      console.log('新信号:', payload.new)
      // 显示通知
    }
  })

  return unsubscribe
}, [instanceId])
```

## 📖 常用示例

### 1. 获取并显示账户列表

```typescript
'use client'

import { useActiveAccounts } from '@/lib/supabase-queries'
import { Card } from '@/components/ui/card'

export default function AccountsList() {
  const { data: accounts, isLoading } = useActiveAccounts()

  if (isLoading) return <div>加载中...</div>

  return (
    <div className="grid gap-4">
      {accounts?.map(account => (
        <Card key={account.id} className="p-4">
          <h3 className="font-bold">{account.account_name}</h3>
          <p className="text-sm text-muted-foreground">
            券商: {account.broker} | 余额: ¥{account.initial_balance.toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  )
}
```

### 2. 搜索合约

```typescript
import { supabase } from '@/lib/supabase'

async function searchContracts(query: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .or(`variety_name.ilike.%${query}%,variety_code.ilike.%${query}%`)
    .limit(10)

  return data
}
```

### 3. 实时持仓监控

```typescript
'use client'

import { usePositions } from '@/lib/supabase-queries'
import { useEffect, useState } from 'react'
import { subscribeToPositions } from '@/lib/supabase-helpers'

export default function PositionsMonitor({ accountId }: { accountId: string }) {
  const { data: positions } = usePositions(accountId)
  const [updates, setUpdates] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeToPositions(accountId, () => {
      setUpdates(prev => prev + 1)
    })
    return unsubscribe
  }, [accountId])

  return (
    <div>
      <p>实时更新次数: {updates}</p>
      <div className="grid gap-2">
        {positions?.map(pos => (
          <div key={pos.id}>
            {pos.symbol}: {pos.long_position} 手多 / {pos.short_position} 手空
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. 策略控制面板

```typescript
'use client'

import { useRunningStrategies, useUpdateStrategyStatus } from '@/lib/supabase-queries'
import { Button } from '@/components/ui/button'

export default function StrategyControl({ accountId }: { accountId: string }) {
  const { data: strategies } = useRunningStrategies(accountId)
  const updateStatus = useUpdateStrategyStatus()

  const handleStop = async (instanceId: string) => {
    await updateStatus.mutateAsync({
      instanceId,
      status: 'stopped'
    })
  }

  return (
    <div className="space-y-2">
      {strategies?.map(strategy => (
        <div key={strategy.id} className="flex justify-between items-center p-3 border rounded">
          <div>
            <p className="font-semibold">{strategy.instance_name}</p>
            <p className="text-sm text-muted-foreground">状态: {strategy.status}</p>
          </div>
          <Button
            onClick={() => handleStop(strategy.id)}
            variant="destructive"
            size="sm"
            disabled={updateStatus.isPending}
          >
            停止
          </Button>
        </div>
      ))}
    </div>
  )
}
```

## 🎨 完整页面示例

创建一个新页面 `app/dashboard/page.tsx`:

```typescript
'use client'

import { useActiveAccounts, usePositionsSummary } from '@/lib/supabase-queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useActiveAccounts()
  const { data: summary, isLoading: summaryLoading } = usePositionsSummary()

  if (accountsLoading || summaryLoading) {
    return <div>加载中...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">交易概览</h1>

      {/* 账户卡片 */}
      <div className="grid md:grid-cols-3 gap-4">
        {accounts?.map(account => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.account_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ¥{account.initial_balance.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {account.broker}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 持仓汇总 */}
      <Card>
        <CardHeader>
          <CardTitle>持仓汇总</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary?.map((pos: any) => (
              <div key={pos.symbol} className="flex justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold">{pos.variety_name}</p>
                  <p className="text-sm text-muted-foreground">
                    净持仓: {pos.net_position} 手
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    pos.total_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pos.total_profit >= 0 ? '+' : ''}
                    ¥{pos.total_profit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pos.account_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🔧 高级用法

### 分页查询

```typescript
import { getPaginatedData } from '@/lib/supabase-helpers'

const result = await getPaginatedData<Account>('accounts', 1, 20)
console.log('总计:', result.total)
console.log('当前页:', result.data)
console.log('总页数:', result.totalPages)
```

### 批量插入

```typescript
import { bulkInsert } from '@/lib/supabase-helpers'

const contracts = [
  { variety_code: 'RB', variety_name: '螺纹钢', ... },
  { variety_code: 'HC', variety_name: '热卷', ... },
]

await bulkInsert('contracts', contracts)
```

### 执行 RPC 函数

```typescript
import { executeRPC } from '@/lib/supabase-helpers'

// 需要先在数据库中创建函数
const result = await executeRPC<any>('calculate_portfolio_risk', {
  account_id: 'xxx'
})
```

## ⚠️ 注意事项

1. **环境变量**: 确保 `.env.local` 文件存在且配置正确
2. **CORS**: Kong 已配置 CORS,支持前端跨域访问
3. **认证**: 当前使用 ANON_KEY,暂时没有用户认证
4. **RLS**: 数据库表的行级安全策略未启用,所有数据都可访问
5. **实时订阅**: 使用完毕后记得取消订阅,避免内存泄漏

## 📝 下一步

- [ ] 根据实际需求扩展 hooks
- [ ] 添加错误处理和重试逻辑
- [ ] 实现乐观更新提升用户体验
- [ ] 配置生产环境的 RLS 策略
- [ ] 添加用户认证系统
