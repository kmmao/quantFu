"""
配置管理模块
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置"""

    # Supabase配置
    supabase_url: str = "http://localhost:8000"
    supabase_key: str

    # 数据库配置
    database_url: str

    # 天勤配置
    tqsdk_account: Optional[str] = None
    tqsdk_password: Optional[str] = None

    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8888

    # Ntfy配置
    ntfy_url: str = "https://ntfy.zmddg.com/claude"

    class Config:
        env_file = ".env"
        case_sensitive = False


# 全局配置实例
settings = Settings()
