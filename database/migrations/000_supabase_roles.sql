-- ============================================
-- Supabase 必需的角色和权限配置
-- ============================================
-- 此脚本必须在其他迁移之前执行

-- 1. 创建 authenticator 角色（PostgREST 连接用户）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator WITH LOGIN NOINHERIT PASSWORD 'XwEpGOeuF1jqrYxMigdFigxComCXEhGa';
    END IF;
END
$$;

-- 2. 创建 anon 角色（匿名访问）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END
$$;

-- 3. 创建 authenticated 角色（认证用户）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END
$$;

-- 4. 创建 service_role 角色（服务账户，完全权限）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
END
$$;

-- 5. 授予 authenticator 能够切换到其他角色的权限
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- 6. 为 public schema 授予权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. 授予表访问权限（默认）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- 8. 授予序列访问权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 9. 启用必需的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 10. 验证角色创建
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase 角色配置完成:';
    RAISE NOTICE '   - authenticator (LOGIN)';
    RAISE NOTICE '   - anon';
    RAISE NOTICE '   - authenticated';
    RAISE NOTICE '   - service_role';
END
$$;
