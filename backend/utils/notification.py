"""
通知工具
支持ntfy推送
"""
import requests
from typing import Optional
import os
from utils.logger import get_logger

logger = get_logger(__name__)

NTFY_URL = os.getenv("NTFY_URL", "https://ntfy.zmddg.com/claude")


async def send_notification(
    title: str,
    message: str,
    priority: str = "default",
    tags: Optional[str] = None,
) -> bool:
    """
    发送ntfy通知

    Args:
        title: 通知标题
        message: 通知内容
        priority: 优先级 (min, low, default, high, urgent)
        tags: 标签(如 "warning,lock")

    Returns:
        是否发送成功
    """
    try:
        headers = {
            "Title": title,
            "Priority": priority,
        }

        if tags:
            headers["Tags"] = tags

        response = requests.post(
            NTFY_URL,
            data=message.encode("utf-8"),
            headers=headers,
            timeout=5,
        )

        if response.status_code == 200:
            logger.info(f"[通知] 发送成功: {title}")
            return True
        else:
            logger.warning(f"[通知] 发送失败: {response.status_code}")
            return False

    except Exception as e:
        logger.error(f"[通知] 发送异常: {e}")
        return False
