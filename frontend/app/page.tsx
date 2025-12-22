'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChartCandlestick,
  LayoutDashboard,
  TrendingUp,
  Activity,
  Info
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          QuantFu 期货量化管理平台
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          实时行情监控 · 持仓管理 · 策略执行
        </p>
      </div>

      {/* 功能入口卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* K线图表 */}
        <Link href="/chart">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <ChartCandlestick className="w-5 h-5" />
                K线图表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                实时行情监控,支持多周期 K线图,技术指标分析
              </p>
              <Badge className="mt-3 bg-blue-600">
                独立模块 · 无需数据库
              </Badge>
            </CardContent>
          </Card>
        </Link>

        {/* 持仓监控 */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <LayoutDashboard className="w-5 h-5" />
              持仓监控
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              实时持仓数据,盈亏分析,风险监控
            </p>
            <Badge className="mt-3 bg-green-600">
              需要数据库支持
            </Badge>
            <div className="mt-3">
              <p className="text-xs text-amber-600">
                数据库连接失败,功能暂不可用
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 策略管理 */}
        <Link href="/strategies">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Activity className="w-5 h-5" />
                策略管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                策略实例管理,性能监控,参数优化
              </p>
              <Badge className="mt-3 bg-purple-600">
                策略运行中心
              </Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 快速开始指南 */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            快速开始
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 左侧:无需数据库的功能 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <ChartCandlestick className="w-4 h-4" />
                独立功能 (无需数据库)
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><Link href="/chart" className="underline font-medium">K线图表</Link> - 通过 TqSDK 实时获取行情数据</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>策略回测 - 本地数据分析</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>技术指标计算 - 纯前端计算</span>
                </li>
              </ul>
            </div>

            {/* 右侧:需要数据库的功能 */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                数据库功能 (需 Supabase)
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>持仓监控 - 实时持仓数据同步</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>锁仓管理 - 持仓配对与解锁</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>历史数据分析 - 交易记录查询</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 系统状态提示 */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">💡 提示:</span>
              如果数据库连接失败,仍可正常使用 <Link href="/chart" className="underline font-medium">K线图表</Link> 等独立功能。
              持仓监控等功能需要 Supabase 数据库正常运行。
            </p>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-3 mt-4">
            <Link href="/chart">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ChartCandlestick className="w-4 h-4 mr-2" />
                打开K线图
              </Button>
            </Link>
            <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                打开数据库管理
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
