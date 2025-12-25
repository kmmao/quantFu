'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Lock, CheckCircle, XCircle, Clock, Play } from 'lucide-react'
import type { LockTrigger } from '@/lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

export default function LockManagementPage() {
  const [triggers, setTriggers] = useState<LockTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTriggers()
    const interval = setInterval(fetchTriggers, 10000) // 10秒刷新
    return () => clearInterval(interval)
  }, [])

  const fetchTriggers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lock/triggers?limit=50`)
      const data = await response.json()
      setTriggers(data.triggers || [])
    } catch (error) {
      console.error('获取锁仓触发记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualExecute = async (triggerId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lock/execute/${triggerId}`, {
        method: 'POST'
      })
      const result = await response.json()

      if (result.code === 200) {
        toast({
          title: '执行成功',
          description: '锁仓已成功执行'
        })
        fetchTriggers()
      } else {
        toast({
          title: '执行失败',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('执行锁仓失败:', error)
      toast({
        title: '执行失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: '待执行', variant: 'secondary', icon: Clock },
      waiting_confirm: { label: '等待确认', variant: 'default', icon: Clock },
      executed: { label: '已执行', variant: 'success', icon: CheckCircle },
      failed: { label: '失败', variant: 'destructive', icon: XCircle },
      cancelled: { label: '已取消', variant: 'outline', icon: XCircle }
    }

    const config = statusMap[status] || statusMap.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const pendingCount = triggers.filter(t => t.execution_status === 'waiting_confirm').length
  const executedCount = triggers.filter(t => t.execution_status === 'executed').length
  const failedCount = triggers.filter(t => t.execution_status === 'failed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">锁仓管理</h1>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              等待确认
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              已执行
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executedCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 触发记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>触发记录</CardTitle>
        </CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              暂无锁仓触发记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>触发时间</TableHead>
                    <TableHead>账户</TableHead>
                    <TableHead>品种</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead className="text-right">触发价格</TableHead>
                    <TableHead className="text-right">触发利润</TableHead>
                    <TableHead className="text-right">锁定手数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triggers.map((trigger) => (
                    <TableRow key={trigger.id}>
                      <TableCell className="text-sm">
                        {new Date(trigger.triggered_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {trigger.account_name}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{trigger.variety_name}</div>
                        <div className="text-xs text-gray-500">{trigger.symbol}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={trigger.direction === 'long' ? 'default' : 'destructive'}>
                          {trigger.direction === 'long' ? '多仓' : '空仓'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {trigger.trigger_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={trigger.trigger_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {trigger.trigger_profit >= 0 ? '+' : ''}{trigger.trigger_profit.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {trigger.lock_volume}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(trigger.execution_status)}
                      </TableCell>
                      <TableCell>
                        {trigger.execution_status === 'waiting_confirm' && (
                          <Button
                            size="sm"
                            onClick={() => handleManualExecute(trigger.id)}
                            className="flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            执行
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
