'use client'

import { useEffect, useState } from 'react'
import { supabase, type Account, type Contract } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function TestSupabasePage() {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 测试连接
  const testConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. 测试账户表查询
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .limit(10)

      if (accountError) throw accountError
      setAccounts(accountData || [])

      // 2. 测试合约表查询
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .limit(5)

      if (contractError) throw contractError
      setContracts(contractData || [])

      setConnectionStatus('success')
    } catch (err: any) {
      console.error('Supabase 连接错误:', err)
      setError(err.message || '未知错误')
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  // 创建测试账户
  const createTestAccount = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const testAccount = {
        account_name: '测试账户-' + Date.now(),
        polar_account_id: 'TEST_' + Date.now(),
        broker: '测试券商',
        initial_balance: 100000,
        status: 'active',
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert([testAccount])
        .select()

      if (error) throw error

      console.log('创建账户成功:', data)

      // 刷新账户列表
      await testConnection()

      toast({
        title: '创建成功',
        description: '测试账户已成功创建',
      })
    } catch (err: any) {
      console.error('创建账户错误:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supabase 连接测试</h1>
          <p className="text-muted-foreground mt-2">
            验证前端到 Supabase 的连接状态
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? '测试中...' : '重新测试'}
          </Button>
          <Button
            onClick={createTestAccount}
            disabled={isLoading}
          >
            创建测试账户
          </Button>
        </div>
      </div>

      {/* 连接状态 */}
      <Card>
        <CardHeader>
          <CardTitle>连接状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'success' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <span className="font-medium">
              {connectionStatus === 'checking' && '正在检查连接...'}
              {connectionStatus === 'success' && '✅ Supabase 连接正常'}
              {connectionStatus === 'error' && '❌ 连接失败'}
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">错误信息:</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置信息 */}
      <Card>
        <CardHeader>
          <CardTitle>配置信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm">
          <div>
            <span className="text-muted-foreground">Supabase URL:</span>{' '}
            <span className="font-semibold">{process.env.NEXT_PUBLIC_SUPABASE_URL}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Anon Key:</span>{' '}
            <span className="font-semibold text-xs">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 账户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>账户数据 (accounts)</CardTitle>
          <CardDescription>
            查询到 {accounts.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              暂无数据，点击&ldquo;创建测试账户&rdquo;按钮添加测试数据
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{account.account_name}</p>
                      <p className="text-sm text-muted-foreground">
                        券商: {account.broker} | 余额: ¥{account.initial_balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {account.polar_account_id}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      account.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 合约列表 */}
      <Card>
        <CardHeader>
          <CardTitle>合约数据 (contracts)</CardTitle>
          <CardDescription>
            查询到 {contracts.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无合约数据</p>
          ) : (
            <div className="space-y-2">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {contract.variety_name} ({contract.variety_code})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contract.exchange} | {contract.polar_symbol}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        保证金率: {(contract.margin_ratio * 100).toFixed(1)}% |
                        合约乘数: {contract.multiplier}
                      </p>
                    </div>
                    {contract.is_main && (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        主力合约
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. 查询数据</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
{`const { data, error } = await supabase
  .from('accounts')
  .select('*')

if (error) console.error(error)
else console.log(data)`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-1">2. 插入数据</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
{`const { data, error } = await supabase
  .from('accounts')
  .insert([{
    account_name: '测试账户',
    broker: '测试券商',
    initial_balance: 100000
  }])`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-1">3. 实时订阅</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
{`supabase
  .channel('accounts-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'accounts' },
    (payload) => console.log('数据变化:', payload)
  )
  .subscribe()`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
