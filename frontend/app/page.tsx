'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  ChartCandlestick,
  LayoutDashboard,
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  DollarSign,
  Users,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { SystemHealth } from '@/components/SystemHealth'

// 模拟盈亏趋势数据
const profitData = [
  { date: '01-15', profit: 0 },
  { date: '01-16', profit: 120 },
  { date: '01-17', profit: -80 },
  { date: '01-18', profit: 240 },
  { date: '01-19', profit: 180 },
  { date: '01-20', profit: 320 },
  { date: '01-21', profit: 280 },
  { date: '01-22', profit: 420 },
]

const chartConfig = {
  profit: {
    label: '盈亏',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            仪表盘
          </h1>
          <p className="text-sm text-muted-foreground">
            欢迎回来,这是您的交易概览
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总盈亏</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+0.00</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.0%</span> 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">持仓品种</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              盈利 0 · 亏损 0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃策略</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              运行中 0 · 已暂停 0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">策略组</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              总计 0 个策略组
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartCandlestick className="h-5 w-5 text-blue-600" />
              K线图表
            </CardTitle>
            <CardDescription>
              实时行情监控,技术指标分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chart">
              <Button className="w-full" variant="default">
                打开图表
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Badge className="mt-3 bg-blue-600">独立模块 · 无需数据库</Badge>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-green-600" />
              持仓监控
            </CardTitle>
            <CardDescription>
              实时持仓数据,盈亏分析,风险监控
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/positions">
              <Button className="w-full" variant="outline">
                查看持仓
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Badge className="mt-3 bg-amber-600" variant="outline">
              需要数据库支持
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              策略管理
            </CardTitle>
            <CardDescription>
              策略实例管理,性能监控,参数优化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/strategies">
              <Button className="w-full" variant="outline">
                管理策略
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Badge className="mt-3 bg-purple-600">策略运行中心</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Profit Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>盈亏趋势</CardTitle>
          <CardDescription>最近7天的盈亏变化</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart
              data={profitData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="profit"
                type="natural"
                fill="var(--color-profit)"
                fillOpacity={0.4}
                stroke="var(--color-profit)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* System Status - 替换为动态健康检查组件 */}
      <SystemHealth />
    </div>
  )
}
