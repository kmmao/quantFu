'use client'

import * as React from 'react'
import { RefreshCw, AlertCircle, Database, Plus, Edit, Trash2 } from 'lucide-react'

import { supabase, type PositionSummary } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { PositionDialog } from '@/components/PositionDialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

export default function PositionsPage() {
  const [positions, setPositions] = React.useState<PositionSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingPosition, setEditingPosition] = React.useState<any>(null)

  const fetchPositions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('v_positions_summary')
        .select('*')
        .order('updated_at', { ascending: false })

      if (queryError) {
        setError(queryError.message || '查询失败')
        return
      }

      setPositions(data || [])
    } catch (err: unknown) {
      const error = err as Error
      setError(error?.message || '未知错误')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchPositions()

    // 订阅实时更新
    const channel = supabase
      .channel('positions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
        },
        () => {
          fetchPositions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 计算统计数据
  const totalProfit = positions.reduce(
    (sum, pos) => sum + (pos.total_profit || 0),
    0
  )
  const profitCount = positions.filter(
    (pos) => (pos.total_profit || 0) > 0
  ).length
  const lossCount = positions.filter((pos) => (pos.total_profit || 0) < 0).length

  // 处理添加持仓
  const handleAdd = () => {
    setEditingPosition(null)
    setDialogOpen(true)
  }

  // 处理编辑持仓
  const handleEdit = async (position: PositionSummary) => {
    // 从 positions 表获取完整数据,通过 symbol 和 account_name 查询
    // 先获取 account_id
    const { data: accountData } = await supabase
      .from('accounts')
      .select('id')
      .eq('account_name', position.account_name)
      .single()

    if (!accountData) {
      alert('未找到账户信息')
      return
    }

    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('account_id', accountData.id)
      .eq('symbol', position.symbol)
      .single()

    if (data) {
      setEditingPosition(data)
      setDialogOpen(true)
    }
  }

  // 处理删除持仓
  const handleDelete = async (position: PositionSummary) => {
    if (!confirm(`确定要删除 ${position.variety_name} ${position.symbol} 的持仓吗?`)) {
      return
    }

    try {
      // 先获取 account_id
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('account_name', position.account_name)
        .single()

      if (!accountData) {
        alert('未找到账户信息')
        return
      }

      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('account_id', accountData.id)
        .eq('symbol', position.symbol)

      if (error) throw error

      fetchPositions()
    } catch (err) {
      alert(`删除失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  // 对话框关闭后的回调
  const handleDialogSuccess = () => {
    fetchPositions()
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            持仓监控
          </h1>
          <p className="text-sm text-muted-foreground">
            实时持仓数据监控与盈亏分析
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            添加持仓
          </Button>
          <Button onClick={fetchPositions} disabled={loading} variant="outline">
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            刷新
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">数据加载失败</p>
                <p className="mt-1 text-sm text-red-800">{error}</p>
                <p className="mt-2 text-xs text-red-700">
                  提示: 请确保 Supabase 服务正在运行 (docker-compose up -d)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总盈亏</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalProfit >= 0 ? '+' : ''}
                  {totalProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {totalProfit >= 0 ? '+' : ''}0.0%
                  </span>{' '}
                  较昨日
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">持仓品种</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{positions.length}</div>
                <p className="text-xs text-muted-foreground">
                  盈利 {profitCount} · 亏损 {lossCount}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">净持仓</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {positions.reduce(
                    (sum, pos) => sum + Math.abs(pos.net_position || 0),
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">手数合计</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>持仓明细</CardTitle>
          <CardDescription>
            {positions.length > 0
              ? `共 ${positions.length} 条持仓记录`
              : '暂无持仓数据'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Database className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">暂无持仓数据</h3>
              <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                持仓数据来自 positions 表和相关视图。
                <br />
                请通过 Supabase Studio 添加数据或连接实盘账户。
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  window.open('http://localhost:3001', '_blank')
                }
              >
                <Database className="mr-2 h-4 w-4" />
                打开 Supabase Studio
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>品种</TableHead>
                    <TableHead>合约</TableHead>
                    <TableHead>账户</TableHead>
                    <TableHead className="text-right">多仓</TableHead>
                    <TableHead className="text-right">空仓</TableHead>
                    <TableHead className="text-right">净持仓</TableHead>
                    <TableHead className="text-right">最新价</TableHead>
                    <TableHead className="text-right">盈亏</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.symbol}>
                      <TableCell className="font-medium">
                        {position.variety_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {position.symbol}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {position.account_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {position.long_position || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{position.long_avg_price?.toFixed(2) || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {position.short_position || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{position.short_avg_price?.toFixed(2) || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            position.net_position > 0
                              ? 'default'
                              : position.net_position < 0
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {position.net_position > 0 ? '+' : ''}
                          {position.net_position || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {position.last_price?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`font-semibold ${
                            (position.total_profit || 0) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(position.total_profit || 0) >= 0 ? '+' : ''}
                          {position.total_profit?.toFixed(2) || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(position)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(position)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <PositionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        position={editingPosition}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
