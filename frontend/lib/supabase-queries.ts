import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getActiveAccounts,
  getAccountById,
  createAccount,
  getMainContracts,
  getContractsByVariety,
  getPositionsByAccount,
  getPositionsSummary,
  getRunningStrategies,
  updateStrategyStatus,
} from './supabase-helpers'

/**
 * React Query Hooks for Supabase
 * 使用 TanStack Query 管理服务端状态
 */

// ==================== 账户 Hooks ====================

/**
 * 获取活跃账户列表
 */
export function useActiveAccounts() {
  return useQuery({
    queryKey: ['accounts', 'active'],
    queryFn: getActiveAccounts,
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

/**
 * 获取单个账户详情
 */
export function useAccount(accountId: string | null) {
  return useQuery({
    queryKey: ['accounts', accountId],
    queryFn: () => accountId ? getAccountById(accountId) : null,
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 创建账户 Mutation
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      // 创建成功后刷新账户列表
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

// ==================== 合约 Hooks ====================

/**
 * 获取主力合约列表
 */
export function useMainContracts() {
  return useQuery({
    queryKey: ['contracts', 'main'],
    queryFn: getMainContracts,
    staleTime: 10 * 60 * 1000, // 10分钟
  })
}

/**
 * 根据品种代码获取合约
 */
export function useContractsByVariety(varietyCode: string | null) {
  return useQuery({
    queryKey: ['contracts', 'variety', varietyCode],
    queryFn: () => varietyCode ? getContractsByVariety(varietyCode) : [],
    enabled: !!varietyCode,
    staleTime: 10 * 60 * 1000,
  })
}

// ==================== 持仓 Hooks ====================

/**
 * 获取账户持仓
 */
export function usePositions(accountId: string | null) {
  return useQuery({
    queryKey: ['positions', accountId],
    queryFn: () => accountId ? getPositionsByAccount(accountId) : [],
    enabled: !!accountId,
    refetchInterval: 5000, // 每5秒自动刷新
  })
}

/**
 * 获取持仓汇总
 */
export function usePositionsSummary(accountId?: string) {
  return useQuery({
    queryKey: ['positions', 'summary', accountId],
    queryFn: () => getPositionsSummary(accountId),
    refetchInterval: 5000,
  })
}

// ==================== 策略 Hooks ====================

/**
 * 获取运行中的策略
 */
export function useRunningStrategies(accountId?: string) {
  return useQuery({
    queryKey: ['strategies', 'running', accountId],
    queryFn: () => getRunningStrategies(accountId),
    refetchInterval: 10000, // 每10秒刷新
  })
}

/**
 * 更新策略状态 Mutation
 */
export function useUpdateStrategyStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ instanceId, status }: {
      instanceId: string
      status: 'stopped' | 'running' | 'paused' | 'error'
    }) => updateStrategyStatus(instanceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}

// ==================== 通用 Hooks ====================

/**
 * 通用表查询 Hook
 */
export function useTableData<T>(
  tableName: string,
  options?: {
    refetchInterval?: number
    enabled?: boolean
  }
) {
  return useQuery<T[]>({
    queryKey: [tableName],
    queryFn: async () => {
      const { supabase } = await import('./supabase')
      const { data, error } = await supabase
        .from(tableName)
        .select('*')

      if (error) throw error
      return data as T[]
    },
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled,
  })
}
