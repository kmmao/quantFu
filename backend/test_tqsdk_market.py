#!/usr/bin/env python3
"""
TqSDK 行情数据测试脚本
测试不同账号模式下的行情获取
"""
import os
from tqsdk import TqApi, TqAuth
from datetime import datetime


def test_market_data():
    """测试行情数据获取"""
    print("=" * 60)
    print("TqSDK 行情数据测试")
    print("=" * 60)

    # 测试合约列表
    test_symbols = [
        'CZCE.TA505',   # PTA
        'DCE.i2505',    # 铁矿石
        'SHFE.rb2505',  # 螺纹钢
    ]

    # 获取环境变量
    account = os.getenv('TQSDK_ACCOUNT', '')
    password = os.getenv('TQSDK_PASSWORD', '')

    print(f"\n当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"账号配置: {account if account and account != 'your_account' else '未配置(使用免费账号)'}")

    # 根据配置选择认证方式
    if account and account != 'your_account' and password and password != 'your_password':
        print(f"\n使用天勤账号: {account}")
        auth = TqAuth(account, password)
    else:
        print(f"\n使用天勤免费快期模拟账号")
        auth = TqAuth("快期模拟", "123456")  # 天勤提供的免费快期模拟账号

    try:
        # 创建API实例
        print("\n正在连接天勤行情服务器...")
        api = TqApi(auth=auth, web_gui=False)
        print("✓ 连接成功!")

        # 测试每个合约的行情
        for symbol in test_symbols:
            print(f"\n{'-' * 60}")
            print(f"测试合约: {symbol}")
            print(f"{'-' * 60}")

            try:
                # 获取实时行情
                quote = api.get_quote(symbol)

                # 等待数据更新
                api.wait_update()

                print(f"合约名称: {quote.instrument_name if hasattr(quote, 'instrument_name') else 'N/A'}")
                print(f"最新价: {quote.last_price}")
                print(f"今开盘: {quote.open}")
                print(f"最高价: {quote.highest}")
                print(f"最低价: {quote.lowest}")
                print(f"成交量: {quote.volume}")
                print(f"持仓量: {quote.open_interest}")
                print(f"涨跌: {quote.last_price - quote.pre_close if quote.pre_close else 0:.2f}")
                print(f"涨跌幅: {((quote.last_price / quote.pre_close - 1) * 100 if quote.pre_close else 0):.2f}%")

                # 测试K线数据
                print(f"\n获取K线数据 (5分钟, 最近5根)...")
                klines = api.get_kline_serial(symbol, duration_seconds=300, data_length=5)

                if len(klines) > 0:
                    print(f"✓ 成功获取 {len(klines)} 根K线")
                    latest = klines.iloc[-1]
                    print(f"  最新K线时间: {datetime.fromtimestamp(latest['datetime'] / 1e9).strftime('%Y-%m-%d %H:%M:%S')}")
                    print(f"  开: {latest['open']:.2f}, 高: {latest['high']:.2f}, 低: {latest['low']:.2f}, 收: {latest['close']:.2f}, 量: {int(latest['volume'])}")
                else:
                    print("✗ K线数据为空")

            except Exception as e:
                print(f"✗ 获取 {symbol} 数据失败: {e}")

        # 关闭API
        print(f"\n{'-' * 60}")
        print("测试完成,关闭连接...")
        api.close()
        print("✓ 连接已关闭")

    except Exception as e:
        print(f"\n✗ 连接失败: {e}")
        print("\n可能的原因:")
        print("1. 网络连接问题")
        print("2. 账号密码错误")
        print("3. TqSDK 服务器维护")
        print("4. 需要配置天勤账号 (在 .env 文件中设置 TQSDK_ACCOUNT 和 TQSDK_PASSWORD)")
        return False

    print("\n" + "=" * 60)
    print("测试结束")
    print("=" * 60)
    return True


if __name__ == "__main__":
    # 加载环境变量
    from dotenv import load_dotenv
    load_dotenv()

    test_market_data()
