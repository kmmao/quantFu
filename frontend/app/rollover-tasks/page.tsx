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
  Play,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRightLeft,
  Plus,
  Eye
} from 'lucide-react'
import { RolloverTask } from '@/lib/supabase'
import RolloverTaskDetailDialog from '@/components/RolloverTaskDetailDialog'
import CreateRolloverTaskDialog from '@/components/CreateRolloverTaskDialog'

export default function RolloverTasksPage() {
  const [tasks, setTasks] = useState<RolloverTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<RolloverTask | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'failed'>('all')

  useEffect(() => {
    fetchTasks()
    // 每10秒刷新一次
    const interval = setInterval(fetchTasks, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/rollover/tasks')
      const data = await response.json()
      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      console.error('获取换月任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteTask = async (taskId: string) => {
    if (!confirm('确定要执行该换月任务吗？')) return

    try {
      const response = await fetch(`/api/rollover/tasks/${taskId}/execute`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        fetchTasks()
      } else {
        alert('执行失败: ' + data.message)
      }
    } catch (error) {
      console.error('执行任务失败:', error)
      alert('执行任务失败')
    }
  }

  const handleCancelTask = async (taskId: string) => {
    if (!confirm('确定要取消该换月任务吗？')) return

    try {
      const response = await fetch(`/api/rollover/tasks/${taskId}/cancel`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        fetchTasks()
      }
    } catch (error) {
      console.error('取消任务失败:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待执行', variant: 'secondary' as const, icon: Clock },
      in_progress: { label: '执行中', variant: 'default' as const, icon: Play },
      completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-500' },
      failed: { label: '失败', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: '已取消', variant: 'outline' as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className || ''}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTriggerTypeBadge = (triggerType: string) => {
    return triggerType === 'main_switch' ? (
      <Badge variant="outline" className="gap-1">
        <ArrowRightLeft className="h-3 w-3" />
        主力切换
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        到期触发
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter)

  // 统计
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    totalCost: tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.total_cost || 0), 0),
    totalVolume: tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.executed_volume || 0), 0)
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
          <h1 className="text-3xl font-bold">换月任务管理</h1>
          <p className="text-muted-foreground mt-1">
            监控和管理合约换月任务的执行
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          创建任务
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总任务数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>待执行</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>执行中</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.in_progress}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已完成</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>失败</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总成本</CardDescription>
            <CardTitle className="text-3xl">{stats.totalCost.toFixed(0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总手数</CardDescription>
            <CardTitle className="text-3xl">{stats.totalVolume}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 筛选按钮 */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待执行' },
          { key: 'in_progress', label: '执行中' },
          { key: 'completed', label: '已完成' },
          { key: 'failed', label: '失败' }
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

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>
            显示 {filteredTasks.length} 个任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无换月任务</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>触发方式</TableHead>
                  <TableHead>账户</TableHead>
                  <TableHead>旧合约</TableHead>
                  <TableHead>新合约</TableHead>
                  <TableHead className="text-right">持仓</TableHead>
                  <TableHead className="text-right">目标</TableHead>
                  <TableHead className="text-right">已执行</TableHead>
                  <TableHead className="text-right">成本</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>完成时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getTriggerTypeBadge(task.trigger_type)}</TableCell>
                    <TableCell className="font-medium">{task.account_id}</TableCell>
                    <TableCell className="text-sm">{task.old_symbol}</TableCell>
                    <TableCell className="text-sm">{task.new_symbol}</TableCell>
                    <TableCell className="text-right">{task.old_position}</TableCell>
                    <TableCell className="text-right">{task.target_position}</TableCell>
                    <TableCell className="text-right">
                      {task.executed_volume !== null ? (
                        <span className={task.executed_volume === task.target_position ? 'text-green-600 font-semibold' : ''}>
                          {task.executed_volume}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.total_cost !== null ? (
                        <span className="font-medium">{task.total_cost.toFixed(2)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(task.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(task.completed_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task)
                            setDetailDialogOpen(true)
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          详情
                        </Button>
                        {task.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleExecuteTask(task.id)}
                              className="gap-1"
                            >
                              <Play className="h-3 w-3" />
                              执行
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelTask(task.id)}
                              className="gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              取消
                            </Button>
                          </>
                        )}
                        {task.status === 'failed' && task.error_message && (
                          <div className="max-w-xs text-xs text-red-600 truncate" title={task.error_message}>
                            {task.error_message}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 对话框 */}
      {selectedTask && (
        <RolloverTaskDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          task={selectedTask}
        />
      )}

      <CreateRolloverTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={fetchTasks}
      />
    </div>
  )
}
