"""
数据库连接工具
"""
from supabase import create_client, Client
from config import settings


# Supabase客户端(单例)
_supabase_client: Client = None


def get_supabase_client() -> Client:
    """
    获取Supabase客户端(单例模式)

    Returns:
        Supabase客户端实例
    """
    global _supabase_client

    if _supabase_client is None:
        _supabase_client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key
        )

    return _supabase_client


async def test_connection() -> bool:
    """
    测试数据库连接

    Returns:
        连接是否成功
    """
    try:
        client = get_supabase_client()
        # 简单查询测试
        _ = client.table("accounts").select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"Database connection test failed: {e}")
        return False
