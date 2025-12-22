# UV 使用指南

## 🚀 什么是 UV？

`uv` 是一个用 Rust 编写的极速 Python 包管理器和项目管理工具，由 Astral 团队开发（同一团队开发了著名的 Ruff linter）。

### 为什么使用 UV？

- ⚡ **极快**: 比 pip 快 10-100 倍
- 🔒 **可靠**: 确定性的依赖解析，类似 npm 的 lock 文件
- 🎯 **简单**: 统一的命令行界面，无需记住多个工具
- 🔄 **兼容**: 完全兼容 pip 和 requirements.txt

## 📦 安装 UV

### macOS/Linux

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 验证安装

```bash
uv --version
# 输出: uv 0.9.18 (...)
```

## 🎯 常用命令

### 1. 创建虚拟环境

```bash
# 创建虚拟环境 (使用 .python-version 指定的版本)
uv venv

# 或指定 Python 版本
uv venv --python 3.9
uv venv --python 3.11
```

### 2. 安装依赖

```bash
# 从 pyproject.toml 安装所有依赖
uv sync

# 安装并更新依赖
uv sync --upgrade

# 仅安装生产依赖 (不安装 dev-dependencies)
uv sync --no-dev
```

### 3. 添加/删除包

```bash
# 添加新包
uv add requests
uv add "fastapi>=0.100.0"

# 添加开发依赖
uv add --dev pytest
uv add --dev ruff

# 删除包
uv remove requests
```

### 4. 运行命令

```bash
# 在虚拟环境中运行命令 (无需手动激活)
uv run python script.py
uv run uvicorn main:app --reload
uv run pytest

# 运行 Python REPL
uv run python
```

### 5. 锁定依赖

```bash
# 更新 uv.lock 文件
uv lock

# 更新特定包
uv lock --upgrade-package fastapi
```

### 6. 导出依赖

```bash
# 导出为 requirements.txt (用于不支持 uv 的环境)
uv export --no-hashes > requirements.txt

# 仅导出生产依赖
uv export --no-dev --no-hashes > requirements.txt
```

## 🔧 项目配置

本项目已配置好 `pyproject.toml`，包含：

### 依赖管理

```toml
[project]
name = "quantfu-backend"
dependencies = [
    "fastapi==0.109.0",
    "uvicorn[standard]==0.27.0",
    # ... 其他依赖
]
```

### 开发依赖

```toml
[tool.uv]
dev-dependencies = []
```

### Python 版本

`.python-version` 文件指定了 Python 3.9

## 📋 常见工作流

### 初次设置

```bash
cd backend

# 创建虚拟环境并安装依赖
uv venv && uv sync
```

### 日常开发

```bash
# 启动开发服务器
uv run uvicorn main:app --reload --port 8888

# 运行测试
uv run pytest

# 运行特定测试文件
uv run pytest tests/test_api.py

# 添加新依赖
uv add httpx
```

### 更新依赖

```bash
# 更新所有依赖到最新兼容版本
uv sync --upgrade

# 更新特定包
uv lock --upgrade-package fastapi
uv sync
```

### 清理环境

```bash
# 删除虚拟环境
rm -rf .venv

# 重新创建
uv venv && uv sync
```

## 🆚 UV vs PIP

| 操作 | UV | PIP |
|------|-----|-----|
| 创建虚拟环境 | `uv venv` | `python -m venv .venv` |
| 激活环境 | 不需要! | `source .venv/bin/activate` |
| 安装依赖 | `uv sync` | `pip install -r requirements.txt` |
| 添加包 | `uv add requests` | `pip install requests` + 手动编辑 requirements.txt |
| 运行命令 | `uv run python script.py` | `source .venv/bin/activate && python script.py` |
| 速度 | ⚡ 极快 | 🐌 较慢 |

## 🔍 故障排查

### 问题 1: 依赖冲突

```bash
# 查看冲突详情
uv sync --verbose

# 强制重新解析依赖
rm uv.lock
uv sync
```

### 问题 2: Python 版本不匹配

```bash
# 查看可用的 Python 版本
uv python list

# 使用特定版本
uv venv --python 3.9
```

### 问题 3: 虚拟环境损坏

```bash
# 完全重建
rm -rf .venv uv.lock
uv venv && uv sync
```

## 📚 更多资源

- [UV 官方文档](https://docs.astral.sh/uv/)
- [UV GitHub](https://github.com/astral-sh/uv)
- [pyproject.toml 规范](https://packaging.python.org/en/latest/specifications/pyproject-toml/)

## 💡 小技巧

### 1. 别名设置

在你的 `.bashrc` 或 `.zshrc` 中添加：

```bash
alias uvr="uv run"
alias uvs="uv sync"
alias uva="uv add"
```

### 2. 在 Makefile 中使用

```makefile
.PHONY: dev test

dev:
	uv run uvicorn main:app --reload

test:
	uv run pytest
```

### 3. 在 CI/CD 中使用

```yaml
# GitHub Actions 示例
- name: Set up UV
  run: curl -LsSf https://astral.sh/uv/install.sh | sh

- name: Install dependencies
  run: uv sync

- name: Run tests
  run: uv run pytest
```

## ⚠️ 注意事项

1. **不要手动激活虚拟环境**: 使用 `uv run` 会自动处理
2. **保持 requirements.txt 同步**: 如果需要兼容性，定期运行 `uv export`
3. **提交 uv.lock**: 这个文件确保团队成员使用相同的依赖版本

---

**最后更新**: 2025-12-23
**UV 版本**: 0.9.18+
