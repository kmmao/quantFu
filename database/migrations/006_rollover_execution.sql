-- =====================================================
-- 换月自动执行数据库迁移
-- =====================================================

-- 1. 换月配置表
CREATE TABLE IF NOT EXISTS rollover_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(50) NOT NULL,
    variety_code VARCHAR(10) NOT NULL,                -- 品种代码(如TA, I)
    exchange VARCHAR(20) NOT NULL,                    -- 交易所代码

    -- 换月策略
    rollover_strategy VARCHAR(20) DEFAULT 'auto',    -- 换月策略(auto/manual/threshold)
    rollover_threshold DECIMAL(8,4) DEFAULT 0.7,     -- 换月阈值(换月指数)

    -- 换月时机
    days_before_expiry INTEGER DEFAULT 7,            -- 到期前多少天换月
    trigger_on_main_switch BOOLEAN DEFAULT true,     -- 主力切换时触发

    -- 执行方式
    auto_execute BOOLEAN DEFAULT false,              -- 是否自动执行
    rollover_ratio DECIMAL(5,2) DEFAULT 1.0,         -- 换月比例(0-1)

    -- 价格控制
    price_mode VARCHAR(20) DEFAULT 'market',         -- 价格模式(market/limit/optimal)
    price_slippage DECIMAL(8,4),                     -- 价格滑点容忍度

    -- 状态
    is_enabled BOOLEAN DEFAULT true,                 -- 是否启用

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT rollover_config_unique UNIQUE (account_id, exchange, variety_code)
);

-- 2. 换月任务表
CREATE TABLE IF NOT EXISTS rollover_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES rollover_configs(id) ON DELETE CASCADE,
    account_id VARCHAR(50) NOT NULL,

    -- 合约信息
    old_symbol VARCHAR(50) NOT NULL,                 -- 旧合约
    new_symbol VARCHAR(50) NOT NULL,                 -- 新合约
    variety_name VARCHAR(50) NOT NULL,

    -- 持仓信息
    direction VARCHAR(10) NOT NULL,                  -- 持仓方向(long/short)
    old_position INTEGER NOT NULL,                   -- 旧合约持仓量
    rollover_volume INTEGER NOT NULL,                -- 计划换月数量

    -- 触发信息
    trigger_type VARCHAR(20) NOT NULL,               -- 触发类型(main_switch/expiry/manual)
    trigger_time TIMESTAMPTZ DEFAULT NOW(),
    rollover_index DECIMAL(8,4),                     -- 触发时的换月指数

    -- 执行状态
    status VARCHAR(20) DEFAULT 'pending',            -- 状态(pending/executing/completed/failed/cancelled)
    execution_mode VARCHAR(20) DEFAULT 'auto',       -- 执行模式(auto/manual)

    -- 执行结果
    close_volume INTEGER DEFAULT 0,                  -- 已平仓数量
    open_volume INTEGER DEFAULT 0,                   -- 已开仓数量
    close_avg_price DECIMAL(12,2),                   -- 平仓均价
    open_avg_price DECIMAL(12,2),                    -- 开仓均价

    -- 成本和盈亏
    close_cost DECIMAL(15,2) DEFAULT 0,              -- 平仓成本(手续费)
    open_cost DECIMAL(15,2) DEFAULT 0,               -- 开仓成本(手续费)
    price_diff DECIMAL(12,2),                        -- 价差(新合约价格-旧合约价格)
    rollover_cost DECIMAL(15,2),                     -- 换月总成本

    -- 时间记录
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_duration_ms INTEGER,

    -- 错误信息
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 换月执行记录表
CREATE TABLE IF NOT EXISTS rollover_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES rollover_tasks(id) ON DELETE CASCADE,
    step_type VARCHAR(20) NOT NULL,                  -- 步骤类型(close/open)

    -- 执行信息
    symbol VARCHAR(50) NOT NULL,                     -- 合约代码
    direction VARCHAR(10) NOT NULL,                  -- 方向
    volume INTEGER NOT NULL,                         -- 数量
    price DECIMAL(12,2) NOT NULL,                    -- 价格

    -- 订单信息
    polar_order_id VARCHAR(100),                     -- 极星订单ID
    order_status VARCHAR(20),                        -- 订单状态

    -- 成本
    commission DECIMAL(10,2) DEFAULT 0,              -- 手续费

    -- 时间
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 换月统计表
CREATE TABLE IF NOT EXISTS rollover_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(50) NOT NULL,
    variety_code VARCHAR(10) NOT NULL,
    year_month VARCHAR(7) NOT NULL,                  -- 统计月份(YYYY-MM)

    -- 换月次数
    total_rollovers INTEGER DEFAULT 0,               -- 总换月次数
    auto_rollovers INTEGER DEFAULT 0,                -- 自动换月次数
    manual_rollovers INTEGER DEFAULT 0,              -- 手动换月次数

    -- 成本统计
    total_cost DECIMAL(15,2) DEFAULT 0,              -- 总成本
    avg_cost DECIMAL(15,2) DEFAULT 0,                -- 平均成本

    -- 成功率
    success_count INTEGER DEFAULT 0,                 -- 成功次数
    failed_count INTEGER DEFAULT 0,                  -- 失败次数
    success_rate DECIMAL(5,2),                       -- 成功率

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT rollover_stats_unique UNIQUE (account_id, variety_code, year_month)
);

-- =====================================================
-- 视图
-- =====================================================

-- 待执行换月任务视图
CREATE OR REPLACE VIEW v_pending_rollover_tasks AS
SELECT
    rt.*,
    rc.auto_execute,
    rc.rollover_ratio,
    rc.price_mode,
    EXTRACT(EPOCH FROM (NOW() - rt.trigger_time)) / 3600 as hours_since_trigger
FROM rollover_tasks rt
JOIN rollover_configs rc ON rt.config_id = rc.id
WHERE rt.status = 'pending'
ORDER BY rt.trigger_time;

-- 换月任务汇总视图
CREATE OR REPLACE VIEW v_rollover_task_summary AS
SELECT
    rt.id,
    rt.account_id,
    rt.variety_name,
    rt.old_symbol,
    rt.new_symbol,
    rt.direction,
    rt.old_position,
    rt.rollover_volume,
    rt.close_volume,
    rt.open_volume,
    rt.status,
    rt.trigger_type,
    rt.rollover_cost,
    rt.trigger_time,
    rt.completed_at,
    rt.error_message,
    CASE
        WHEN rt.status = 'completed' THEN
            ROUND((rt.close_volume::DECIMAL / rt.rollover_volume) * 100, 2)
        ELSE NULL
    END as completion_rate
FROM rollover_tasks rt
ORDER BY rt.trigger_time DESC;

-- 换月配置汇总视图
CREATE OR REPLACE VIEW v_rollover_configs_summary AS
SELECT
    rc.*,
    COUNT(rt.id) as total_tasks,
    COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN rt.status = 'failed' THEN 1 END) as failed_tasks
FROM rollover_configs rc
LEFT JOIN rollover_tasks rt ON rc.id = rt.config_id
GROUP BY rc.id;

-- =====================================================
-- 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rollover_configs_account ON rollover_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_rollover_configs_variety ON rollover_configs(exchange, variety_code);
CREATE INDEX IF NOT EXISTS idx_rollover_configs_enabled ON rollover_configs(is_enabled);

CREATE INDEX IF NOT EXISTS idx_rollover_tasks_config ON rollover_tasks(config_id);
CREATE INDEX IF NOT EXISTS idx_rollover_tasks_account ON rollover_tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_rollover_tasks_status ON rollover_tasks(status);
CREATE INDEX IF NOT EXISTS idx_rollover_tasks_trigger_time ON rollover_tasks(trigger_time DESC);

CREATE INDEX IF NOT EXISTS idx_rollover_execs_task ON rollover_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_rollover_execs_executed ON rollover_executions(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rollover_stats_account ON rollover_statistics(account_id);
CREATE INDEX IF NOT EXISTS idx_rollover_stats_month ON rollover_statistics(year_month);

-- =====================================================
-- 触发器
-- =====================================================

-- 更新 updated_at
CREATE TRIGGER update_rollover_configs_updated_at BEFORE UPDATE ON rollover_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rollover_stats_updated_at BEFORE UPDATE ON rollover_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 换月任务完成时更新统计
CREATE OR REPLACE FUNCTION update_rollover_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 更新或插入统计数据
        INSERT INTO rollover_statistics (
            account_id,
            variety_code,
            year_month,
            total_rollovers,
            auto_rollovers,
            manual_rollovers,
            total_cost,
            success_count
        )
        VALUES (
            NEW.account_id,
            (SELECT variety_code FROM rollover_configs WHERE id = NEW.config_id),
            TO_CHAR(NEW.completed_at, 'YYYY-MM'),
            1,
            CASE WHEN NEW.execution_mode = 'auto' THEN 1 ELSE 0 END,
            CASE WHEN NEW.execution_mode = 'manual' THEN 1 ELSE 0 END,
            COALESCE(NEW.rollover_cost, 0),
            1
        )
        ON CONFLICT (account_id, variety_code, year_month)
        DO UPDATE SET
            total_rollovers = rollover_statistics.total_rollovers + 1,
            auto_rollovers = rollover_statistics.auto_rollovers + CASE WHEN NEW.execution_mode = 'auto' THEN 1 ELSE 0 END,
            manual_rollovers = rollover_statistics.manual_rollovers + CASE WHEN NEW.execution_mode = 'manual' THEN 1 ELSE 0 END,
            total_cost = rollover_statistics.total_cost + COALESCE(NEW.rollover_cost, 0),
            success_count = rollover_statistics.success_count + 1,
            avg_cost = (rollover_statistics.total_cost + COALESCE(NEW.rollover_cost, 0)) / (rollover_statistics.total_rollovers + 1),
            success_rate = ((rollover_statistics.success_count + 1)::DECIMAL / (rollover_statistics.total_rollovers + 1)) * 100;
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        -- 更新失败统计
        INSERT INTO rollover_statistics (
            account_id,
            variety_code,
            year_month,
            total_rollovers,
            failed_count
        )
        VALUES (
            NEW.account_id,
            (SELECT variety_code FROM rollover_configs WHERE id = NEW.config_id),
            TO_CHAR(NEW.trigger_time, 'YYYY-MM'),
            1,
            1
        )
        ON CONFLICT (account_id, variety_code, year_month)
        DO UPDATE SET
            total_rollovers = rollover_statistics.total_rollovers + 1,
            failed_count = rollover_statistics.failed_count + 1,
            success_rate = (rollover_statistics.success_count::DECIMAL / (rollover_statistics.total_rollovers + 1)) * 100;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rollover_statistics
    AFTER UPDATE ON rollover_tasks
    FOR EACH ROW
    WHEN (NEW.status IN ('completed', 'failed'))
    EXECUTE FUNCTION update_rollover_statistics();

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE rollover_configs IS '换月配置表';
COMMENT ON TABLE rollover_tasks IS '换月任务表';
COMMENT ON TABLE rollover_executions IS '换月执行记录表';
COMMENT ON TABLE rollover_statistics IS '换月统计表';
