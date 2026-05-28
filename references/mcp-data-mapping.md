# QuinnMacro Bloomberg MCP → 数据映射

## MCP工具概览

| 工具 | 参数 | 返回 |
|------|------|------|
| `get_bbg_list_series` | 无 | 47系列完整目录 |
| `get_bbg_by_ticker` | ticker (必填) | ~35条观测 + 1月变动 |
| `get_bbg_by_ticker_history` | ticker (必填) | 最多10年历史 |
| `get_bbg_fed_path` | 无 | 隐含联储路径 |

## 系列分类 → 简报章节映射

### 美国国债 (US Treasury)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| DGS1MO | 1月期 | 短端利率参考 |
| DGS3MO | 3月期 | 短端利率参考 |
| DGS2 | 2年期 | 2s10s利差计算 |
| DGS10 | 10年期 | 全球定价锚、各章引用 |
| DGS30 | 30年期 | 长端参考 |

### 利差 (Spreads)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| T10Y2Y | 10Y-2Y利差 | 衰退信号 |
| T10YIE | 10Y盈亏平衡通胀 | 通胀预期 |
| DFII10 | 10Y TIPS实际收益率 | 实际利率 |

### 政策利率 (Policy Rates)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| EFFR | 有效联邦基金利率 | 联储政策 |
| SOFR | 隔夜担保融资利率 | 市场基准 |

### 波动率 (Volatility)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| MOVE | 美债波动率指数 | 固收风险 |
| VIX | S&P波动率 | 权益风险 |

### 全球10Y (Global 10Y)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| DE10Y | 德国10Y Bund | 欧元区定价 |
| GB10Y | 英国10Y Gilt | 英国定价 |
| JP10Y | 日本10Y JGB | 日本定价+BOJ正常化 |

### 信用 (Credit)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| IG_OAS | 投资级利差 | 信用市场 |
| HY_OAS | 高收益利差 | 信用市场 |
| EM_SPREAD | 新兴主权利差 | EM风险 |

### 风险资产 (Risk Assets)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| SPX | S&P 500 | 美股参考 |
| DXY | 美元指数 | 汇率主线 |
| BRENT | 布伦特原油 | 能源/地缘 |
| GOLD | 黄金 | 避险/通胀 |
| SILVER | 白银 | 商品补充 |

### 联邦基金期货 (Fed Funds Futures)
| 系列ID | 说明 | 简报用途 |
|--------|------|----------|
| FF1M-FF12M | 1-12月合约 | 隐含利率路径 |
| FED_PATH | 隐含联储路径 | 主要经济体章节 |

## OpenEcon数据查询模板

| 章节 | 查询 |
|------|------|
| 香港概况 | "Hong Kong GDP Q1 2026", "Hong Kong CPI unemployment 2026", "Hong Kong retail sales" |
| 中国宏观 | "China GDP Q1 2026", "China CPI PPI April 2026", "China PMI 2026", "China trade 2026" |
| 主要经济体 | "US GDP Q1 2026", "US CPI April 2026", "Euro area GDP HICP Q1 2026", "Japan GDP CPI 2026" |

## 补充数据源

当MCP数据不覆盖时，使用WebSearch/WebFetch：
- IPO数据（港交所季报）
- 银行体系数据（金管局月报）
- 政策细节（FOMC纪要、ECB决议）
- 行业热点（半导体/AI/地缘新闻）