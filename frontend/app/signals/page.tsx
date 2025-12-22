'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Activity,
  AlertTriangle,
  Play,
  Zap,
  AlertCircle
} from 'lucide-react'
import { supabase, StrategySignal } from '@/lib/supabase'

export default function SignalsPage() {
  const [signals, setSignals] = useState<StrategySignal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed' | 'rejected'>('all')

  useEffect(() => {
    fetchSignals()
    // 每5秒刷新一次
    const interval = setInterval(fetchSignals, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('v_pending_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('获取信号失败:', error)
      } else {
        setSignals(data || [])
      }
    } catch (error) {
      console.error('获取信号失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessSignal = async (signalId: string) => {
    try {
      const response = await fetch(`/api/strategy-signals/${signalId}/process`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        fetchSignals()
      }
    } catch (error) {
      console.error('处理信号失败:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: '待处理', variant: 'secondary' as const, icon: Clock, className: '' },
      executed: { label: '已执行', variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-500' },
      rejected: { label: '已拒绝', variant: 'destructive' as const, icon: XCircle, className: '' },
      expired: { label: '已过期', variant: 'outline' as const, icon: Clock, className: '' }
    }
    const { label, variant, icon: Icon, className } = config[status as keyof typeof config] || config.pending
    return (
      <Badge variant={variant} className={`gap-1 ${className || ''}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getSignalTypeBadge = (type: string) => {
    const config = {
      open: { label: '开仓', icon: TrendingUp },
      close: { label: '平仓', icon: TrendingDown },
      reverse: { label: '反手', icon: Activity }
    }
    const { label, icon: Icon } = config[type as keyof typeof config] || config.open
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getDirectionBadge = (direction: string) => {
    return direction === 'long' ? (
      <Badge className="bg-red-500 gap-1">
        <TrendingUp className="h-3 w-3" />
        多
      </Badge>
    ) : (
      <Badge className="bg-green-600 gap-1">
        <TrendingDown className="h-3 w-3" />
        空
      </Badge>
    )
  }

  const getStrengthBadge = (strength: string) => {
    const config = {
      weak: { label: '弱', variant: 'outline' as const },
      medium: { label: '中', variant: 'secondary' as const },
      strong: { label: '强', variant: 'default' as const }
    }
    const { label, variant } = config[strength as keyof typeof config] || config.medium
    return <Badge variant={variant}>{label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatAge = (ageSeconds: number | undefined) => {
    if (!ageSeconds) return '-'
    if (ageSeconds < 60) return `${Math.floor(ageSeconds)}秒前`
    if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}分钟前`
    return `${Math.floor(ageSeconds / 3600)}小时前`
  }

  const filteredSignals = filter === 'all'
    ? signals
    : signals.filter(s => s.status === filter)

  // 统计
  const stats = {
    total: signals.length,
    pending: signals.filter(s => s.status === 'pending').length,
    executed: signals.filter(s => s.status === 'executed').length,
    rejected: signals.filter(s => s.status === 'rejected').length,
    expired: signals.filter(s => s.status === 'expired').length,
    avgConfidence: signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0
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
          <h1 className="text-3xl font-bold">策略信号监控</h1>
          <p className="text-muted-foreground mt-1">
            实时监控所有策略的交易信号
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3 animate-pulse" />
            实时刷新中
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              总信号数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              待处理
            </CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              已执行
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.executed}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              已拒绝
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已过期</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均置信度</CardDescription>
            <CardTitle className="text-3xl">{(stats.avgConfidence * 100).toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 筛选按钮 */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待处理' },
          { key: 'executed', label: '已执行' },
          { key: 'rejected', label: '已拒绝' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key as any)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 信号列表 */}
      <Card>
        <CardHeader>
          <CardTitle>信号列表</CardTitle>
          <CardDescription>
            显示 {filteredSignals.length} 个信号
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无信号</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>策略实例</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>合约</TableHead>
                  <TableHead>方向</TableHead>
                  <TableHead className="text-right">手数</TableHead>
                  <TableHead className="text-right">价格</TableHead>
                  <TableHead>强度</TableHead>
                  <TableHead className="text-right">置信度</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignals.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell>{getStatusBadge(signal.status)}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{signal.instance_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {signal.strategy_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getSignalTypeBadge(signal.signal_type)}</TableCell>
                    <TableCell className="font-medium">{signal.symbol}</TableCell>
                    <TableCell>{getDirectionBadge(signal.direction)}</TableCell>
                    <TableCell className="text-right font-medium">{signal.volume}</TableCell>
                    <TableCell className="text-right">
                      {signal.price ? signal.price.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell>{getStrengthBadge(signal.strength)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">
                        {(signal.confidence * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(signal.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatAge(signal.age_seconds)}
                    </TableCell>
                    <TableCell className="text-right">
                      {signal.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleProcessSignal(signal.id)}
                          className="gap-1"
                        >
                          <Play className="h-3 w-3" />
                          处理
                        </Button>
                      )}
                      {signal.status === 'rejected' && signal.rejection_reason && (
                        <div className="max-w-xs text-xs text-red-600 truncate" title={signal.rejection_reason}>
                          {signal.rejection_reason}
                        </div>
                      )}
                      {signal.status === 'executed' && (
                        <div className="text-xs text-muted-foreground">
                          {signal.execution_price && `@ ${signal.execution_price.toFixed(2)}`}
                          {signal.execution_volume && ` × ${signal.execution_volume}`}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 待处理信号警告 */}
      {stats.pending > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900">
                有 {stats.pending} 个信号待处理
              </p>
              <p className="text-sm text-orange-700">
                请及时处理待处理的信号,避免错过交易机会
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
