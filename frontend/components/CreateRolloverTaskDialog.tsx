'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface CreateRolloverTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
}

export default function CreateRolloverTaskDialog({
  open,
  onOpenChange,
  onTaskCreated
}: CreateRolloverTaskDialogProps) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    account_id: '',
    old_symbol: '',
    new_symbol: '',
    trigger_type: 'main_switch' as 'main_switch' | 'expiry',
    old_position: '',
    target_position: ''
  })

  const handleCreate = async () => {
    setError(null)
    setSuccess(null)

    // 验证
    if (!formData.account_id.trim()) {
      setError('请输入账户ID')
      return
    }
    if (!formData.old_symbol.trim()) {
      setError('请输入旧合约')
      return
    }
    if (!formData.new_symbol.trim()) {
      setError('请输入新合约')
      return
    }
    if (!formData.old_position || parseInt(formData.old_position) <= 0) {
      setError('请输入有效的旧持仓数量')
      return
    }
    if (!formData.target_position || parseInt(formData.target_position) <= 0) {
      setError('请输入有效的目标手数')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/rollover/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: formData.account_id,
          old_symbol: formData.old_symbol.toUpperCase(),
          new_symbol: formData.new_symbol.toUpperCase(),
          trigger_type: formData.trigger_type,
          old_position: parseInt(formData.old_position),
          target_position: parseInt(formData.target_position)
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('换月任务创建成功!')

        // 重置表单
        setFormData({
          account_id: '',
          old_symbol: '',
          new_symbol: '',
          trigger_type: 'main_switch',
          old_position: '',
          target_position: ''
        })

        onTaskCreated?.()

        // 3秒后关闭对话框
        setTimeout(() => {
          onOpenChange(false)
        }, 3000)
      } else {
        setError(data.message || '创建失败')
      }
    } catch (error) {
      console.error('创建任务失败:', error)
      setError('创建任务失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建换月任务</DialogTitle>
          <DialogDescription>
            手动创建合约换月任务,系统将按配置执行换月操作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-id">账户ID *</Label>
              <Input
                id="account-id"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                placeholder="例如: 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger-type">触发方式 *</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value: 'main_switch' | 'expiry') =>
                  setFormData({ ...formData, trigger_type: value })
                }
              >
                <SelectTrigger id="trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main_switch">主力切换</SelectItem>
                  <SelectItem value="expiry">到期触发</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="old-symbol">旧合约代码 *</Label>
              <Input
                id="old-symbol"
                value={formData.old_symbol}
                onChange={(e) => setFormData({ ...formData, old_symbol: e.target.value })}
                placeholder="例如: IF2412"
              />
              <p className="text-xs text-muted-foreground">
                当前持有的合约
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-symbol">新合约代码 *</Label>
              <Input
                id="new-symbol"
                value={formData.new_symbol}
                onChange={(e) => setFormData({ ...formData, new_symbol: e.target.value })}
                placeholder="例如: IF2501"
              />
              <p className="text-xs text-muted-foreground">
                要换到的合约
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="old-position">旧持仓手数 *</Label>
              <Input
                id="old-position"
                type="number"
                value={formData.old_position}
                onChange={(e) => setFormData({ ...formData, old_position: e.target.value })}
                placeholder="例如: 10"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                当前持有的手数
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-position">目标手数 *</Label>
              <Input
                id="target-position"
                type="number"
                value={formData.target_position}
                onChange={(e) => setFormData({ ...formData, target_position: e.target.value })}
                placeholder="例如: 10"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                换月后的目标手数
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">换月流程说明</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>系统将平掉旧合约的持仓</li>
              <li>开立新合约的持仓</li>
              <li>记录换月成本和执行情况</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              ⚠️ 注意: 当前为模拟执行模式,实际交易需要接入极星平台API
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? '创建中...' : '创建任务'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
