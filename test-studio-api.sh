#!/bin/bash
# 测试 Supabase Studio 和 Meta API 的核心功能

echo "=================================="
echo "Supabase 系统验证测试"
echo "=================================="
echo ""

# 1. 测试 Meta API 直接访问
echo "1. 测试 Meta API (直接访问):"
META_RESPONSE=$(curl -s http://localhost:8080/tables)
TABLE_COUNT=$(echo "$META_RESPONSE" | jq 'length' 2>/dev/null)
if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Meta API 正常 - 返回 $TABLE_COUNT 个表"
    echo "$META_RESPONSE" | jq '[.[] | select(.schema == "public") | .name]' 2>/dev/null | head -10
else
    echo "❌ Meta API 异常"
fi
echo ""

# 2. 测试 PostgreSQL 直接连接
echo "2. 测试 PostgreSQL 直接连接:"
PGPASSWORD=XwEpGOeuF1jqrYxMigdFigxComCXEhGa psql -h localhost -U postgres -d postgres -c "SELECT COUNT(*) as account_count FROM accounts;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL 直接查询成功"
else
    echo "❌ PostgreSQL 连接失败"
fi
echo ""

# 3. 测试 PostgREST API
echo "3. 测试 PostgREST API:"
REST_RESPONSE=$(curl -s http://localhost:3000/accounts)
if echo "$REST_RESPONSE" | jq . >/dev/null 2>&1; then
    ACCOUNT_COUNT=$(echo "$REST_RESPONSE" | jq 'length')
    echo "✅ PostgREST API 正常 - 返回 $ACCOUNT_COUNT 条账户记录"
else
    echo "❌ PostgREST API 异常"
fi
echo ""

# 4. 测试 Studio 访问
echo "4. 测试 Studio UI:"
if curl -s http://localhost:3001 | grep -q "Supabase" 2>/dev/null; then
    echo "✅ Studio UI 可访问"
else
    echo "❌ Studio UI 无法访问"
fi
echo ""

# 5. 检查容器状态
echo "5. 容器运行状态:"
docker ps --filter "name=quantfu" --format "table {{.Names}}\t{{.Status}}" | grep -E "(NAMES|quantfu)"
echo ""

echo "=================================="
echo "测试完成!"
echo "=================================="
echo ""
echo "📝 下一步操作:"
echo "1. 打开浏览器访问: http://localhost:3001"
echo "2. 进入 SQL Editor"
echo "3. 执行查询: SELECT * FROM accounts;"
echo "4. 检查是否还有验证错误"
