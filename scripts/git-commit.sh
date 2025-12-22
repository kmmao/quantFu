#!/bin/bash
# ========================================
# Git 智能提交脚本
# ========================================
# 遵循 Conventional Commits 规范的交互式提交工具

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}→ $1${NC}"
}

# 检查是否在 Git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "不在 Git 仓库中"
    exit 1
fi

print_header "Git 智能提交工具"

# 1. 检查是否有更改
echo -e "${CYAN}1️⃣  检查工作区状态...${NC}\n"

if git diff-index --quiet HEAD -- 2>/dev/null; then
    print_warn "工作区没有更改"
    echo ""
    git status
    exit 0
fi

# 显示状态
git status --short

echo ""
read -p "$(echo -e ${YELLOW}是否查看详细差异? [y/N]: ${NC})" show_diff
if [[ $show_diff =~ ^[Yy]$ ]]; then
    git diff
fi

# 2. 选择提交类型
echo -e "\n${CYAN}2️⃣  选择提交类型:${NC}\n"

echo "  1) feat      - 新功能"
echo "  2) fix       - Bug 修复"
echo "  3) docs      - 文档更新"
echo "  4) style     - 代码格式"
echo "  5) refactor  - 重构"
echo "  6) perf      - 性能优化"
echo "  7) test      - 测试"
echo "  8) chore     - 构建/工具"
echo "  9) ci        - CI 配置"
echo "  0) revert    - 回退提交"
echo ""

read -p "$(echo -e ${YELLOW}请选择 [1-9,0]: ${NC})" type_choice

case $type_choice in
    1) TYPE="feat" ;;
    2) TYPE="fix" ;;
    3) TYPE="docs" ;;
    4) TYPE="style" ;;
    5) TYPE="refactor" ;;
    6) TYPE="perf" ;;
    7) TYPE="test" ;;
    8) TYPE="chore" ;;
    9) TYPE="ci" ;;
    0) TYPE="revert" ;;
    *)
        print_error "无效选择"
        exit 1
        ;;
esac

# 3. 选择范围 (可选)
echo -e "\n${CYAN}3️⃣  选择变更范围 (可选):${NC}\n"

echo "  常用范围:"
echo "    - auth (认证)"
echo "    - api (API)"
echo "    - db (数据库)"
echo "    - ui (UI组件)"
echo "    - backend (后端)"
echo "    - frontend (前端)"
echo "    - deps (依赖)"
echo "    - env (环境配置)"
echo ""

read -p "$(echo -e ${YELLOW}输入范围 (直接回车跳过): ${NC})" SCOPE

# 4. 输入描述
echo -e "\n${CYAN}4️⃣  输入简短描述:${NC}"
echo -e "${BLUE}   提示: 用一句话说明做了什么 (不超过50字)${NC}\n"

read -p "$(echo -e ${YELLOW}描述: ${NC})" DESCRIPTION

if [ -z "$DESCRIPTION" ]; then
    print_error "描述不能为空"
    exit 1
fi

# 5. 详细说明 (可选)
echo -e "\n${CYAN}5️⃣  详细说明 (可选):${NC}"
echo -e "${BLUE}   提示: 可以多行输入，输入空行结束${NC}\n"

BODY=""
while IFS= read -r line; do
    [ -z "$line" ] && break
    BODY="${BODY}${line}\n"
done

# 6. 构建提交消息
if [ -n "$SCOPE" ]; then
    COMMIT_SUBJECT="${TYPE}(${SCOPE}): ${DESCRIPTION}"
else
    COMMIT_SUBJECT="${TYPE}: ${DESCRIPTION}"
fi

# AI 标识
AI_FOOTER="\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 完整提交消息
if [ -n "$BODY" ]; then
    COMMIT_MESSAGE="${COMMIT_SUBJECT}\n\n${BODY}${AI_FOOTER}"
else
    COMMIT_MESSAGE="${COMMIT_SUBJECT}${AI_FOOTER}"
fi

# 7. 预览并确认
echo -e "\n${CYAN}6️⃣  提交消息预览:${NC}\n"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${COMMIT_MESSAGE}" | sed 's/\\n/\n/g'
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

read -p "$(echo -e ${YELLOW}确认提交? [Y/n]: ${NC})" confirm
if [[ $confirm =~ ^[Nn]$ ]]; then
    print_warn "已取消提交"
    exit 0
fi

# 8. 添加文件
echo -e "\n${CYAN}7️⃣  选择要提交的文件:${NC}\n"
echo "  1) 所有更改 (git add .)"
echo "  2) 已修改的文件 (git add -u)"
echo "  3) 手动选择"
echo ""

read -p "$(echo -e ${YELLOW}请选择 [1-3]: ${NC})" add_choice

case $add_choice in
    1)
        git add .
        print_success "已添加所有更改"
        ;;
    2)
        git add -u
        print_success "已添加所有已跟踪文件的更改"
        ;;
    3)
        echo -e "\n${BLUE}输入文件路径 (多个文件用空格分隔):${NC}"
        read -p "> " files
        git add $files
        print_success "已添加指定文件"
        ;;
    *)
        print_error "无效选择"
        exit 1
        ;;
esac

# 9. 执行提交
echo -e "\n${CYAN}8️⃣  执行提交...${NC}\n"

# 使用 HEREDOC 保证格式正确
git commit -m "$(echo -e "${COMMIT_MESSAGE}")"

if [ $? -eq 0 ]; then
    echo ""
    print_success "提交成功！"
    echo ""

    # 显示最新提交
    git log -1 --pretty=format:"%C(yellow)%h%Creset - %C(cyan)%an%Creset, %C(green)%ar%Creset : %s" --abbrev-commit
    echo -e "\n"

    # 询问是否推送
    read -p "$(echo -e ${YELLOW}是否推送到远程? [y/N]: ${NC})" push_confirm
    if [[ $push_confirm =~ ^[Yy]$ ]]; then
        CURRENT_BRANCH=$(git branch --show-current)
        echo -e "\n${CYAN}推送到远程分支: ${CURRENT_BRANCH}${NC}\n"
        git push origin "$CURRENT_BRANCH"

        if [ $? -eq 0 ]; then
            print_success "推送成功！"
        else
            print_error "推送失败"
        fi
    fi
else
    print_error "提交失败"
    exit 1
fi

echo ""
