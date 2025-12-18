'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Clock, CheckCircle2, XCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { RolloverTask, RolloverExecution } from '@/lib/supabase'
import { Separator } from "@/components/ui/separator"

interface RolloverTaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: RolloverTask
}

export default function RolloverTaskDetailDialog({
  open,
  onOpenChange,
  task
}: RolloverTaskDetailDialogProps) {
  const [executions, setExecutions] = useState<RolloverExecution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchExecutions()
    }
  }, [open, task.id])

  const fetchExecutions = async () => {
    setLoading(true)
    try {
      // 注意: 这里需要添加一个获取执行详情的API端点
      // 暂时使用模拟数据
      setExecutions([])
    } catch (error) {
      console.error('获取执行详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-orange-600" />
    }
  }

  const progress = task.target_position > 0
    ? ((task.executed_volume || 0) / task.target_position) * 100
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(task.status)}
            <div>
              <DialogTitle>换月任务详情</DialogTitle>
              <DialogDescription>
                {task.old_symbol} → {task.new_symbol}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">任务ID:</span>
                <span className="ml-2 font-mono text-xs">{task.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">账户:</span>
                <span className="ml-2 font-medium">{task.account_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">旧合约:</span>
                <span className="ml-2 font-medium">{task.old_symbol}</span>
              </div>
              <div>
                <span className="text-muted-foreground">新合约:</span>
                <span className="ml-2 font-medium">{task.new_symbol}</span>
              </div>
              <div>
                <span className="text-muted-foreground">触发方式:</span>
                <Badge variant="outline" className="ml-2">
                  {task.trigger_type === 'main_switch' ? '主力切换' : '到期触发'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">状态:</span>
                <Badge
                  variant={
                    task.status === 'completed' ? 'default' :
                    task.status === 'failed' ? 'destructive' :
                    'secondary'
                  }
                  className={task.status === 'completed' ? 'ml-2 bg-green-500' : 'ml-2'}
                >
                  {
                    task.status === 'pending' ? '待执行' :
                    task.status === 'in_progress' ? '执行中' :
                    task.status === 'completed' ? '已完成' :
                    task.status === 'failed' ? '失败' : '已取消'
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 执行进度 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">执行进度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {task.old_position}
                  </div>
                  <div className="text-muted-foreground mt-1">旧持仓</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {task.target_position}
                  </div>
                  <div className="text-muted-foreground mt-1">目标手数</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {task.executed_volume || 0}
                  </div>
                  <div className="text-muted-foreground mt-1">已执行</div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">完成进度</span>
                  <span className="font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {task.remaining_volume !== null && task.remaining_volume > 0 && (
                <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
                  剩余待执行: {task.remaining_volume} 手
                </div>
              )}
            </CardContent>
          </Card>

          {/* 成本统计 */}
          {task.total_cost !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">成本统计</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-muted-foreground mb-1">总成本</div>
                  <div className="text-2xl font-bold">
                    {task.total_cost.toFixed(2)} 元
                  </div>
                </div>
                {task.executed_volume && task.executed_volume > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-muted-foreground mb-1">单位成本</div>
                    <div className="text-2xl font-bold">
                      {(task.total_cost / task.executed_volume).toFixed(2)} 元/手
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">时间信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">创建时间:</span>
                <span className="ml-2">{formatDate(task.created_at)}</span>
              </div>
              {task.started_at && (
                <div>
                  <span className="text-muted-foreground">开始时间:</span>
                  <span className="ml-2">{formatDate(task.started_at)}</span>
                </div>
              )}
              {task.completed_at && (
                <div>
                  <span className="text-muted-foreground">完成时间:</span>
                  <span className="ml-2">{formatDate(task.completed_at)}</span>
                </div>
              )}
              {task.started_at && task.completed_at && (
                <div>
                  <span className="text-muted-foreground">执行时长:</span>
                  <span className="ml-2">
                    {Math.round(
                      (new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000
                    )} 秒
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 错误信息 */}
          {task.error_message && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  错误信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">{task.error_message}</p>
              </CardContent>
            </Card>
          )}

          {/* 执行步骤 (如果有的话) */}
          {executions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">执行步骤</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>步骤</TableHead>
                      <TableHead>合约</TableHead>
                      <TableHead>方向</TableHead>
                      <TableHead className="text-right">手数</TableHead>
                      <TableHead className="text-right">价格</TableHead>
                      <TableHead className="text-right">成本</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>执行时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((exec) => (
                      <TableRow key={exec.id}>
                        <TableCell>
                          {exec.step_type === 'close_old' ? '平旧仓' : '开新仓'}
                        </TableCell>
                        <TableCell>{exec.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={exec.direction === 'long' ? 'default' : 'destructive'}>
                            {exec.direction === 'long' ? '多' : '空'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{exec.volume}</TableCell>
                        <TableCell className="text-right">
                          {exec.price ? exec.price.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {exec.cost ? exec.cost.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>
                          {exec.status === 'executed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : exec.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(exec.execution_time)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
