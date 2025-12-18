'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { StrategyInstance, StrategyParamConfig, StrategyParamDefinition } from '@/lib/supabase'

interface InstanceParamsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: StrategyInstance
  onParamsUpdated?: () => void
}

interface ParamWithDefinition extends StrategyParamConfig {
  definition?: StrategyParamDefinition
}

export default function InstanceParamsDialog({
  open,
  onOpenChange,
  instance,
  onParamsUpdated
}: InstanceParamsDialogProps) {
  const [params, setParams] = useState<ParamWithDefinition[]>([])
  const [definitions, setDefinitions] = useState<StrategyParamDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changedParams, setChangedParams] = useState<Set<string>>(new Set())
  const [changeReason, setChangeReason] = useState('')
  const [changedBy, setChangedBy] = useState('admin')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchParams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 获取参数定义
      const defResponse = await fetch(`/api/strategies/${instance.strategy_id}/params`)
      const defData = await defResponse.json()

      // 获取当前参数值
      const paramsResponse = await fetch(`/api/strategy-instances/${instance.id}/params`)
      const paramsData = await paramsResponse.json()

      if (defData.success && paramsData.success) {
        setDefinitions(defData.data)

        // 合并参数定义和当前值
        const mergedParams: ParamWithDefinition[] = defData.data.map((def: StrategyParamDefinition) => {
          const currentValue = paramsData.data[def.param_key]
          return {
            id: '',
            instance_id: instance.id,
            param_key: def.param_key,
            param_value: currentValue !== undefined ? String(currentValue) : def.default_value,
            version: 0,
            changed_by: '',
            change_reason: null,
            is_active: true,
            created_at: '',
            param_name: def.param_name,
            param_type: def.param_type,
            description: def.description,
            definition: def
          }
        })

        setParams(mergedParams)
      }
    } catch (error) {
      console.error('获取参数失败:', error)
      setError('获取参数失败')
    } finally {
      setLoading(false)
    }
  }, [instance.id, instance.strategy_id])

  useEffect(() => {
    if (open) {
      fetchParams()
    }
  }, [open, fetchParams])

  const handleParamChange = (paramKey: string, value: string) => {
    setParams(params.map(p =>
      p.param_key === paramKey ? { ...p, param_value: value } : p
    ))
    setChangedParams(new Set(changedParams).add(paramKey))
    setError(null)
    setSuccess(null)
  }

  const validateParam = (param: ParamWithDefinition): string | null => {
    const def = param.definition
    if (!def) return null

    const value = param.param_value

    // 类型验证
    if (def.param_type === 'int') {
      const intValue = parseInt(value)
      if (isNaN(intValue)) return `${def.param_name} 必须是整数`
      if (def.min_value !== null && intValue < def.min_value) {
        return `${def.param_name} 不能小于 ${def.min_value}`
      }
      if (def.max_value !== null && intValue > def.max_value) {
        return `${def.param_name} 不能大于 ${def.max_value}`
      }
    } else if (def.param_type === 'float') {
      const floatValue = parseFloat(value)
      if (isNaN(floatValue)) return `${def.param_name} 必须是数字`
      if (def.min_value !== null && floatValue < def.min_value) {
        return `${def.param_name} 不能小于 ${def.min_value}`
      }
      if (def.max_value !== null && floatValue > def.max_value) {
        return `${def.param_name} 不能大于 ${def.max_value}`
      }
    } else if (def.param_type === 'bool') {
      if (value !== 'true' && value !== 'false') {
        return `${def.param_name} 必须是 true 或 false`
      }
    }

    // 枚举值验证
    if (def.allowed_values && def.allowed_values.length > 0) {
      if (!def.allowed_values.includes(value)) {
        return `${def.param_name} 必须是以下值之一: ${def.allowed_values.join(', ')}`
      }
    }

    return null
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    // 验证所有更改的参数
    const changedParamsList = params.filter(p => changedParams.has(p.param_key))
    for (const param of changedParamsList) {
      const validationError = validateParam(param)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (changedParamsList.length === 0) {
      setError('没有需要保存的更改')
      return
    }

    if (!changeReason.trim()) {
      setError('请填写修改原因')
      return
    }

    setSaving(true)

    try {
      // 批量更新参数
      const response = await fetch(`/api/strategy-instances/${instance.id}/params`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: changedParamsList.reduce((acc, p) => {
            acc[p.param_key] = p.param_value
            return acc
          }, {} as Record<string, string>),
          changed_by: changedBy,
          change_reason: changeReason
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`成功更新 ${changedParamsList.length} 个参数`)
        setChangedParams(new Set())
        setChangeReason('')
        onParamsUpdated?.()

        // 3秒后关闭对话框
        setTimeout(() => {
          onOpenChange(false)
        }, 3000)
      } else {
        setError(data.message || '保存失败')
      }
    } catch (error) {
      console.error('保存参数失败:', error)
      setError('保存参数失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = (paramKey: string) => {
    const param = params.find(p => p.param_key === paramKey)
    if (param?.definition) {
      handleParamChange(paramKey, param.definition.default_value)
    }
  }

  const renderParamInput = (param: ParamWithDefinition) => {
    const def = param.definition
    if (!def) return null

    const isChanged = changedParams.has(param.param_key)

    if (def.param_type === 'bool') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={param.param_value === 'true'}
            onCheckedChange={(checked) => handleParamChange(param.param_key, String(checked))}
          />
          <Label>{param.param_value === 'true' ? '是' : '否'}</Label>
        </div>
      )
    }

    if (def.allowed_values && def.allowed_values.length > 0) {
      return (
        <Select
          value={param.param_value}
          onValueChange={(value) => handleParamChange(param.param_key, value)}
        >
          <SelectTrigger className={isChanged ? 'border-yellow-500' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {def.allowed_values.map(value => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (def.param_type === 'string' && (!def.max_value || def.max_value > 100)) {
      return (
        <Textarea
          value={param.param_value}
          onChange={(e) => handleParamChange(param.param_key, e.target.value)}
          className={isChanged ? 'border-yellow-500' : ''}
          rows={3}
        />
      )
    }

    return (
      <Input
        type={def.param_type === 'int' || def.param_type === 'float' ? 'number' : 'text'}
        value={param.param_value}
        onChange={(e) => handleParamChange(param.param_key, e.target.value)}
        className={isChanged ? 'border-yellow-500' : ''}
        step={def.param_type === 'float' ? '0.01' : '1'}
      />
    )
  }

  // 按分类分组参数
  const groupedParams = params.reduce((acc, param) => {
    const category = param.definition?.category || '其他'
    if (!acc[category]) acc[category] = []
    acc[category].push(param)
    return acc
  }, {} as Record<string, ParamWithDefinition[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>参数配置 - {instance.instance_name}</DialogTitle>
          <DialogDescription>
            策略: {instance.strategy_display_name || instance.strategy_name}
            {changedParams.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {changedParams.size} 个参数已修改
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : (
          <div className="space-y-6">
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

            {Object.entries(groupedParams).map(([category, categoryParams]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                <div className="space-y-4">
                  {categoryParams.map(param => (
                    <div key={param.param_key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={param.param_key} className="flex items-center gap-2">
                          {param.param_name || param.param_key}
                          {param.definition?.is_required && (
                            <Badge variant="destructive" className="text-xs">必填</Badge>
                          )}
                          {param.definition?.unit && (
                            <span className="text-xs text-muted-foreground">({param.definition.unit})</span>
                          )}
                        </Label>
                        {changedParams.has(param.param_key) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReset(param.param_key)}
                            className="gap-1 h-6 text-xs"
                          >
                            <RotateCcw className="h-3 w-3" />
                            重置
                          </Button>
                        )}
                      </div>
                      {renderParamInput(param)}
                      {param.description && (
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      )}
                      {param.definition && (param.definition.min_value !== null || param.definition.max_value !== null) && (
                        <p className="text-xs text-muted-foreground">
                          范围: {param.definition.min_value ?? '-∞'} ~ {param.definition.max_value ?? '+∞'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Separator className="mt-6" />
              </div>
            ))}

            {changedParams.size > 0 && (
              <div className="space-y-2">
                <Label htmlFor="changed-by">修改人</Label>
                <Input
                  id="changed-by"
                  value={changedBy}
                  onChange={(e) => setChangedBy(e.target.value)}
                  placeholder="输入修改人"
                />

                <Label htmlFor="change-reason">修改原因 *</Label>
                <Textarea
                  id="change-reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="请说明为什么修改这些参数..."
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || changedParams.size === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : `保存 (${changedParams.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
