'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react'
import { RolloverStatistics } from '@/lib/supabase'

export default function RolloverStatsPage() {
  const [stats, setStats] = useState<RolloverStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/rollover/statistics')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取换月统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取唯一账户列表
  const accounts = Array.from(new Set(stats.map(s => s.account_id)))

  // 过滤数据
  const filteredStats = stats.filter(s => {
    if (accountFilter !== 'all' && s.account_id !== accountFilter) return false

    const statDate = new Date(s.date)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange))

    return statDate >= cutoffDate
  })

  // 聚合统计
  const aggregated = filteredStats.reduce((acc, stat) => {
    const key = `${stat.exchange}_${stat.variety_code}`
    if (!acc[key]) {
      acc[key] = {
        exchange: stat.exchange,
        variety_code: stat.variety_code,
        total_tasks: 0,
        success_tasks: 0,
        failed_tasks: 0,
        total_volume: 0,
        total_cost: 0,
        dates: [] as string[]
      }
    }
    acc[key].total_tasks += stat.total_tasks
    acc[key].success_tasks += stat.success_tasks
    acc[key].failed_tasks += stat.failed_tasks
    acc[key].total_volume += stat.total_volume
    acc[key].total_cost += stat.total_cost
    acc[key].dates.push(stat.date)
    return acc
  }, {} as Record<string, any>)

  const aggregatedStats = Object.values(aggregated).map((item: any) => ({
    ...item,
    success_rate: item.total_tasks > 0 ? (item.success_tasks / item.total_tasks) * 100 : 0,
    avg_cost_per_lot: item.total_volume > 0 ? item.total_cost / item.total_volume : 0
  }))

  // 总计
  const totals = {
    total_tasks: aggregatedStats.reduce((sum, s) => sum + s.total_tasks, 0),
    success_tasks: aggregatedStats.reduce((sum, s) => sum + s.success_tasks, 0),
    failed_tasks: aggregatedStats.reduce((sum, s) => sum + s.failed_tasks, 0),
    total_volume: aggregatedStats.reduce((sum, s) => sum + s.total_volume, 0),
    total_cost: aggregatedStats.reduce((sum, s) => sum + s.total_cost, 0)
  }

  const overallSuccessRate = totals.total_tasks > 0
    ? (totals.success_tasks / totals.total_tasks) * 100
    : 0

  const avgCostPerLot = totals.total_volume > 0
    ? totals.total_cost / totals.total_volume
    : 0

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
          <h1 className="text-3xl font-bold">换月统计分析</h1>
          <p className="text-muted-foreground mt-1">
            查看换月成本和执行效果统计
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择账户" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部账户</SelectItem>
              {accounts.map(account => (
                <SelectItem key={account} value={account}>
                  账户 {account}
                </SelectItem>
              ))}
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              总任务数
            </CardDescription>
            <CardTitle className="text-3xl">{totals.total_tasks}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              成功率
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {overallSuccessRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              成功 {totals.success_tasks} / 失败 {totals.failed_tasks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              总手数
            </CardDescription>
            <CardTitle className="text-3xl">{totals.total_volume}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              总成本
            </CardDescription>
            <CardTitle className="text-3xl">
              {totals.total_cost.toFixed(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">元</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              单位成本
            </CardDescription>
            <CardTitle className="text-3xl">
              {avgCostPerLot.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">元/手</div>
          </CardContent>
        </Card>
      </div>

      {/* 按品种统计 */}
      <Card>
        <CardHeader>
          <CardTitle>品种统计</CardTitle>
          <CardDescription>
            各交易品种的换月统计数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aggregatedStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无统计数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>交易所</TableHead>
                  <TableHead>品种</TableHead>
                  <TableHead className="text-right">任务数</TableHead>
                  <TableHead className="text-right">成功</TableHead>
                  <TableHead className="text-right">失败</TableHead>
                  <TableHead className="text-right">成功率</TableHead>
                  <TableHead className="text-right">总手数</TableHead>
                  <TableHead className="text-right">总成本</TableHead>
                  <TableHead className="text-right">单位成本</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{stat.exchange}</TableCell>
                    <TableCell>{stat.variety_code}</TableCell>
                    <TableCell className="text-right">{stat.total_tasks}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {stat.success_tasks}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {stat.failed_tasks}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={stat.success_rate >= 90 ? 'text-green-600 font-semibold' : ''}>
                        {stat.success_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{stat.total_volume}</TableCell>
                    <TableCell className="text-right">
                      {stat.total_cost.toFixed(2)} 元
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {stat.avg_cost_per_lot.toFixed(2)} 元/手
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 详细统计 */}
      <Card>
        <CardHeader>
          <CardTitle>每日统计</CardTitle>
          <CardDescription>
            按日期查看详细的换月统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无统计数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>账户</TableHead>
                  <TableHead>交易所</TableHead>
                  <TableHead>品种</TableHead>
                  <TableHead className="text-right">任务数</TableHead>
                  <TableHead className="text-right">成功</TableHead>
                  <TableHead className="text-right">失败</TableHead>
                  <TableHead className="text-right">手数</TableHead>
                  <TableHead className="text-right">成本</TableHead>
                  <TableHead className="text-right">单位成本</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">
                      {new Date(stat.date).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>{stat.account_id}</TableCell>
                    <TableCell>{stat.exchange}</TableCell>
                    <TableCell>{stat.variety_code}</TableCell>
                    <TableCell className="text-right">{stat.total_tasks}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {stat.success_tasks}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {stat.failed_tasks}
                    </TableCell>
                    <TableCell className="text-right">{stat.total_volume}</TableCell>
                    <TableCell className="text-right">
                      {stat.total_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {stat.avg_cost_per_lot.toFixed(2)}
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
