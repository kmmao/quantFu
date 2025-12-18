'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { StrategyGroup, StrategyInstance } from '@/lib/supabase'

interface GroupMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: StrategyGroup
  onMembersUpdated?: () => void
}

export default function GroupMembersDialog({
  open,
  onOpenChange,
  group,
  onMembersUpdated
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<any[]>([])
  const [availableInstances, setAvailableInstances] = useState<StrategyInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const [newMember, setNewMember] = useState({
    instance_id: '',
    capital_allocation: '',
    position_limit: '',
    priority: '0'
  })

  const fetchMembers = async () => {
    setLoading(true)
    try {
      // Note: 需要添加获取组成员的API
      // 暂时使用空数组
      setMembers([])
    } catch (error) {
      console.error('获取成员失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableInstances = useCallback(async () => {
    try {
      const response = await fetch(`/api/strategy-instances?account_id=${group.account_id}`)
      const data = await response.json()
      if (data.success) {
        setAvailableInstances(data.data)
      }
    } catch (error) {
      console.error('获取策略实例失败:', error)
    }
  }, [group.account_id])

  useEffect(() => {
    if (open) {
      fetchMembers()
      fetchAvailableInstances()
    }
  }, [open, group.id, fetchAvailableInstances])

  const handleAddMember = async () => {
    if (!newMember.instance_id) {
      alert('请选择策略实例')
      return
    }

    setAdding(true)
    try {
      const response = await fetch(`/api/strategy-groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: newMember.instance_id,
          capital_allocation: newMember.capital_allocation ? parseFloat(newMember.capital_allocation) : null,
          position_limit: newMember.position_limit ? parseInt(newMember.position_limit) : null,
          priority: parseInt(newMember.priority)
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchMembers()
        onMembersUpdated?.()
        setNewMember({ instance_id: '', capital_allocation: '', position_limit: '', priority: '0' })
      } else {
        alert('添加失败: ' + data.message)
      }
    } catch (error) {
      alert('添加失败')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (instanceId: string) => {
    if (!confirm('确定要移除该成员吗？')) return

    try {
      const response = await fetch(`/api/strategy-groups/${group.id}/members/${instanceId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        fetchMembers()
        onMembersUpdated?.()
      }
    } catch (error) {
      alert('移除失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>成员管理 - {group.group_name}</DialogTitle>
          <DialogDescription>
            添加或移除策略实例,配置资源分配
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 添加成员表单 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <h3 className="font-semibold">添加新成员</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>策略实例 *</Label>
                <Select
                  value={newMember.instance_id}
                  onValueChange={(value) => setNewMember({ ...newMember, instance_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择实例" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstances.map(instance => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.instance_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>分配资金</Label>
                <Input
                  type="number"
                  value={newMember.capital_allocation}
                  onChange={(e) => setNewMember({ ...newMember, capital_allocation: e.target.value })}
                  placeholder="选填"
                />
              </div>

              <div className="space-y-2">
                <Label>持仓限制</Label>
                <Input
                  type="number"
                  value={newMember.position_limit}
                  onChange={(e) => setNewMember({ ...newMember, position_limit: e.target.value })}
                  placeholder="选填"
                />
              </div>

              <div className="space-y-2">
                <Label>优先级</Label>
                <Input
                  type="number"
                  value={newMember.priority}
                  onChange={(e) => setNewMember({ ...newMember, priority: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddMember} disabled={adding} className="gap-2">
              <Plus className="h-4 w-4" />
              {adding ? '添加中...' : '添加成员'}
            </Button>
          </div>

          {/* 成员列表 */}
          <div>
            <h3 className="font-semibold mb-3">当前成员</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p>暂无成员</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>实例名称</TableHead>
                    <TableHead>策略</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">分配资金</TableHead>
                    <TableHead className="text-right">持仓限制</TableHead>
                    <TableHead className="text-right">优先级</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.instance_name}</TableCell>
                      <TableCell>{member.strategy_name}</TableCell>
                      <TableCell>
                        <Badge>{member.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {member.capital_allocation ? member.capital_allocation.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.position_limit || '-'}
                      </TableCell>
                      <TableCell className="text-right">{member.priority}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member.instance_id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          移除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
