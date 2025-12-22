'use client'

import { useEffect, useState } from 'react'
import {
  Server,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  components: {
    database?: {
      status: string
      type?: string
      error?: string
    }
    tqsdk?: {
      status: string
      user?: string
    }
  }
  metrics?: {
    accounts: number
    positions: number
    latest_trade?: string | null
  }
  system?: {
    cpu_percent: number
    memory_percent: number
    memory_used_gb: number
    memory_total_gb: number
    disk_percent: number
    disk_used_gb: number
    disk_total_gb: number
  }
  warnings: string[]
}

export function SystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      setError(null)

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'
      const response = await fetch(`${backendUrl}/health/detailed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 后端服务不可用`)
      }

      const data = await response.json()
      setHealthData(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法连接到后端服务')
      setHealthData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000) // 每30秒刷新
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'bg-green-600'
      case 'degraded':
      case 'configured':
        return 'bg-yellow-600'
      case 'unhealthy':
      case 'error':
        return 'bg-red-600'
      case 'not_configured':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'degraded':
      case 'configured':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '健康'
      case 'ok':
        return '正常'
      case 'degraded':
        return '降级'
      case 'unhealthy':
        return '异常'
      case 'error':
        return '错误'
      case 'configured':
        return '已配置'
      case 'not_configured':
        return '未配置'
      default:
        return status
    }
  }

  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return '无数据'
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return '刚刚'
      if (diffMins < 60) return `${diffMins}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      return `${diffDays}天前`
    } catch {
      return timestamp
    }
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            系统状态检查失败
          </CardTitle>
          <CardDescription>无法获取系统健康状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-red-100 p-4 text-sm text-red-900">
            <p className="font-semibold">错误信息:</p>
            <p>{error}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={fetchHealthData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 提示:</span> 请确保后端服务正在运行 (默认端口 8888)
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              系统服务状态
            </CardTitle>
            <CardDescription>
              实时监控各项依赖服务的运行状态
              {lastUpdate && (
                <span className="ml-2 text-xs">
                  · 最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-green-600 text-green-600' : ''}
            >
              <Activity className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? '自动刷新' : '手动模式'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealthData}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 整体状态 */}
        {healthData && (
          <div className="flex items-center justify-between rounded-lg border-2 p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(healthData.status)}
              <div>
                <p className="font-semibold">系统整体状态</p>
                <p className="text-sm text-muted-foreground">
                  {healthData.warnings.length > 0
                    ? `${healthData.warnings.length} 个警告`
                    : '所有服务正常运行'}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(healthData.status)}>
              {getStatusText(healthData.status).toUpperCase()}
            </Badge>
          </div>
        )}

        {/* 核心服务状态 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">核心服务</h3>

          {/* Backend API */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Backend API</p>
                <p className="text-sm text-muted-foreground">FastAPI 服务 · 端口 8888</p>
              </div>
            </div>
            <Badge className="bg-green-600">在线</Badge>
          </div>

          {/* Supabase 数据库 */}
          {healthData?.components.database && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Supabase 数据库</p>
                  <p className="text-sm text-muted-foreground">
                    PostgreSQL · {healthData.components.database.type || 'PostgreSQL'}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(healthData.components.database.status)}>
                {getStatusText(healthData.components.database.status)}
              </Badge>
            </div>
          )}

          {/* TqSDK 天勤 */}
          {healthData?.components.tqsdk && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">天勤行情服务 (TqSDK)</p>
                  <p className="text-sm text-muted-foreground">
                    {healthData.components.tqsdk.user
                      ? `账户: ${healthData.components.tqsdk.user}`
                      : '实时行情数据源'}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(healthData.components.tqsdk.status)}>
                {getStatusText(healthData.components.tqsdk.status)}
              </Badge>
            </div>
          )}
        </div>

        {/* 业务指标 */}
        {healthData?.metrics && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">业务指标</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">账户数量</p>
                <p className="mt-1 text-2xl font-bold">{healthData.metrics.accounts}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">持仓记录</p>
                <p className="mt-1 text-2xl font-bold">{healthData.metrics.positions}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">最近成交</p>
                <p className="mt-1 text-sm font-medium">
                  {formatTimestamp(healthData.metrics.latest_trade)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 系统资源 */}
        {healthData?.system && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">系统资源使用</h3>
            <div className="space-y-4">
              {/* CPU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {healthData.system.cpu_percent}%
                  </span>
                </div>
                <Progress value={healthData.system.cpu_percent} />
              </div>

              {/* 内存 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">内存</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {healthData.system.memory_used_gb.toFixed(1)} GB /{' '}
                    {healthData.system.memory_total_gb.toFixed(1)} GB ({healthData.system.memory_percent}%)
                  </span>
                </div>
                <Progress value={healthData.system.memory_percent} />
              </div>

              {/* 磁盘 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">磁盘</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {healthData.system.disk_used_gb.toFixed(1)} GB /{' '}
                    {healthData.system.disk_total_gb.toFixed(1)} GB ({healthData.system.disk_percent}%)
                  </span>
                </div>
                <Progress value={healthData.system.disk_percent} />
              </div>
            </div>
          </div>
        )}

        {/* 警告信息 */}
        {healthData && healthData.warnings.length > 0 && (
          <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">系统警告</p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                  {healthData.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {healthData && healthData.warnings.length === 0 && (
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-900">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              所有系统服务运行正常,当前状态良好
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
