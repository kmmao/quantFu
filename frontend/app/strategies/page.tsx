'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Square,
  Settings,
  History,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react'
import { StrategyInstance } from '@/lib/supabase'
import InstanceParamsDialog from '@/components/InstanceParamsDialog'
import ParamHistoryDialog from '@/components/ParamHistoryDialog'
import CreateInstanceDialog from '@/components/CreateInstanceDialog'

export default function StrategiesPage() {
  const [instances, setInstances] = useState<StrategyInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInstance, setSelectedInstance] = useState<StrategyInstance | null>(null)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [paramsDialogOpen, setParamsDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchInstances()
    // 每30秒刷新一次以更新心跳状态
    const interval = setInterval(fetchInstances, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/strategy-instances')
      const data = await response.json()
      if (data.success) {
        setInstances(data.data)
      }
    } catch (error) {
      console.error('获取策略实例失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (instanceId: string, status: string) => {
    try {
      const response = await fetch(`/api/strategy-instances/${instanceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await response.json()
      if (data.success) {
        fetchInstances()
      }
    } catch (error) {
      console.error('修改状态失败:', error)
    }
  }

  const getStatusBadge = (instance: StrategyInstance) => {
    const now = new Date()
    const lastHeartbeat = instance.last_heartbeat ? new Date(instance.last_heartbeat) : null
    const minutesSinceHeartbeat = lastHeartbeat
      ? Math.floor((now.getTime() - lastHeartbeat.getTime()) / 60000)
      : null

    if (instance.status === 'running') {
      // 如果超过5分钟没有心跳,标记为异常
      if (minutesSinceHeartbeat && minutesSinceHeartbeat > 5) {
        return <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          异常 (无心跳 {minutesSinceHeartbeat}分钟)
        </Badge>
      }
      return <Badge variant="default" className="bg-green-500 gap-1">
        <Activity className="h-3 w-3" />
        运行中
      </Badge>
    } else if (instance.status === 'paused') {
      return <Badge variant="secondary" className="gap-1">
        <Pause className="h-3 w-3" />
        已暂停
      </Badge>
    } else if (instance.status === 'error') {
      return <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        错误
      </Badge>
    } else {
      return <Badge variant="outline" className="gap-1">
        <Square className="h-3 w-3" />
        已停止
      </Badge>
    }
  }

  const formatHeartbeat = (timestamp: string | null) => {
    if (!timestamp) return '无'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffMinutes === 0) return '刚刚'
    if (diffMinutes < 60) return `${diffMinutes}分钟前`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}小时前`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}天前`
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

  // 统计数据
  const stats = {
    total: instances.length,
    running: instances.filter(i => i.status === 'running').length,
    stopped: instances.filter(i => i.status === 'stopped').length,
    error: instances.filter(i => i.status === 'error').length,
    todayProfit: instances.reduce((sum, i) => sum + (i.today_profit || 0), 0),
    todayTrades: instances.reduce((sum, i) => sum + (i.today_trades || 0), 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">策略实例管理</h1>
          <p className="text-muted-foreground mt-1">
            管理和监控所有策略实例的运行状态
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          创建实例
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总实例数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>运行中</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.running}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已停止</CardDescription>
            <CardTitle className="text-3xl text-gray-500">{stats.stopped}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>异常</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.error}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>今日盈亏</CardDescription>
            <CardTitle className={`text-3xl flex items-center gap-1 ${
              stats.todayProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.todayProfit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {stats.todayProfit.toFixed(0)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>今日交易</CardDescription>
            <CardTitle className="text-3xl">{stats.todayTrades}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 实例列表 */}
      <div className="grid gap-4">
        {instances.map(instance => (
          <Card key={instance.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{instance.instance_name}</CardTitle>
                    {getStatusBadge(instance)}
                    {instance.group_name && (
                      <Badge variant="outline" className="gap-1">
                        组: {instance.group_name}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span>策略: {instance.strategy_display_name || instance.strategy_name}</span>
                    <span>账户: {instance.account_id}</span>
                    <span>合约: {instance.symbols.join(', ')}</span>
                    {instance.strategy_category && (
                      <span>分类: {instance.strategy_category}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {instance.status === 'stopped' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(instance.id, 'running')}
                      className="gap-1"
                    >
                      <Play className="h-4 w-4" />
                      启动
                    </Button>
                  )}
                  {instance.status === 'running' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(instance.id, 'paused')}
                        className="gap-1"
                      >
                        <Pause className="h-4 w-4" />
                        暂停
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(instance.id, 'stopped')}
                        className="gap-1"
                      >
                        <Square className="h-4 w-4" />
                        停止
                      </Button>
                    </>
                  )}
                  {instance.status === 'paused' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(instance.id, 'running')}
                        className="gap-1"
                      >
                        <Play className="h-4 w-4" />
                        恢复
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(instance.id, 'stopped')}
                        className="gap-1"
                      >
                        <Square className="h-4 w-4" />
                        停止
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedInstance(instance)
                      setParamsDialogOpen(true)
                    }}
                    className="gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    参数
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedInstance(instance)
                      setHistoryDialogOpen(true)
                    }}
                    className="gap-1"
                  >
                    <History className="h-4 w-4" />
                    历史
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">最后心跳</div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatHeartbeat(instance.last_heartbeat)}
                  </div>
                </div>
                {instance.capital_allocation && (
                  <div>
                    <div className="text-muted-foreground">分配资金</div>
                    <div className="font-medium">{instance.capital_allocation.toLocaleString()} 元</div>
                  </div>
                )}
                {instance.position_limit && (
                  <div>
                    <div className="text-muted-foreground">持仓限制</div>
                    <div className="font-medium">{instance.position_limit} 手</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">今日盈亏</div>
                  <div className={`font-medium ${
                    (instance.today_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(instance.today_profit || 0).toFixed(2)} 元
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">今日交易</div>
                  <div className="font-medium">{instance.today_trades || 0} 笔</div>
                </div>
                {instance.win_rate !== null && instance.win_rate !== undefined && (
                  <div>
                    <div className="text-muted-foreground">胜率</div>
                    <div className="font-medium">{(instance.win_rate * 100).toFixed(1)}%</div>
                  </div>
                )}
              </div>
              {instance.error_message && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  <strong>错误信息:</strong> {instance.error_message}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {instances.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无策略实例</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                创建第一个实例
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 对话框组件 */}
      {selectedInstance && (
        <>
          <InstanceParamsDialog
            open={paramsDialogOpen}
            onOpenChange={setParamsDialogOpen}
            instance={selectedInstance}
            onParamsUpdated={fetchInstances}
          />
          <ParamHistoryDialog
            open={historyDialogOpen}
            onOpenChange={setHistoryDialogOpen}
            instance={selectedInstance}
          />
        </>
      )}

      <CreateInstanceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onInstanceCreated={fetchInstances}
      />
    </div>
  )
}
