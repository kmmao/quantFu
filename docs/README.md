# QuantFu 项目文档

## 📖 文档目录

### 🚀 快速入门
- **返回项目首页**: [../README.md](../README.md)
- **项目概览**: [../PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md)
- **快速开始**: [../QUICKSTART.md](../QUICKSTART.md)
- **当前状态**: [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

## 📚 集成指南

### 极星量化平台集成
| 文档 | 说明 |
|------|------|
| [POLAR_INTEGRATION.md](integration/POLAR_INTEGRATION.md) | 极星 v12.py 策略改造指南 |
| [V12_INTEGRATION_GUIDE.md](integration/V12_INTEGRATION_GUIDE.md) | V12 策略详细集成步骤 |
| [V12_INTEGRATION_VISUAL_GUIDE.md](integration/V12_INTEGRATION_VISUAL_GUIDE.md) | V12 集成可视化教程 |

---

## 🚀 部署运维

| 文档 | 说明 |
|------|------|
| [DEPLOYMENT.md](deployment/DEPLOYMENT.md) | 生产环境部署指南 |

---

## 📝 开发历史

### Phase 2: 基础功能开发
| 文档 | 说明 |
|------|------|
| [COMPLETE.md](development/phase2/COMPLETE.md) | Phase 2 完成总结 |
| [GUIDE.md](development/phase2/GUIDE.md) | Phase 2 开发指南 |

### Phase 3: 高级功能开发
| 文档 | 说明 |
|------|------|
| [CONTRACT.md](development/phase3/CONTRACT.md) | 合约管理功能 |
| [KLINE.md](development/phase3/KLINE.md) | K线数据功能 |
| [LOCK.md](development/phase3/LOCK.md) | 数据锁定功能 |
| [MULTI_STRATEGY.md](development/phase3/MULTI_STRATEGY.md) | 多策略支持 |
| [ROLLOVER.md](development/phase3/ROLLOVER.md) | 换月功能 |
| [STRATEGY_PARAMS.md](development/phase3/STRATEGY_PARAMS.md) | 策略参数管理 |

---

## 📁 目录结构说明

```
docs/
├── README.md              # 本文档 - 文档索引
├── PROJECT_STATUS.md      # 项目当前状态
│
├── integration/           # 集成指南
│   ├── POLAR_INTEGRATION.md
│   ├── V12_INTEGRATION_GUIDE.md
│   └── V12_INTEGRATION_VISUAL_GUIDE.md
│
├── deployment/            # 部署指南
│   └── DEPLOYMENT.md
│
└── development/           # 开发过程文档
    ├── phase2/            # Phase 2 开发记录
    │   ├── COMPLETE.md
    │   └── GUIDE.md
    └── phase3/            # Phase 3 开发记录
        ├── CONTRACT.md
        ├── KLINE.md
        ├── LOCK.md
        ├── MULTI_STRATEGY.md
        ├── ROLLOVER.md
        └── STRATEGY_PARAMS.md
```

---

## 🔍 文档更新说明

- **最后整理**: 2025-12-18
- **维护方式**: 所有开发过程文档统一存放在 `docs/` 目录
- **命名规范**: 移除了 `PHASE` 前缀，使用更简洁的文件名

---

**返回**: [项目首页](../README.md) | [快速开始](../QUICKSTART.md)
