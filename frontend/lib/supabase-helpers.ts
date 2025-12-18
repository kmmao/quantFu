import { supabase, type Account, type Contract, type Position, type StrategyInstance } from './supabase'

/**
 * Supabase 数据访问助手
 * 提供常用的数据查询和操作方法
 */

// ==================== 账户相关 ====================

/**
 * 获取所有活跃账户
 */
export async function getActiveAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Account[]
}

/**
 * 根据 ID 获取账户
 */
export async function getAccountById(accountId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error) throw error
  return data as Account
}

/**
 * 创建新账户
 */
export async function createAccount(account: {
  account_name: string
  polar_account_id: string
  broker: string
  initial_balance: number
  status?: string
}) {
  const { data, error } = await supabase
    .from('accounts')
    .insert([{
      ...account,
      status: account.status || 'active'
    }])
    .select()
    .single()

  if (error) throw error
  return data as Account
}

// ==================== 合约相关 ====================

/**
 * 获取所有主力合约
 */
export async function getMainContracts() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('is_main', true)
    .order('variety_code', { ascending: true })

  if (error) throw error
  return data as Contract[]
}

/**
 * 根据品种代码获取合约
 */
export async function getContractsByVariety(varietyCode: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('variety_code', varietyCode)
    .order('expire_date', { ascending: true })

  if (error) throw error
  return data as Contract[]
}

/**
 * 搜索合约
 */
export async function searchContracts(query: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .or(`variety_name.ilike.%${query}%,variety_code.ilike.%${query}%,polar_symbol.ilike.%${query}%`)
    .limit(20)

  if (error) throw error
  return data as Contract[]
}

// ==================== 持仓相关 ====================

/**
 * 获取账户的所有持仓
 */
export async function getPositionsByAccount(accountId: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('account_id', accountId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as Position[]
}

/**
 * 获取持仓汇总视图
 */
export async function getPositionsSummary(accountId?: string) {
  let query = supabase
    .from('v_positions_summary')
    .select('*')
    .order('total_profit', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ==================== 策略相关 ====================

/**
 * 获取运行中的策略实例
 */
export async function getRunningStrategies(accountId?: string) {
  let query = supabase
    .from('strategy_instances')
    .select(`
      *,
      strategies (
        name,
        display_name,
        category
      )
    `)
    .eq('status', 'running')
    .order('created_at', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) throw error
  return data as StrategyInstance[]
}

/**
 * 更新策略实例状态
 */
export async function updateStrategyStatus(
  instanceId: string,
  status: 'stopped' | 'running' | 'paused' | 'error'
) {
  const { data, error } = await supabase
    .from('strategy_instances')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', instanceId)
    .select()
    .single()

  if (error) throw error
  return data as StrategyInstance
}

// ==================== 实时订阅 ====================

/**
 * 订阅持仓变化
 */
export function subscribeToPositions(
  accountId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`positions-${accountId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'positions',
        filter: `account_id=eq.${accountId}`
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * 订阅策略信号
 */
export function subscribeToStrategySignals(
  instanceId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`signals-${instanceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'strategy_signals',
        filter: `instance_id=eq.${instanceId}`
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * 订阅表的所有变化
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`${tableName}-all-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ==================== 工具函数 ====================

/**
 * 批量插入数据
 */
export async function bulkInsert<T>(
  tableName: string,
  records: T[]
) {
  const { data, error } = await supabase
    .from(tableName)
    .insert(records)
    .select()

  if (error) throw error
  return data
}

/**
 * 执行自定义 SQL 查询 (通过 RPC)
 * 注意: 需要在数据库中预先创建对应的函数
 */
export async function executeRPC<T>(
  functionName: string,
  params?: Record<string, any>
) {
  const { data, error } = await supabase
    .rpc(functionName, params)

  if (error) throw error
  return data as T
}

/**
 * 分页查询
 */
export async function getPaginatedData<T>(
  tableName: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: string = 'created_at',
  ascending: boolean = false
) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .order(orderBy, { ascending })
    .range(from, to)

  if (error) throw error

  return {
    data: data as T[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}
