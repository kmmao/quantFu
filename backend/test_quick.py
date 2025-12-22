#!/usr/bin/env python3
"""快速测试天勤连接"""
import os
from dotenv import load_dotenv
load_dotenv()

account = os.getenv('TQSDK_ACCOUNT', '')
password = os.getenv('TQSDK_PASSWORD', '')

print(f"账号: {account}")
print(f"密码: {'*' * len(password)}")

from tqsdk import TqApi, TqAuth
import sys

try:
    print("\n正在连接...")
    api = TqApi(auth=TqAuth(account, password), web_gui=False)
    print("✅ 连接成功!")

    # 快速测试一个行情
    quote = api.get_quote("SHFE.cu2502")
    api.wait_update()

    print(f"铜主力最新价: {quote.last_price}")

    # 测试K线
    klines = api.get_kline_serial("CZCE.TA505", 300, 3)
    print(f"✅ K线数据: {len(klines)} 条")
    if len(klines) > 0:
        print(f"   最新收盘价: {klines.iloc[-1]['close']}")

    api.close()
    print("\n✅ 测试成功!")
    sys.exit(0)

except Exception as e:
    print(f"\n✗ 失败: {e}")
    sys.exit(1)
