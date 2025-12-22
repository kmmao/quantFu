"""
天勤SDK单例管理器
保持全局唯一的TqApi连接，避免每次请求都重新连接
"""
from typing import Optional
from tqsdk import TqApi, TqAuth
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


class TqSdkManager:
    """天勤SDK单例管理器"""

    _instance: Optional['TqSdkManager'] = None
    _api: Optional[TqApi] = None
    _is_connected: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_api(self) -> Optional[TqApi]:
        """获取TqApi实例，如果未连接则自动连接"""
        if self._api is None or not self._is_connected:
            self._connect()
        return self._api

    def _connect(self):
        """连接天勤服务"""
        try:
            if self._api is not None:
                # 如果已有连接，先关闭
                try:
                    self._api.close()
                except Exception as e:
                    logger.warning(f"关闭旧连接失败: {e}")

            logger.info("正在连接天勤服务...")
            self._api = TqApi(
                auth=TqAuth(settings.tqsdk_account, settings.tqsdk_password),
                web_gui=False
            )
            self._is_connected = True
            logger.info("✅ 天勤服务连接成功（单例模式）")

        except Exception as e:
            logger.error(f"❌ 天勤服务连接失败: {e}")
            self._is_connected = False
            self._api = None

    def is_connected(self) -> bool:
        """检查是否已连接"""
        return self._is_connected and self._api is not None

    def close(self):
        """关闭连接（仅在应用退出时调用）"""
        if self._api is not None:
            try:
                self._api.close()
                logger.info("天勤服务连接已关闭")
            except Exception as e:
                logger.error(f"关闭天勤连接失败: {e}")
            finally:
                self._api = None
                self._is_connected = False


# 全局单例
tqsdk_manager = TqSdkManager()
