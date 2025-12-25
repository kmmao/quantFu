'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  AlertCircle,
  Calculator,
} from 'lucide-react'
import MarginCalculator from '@/components/MarginCalculator'
import { supabase } from '@/lib/supabase'
import type { Contract, MainContractSwitch } from '@/lib/supabase'

export default function ContractsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'list' | 'main' | 'expiring' | 'switches'>(
    'main'
  )
  const [contracts, setContracts] = useState<Contract[]>([])
  const [switches, setSwitches] = useState<MainContractSwitch[]>([])
  const [loading, setLoading] = useState(true)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 统计数据
  const stats = {
    total: contracts.length,
    main: contracts.filter((c) => c.is_main_contract).length,
    expiring: contracts.filter(
      (c) => c.days_to_expiry !== undefined && c.days_to_expiry <= 30
    ).length,
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'switches') {
        // 获取主力合约切换历史
        // 注意: 这个表可能还不存在,需要后端服务创建
        try {
          const { data, error } = await supabase
            .from('main_contract_switches')
            .select('*')
            .order('switch_date', { ascending: false })
            .limit(50)

          if (error) {
            // 如果表不存在,设置为空数组
            if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
              setSwitches([])
              setError('主力合约切换历史表尚未创建')
            } else {
              throw error
            }
          } else {
            setSwitches(data || [])
          }
        } catch (err) {
          setSwitches([])
        }
      } else {
        let query = supabase
          .from('contracts')
          .select('*')

        // 根据不同标签页添加过滤条件
        if (activeTab === 'main') {
          // 数据库字段是 is_main 不是 is_main_contract
          query = query.eq('is_main', true)
        } else if (activeTab === 'expiring') {
          // 计算 30 天后的日期
          // 数据库字段是 expiry_date 不是 expire_date
          const thirtyDaysLater = new Date()
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
          query = query.lte('expiry_date', thirtyDaysLater.toISOString())
        }

        // 排序
        query = query.order('exchange', { ascending: true })
          .order('variety_code', { ascending: true })

        const { data, error } = await query

        if (error) throw error

        // 计算到期天数并转换字段名以匹配组件
        const contractsWithDays = (data || []).map((contract: any) => {
          const result: any = {
            ...contract,
            // 字段名映射: 数据库 -> 组件
            symbol: contract.polar_symbol,
            is_main_contract: contract.is_main,
            expire_date: contract.expiry_date,
            // 设置缺失的字段默认值
            last_price: null,
            settlement_price: null,
            open_interest: 0,
            volume: 0,
            trading_status: 'active'
          }

          if (contract.expiry_date) {
            const expireDate = new Date(contract.expiry_date)
            const today = new Date()
            const daysToExpiry = Math.ceil(
              (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
            result.days_to_expiry = daysToExpiry
          }
          return result
        })

        setContracts(contractsWithDays)
      }
    } catch (error: any) {
      console.error('获取数据失败:', error)
      setError(error.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 创建测试数据
  const createTestData = async () => {
    try {
      const testContracts = [
        {
          variety_code: 'RB',
          variety_name: '螺纹钢',
          exchange: 'SHFE',
          polar_symbol: 'SHFE.rb2505',
          tqsdk_symbol: 'SHFE.rb2505',
          is_main: true,
          contract_month: '2505',
          expiry_date: '2025-05-15',
          multiplier: 10,
          price_tick: 1.0,
          margin_ratio: 0.08,
        },
        {
          variety_code: 'HC',
          variety_name: '热轧卷板',
          exchange: 'SHFE',
          polar_symbol: 'SHFE.hc2505',
          tqsdk_symbol: 'SHFE.hc2505',
          is_main: true,
          contract_month: '2505',
          expiry_date: '2025-05-15',
          multiplier: 10,
          price_tick: 1.0,
          margin_ratio: 0.08,
        },
        {
          variety_code: 'I',
          variety_name: '铁矿石',
          exchange: 'DCE',
          polar_symbol: 'DCE.i2505',
          tqsdk_symbol: 'DCE.i2505',
          is_main: true,
          contract_month: '2505',
          expiry_date: '2025-05-15',
          multiplier: 100,
          price_tick: 0.5,
          margin_ratio: 0.09,
        },
      ]

      const { error } = await supabase
        .from('contracts')
        .insert(testContracts)

      if (error) throw error

      toast({
        title: '创建成功',
        description: '测试数据已成功创建',
      })
      fetchData()
    } catch (error: any) {
      console.error('创建测试数据失败:', error)
      toast({
        title: '创建失败',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSyncContract = async (symbol: string) => {
    // 注意: 合约同步功能需要后端服务支持
    // 如果需要这个功能,请启动后端 FastAPI 服务
    toast({
      title: '功能提示',
      description: '合约同步功能需要后端服务支持，请先启动后端 FastAPI 服务 (localhost:8888)',
    })

    // TODO: 如果后端服务已启动,取消注释下面的代码
    /*
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'
      const response = await fetch(`${BACKEND_URL}/api/contracts/sync/${symbol}`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.code === 200) {
        toast({
          title: '同步成功',
          description: '合约信息已同步',
        })
        fetchData()
      } else {
        toast({
          title: '同步失败',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('同步合约失败:', error)
      toast({
        title: '同步失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
    */
  }

  const getExchangeBadge = (exchange: string) => {
    const colors: Record<string, string> = {
      CZCE: 'bg-blue-100 text-blue-800',
      DCE: 'bg-green-100 text-green-800',
      SHFE: 'bg-purple-100 text-purple-800',
      INE: 'bg-red-100 text-red-800',
      CFFEX: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <Badge className={colors[exchange] || 'bg-gray-100 text-gray-800'}>
        {exchange}
      </Badge>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-'
    return price.toFixed(2)
  }

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">合约管理</h1>
        </div>
        <div className="flex gap-2">
          {contracts.length === 0 && !loading && (
            <Button variant="outline" onClick={createTestData}>
              创建测试数据
            </Button>
          )}
          <Button variant="outline" onClick={() => setCalculatorOpen(true)}>
            <Calculator className="w-4 h-4 mr-1" />
            保证金计算
          </Button>
          <Button onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              合约总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              主力合约
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.main}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              即将到期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.expiring}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'main' ? 'default' : 'outline'}
              onClick={() => setActiveTab('main')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              主力合约
            </Button>
            <Button
              variant={activeTab === 'expiring' ? 'default' : 'outline'}
              onClick={() => setActiveTab('expiring')}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              即将到期
            </Button>
            <Button
              variant={activeTab === 'list' ? 'default' : 'outline'}
              onClick={() => setActiveTab('list')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              全部合约
            </Button>
            <Button
              variant={activeTab === 'switches' ? 'default' : 'outline'}
              onClick={() => setActiveTab('switches')}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              切换历史
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'switches' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易所</TableHead>
                    <TableHead>品种</TableHead>
                    <TableHead>旧主力</TableHead>
                    <TableHead>新主力</TableHead>
                    <TableHead className="text-right">换月指数</TableHead>
                    <TableHead className="text-right">旧持仓量</TableHead>
                    <TableHead className="text-right">新持仓量</TableHead>
                    <TableHead>切换时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {switches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        暂无切换记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    switches.map((sw) => (
                      <TableRow key={sw.id}>
                        <TableCell>{getExchangeBadge(sw.exchange)}</TableCell>
                        <TableCell className="font-medium">
                          {sw.variety_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {sw.old_main_contract}
                        </TableCell>
                        <TableCell className="text-sm text-blue-600 font-medium">
                          {sw.new_main_contract}
                        </TableCell>
                        <TableCell className="text-right">
                          {sw.rollover_index.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {sw.old_open_interest.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {sw.new_open_interest.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(sw.switch_date)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易所</TableHead>
                    <TableHead>品种</TableHead>
                    <TableHead>合约代码</TableHead>
                    <TableHead>合约月份</TableHead>
                    {activeTab === 'main' && <TableHead>主力</TableHead>}
                    {activeTab !== 'list' && <TableHead>到期天数</TableHead>}
                    <TableHead className="text-right">最新价</TableHead>
                    <TableHead className="text-right">结算价</TableHead>
                    <TableHead className="text-right">持仓量</TableHead>
                    <TableHead className="text-right">成交量</TableHead>
                    <TableHead>保证金比例</TableHead>
                    {activeTab === 'expiring' && <TableHead>到期日</TableHead>}
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeTab === 'list' ? 11 : 12}
                        className="text-center text-gray-500 py-8"
                      >
                        暂无合约数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{getExchangeBadge(contract.exchange)}</TableCell>
                        <TableCell className="font-medium">
                          {contract.variety_name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contract.symbol}
                        </TableCell>
                        <TableCell>{contract.contract_month}</TableCell>
                        {activeTab === 'main' && (
                          <TableCell>
                            {contract.is_main_contract && (
                              <Badge className="bg-blue-600">主力</Badge>
                            )}
                          </TableCell>
                        )}
                        {activeTab !== 'list' && (
                          <TableCell>
                            {contract.days_to_expiry !== undefined ? (
                              <Badge
                                variant={
                                  contract.days_to_expiry <= 7
                                    ? 'destructive'
                                    : contract.days_to_expiry <= 15
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {Math.floor(contract.days_to_expiry)} 天
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-medium">
                          {formatPrice(contract.last_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(contract.settlement_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {contract.open_interest.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {contract.volume.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(contract.margin_ratio * 100).toFixed(1)}%
                        </TableCell>
                        {activeTab === 'expiring' && (
                          <TableCell className="text-sm">
                            {formatDate(contract.expire_date)}
                          </TableCell>
                        )}
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSyncContract(contract.symbol)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保证金计算器 */}
      <MarginCalculator open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </main>
  )
}
