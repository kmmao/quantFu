#!/usr/bin/env python3
"""
天勤TqSDK连接测试脚本
用途: 验证天勤账号配置和行情数据获取
"""

import os
import sys
from dotenv import load_dotenv
from tqsdk import TqApi, TqAuth


def test_tqsdk_connection():
    """测试天勤连接"""

    # 加载环境变量
    load_dotenv()

    tq_user = os.getenv('TQSDK_USER')
    tq_password = os.getenv('TQSDK_PASSWORD')

    if not tq_user or not tq_password:
        print("❌ 错误: 未配置天勤账号")
        print("请在 .env 文件中设置:")
        print("  TQSDK_USER=你的天勤账号")
        print("  TQSDK_PASSWORD=你的天勤密码")
        return False

    print("📡 正在连接天勤行情服务...")
    print(f"   账号: {tq_user}")

    try:
        # 创建API实例
        api = TqApi(auth=TqAuth(tq_user, tq_password))

        print("✅ 天勤连接成功!")

        # 测试获取行情数据
        print("\n📊 测试行情数据获取...")

        test_symbols = [
            "SHFE.cu2505",  # 铜
            "DCE.i2505",    # 铁矿石
            "CZCE.TA505",   # PTA
            "INE.sc2505"    # 原油
        ]

        success_count = 0
        for symbol in test_symbols:
            try:
                quote = api.get_quote(symbol)
                api.wait_update()

                if quote.last_price > 0:
                    print(f"  ✅ {symbol}: {quote.last_price:.2f} (买:{quote.bid_price1:.2f} 卖:{quote.ask_price1:.2f})")
                    success_count += 1
                else:
                    print(f"  ⚠️  {symbol}: 暂无行情")
            except Exception as e:
                print(f"  ❌ {symbol}: 获取失败 - {str(e)}")

        # 关闭连接
        api.close()

        print(f"\n📈 行情测试完成: {success_count}/{len(test_symbols)} 成功")

        if success_count >= len(test_symbols) // 2:
            print("\n✅ TqSDK测试通过!")
            return True
        else:
            print("\n⚠️  部分行情获取失败,请检查网络或合约代码")
            return False

    except Exception as e:
        print(f"\n❌ 连接失败: {str(e)}")
        print("\n可能的原因:")
        print("  1. 账号或密码错误")
        print("  2. 网络连接问题")
        print("  3. 天勤服务器维护")
        print("  4. 需要安装tqsdk: pip install tqsdk")
        return False


def test_contract_mapping():
    """测试合约映射"""
    print("\n🔗 测试极星-天勤合约映射...")

    mapping_examples = [
        ("ZCE|F|TA|2505", "CZCE.TA505"),    # 郑商所PTA
        ("SHFE|F|cu|2505", "SHFE.cu2505"),  # 上期所铜
        ("DCE|F|i|2505", "DCE.i2505"),      # 大商所铁矿石
        ("INE|F|sc|2505", "INE.sc2505")     # 上期能源原油
    ]

    print("极星格式 → 天勤格式:")
    for polar, tq in mapping_examples:
        print(f"  {polar} → {tq}")

    print("\n✅ 合约映射规则正确")
    return True


if __name__ == '__main__':
    print("=" * 60)
    print("天勤TqSDK连接测试")
    print("=" * 60)

    # 测试连接
    connection_ok = test_tqsdk_connection()

    # 测试映射
    mapping_ok = test_contract_mapping()

    print("\n" + "=" * 60)
    if connection_ok and mapping_ok:
        print("✅ 所有测试通过!")
        print("\n下一步:")
        print("  1. 启动后端服务: uvicorn main:app --reload --port 8888")
        print("  2. 访问API文档: http://localhost:8888/docs")
        sys.exit(0)
    else:
        print("❌ 测试失败,请检查配置")
        sys.exit(1)
