'use client'

import { useEffect, useState } from 'react'
import { supabase, type PositionSummary } from '@/lib/supabase'
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
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Database } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [positions, setPositions] = useState<PositionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // 加载持仓数据
  const fetchPositions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('v_positions_summary')
        .select('*')
        .order('updated_at', { ascending: false })

      if (queryError) {
        console.error('获取持仓数据失败:', queryError)
        setError(queryError.message || '查询失败')
        return
      }

      setPositions(data || [])
      setLastUpdate(new Date())
    } catch (err: any) {
      console.error('获取持仓数据异常:', err)
      setError(err?.message || '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 初始加载
    fetchPositions()

    // 订阅实时更新
    const channel = supabase
      .channel('positions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions'
        },
        (payload) => {
          console.log('持仓数据变化:', payload)
          fetchPositions()
        }
      )
      .subscribe()

    // 定时刷新(备用机制)
    const interval = setInterval(fetchPositions, 30000)  // 30秒刷新一次

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  // 计算总盈亏
  const totalProfit = positions.reduce((sum, pos) => sum + (pos.total_profit || 0), 0)
  const profitCount = positions.filter(pos => (pos.total_profit || 0) > 0).length
  const lossCount = positions.filter(pos => (pos.total_profit || 0) < 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">数据加载失败</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 text-red-600">
                提示: 请确保 Supabase 服务正在运行 (docker-compose up -d)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">持仓监控</h1>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              最后更新: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: zhCN })}
            </p>
          )}
        </div>
        <Button
          onClick={fetchPositions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              总盈亏
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              持仓品种
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {positions.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              盈利 {profitCount} · 亏损 {lossCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              净持仓
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {positions.reduce((sum, pos) => sum + Math.abs(pos.net_position || 0), 0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              手数合计
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 持仓列表 */}
      {positions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                暂无持仓数据
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                持仓数据来自 positions 表和相关视图。<br/>
                可以通过以下方式查看或添加数据:
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/test-supabase">
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-1" />
                    测试 Supabase 连接
                  </Button>
                </Link>
                <Button
                  variant="default"
                  onClick={() => window.open('http://localhost:3001', '_blank')}
                >
                  打开 Supabase Studio
                </Button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto text-left">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  💡 快速开始:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>访问 <Link href="/test-supabase" className="underline">Supabase 测试页面</Link> 创建测试账户</li>
                  <li>在 Supabase Studio 中添加持仓数据</li>
                  <li>刷新此页面查看持仓监控</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>持仓明细</CardTitle>
          </CardHeader>
          <CardContent>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.symbol}>
                      <TableCell className="font-medium">
                        {position.variety_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {position.symbol}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {position.account_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{position.long_position || 0}</span>
                          <span className="text-xs text-gray-500">
                            @{position.long_avg_price?.toFixed(2) || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{position.short_position || 0}</span>
                          <span className="text-xs text-gray-500">
                            @{position.short_avg_price?.toFixed(2) || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={position.net_position > 0 ? 'default' : position.net_position < 0 ? 'destructive' : 'secondary'}>
                          {position.net_position > 0 ? '+' : ''}{position.net_position || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {position.last_price?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(position.total_profit || 0) >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`font-semibold ${(position.total_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(position.total_profit || 0) >= 0 ? '+' : ''}{position.total_profit?.toFixed(2) || 0}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
