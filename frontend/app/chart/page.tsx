'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import KLineChart from '@/components/KLineChart'
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, Grid2X2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

interface SymbolInfo {
  symbol: string
  account_id: string
  position: number
  avg_price: number
  profit: number
}

export default function ChartPage() {
  const [klines, setKlines] = useState<KLineData[]>([])
  const [markers, setMarkers] = useState<any[]>([])
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true) // 等待持仓数据加载
  const [duration, setDuration] = useState(300) // 5分钟K线
  const [symbol, setSymbol] = useState('')
  const [accountId, setAccountId] = useState('')
  const [availableSymbols, setAvailableSymbols] = useState<SymbolInfo[]>([])
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const [klineError, setKlineError] = useState<string | null>(null)
  const [manualSymbol, setManualSymbol] = useState('')  // 手动输入的合约代码
  const [inputMode, setInputMode] = useState<'select' | 'manual'>('select')  // 输入模式

  // 获取可用合约列表（从持仓中）
  const fetchAvailableSymbols = useCallback(async () => {
    try {
      setLoading(true)
      // 添加超时控制 - 10秒超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { data, error } = await supabase
        .from('v_positions_summary')
        .select('symbol, account_id, long_position, short_position, long_avg_price, short_avg_price, long_profit, short_profit')
        .or('long_position.gt.0,short_position.gt.0')
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.error('获取持仓合约失败:', error)
        setKlineError('获取持仓合约失败: ' + error.message)
        setLoading(false)
        return
      }

      const symbols: SymbolInfo[] = (data || []).map((pos: any) => ({
        symbol: pos.symbol,
        account_id: pos.account_id,
        position: (pos.long_position || 0) + (pos.short_position || 0),
        avg_price: pos.long_position > 0 ? pos.long_avg_price : pos.short_avg_price,
        profit: (pos.long_profit || 0) + (pos.short_profit || 0)
      }))

      setAvailableSymbols(symbols)

      // 如果有持仓，默认选择第一个；否则不设置错误
      if (symbols.length > 0) {
        setSymbol(symbols[0].symbol)
        setAccountId(symbols[0].account_id)
      }

      setLoading(false)
    } catch (error: any) {
      console.error('获取持仓合约失败:', error)
      if (error.name === 'AbortError') {
        setKlineError('获取持仓合约超时,请检查数据库连接')
      } else {
        setKlineError('获取持仓合约失败: ' + error.message)
      }
      setLoading(false)
    }
  }, [])

  const fetchKlineData = useCallback(async () => {
    const targetSymbol = inputMode === 'manual' ? manualSymbol.trim() : symbol
    if (!targetSymbol) return

    try {
      setLoading(true)
      setKlineError(null)

      // K线数据获取 - 带持仓标记
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      // 如果是手动输入模式或没有 accountId，使用纯K线接口
      const url = inputMode === 'manual' || !accountId
        ? `${BACKEND_URL}/api/kline/${targetSymbol}?duration=${duration}&length=500`
        : `${BACKEND_URL}/api/kline/${targetSymbol}/with-positions?account_id=${accountId}&duration=${duration}&length=500`

      const response = await fetch(url, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // 兼容两种接口格式
      // 纯K线接口：返回 { symbol, duration, total, klines }
      // 带持仓接口：返回 { klines, markers, position }
      setKlines(data.klines || [])
      setMarkers(data.markers || [])
      setPosition(data.position || null)
    } catch (error: any) {
      console.error('获取K线数据失败:', error)

      let errorMsg = '获取K线数据失败'
      if (error.name === 'AbortError') {
        errorMsg = '请求超时：天勤行情服务可能未启动或网络延迟'
      } else if (error.message?.includes('Failed to fetch')) {
        errorMsg = '无法连接到后端服务，请检查后端是否运行 (localhost:8888)'
      } else if (error.message) {
        errorMsg = error.message
      }

      setKlineError(errorMsg)
      setKlines([])
      setMarkers([])
      setPosition(null)
    } finally {
      setLoading(false)
    }
  }, [symbol, accountId, duration, inputMode, manualSymbol])

  useEffect(() => {
    // 页面加载时获取持仓合约列表
    fetchAvailableSymbols()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // 合约或周期变化时重新获取K线
    const targetSymbol = inputMode === 'manual' ? manualSymbol.trim() : symbol
    if (targetSymbol) {
      fetchKlineData()
    }
  }, [symbol, duration, inputMode, manualSymbol, fetchKlineData])

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

  const handleSymbolChange = (selectedSymbol: string) => {
    const symbolInfo = availableSymbols.find(s => s.symbol === selectedSymbol)
    if (symbolInfo) {
      setSymbol(symbolInfo.symbol)
      setAccountId(symbolInfo.account_id)
    }
  }

  const handleManualSymbolSubmit = () => {
    if (manualSymbol.trim()) {
      setInputMode('manual')
      // 触发数据加载
      fetchKlineData()
    }
  }

  const handleManualSymbolKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSymbolSubmit()
    }
  }

  const switchToSelectMode = () => {
    setInputMode('select')
    if (availableSymbols.length > 0 && !symbol) {
      setSymbol(availableSymbols[0].symbol)
      setAccountId(availableSymbols[0].account_id)
    }
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">K线图表</h1>
            <p className="text-muted-foreground text-sm mt-1">
              持仓合约实时行情 (TqSDK)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('single')}
          >
            <Activity className="w-4 h-4 mr-1" />
            单图
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid2X2 className="w-4 h-4 mr-1" />
            多图
          </Button>
        </div>
      </div>

      {/* 合约选择和控制 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">合约代码</label>
                <div className="flex items-center gap-2">
                  {inputMode === 'select' ? (
                    <>
                      <Select value={symbol} onValueChange={handleSymbolChange}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="选择持仓合约" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSymbols.map((s) => (
                            <SelectItem key={s.symbol} value={s.symbol}>
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">{s.symbol}</span>
                                <Badge variant={s.profit >= 0 ? 'default' : 'destructive'} className="text-xs">
                                  {s.profit >= 0 ? '+' : ''}{s.profit.toFixed(0)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInputMode('manual')}
                      >
                        手动输入
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        placeholder="如: SHFE.rb2505"
                        value={manualSymbol}
                        onChange={(e) => setManualSymbol(e.target.value)}
                        onKeyDown={handleManualSymbolKeyDown}
                        className="w-[200px]"
                      />
                      <Button
                        size="sm"
                        onClick={handleManualSymbolSubmit}
                        disabled={!manualSymbol.trim()}
                      >
                        查询
                      </Button>
                      {availableSymbols.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={switchToSelectMode}
                        >
                          持仓列表
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {klines.length > 0 && (
                <div className="border-l pl-4">
                  <div className="text-sm text-muted-foreground mb-1">最新价</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {klines[klines.length - 1].close.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      {change >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={fetchKlineData} size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 mr-2">K线周期:</span>
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

      {/* K线图区域 */}
      {viewMode === 'single' ? (
        // 单图模式
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {inputMode === 'manual' ? manualSymbol : symbol} K线走势
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {klineError ? (
                <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50">
                  <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
                  <p className="text-muted-foreground mb-2">{klineError}</p>
                  <p className="text-sm text-muted-foreground mb-4">K线图功能需要天勤行情服务支持</p>
                  <Button onClick={fetchKlineData} size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    重试
                  </Button>
                </div>
              ) : klines.length === 0 && !loading ? (
                <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无K线数据</p>
                </div>
              ) : (
                <KLineChart data={klines} markers={markers} height={600} />
              )}
            </CardContent>
          </Card>

          {/* 持仓信息 */}
          {position && (
            <Card>
              <CardHeader>
                <CardTitle>持仓详情</CardTitle>
                <CardDescription>当前合约的持仓情况与盈亏</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 多仓 */}
                  {position.long_position > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-green-600">多仓</Badge>
                        <span className="text-2xl font-bold text-green-700">
                          {position.long_position} 手
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">均价:</span>
                          <span className="font-medium">{position.long_avg_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">最新价:</span>
                          <span className="font-medium">{position.last_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="text-gray-600 font-medium">浮盈:</span>
                          <span className={`font-bold text-lg ${position.long_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.long_profit >= 0 ? '+' : ''}{position.long_profit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 空仓 */}
                  {position.short_position > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-red-600">空仓</Badge>
                        <span className="text-2xl font-bold text-red-700">
                          {position.short_position} 手
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">均价:</span>
                          <span className="font-medium">{position.short_avg_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">最新价:</span>
                          <span className="font-medium">{position.last_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-red-200">
                          <span className="text-gray-600 font-medium">浮盈:</span>
                          <span className={`font-bold text-lg ${position.short_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        </>
      ) : (
        // 多图模式 - 显示所有持仓合约的图表
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {availableSymbols.slice(0, 4).map((symbolInfo) => (
            <Card key={symbolInfo.symbol}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{symbolInfo.symbol}</CardTitle>
                  <Badge variant={symbolInfo.profit >= 0 ? 'default' : 'destructive'} className="text-xs">
                    {symbolInfo.profit >= 0 ? '+' : ''}{symbolInfo.profit.toFixed(0)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] flex items-center justify-center bg-gray-50">
                  <p className="text-sm text-muted-foreground">
                    点击切换到单图模式查看详细K线
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
