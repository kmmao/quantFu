'use client'

import { useEffect, useState, useCallback } from 'react'
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
import type { Contract, MainContractSwitch } from '@/lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'main' | 'expiring' | 'switches'>(
    'main'
  )
  const [contracts, setContracts] = useState<Contract[]>([])
  const [switches, setSwitches] = useState<MainContractSwitch[]>([])
  const [loading, setLoading] = useState(true)
  const [calculatorOpen, setCalculatorOpen] = useState(false)

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

      if (activeTab === 'switches') {
        const response = await fetch(`${BACKEND_URL}/api/contracts/main-switches`)
        const data = await response.json()
        setSwitches(data.data?.switches || [])
      } else {
        let endpoint = '/api/contracts/list'
        if (activeTab === 'main') {
          endpoint = '/api/contracts/main'
        } else if (activeTab === 'expiring') {
          endpoint = '/api/contracts/expiring?days=30'
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`)
        const data = await response.json()
        setContracts(data.data?.contracts || [])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSyncContract = async (symbol: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contracts/sync/${symbol}`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.code === 200) {
        alert('合约同步成功!')
        fetchData()
      } else {
        alert(`同步失败: ${data.message}`)
      }
    } catch (error) {
      console.error('同步合约失败:', error)
      alert('同步失败,请稍后重试')
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">合约管理</h1>
        </div>
        <div className="flex gap-2">
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
