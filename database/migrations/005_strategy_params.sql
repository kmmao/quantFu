-- =====================================================
-- 策略参数远程配置数据库迁移
-- =====================================================

-- 1. 策略定义表
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,              -- 策略名称
    display_name VARCHAR(100) NOT NULL,             -- 显示名称
    description TEXT,                               -- 策略描述
    version VARCHAR(20) NOT NULL,                   -- 策略版本

    -- 策略分类
    category VARCHAR(50),                           -- 策略分类 (trend/arbitrage/grid等)
    risk_level VARCHAR(20) DEFAULT 'medium',        -- 风险等级 (low/medium/high)

    -- 状态
    is_active BOOLEAN DEFAULT true,                 -- 是否活跃

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- 2. 策略参数定义表
CREATE TABLE IF NOT EXISTS strategy_param_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,

    -- 参数基本信息
    param_key VARCHAR(100) NOT NULL,                -- 参数键名 (如 stop_loss_ratio)
    param_name VARCHAR(100) NOT NULL,               -- 参数显示名称
    description TEXT,                               -- 参数描述

    -- 参数类型和验证
    param_type VARCHAR(20) NOT NULL,                -- 参数类型 (int/float/string/bool/json)
    default_value TEXT,                             -- 默认值(JSON字符串)
    min_value DECIMAL(20,8),                        -- 最小值(数值类型)
    max_value DECIMAL(20,8),                        -- 最大值(数值类型)
    allowed_values TEXT,                            -- 允许的值列表(JSON数组)

    -- 验证规则
    is_required BOOLEAN DEFAULT false,              -- 是否必填
    validation_regex VARCHAR(500),                  -- 验证正则表达式

    -- UI展示
    display_order INTEGER DEFAULT 0,                -- 显示顺序
    group_name VARCHAR(50),                         -- 参数分组
    unit VARCHAR(20),                               -- 单位(如 %, 元, 手)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT param_def_unique UNIQUE (strategy_id, param_key)
);

-- 3. 策略实例表
CREATE TABLE IF NOT EXISTS strategy_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id),
    account_id VARCHAR(50) NOT NULL,                -- 账户ID

    -- 实例信息
    instance_name VARCHAR(100) NOT NULL,            -- 实例名称
    symbols TEXT[],                                 -- 运行的合约列表

    -- 运行状态
    status VARCHAR(20) DEFAULT 'stopped',           -- 状态 (stopped/running/paused/error)
    is_enabled BOOLEAN DEFAULT true,                -- 是否启用

    -- 运行信息
    started_at TIMESTAMPTZ,                         -- 启动时间
    stopped_at TIMESTAMPTZ,                         -- 停止时间
    last_heartbeat TIMESTAMPTZ,                     -- 最后心跳时间
    error_message TEXT,                             -- 错误信息

    -- 统计信息
    total_trades INTEGER DEFAULT 0,                 -- 总交易次数
    total_profit DECIMAL(15,2) DEFAULT 0,           -- 总盈亏
    win_rate DECIMAL(5,2),                          -- 胜率

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT instance_unique UNIQUE (strategy_id, account_id, instance_name)
);

-- 4. 策略参数配置表
CREATE TABLE IF NOT EXISTS strategy_param_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_instances(id) ON DELETE CASCADE,
    param_key VARCHAR(100) NOT NULL,                -- 参数键名
    param_value TEXT NOT NULL,                      -- 参数值(JSON字符串)

    -- 版本控制
    version INTEGER DEFAULT 1,                      -- 配置版本
    is_active BOOLEAN DEFAULT true,                 -- 是否当前生效的配置

    -- 生效控制
    effective_at TIMESTAMPTZ DEFAULT NOW(),         -- 生效时间
    applied_at TIMESTAMPTZ,                         -- 实际应用时间

    -- 变更记录
    changed_by VARCHAR(100),                        -- 修改人
    change_reason TEXT,                             -- 修改原因

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT param_config_unique UNIQUE (instance_id, param_key, version)
);

-- 5. 参数变更历史表
CREATE TABLE IF NOT EXISTS strategy_param_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_instances(id) ON DELETE CASCADE,
    param_key VARCHAR(100) NOT NULL,

    -- 变更内容
    old_value TEXT,                                 -- 旧值
    new_value TEXT,                                 -- 新值

    -- 变更信息
    changed_by VARCHAR(100),                        -- 修改人
    change_reason TEXT,                             -- 修改原因
    change_type VARCHAR(20) DEFAULT 'manual',       -- 变更类型 (manual/auto/rollback)

    -- 生效情况
    applied BOOLEAN DEFAULT false,                  -- 是否已应用
    applied_at TIMESTAMPTZ,                         -- 应用时间

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 策略参数模板表
CREATE TABLE IF NOT EXISTS strategy_param_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,

    -- 模板信息
    template_name VARCHAR(100) NOT NULL,            -- 模板名称
    description TEXT,                               -- 模板描述
    params JSONB NOT NULL,                          -- 参数JSON

    -- 分类
    template_type VARCHAR(50) DEFAULT 'custom',     -- 模板类型 (official/custom)
    risk_level VARCHAR(20),                         -- 风险等级

    -- 使用统计
    usage_count INTEGER DEFAULT 0,                  -- 使用次数

    -- 元数据
    is_public BOOLEAN DEFAULT false,                -- 是否公开
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT template_unique UNIQUE (strategy_id, template_name)
);

-- =====================================================
-- 视图
-- =====================================================

-- 活跃策略实例视图
CREATE OR REPLACE VIEW v_active_strategy_instances AS
SELECT
    si.*,
    s.name as strategy_name,
    s.display_name as strategy_display_name,
    s.category as strategy_category,
    CASE
        WHEN si.last_heartbeat IS NOT NULL THEN
            EXTRACT(EPOCH FROM (NOW() - si.last_heartbeat))
        ELSE NULL
    END as seconds_since_heartbeat
FROM strategy_instances si
JOIN strategies s ON si.strategy_id = s.id
WHERE si.is_enabled = true
ORDER BY si.updated_at DESC;

-- 当前生效参数配置视图
CREATE OR REPLACE VIEW v_current_strategy_params AS
SELECT
    spc.instance_id,
    si.instance_name,
    si.account_id,
    s.name as strategy_name,
    spc.param_key,
    spd.param_name,
    spd.param_type,
    spc.param_value,
    spd.unit,
    spd.group_name,
    spc.effective_at,
    spc.applied_at,
    spc.version
FROM strategy_param_configs spc
JOIN strategy_instances si ON spc.instance_id = si.id
JOIN strategies s ON si.strategy_id = s.id
LEFT JOIN strategy_param_definitions spd ON s.id = spd.strategy_id AND spc.param_key = spd.param_key
WHERE spc.is_active = true
ORDER BY si.instance_name, spd.display_order;

-- 策略参数变更统计视图
CREATE OR REPLACE VIEW v_strategy_param_change_stats AS
SELECT
    instance_id,
    param_key,
    COUNT(*) as change_count,
    MAX(created_at) as last_change_at,
    COUNT(CASE WHEN applied = true THEN 1 END) as applied_count
FROM strategy_param_history
GROUP BY instance_id, param_key;

-- =====================================================
-- 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_strategies_name ON strategies(name);
CREATE INDEX IF NOT EXISTS idx_strategies_active ON strategies(is_active);

CREATE INDEX IF NOT EXISTS idx_param_def_strategy ON strategy_param_definitions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_param_def_key ON strategy_param_definitions(param_key);

CREATE INDEX IF NOT EXISTS idx_instances_strategy ON strategy_instances(strategy_id);
CREATE INDEX IF NOT EXISTS idx_instances_account ON strategy_instances(account_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON strategy_instances(status);

CREATE INDEX IF NOT EXISTS idx_param_config_instance ON strategy_param_configs(instance_id);
CREATE INDEX IF NOT EXISTS idx_param_config_active ON strategy_param_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_param_history_instance ON strategy_param_history(instance_id);
CREATE INDEX IF NOT EXISTS idx_param_history_created ON strategy_param_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_strategy ON strategy_param_templates(strategy_id);

-- =====================================================
-- 触发器
-- =====================================================

-- 更新 updated_at
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_param_def_updated_at BEFORE UPDATE ON strategy_param_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON strategy_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON strategy_param_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 参数配置变更时自动记录历史
CREATE OR REPLACE FUNCTION record_param_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入历史记录
    INSERT INTO strategy_param_history (
        instance_id,
        param_key,
        old_value,
        new_value,
        changed_by,
        change_reason
    ) VALUES (
        NEW.instance_id,
        NEW.param_key,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.param_value ELSE NULL END,
        NEW.param_value,
        NEW.changed_by,
        NEW.change_reason
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_param_change
    AFTER INSERT OR UPDATE ON strategy_param_configs
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION record_param_change();

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE strategies IS '策略定义表';
COMMENT ON TABLE strategy_param_definitions IS '策略参数定义表';
COMMENT ON TABLE strategy_instances IS '策略实例表';
COMMENT ON TABLE strategy_param_configs IS '策略参数配置表';
COMMENT ON TABLE strategy_param_history IS '参数变更历史表';
COMMENT ON TABLE strategy_param_templates IS '策略参数模板表';
