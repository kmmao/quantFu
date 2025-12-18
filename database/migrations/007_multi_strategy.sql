-- =====================================================
-- 多策略并行管理数据库迁移
-- =====================================================

-- 1. 策略组表
CREATE TABLE IF NOT EXISTS strategy_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(50) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- 资源分配
    total_capital DECIMAL(15,2),                    -- 总资金
    max_position_ratio DECIMAL(5,2) DEFAULT 1.0,    -- 最大持仓比例
    max_risk_per_strategy DECIMAL(5,2) DEFAULT 0.2, -- 单策略最大风险比例

    -- 协调设置
    allow_opposite_positions BOOLEAN DEFAULT true,   -- 是否允许对冲持仓
    position_conflict_mode VARCHAR(20) DEFAULT 'allow', -- 冲突模式(allow/reject/merge)

    -- 状态
    is_active BOOLEAN DEFAULT true,

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT strategy_group_unique UNIQUE (account_id, group_name)
);

-- 2. 策略组成员表
CREATE TABLE IF NOT EXISTS strategy_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES strategy_groups(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES strategy_instances(id) ON DELETE CASCADE,

    -- 资源配额
    capital_allocation DECIMAL(15,2),               -- 分配资金
    position_limit INTEGER,                         -- 持仓限制
    priority INTEGER DEFAULT 0,                     -- 优先级(数字越大优先级越高)

    -- 状态
    is_active BOOLEAN DEFAULT true,

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT group_member_unique UNIQUE (group_id, instance_id)
);

-- 3. 策略性能表
CREATE TABLE IF NOT EXISTS strategy_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_instances(id) ON DELETE CASCADE,
    date DATE NOT NULL,                             -- 统计日期

    -- 交易统计
    total_trades INTEGER DEFAULT 0,                 -- 交易次数
    winning_trades INTEGER DEFAULT 0,               -- 盈利次数
    losing_trades INTEGER DEFAULT 0,                -- 亏损次数

    -- 盈亏统计
    gross_profit DECIMAL(15,2) DEFAULT 0,           -- 总盈利
    gross_loss DECIMAL(15,2) DEFAULT 0,             -- 总亏损
    net_profit DECIMAL(15,2) DEFAULT 0,             -- 净盈利
    commission DECIMAL(15,2) DEFAULT 0,             -- 手续费

    -- 性能指标
    win_rate DECIMAL(5,2),                          -- 胜率
    profit_factor DECIMAL(8,2),                     -- 盈亏比
    sharpe_ratio DECIMAL(8,4),                      -- 夏普比率
    max_drawdown DECIMAL(15,2),                     -- 最大回撤

    -- 仓位统计
    avg_position_size DECIMAL(10,2),                -- 平均持仓量
    max_position_size INTEGER,                      -- 最大持仓量
    position_holding_time_avg INTEGER,              -- 平均持仓时间(秒)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT performance_unique UNIQUE (instance_id, date)
);

-- 4. 策略信号表
CREATE TABLE IF NOT EXISTS strategy_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_instances(id) ON DELETE CASCADE,

    -- 信号信息
    symbol VARCHAR(50) NOT NULL,                    -- 合约代码
    signal_type VARCHAR(20) NOT NULL,               -- 信号类型(open/close/reverse)
    direction VARCHAR(10) NOT NULL,                 -- 方向(long/short)
    volume INTEGER NOT NULL,                        -- 数量
    price DECIMAL(12,2),                            -- 价格

    -- 信号强度
    confidence DECIMAL(5,2) DEFAULT 1.0,            -- 信号置信度(0-1)
    strength VARCHAR(20) DEFAULT 'medium',          -- 信号强度(weak/medium/strong)

    -- 状态
    status VARCHAR(20) DEFAULT 'pending',           -- 状态(pending/executed/rejected/expired)
    rejection_reason TEXT,                          -- 拒绝原因

    -- 执行信息
    executed_at TIMESTAMPTZ,
    execution_price DECIMAL(12,2),
    execution_volume INTEGER,

    -- 信号有效期
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 策略冲突记录表
CREATE TABLE IF NOT EXISTS strategy_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES strategy_groups(id) ON DELETE CASCADE,

    -- 冲突策略
    instance_id_1 UUID NOT NULL REFERENCES strategy_instances(id),
    instance_id_2 UUID NOT NULL REFERENCES strategy_instances(id),

    -- 冲突信息
    conflict_type VARCHAR(20) NOT NULL,             -- 冲突类型(opposite_direction/exceed_limit/same_symbol)
    symbol VARCHAR(50) NOT NULL,
    description TEXT,

    -- 解决方案
    resolution VARCHAR(20),                         -- 解决方式(allow/reject/merge/priority)
    resolved BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    CONSTRAINT no_self_conflict CHECK (instance_id_1 != instance_id_2)
);

-- 6. 资源使用记录表
CREATE TABLE IF NOT EXISTS resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES strategy_groups(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- 资源使用情况
    total_capital_used DECIMAL(15,2),               -- 已使用资金
    total_position INTEGER,                         -- 总持仓量
    total_margin_used DECIMAL(15,2),                -- 已使用保证金

    -- 风险指标
    total_risk DECIMAL(15,2),                       -- 总风险
    risk_utilization DECIMAL(5,2),                  -- 风险利用率

    -- 各策略分布(JSON)
    strategy_breakdown JSONB
);

-- =====================================================
-- 视图
-- =====================================================

-- 策略组汇总视图
CREATE OR REPLACE VIEW v_strategy_group_summary AS
SELECT
    sg.*,
    COUNT(DISTINCT sgm.instance_id) as member_count,
    COUNT(DISTINCT si.id) FILTER (WHERE si.status = 'running') as running_count,
    SUM(sgm.capital_allocation) as allocated_capital,
    COALESCE(SUM(sp.net_profit), 0) as total_profit
FROM strategy_groups sg
LEFT JOIN strategy_group_members sgm ON sg.id = sgm.group_id AND sgm.is_active = true
LEFT JOIN strategy_instances si ON sgm.instance_id = si.id
LEFT JOIN strategy_performance sp ON si.id = sp.instance_id AND sp.date = CURRENT_DATE
WHERE sg.is_active = true
GROUP BY sg.id;

-- 策略实例详情视图
CREATE OR REPLACE VIEW v_strategy_instance_detail AS
SELECT
    si.*,
    s.name as strategy_name,
    s.display_name as strategy_display_name,
    s.category as strategy_category,
    sgm.group_id,
    sg.group_name,
    sgm.capital_allocation,
    sgm.position_limit,
    sgm.priority,
    sp.win_rate,
    sp.net_profit as today_profit,
    sp.total_trades as today_trades
FROM strategy_instances si
JOIN strategies s ON si.strategy_id = s.id
LEFT JOIN strategy_group_members sgm ON si.id = sgm.instance_id AND sgm.is_active = true
LEFT JOIN strategy_groups sg ON sgm.group_id = sg.id
LEFT JOIN strategy_performance sp ON si.id = sp.instance_id AND sp.date = CURRENT_DATE;

-- 待处理信号视图
CREATE OR REPLACE VIEW v_pending_signals AS
SELECT
    ss.*,
    si.instance_name,
    si.account_id,
    s.name as strategy_name,
    EXTRACT(EPOCH FROM (NOW() - ss.created_at)) as age_seconds
FROM strategy_signals ss
JOIN strategy_instances si ON ss.instance_id = si.id
JOIN strategies s ON si.strategy_id = s.id
WHERE ss.status = 'pending'
  AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
ORDER BY ss.created_at;

-- 策略性能排名视图
CREATE OR REPLACE VIEW v_strategy_performance_ranking AS
SELECT
    sp.*,
    si.instance_name,
    si.account_id,
    s.name as strategy_name,
    RANK() OVER (PARTITION BY sp.date ORDER BY sp.net_profit DESC) as profit_rank,
    RANK() OVER (PARTITION BY sp.date ORDER BY sp.win_rate DESC) as winrate_rank,
    RANK() OVER (PARTITION BY sp.date ORDER BY sp.sharpe_ratio DESC) as sharpe_rank
FROM strategy_performance sp
JOIN strategy_instances si ON sp.instance_id = si.id
JOIN strategies s ON si.strategy_id = s.id
WHERE sp.date >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_strategy_groups_account ON strategy_groups(account_id);
CREATE INDEX IF NOT EXISTS idx_strategy_groups_active ON strategy_groups(is_active);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON strategy_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_instance ON strategy_group_members(instance_id);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON strategy_group_members(is_active);

CREATE INDEX IF NOT EXISTS idx_performance_instance ON strategy_performance(instance_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON strategy_performance(date DESC);

CREATE INDEX IF NOT EXISTS idx_signals_instance ON strategy_signals(instance_id);
CREATE INDEX IF NOT EXISTS idx_signals_status ON strategy_signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created ON strategy_signals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conflicts_group ON strategy_conflicts(group_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON strategy_conflicts(resolved);

CREATE INDEX IF NOT EXISTS idx_resource_usage_group ON resource_usage(group_id);
CREATE INDEX IF NOT EXISTS idx_resource_usage_timestamp ON resource_usage(timestamp DESC);

-- =====================================================
-- 触发器
-- =====================================================

-- 更新 updated_at
CREATE TRIGGER update_strategy_groups_updated_at BEFORE UPDATE ON strategy_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON strategy_group_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_updated_at BEFORE UPDATE ON strategy_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 信号过期自动更新
CREATE OR REPLACE FUNCTION expire_old_signals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE strategy_signals
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_signals
    AFTER INSERT OR UPDATE ON strategy_signals
    FOR EACH STATEMENT
    EXECUTE FUNCTION expire_old_signals();

-- =====================================================
-- 函数
-- =====================================================

-- 检查策略冲突
CREATE OR REPLACE FUNCTION check_strategy_conflicts(
    p_group_id UUID,
    p_instance_id UUID,
    p_symbol VARCHAR(50),
    p_direction VARCHAR(10),
    p_volume INTEGER
) RETURNS TABLE (
    has_conflict BOOLEAN,
    conflict_type VARCHAR(20),
    conflicting_instance_id UUID,
    description TEXT
) AS $$
BEGIN
    -- 检查是否有对冲持仓
    RETURN QUERY
    SELECT
        true as has_conflict,
        'opposite_direction'::VARCHAR(20) as conflict_type,
        sgm2.instance_id as conflicting_instance_id,
        'Strategy ' || si.instance_name || ' has opposite position' as description
    FROM strategy_group_members sgm1
    JOIN strategy_groups sg ON sgm1.group_id = sg.id
    JOIN strategy_group_members sgm2 ON sg.id = sgm2.group_id
    JOIN strategy_instances si ON sgm2.instance_id = si.id
    JOIN positions p ON si.account_id = p.account_id AND p.symbol = p_symbol
    WHERE sgm1.group_id = p_group_id
      AND sgm1.instance_id = p_instance_id
      AND sgm2.instance_id != p_instance_id
      AND sgm1.is_active = true
      AND sgm2.is_active = true
      AND NOT sg.allow_opposite_positions
      AND (
          (p_direction = 'long' AND p.short_position > 0) OR
          (p_direction = 'short' AND p.long_position > 0)
      )
    LIMIT 1;

    -- 如果没有冲突
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::UUID, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE strategy_groups IS '策略组表';
COMMENT ON TABLE strategy_group_members IS '策略组成员表';
COMMENT ON TABLE strategy_performance IS '策略性能表';
COMMENT ON TABLE strategy_signals IS '策略信号表';
COMMENT ON TABLE strategy_conflicts IS '策略冲突记录表';
COMMENT ON TABLE resource_usage IS '资源使用记录表';
