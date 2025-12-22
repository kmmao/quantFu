#!/bin/bash
# ========================================
# 快速 Git 提交脚本
# ========================================
# 用于 AI 自动提交，接受参数快速提交

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查是否在 Git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}✗ 不在 Git 仓库中${NC}"
    exit 1
fi

# 检查是否有更改
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}⚠ 工作区没有更改${NC}"
    exit 0
fi

# 参数处理
TYPE=""
SCOPE=""
DESCRIPTION=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TYPE="$2"
            shift 2
            ;;
        -s|--scope)
            SCOPE="$2"
            shift 2
            ;;
        -m|--message)
            DESCRIPTION="$2"
            shift 2
            ;;
        *)
            # 如果没有指定参数，第一个参数作为消息
            if [ -z "$DESCRIPTION" ]; then
                DESCRIPTION="$1"
            fi
            shift
            ;;
    esac
done

# 如果没有提供参数，使用交互模式
if [ -z "$TYPE" ]; then
    echo -e "${CYAN}快速提交模式${NC}\n"
    echo "常用类型:"
    echo "  1) feat     2) fix      3) docs"
    echo "  4) chore    5) refactor 6) test"
    echo ""
    read -p "选择类型 [1-6]: " type_choice

    case $type_choice in
        1) TYPE="feat" ;;
        2) TYPE="fix" ;;
        3) TYPE="docs" ;;
        4) TYPE="chore" ;;
        5) TYPE="refactor" ;;
        6) TYPE="test" ;;
        *) TYPE="chore" ;;
    esac
fi

# 如果没有描述，提示输入
if [ -z "$DESCRIPTION" ]; then
    read -p "$(echo -e ${YELLOW}提交描述: ${NC})" DESCRIPTION
fi

# 如果还是没有描述，使用默认
if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="更新代码"
fi

# 构建提交消息
if [ -n "$SCOPE" ]; then
    COMMIT_SUBJECT="${TYPE}(${SCOPE}): ${DESCRIPTION}"
else
    COMMIT_SUBJECT="${TYPE}: ${DESCRIPTION}"
fi

# AI 标识
AI_FOOTER="\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

COMMIT_MESSAGE="${COMMIT_SUBJECT}${AI_FOOTER}"

# 显示将要提交的内容
echo -e "\n${CYAN}准备提交:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${COMMIT_MESSAGE}" | sed 's/\\n/\n/g'
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 显示状态
git status --short

echo ""
read -p "$(echo -e ${YELLOW}确认提交? [Y/n]: ${NC})" confirm
if [[ $confirm =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}⚠ 已取消提交${NC}"
    exit 0
fi

# 添加所有更改
git add .

# 执行提交
git commit -m "$(echo -e "${COMMIT_MESSAGE}")"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ 提交成功！${NC}\n"
    git log -1 --pretty=format:"%C(yellow)%h%Creset - %C(cyan)%an%Creset, %C(green)%ar%Creset : %s" --abbrev-commit
    echo -e "\n"
else
    echo -e "${RED}✗ 提交失败${NC}"
    exit 1
fi
