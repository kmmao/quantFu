# QuantFu Backend

期货量化管理平台后端服务

## 技术栈

- **Framework**: FastAPI
- **Database**: PostgreSQL (via Supabase)
- **Data Provider**: TqSDK (天勤)
- **Package Manager**: uv (推荐) or pip

## 快速开始

### 使用 uv (推荐)

```bash
# 安装依赖
uv sync

# 启动开发服务器
uv run uvicorn main:app --reload --port 8888

# 运行测试
uv run pytest
```

### 使用传统方式

```bash
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn main:app --reload --port 8888

# 运行测试
pytest
```

## 项目结构

```
backend/
├── main.py              # FastAPI 应用入口
├── pyproject.toml       # 项目配置和依赖
├── requirements.txt     # pip 依赖文件 (兼容性)
├── .env                 # 环境变量
├── .python-version      # Python 版本指定
└── tests/               # 测试文件
```

## API 文档

启动服务后访问:
- Swagger UI: http://localhost:8888/docs
- ReDoc: http://localhost:8888/redoc

## 更多文档

- [UV 使用指南](UV_GUIDE.md)
- [项目总体文档](../README.md)
