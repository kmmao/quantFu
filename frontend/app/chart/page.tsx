'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import KLineChart from '@/components/KLineChart'
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

interface KLineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Position {
  long_position: number
  long_avg_price: number
  long_profit: number
  short_position: number
  short_avg_price: number
  short_profit: number
  last_price: number
}

export default function ChartPage() {
  const [klines, setKlines] = useState<KLineData[]>([])
  const [markers, setMarkers] = useState<any[]>([])
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(300) // 5分钟K线
  const [symbol, setSymbol] = useState('CZCE.TA2505')

  // 这里简化处理,实际应该从用户选择或持仓列表获取
  const accountId = 'your-account-id' // 需要从实际账户获取

  const fetchKlineData = useCallback(async () => {
    try {
      setLoading(true)

      // 获取带持仓标记的K线数据
      const response = await fetch(
        `${BACKEND_URL}/api/kline/${symbol}/with-positions?account_id=${accountId}&duration=${duration}&length=500`
      )
      const data = await response.json()

      setKlines(data.klines || [])
      setMarkers(data.markers || [])
      setPosition(data.position)
    } catch (error) {
      console.error('获取K线数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [symbol, accountId, duration])

  useEffect(() => {
    fetchKlineData()
  }, [fetchKlineData])

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration)
  }

  const durationOptions = [
    { label: '1分钟', value: 60 },
    { label: '5分钟', value: 300 },
    { label: '15分钟', value: 900 },
    { label: '30分钟', value: 1800 },
    { label: '1小时', value: 3600 },
    { label: '日线', value: 86400 },
  ]

  const calculateChange = () => {
    if (klines.length < 2) return { change: 0, percent: 0 }

    const current = klines[klines.length - 1].close
    const previous = klines[klines.length - 2].close
    const change = current - previous
    const percent = (change / previous) * 100

    return { change, percent }
  }

  const { change, percent } = calculateChange()

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
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">K线图</h1>
      </div>

      {/* 合约信息和周期选择 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{symbol}</CardTitle>
              {klines.length > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold">
                    {klines[klines.length - 1].close.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1">
                    {change >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={fetchKlineData} size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 mr-2">周期:</span>
            {durationOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={duration === option.value ? 'default' : 'outline'}
                onClick={() => handleDurationChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* K线图 */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <KLineChart data={klines} markers={markers} height={500} />
        </CardContent>
      </Card>

      {/* 持仓信息 */}
      {position && (
        <Card>
          <CardHeader>
            <CardTitle>持仓信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 多仓 */}
              {position.long_position > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-600">多仓</Badge>
                    <span className="text-2xl font-bold text-green-700">
                      {position.long_position} 手
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">均价:</span>
                      <span className="font-medium">{position.long_avg_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最新价:</span>
                      <span className="font-medium">{position.last_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">浮盈:</span>
                      <span className={`font-semibold ${position.long_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.long_profit >= 0 ? '+' : ''}{position.long_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 空仓 */}
              {position.short_position > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-red-600">空仓</Badge>
                    <span className="text-2xl font-bold text-red-700">
                      {position.short_position} 手
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">均价:</span>
                      <span className="font-medium">{position.short_avg_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最新价:</span>
                      <span className="font-medium">{position.last_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">浮盈:</span>
                      <span className={`font-semibold ${position.short_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.short_profit >= 0 ? '+' : ''}{position.short_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
