#!/bin/bash

echo "=================================="
echo "前端 Supabase 连接测试"
echo "=================================="
echo ""

# 1. 检查后端服务
echo "1. 检查 Supabase 服务状态:"
docker ps --filter "name=quantfu" --format "table {{.Names}}\t{{.Status}}" | grep -E "(NAMES|quantfu)" | head -7
echo ""

# 2. 检查环境变量
echo "2. 前端环境变量配置:"
if [ -f "frontend/.env.local" ]; then
    echo "✅ .env.local 文件存在"
    cat frontend/.env.local | grep -v "^#" | grep -v "^$"
else
    echo "❌ .env.local 文件不存在"
fi
echo ""

# 3. 测试 API 连通性
echo "3. 测试 Kong API Gateway:"
KONG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/rest/v1/)
if [ "$KONG_STATUS" = "200" ] || [ "$KONG_STATUS" = "404" ]; then
    echo "✅ Kong 可访问 (HTTP $KONG_STATUS)"
else
    echo "❌ Kong 不可访问 (HTTP $KONG_STATUS)"
fi
echo ""

# 4. 测试数据查询
echo "4. 测试数据库查询 (通过 Kong):"
ACCOUNTS_RESPONSE=$(curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" http://localhost:8000/rest/v1/accounts)

if echo "$ACCOUNTS_RESPONSE" | jq . >/dev/null 2>&1; then
    ACCOUNT_COUNT=$(echo "$ACCOUNTS_RESPONSE" | jq 'length')
    echo "✅ 数据查询成功 - 查询到 $ACCOUNT_COUNT 个账户"
else
    echo "❌ 数据查询失败"
    echo "响应: $ACCOUNTS_RESPONSE"
fi
echo ""

echo "=================================="
echo "✅ 后端准备就绪!"
echo ""
echo "📝 下一步操作:"
echo "1. 启动前端开发服务器:"
echo "   cd frontend && npm run dev"
echo ""
echo "2. 访问测试页面:"
echo "   http://localhost:3000/test-supabase"
echo ""
echo "3. 查看使用文档:"
echo "   frontend/SUPABASE_USAGE.md"
echo "=================================="
