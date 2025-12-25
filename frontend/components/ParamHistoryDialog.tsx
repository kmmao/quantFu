'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConfirm } from '@/hooks/use-confirm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { RotateCcw, AlertCircle, Clock } from 'lucide-react'
import { StrategyInstance, StrategyParamHistory } from '@/lib/supabase'
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

interface ParamHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: StrategyInstance
}

export default function ParamHistoryDialog({
  open,
  onOpenChange,
  instance
}: ParamHistoryDialogProps) {
  const [history, setHistory] = useState<StrategyParamHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/strategy-instances/${instance.id}/params/history`)
      const data = await response.json()

      if (data.success) {
        setHistory(data.data)
      } else {
        setError(data.message || '获取历史记录失败')
      }
    } catch (error) {
      console.error('获取历史记录失败:', error)
      setError('获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }, [instance.id])

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open, fetchHistory])

  const handleRollback = async (paramKey: string) => {
    const confirmed = await confirm({
      title: '确认回滚',
      description: `确定要回滚参数 "${paramKey}" 到上一个版本吗？`,
      confirmText: '确认回滚',
      cancelText: '取消',
      variant: 'destructive'
    })
    if (!confirmed) {
      return
    }

    setRollingBack(paramKey)
    setError(null)

    try {
      const response = await fetch(
        `/api/strategy-instances/${instance.id}/params/${paramKey}/rollback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            changed_by: 'admin'
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        // 刷新历史记录
        await fetchHistory()
      } else {
        setError(data.message || '回滚失败')
      }
    } catch (error) {
      console.error('回滚失败:', error)
      setError('回滚失败')
    } finally {
      setRollingBack(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const renderValueChange = (oldValue: string | null, newValue: string) => {
    return (
      <div className="flex items-center gap-2">
        <code className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
          {oldValue || '(无)'}
        </code>
        <span className="text-muted-foreground">→</span>
        <code className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
          {newValue}
        </code>
      </div>
    )
  }

  // 按参数分组历史记录
  const groupedHistory = history.reduce((acc, record) => {
    if (!acc[record.param_key]) {
      acc[record.param_key] = []
    }
    acc[record.param_key].push(record)
    return acc
  }, {} as Record<string, StrategyParamHistory[]>)

  return (
    <>
    <ConfirmDialog />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>参数修改历史 - {instance.instance_name}</DialogTitle>
          <DialogDescription>
            查看参数的历史修改记录,并可以回滚到之前的版本
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mb-4" />
            <p>暂无参数修改历史</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([paramKey, records]) => (
              <div key={paramKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{paramKey}</h3>
                  <Badge>{records.length} 次修改</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">版本</TableHead>
                      <TableHead>修改内容</TableHead>
                      <TableHead>修改原因</TableHead>
                      <TableHead>修改人</TableHead>
                      <TableHead>修改时间</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant={index === 0 ? 'default' : 'outline'}>
                            v{record.version}
                            {index === 0 && ' (当前)'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderValueChange(record.old_value, record.new_value)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {record.change_reason || '(无)'}
                          </p>
                        </TableCell>
                        <TableCell>{record.changed_by}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(record.created_at)}
                        </TableCell>
                        <TableCell>
                          {index === 0 && records.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRollback(paramKey)}
                              disabled={rollingBack === paramKey}
                              className="gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              回滚
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
