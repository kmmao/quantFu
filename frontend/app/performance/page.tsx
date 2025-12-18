'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Activity,
  DollarSign,
  Percent,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { StrategyPerformance } from '@/lib/supabase'

export default function PerformancePage() {
  const [performances, setPerformances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')
  const [sortBy, setSortBy] = useState<'profit' | 'winrate' | 'sharpe'>('profit')

  const fetchPerformances = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/strategy-performance/ranking?days=${dateRange}`)
      const data = await response.json()
      if (data.success) {
        setPerformances(data.data)
      }
    } catch (error) {
      console.error('获取性能数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchPerformances()
  }, [fetchPerformances])

  // 按选择的维度排序
  const sortedPerformances = [...performances].sort((a, b) => {
    if (sortBy === 'profit') {
      return (b.net_profit || 0) - (a.net_profit || 0)
    } else if (sortBy === 'winrate') {
      return (b.win_rate || 0) - (a.win_rate || 0)
    } else {
      return (b.sharpe_ratio || 0) - (a.sharpe_ratio || 0)
    }
  })

  // 汇总统计
  const stats = {
    totalProfit: performances.reduce((sum, p) => sum + (p.net_profit || 0), 0),
    totalTrades: performances.reduce((sum, p) => sum + (p.total_trades || 0), 0),
    avgWinRate: performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.win_rate || 0), 0) / performances.length
      : 0,
    avgSharpe: performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.sharpe_ratio || 0), 0) / performances.length
      : 0,
    topPerformer: sortedPerformances[0],
    worstPerformer: sortedPerformances[sortedPerformances.length - 1]
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-yellow-500 gap-1">
          <Trophy className="h-3 w-3" />
          第1名
        </Badge>
      )
    } else if (rank === 2) {
      return (
        <Badge className="bg-gray-400 gap-1">
          <Trophy className="h-3 w-3" />
          第2名
        </Badge>
      )
    } else if (rank === 3) {
      return (
        <Badge className="bg-amber-600 gap-1">
          <Trophy className="h-3 w-3" />
          第3名
        </Badge>
      )
    }
    return <Badge variant="outline">第{rank}名</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">策略性能对比</h1>
          <p className="text-muted-foreground mt-1">
            对比各策略实例的历史表现和排名
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profit">按盈亏排序</SelectItem>
              <SelectItem value="winrate">按胜率排序</SelectItem>
              <SelectItem value="sharpe">按夏普排序</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">近7天</SelectItem>
              <SelectItem value="30">近30天</SelectItem>
              <SelectItem value="90">近90天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 总览卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              总盈亏
            </CardDescription>
            <CardTitle className={`text-3xl flex items-center gap-2 ${
              stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalProfit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              总交易次数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalTrades}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              平均胜率
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {(stats.avgWinRate * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              平均夏普
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats.avgSharpe.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 最佳/最差表现 */}
      {stats.topPerformer && stats.worstPerformer && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Trophy className="h-5 w-5" />
                最佳表现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">策略实例:</span>
                  <span className="font-semibold text-green-900">
                    {stats.topPerformer.instance_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">净盈利:</span>
                  <span className="font-semibold text-green-600 text-lg">
                    +{stats.topPerformer.net_profit?.toFixed(2) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">胜率:</span>
                  <span className="font-medium text-green-900">
                    {((stats.topPerformer.win_rate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="h-5 w-5" />
                最差表现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700">策略实例:</span>
                  <span className="font-semibold text-red-900">
                    {stats.worstPerformer.instance_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700">净盈利:</span>
                  <span className="font-semibold text-red-600 text-lg">
                    {stats.worstPerformer.net_profit?.toFixed(2) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700">胜率:</span>
                  <span className="font-medium text-red-900">
                    {((stats.worstPerformer.win_rate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 性能排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle>性能排行榜</CardTitle>
          <CardDescription>
            按{sortBy === 'profit' ? '盈亏' : sortBy === 'winrate' ? '胜率' : '夏普比率'}排序
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPerformances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无性能数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>策略实例</TableHead>
                  <TableHead>策略名称</TableHead>
                  <TableHead className="text-right">交易次数</TableHead>
                  <TableHead className="text-right">盈利次数</TableHead>
                  <TableHead className="text-right">亏损次数</TableHead>
                  <TableHead className="text-right">胜率</TableHead>
                  <TableHead className="text-right">净盈利</TableHead>
                  <TableHead className="text-right">盈亏比</TableHead>
                  <TableHead className="text-right">夏普比率</TableHead>
                  <TableHead className="text-right">最大回撤</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerformances.map((perf, index) => (
                  <TableRow key={perf.id}>
                    <TableCell>{getRankBadge(index + 1)}</TableCell>
                    <TableCell className="font-medium">{perf.instance_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {perf.strategy_name}
                    </TableCell>
                    <TableCell className="text-right">{perf.total_trades || 0}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {perf.winning_trades || 0}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {perf.losing_trades || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        (perf.win_rate || 0) >= 0.6 ? 'text-green-600' :
                        (perf.win_rate || 0) >= 0.4 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {((perf.win_rate || 0) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${
                        (perf.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(perf.net_profit || 0) >= 0 ? '+' : ''}{(perf.net_profit || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {perf.profit_factor ? perf.profit_factor.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        (perf.sharpe_ratio || 0) >= 1.5 ? 'text-green-600' :
                        (perf.sharpe_ratio || 0) >= 0.5 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {perf.sharpe_ratio ? perf.sharpe_ratio.toFixed(2) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {perf.max_drawdown ? perf.max_drawdown.toFixed(2) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
