#!/usr/bin/env python3
"""
TqSDK 认证方式测试
帮助用户配置天勤账号
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("TqSDK 认证配置检查")
print("=" * 60)

account = os.getenv('TQSDK_ACCOUNT', '')
password = os.getenv('TQSDK_PASSWORD', '')

print(f"\n当前配置:")
print(f"  TQSDK_ACCOUNT: {account if account else '未设置'}")
print(f"  TQSDK_PASSWORD: {'*' * len(password) if password else '未设置'}")

if not account or account == 'your_account':
    print("\n" + "!" * 60)
    print("⚠️  未配置天勤账号!")
    print("!" * 60)
    print("\n天勤SDK需要真实账号才能获取行情数据。请按以下步骤操作:")
    print("\n1️⃣  注册天勤账号")
    print("   访问: https://www.shinnytech.com/tianqin")
    print("   注册一个免费账号")
    print("\n2️⃣  配置账号信息")
    print("   编辑 backend/.env 文件,设置:")
    print("   TQSDK_ACCOUNT=你的手机号或邮箱")
    print("   TQSDK_PASSWORD=你的密码")
    print("\n3️⃣  免费额度说明")
    print("   - 天勤提供免费的实时行情数据")
    print("   - 每日有一定的调用次数限制")
    print("   - 足够开发和小规模使用")
    print("\n4️⃣  其他选择")
    print("   - 使用模拟数据 (开发测试用)")
    print("   - 接入其他行情源 (如CTP)")
    print("   - 购买天勤专业版 (不限次数)")
    print("\n" + "=" * 60)
    exit(1)
else:
    print("\n✅ 账号已配置")
    print("\n正在测试连接...")

    try:
        from tqsdk import TqApi, TqAuth

        api = TqApi(
            auth=TqAuth(account, password),
            web_gui=False
        )

        print("✅ 认证成功!")

        # 测试获取一个行情
        quote = api.get_quote("SHFE.cu2502")
        api.wait_update()

        print(f"\n测试行情 (铜主力):")
        print(f"  最新价: {quote.last_price}")
        print(f"  成交量: {quote.volume}")

        api.close()
        print("\n✅ TqSDK 配置正常,可以正常使用!")

    except Exception as e:
        print(f"\n✗ 连接失败: {e}")
        print("\n请检查:")
        print("1. 账号密码是否正确")
        print("2. 网络连接是否正常")
        print("3. 是否需要在天勤网站激活账号")
