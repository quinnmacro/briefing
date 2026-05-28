# Briefing — 金融参阅材料生成器

YAML 模板驱动的金融参阅材料 Word 文档（.docx）生成工具。

**核心设计**：Claude 编排数据采集与内容写作，Node.js 纯渲染器输出排版文档——两者完全解耦。

---

## 架构

```
/briefing → Claude 读 YAML 模板
  → xbbg 采 Bloomberg 数据
  → Tavily 采新闻与定性数据
  → 公文体写作
  → 组 manifest JSON
  → node src/index.js 读 YAML + JSON → 渲染 .docx → 输出文件
```

Node.js generator **不做任何网络调用、不调 MCP、不写内容**。它只做一件事：读 YAML 模板 + JSON manifest → 输出排版规范的 .docx。所有数据采集和写作由 Claude 完成。

---

## 项目结构

```
briefing/
├── src/                          # docx 渲染器（ESM，纯渲染）
│   ├── index.js                  # CLI 入口: --template --manifest --output
│   ├── styles.js                 # 字体/字号常量（宋体、黑体、Times New Roman）
│   ├── helpers.js                # run/para/bodyPara/h1-h3/table helpers
│   ├── renderer.js               # manifest blocks → docx elements
│   ├── assembler.js              # Document shell + Packer（A4、页眉页脚）
│   └── template-loader.js        # YAML + JSON 读写合并
│
├── assets/                       # YAML 模板
│   ├── gaofang-reference.yaml    # 高访参阅材料（7章完整版）
│   └── financial-briefing.yaml   # 通用金融简报（5章框架）
│
├── scripts/                      # 数据采集脚本
│   ├── fetch_bbg.py              # Bloomberg 数据（xbbg + BLPAPI，27系列）
│   └── tavily_search.py          # Tavily AI Search（新闻/定性数据）
│
├── references/                   # 规范文档
│   ├── yaml-schema.md            # YAML 模板字段规范
│   ├── mcp-data-mapping.md       # Bloomberg series → 章节 对照表
│   └── tone.md                   # 公文体写作规范
│
├── SKILL.md                      # Claude Code skill 定义
├── .env.example                  # 环境变量模板
├── .env                          # 实际环境变量（gitignored）
└── state/                        # 版本状态（gitignored）
    └── last-version.json
```

---

## 使用方式

### Claude Code Skill

在 Claude Code 中直接调用 skill：

| 命令 | 模板 | 说明 |
|------|------|------|
| `/briefing` | gaofang-reference | 高访参阅材料（7章完整版） |
| `/briefing financial` | financial-briefing | 通用金融简报（5章框架） |
| `/briefing update` | 同上次模板 | 重新采集数据 + 全量重写 |

Skill 工作流：读模板 → xbbg 采集 Bloomberg 数据 → Tavily 采集新闻 → 公文体写作 → 组 manifest JSON → 渲染 .docx → 更新版本号。

### 手动渲染

已有 manifest JSON 后可直接渲染 .docx：

```bash
node src/index.js \
  --template gaofang-reference \
  --manifest output/manifest_v23.json \
  --output output/高访参阅材料_v23.docx
```

---

## 数据采集

### Bloomberg Terminal（xbbg）

需要 Bloomberg Terminal 运行 + xbbg 安装：

```bash
pip install xbbg

# 抓取全部高访指标（27个系列）
python scripts/fetch_bbg.py --gaofang

# 抓取指定指标
python scripts/fetch_bbg.py --tickers DGS10,BRENT,GOLD --fields px_last,chg_pct_1m

# 加30天历史数据
python scripts/fetch_bbg.py --gaofang --history 30
```

输出 `output/bbg_gaofang.json`，包含 27 个系列的实时值 + 月度/日度涨跌幅。

**27个系列覆盖范围**：

| 类别 | 系列 | 说明 |
|------|------|------|
| US 国债 | DGS10, DGS2, DGS30, T10Y2Y | 10Y/2Y/30Y 收益率 + 10Y-2Y利差（计算值） |
| 政策利率 | EFFR, SOFR | 有效联邦基金利率 + SOFR |
| 波动率 | VIX, MOVE | CBOE VIX + MOVE 利率波动指数 |
| 全球10Y | DE10Y, GB10Y, JP10Y | 德/英/日10Y国债收益率（YAS_BOND_YLD field） |
| 信用利差 | IG_OAS, HY_OAS, EM_SPREAD | IG 73bp / HY 261bp / EM主权169bp |
| 风险资产 | SPX, DXY, BRENT, GOLD, SILVER | 标普500/美元指数/布伦特/黄金/白银 |
| 港股/A股 | HSI, HSCEI, HSTECH, SHCOMP, SZCOMP | 恒指/红筹/科技/上证/深证 |
| 汇率 | CNH, CNY, USDJPY | 离岸/在岸人民币 + 美日 |

**特殊处理**：
- **T10Y2Y 利差**：由 DGS10 - DGS2 计算（无直接 Bloomberg ticker）
- **全球10Y收益率**：通过 `YAS_BOND_YLD` field 取收益率（px_last 返回债券价格）
- **IG/HY OAS**：专用 OAS ticker（`LUACOAS Index` / `LF98OAS Index`），PX_LAST 直接返回利差
- **EM 主权利差**：`BSSUTRUU Index` + `INDEX_OAS_TSY_BP` field

### Tavily AI Search（结构化新闻检索）

比 WebSearch 结果更干净、更适合 LLM 消费的数据源：

```bash
pip install tavily-python python-dotenv

# 在 .env 中设置 TAVILY_API_KEY（get key at tavily.com）

# 运行全部高访搜索查询（12条）
python scripts/tavily_search.py --gaofang

# 单条搜索（basic 模式，快速）
python scripts/tavily_search.py --query "Iran war oil price May 2026"

# 深度搜索（advanced 模式，更多结果但更慢）
python scripts/tavily_search.py --query "长鑫科技科创板IPO" --search-depth advanced

# 提取文章全文内容
python scripts/tavily_search.py --extract https://www.reuters.com/article/...
```

输出 `output/tavily_results.json`，每条 query 返回结构化结果（标题、URL、内容摘要、相关性评分、发布日期）。advanced 模式还包含 `raw_content` 全文。

---

## 模板体系

### 高访参阅材料（gaofang-reference，7章）

| 章节 | 内容 | 数据源优先级 |
|------|------|-------------|
| 一、本期要点 | 10条 bold lead-in 要点 | xbbg → Tavily |
| 二、香港市场 | 宏观/银行/IPO/金融中心 | xbbg → Tavily |
| 三、中国宏观 | 增长/物价/产业政策 | Tavily → WebSearch |
| 四、主要经济体 | 美国/欧元区/日本 | xbbg → Tavily |
| 五、全球金融 | 利率/权益/商品 | xbbg 27系列 |
| 六、热点头条 | 动态选题（每版不同） | Tavily → WebSearch |
| 七、附录 | 4张数据速查表 | xbbg → Tavily |

第六章（热点头条）为**动态章节**：每版由 Claude 根据当期新闻决定选题，不硬编码。常见方向参考（非必须覆盖）：AI/算力产业链、半导体与存储、重要IPO进展、出口管制与供应链、地缘冲突、香港新经济热点。也可出现全新专题。

### 通用金融简报（financial-briefing，5章）

精简框架：概要 / 市场概况 / 重点议题 / 数据表 / 前瞻。适合非高访场景的周期性简报。

---

## 写作规范

参阅材料属于"内部参阅、高层决策支持"性质，文风介于公文与研究报告之间（详见 `references/tone.md`）：

- **bold lead-in + 数据支撑**：每段以1—2句加粗概括开头，后续数据展开不加粗
- **精确**：每个数据点必须有出处和时点
- **简洁**：一句话讲一个事实，不铺陈、不抒情
- **中性**：陈述事实和趋势，不做主观判断
- **数字格式**："+5.9%"（正号）、"-0.3%"（负号）、1,104亿港元（千位逗号）、25,000—27,000（中文连接号）

---

## 依赖

| 依赖 | 用途 | 安装 |
|------|------|------|
| Node.js + npm | .docx 渲染 | `npm install`（docx, yaml） |
| Python + xbbg | Bloomberg 直连数据 | `pip install xbbg` |
| Python + tavily-python | 结构化新闻搜索 | `pip install tavily-python python-dotenv` |
| Bloomberg Terminal | 实时金融数据源 | 本地 Terminal 运行 |
| Claude Code | 编排 + 写作 + skill | Claude Code CLI |

---

## 版本管理

- `state/last-version.json` 跟踪版本号（每次 `/briefing` 自增）
- `output/manifest_v{N}.json` 为每版内容存档
- `output/{title}_v{N}.docx` 为最终输出文档
- 每次更新为**全量重写**——数字和内容均重新采集与写作

---

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

```
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx    # Tavily AI Search API key
```

Bloomberg Terminal 数据通过 xbbg 直连，无需 API key。