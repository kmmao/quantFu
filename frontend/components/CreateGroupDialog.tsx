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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated?: () => void
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
  onGroupCreated
}: CreateGroupDialogProps) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    account_id: '',
    group_name: '',
    description: '',
    total_capital: '',
    max_position_ratio: '1.0',
    max_risk_per_strategy: '0.2',
    allow_opposite_positions: true,
    position_conflict_mode: 'allow' as 'allow' | 'reject' | 'merge'
  })

  const handleCreate = async () => {
    setError(null)
    setSuccess(null)

    if (!formData.account_id.trim()) {
      setError('请输入账户ID')
      return
    }
    if (!formData.group_name.trim()) {
      setError('请输入策略组名称')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/strategy-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_capital: formData.total_capital ? parseFloat(formData.total_capital) : null,
          max_position_ratio: parseFloat(formData.max_position_ratio),
          max_risk_per_strategy: parseFloat(formData.max_risk_per_strategy)
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('策略组创建成功!')
        onGroupCreated?.()
        setTimeout(() => onOpenChange(false), 2000)
      } else {
        setError(data.message || '创建失败')
      }
    } catch (error) {
      setError('创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建策略组</DialogTitle>
          <DialogDescription>
            配置新的策略组,管理多个策略实例的资源和协调
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-name">策略组名称 *</Label>
              <Input
                id="group-name"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-capital">总资金(元)</Label>
              <Input
                id="total-capital"
                type="number"
                value={formData.total_capital}
                onChange={(e) => setFormData({ ...formData, total_capital: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-position">最大持仓比例</Label>
              <Input
                id="max-position"
                type="number"
                step="0.1"
                max="1"
                min="0"
                value={formData.max_position_ratio}
                onChange={(e) => setFormData({ ...formData, max_position_ratio: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">0-1之间</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-risk">单策略最大风险</Label>
              <Input
                id="max-risk"
                type="number"
                step="0.1"
                max="1"
                min="0"
                value={formData.max_risk_per_strategy}
                onChange={(e) => setFormData({ ...formData, max_risk_per_strategy: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">0-1之间</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <Label>允许对冲持仓</Label>
              <p className="text-xs text-muted-foreground">是否允许不同策略持有相反方向的仓位</p>
            </div>
            <Switch
              checked={formData.allow_opposite_positions}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_opposite_positions: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conflict-mode">冲突处理模式</Label>
            <Select
              value={formData.position_conflict_mode}
              onValueChange={(value: 'allow' | 'reject' | 'merge') =>
                setFormData({ ...formData, position_conflict_mode: value })
              }
            >
              <SelectTrigger id="conflict-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">允许 - 允许冲突信号执行</SelectItem>
                <SelectItem value="reject">拒绝 - 拒绝冲突信号</SelectItem>
                <SelectItem value="merge">合并 - 合并冲突信号</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? '创建中...' : '创建策略组'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
