# Briefing

> YAML 模板驱动的金融参阅材料 Word 文档生成器 — Claude 编排数据与写作，Node.js 纯渲染输出

---

## 为什么做这个？

传统方式：每次更新参阅材料都要手动改代码里的数据点。847 行硬编码的 `build.js`，改一个数字要翻半天。

Briefing 把这个问题拆成三层：

| 层 | 职责 | 工具 |
|----|------|------|
| **数据层** | 采集实时行情、宏观数据、新闻 | xbbg / Tavily / WebSearch |
| **内容层** | 公文体写作、数据编排 | Claude Code |
| **渲染层** | YAML + JSON → 排版 .docx | Node.js（零网络调用） |

三层完全解耦。数据变了只改 manifest，排版变了只改模板，互不干扰。

---

## 一句话架构

```
Claude 读 YAML → 采 Bloomberg 数据 → 采 Tavily 新闻 → 公文体写作 → 组 manifest JSON
  → node src/index.js 渲染 .docx → 更新版本号
```

渲染器**不做任何网络调用、不调 MCP、不写内容**。它只做一件事：读 YAML + JSON → 输出排版规范的 Word 文档。

---

## 快速开始

### 安装

```bash
# Node.js 渲染器
npm install

# Python 数据采集
pip install xbbg tavily-python python-dotenv

# 环境变量
cp .env.example .env
# 在 .env 中填写 TAVILY_API_KEY（tavily.com 注册获取）
```

### 生成第一份参阅材料

```bash
# 1. 采集 Bloomberg 数据（需要 Terminal 运行）
python scripts/fetch_bbg.py --gaofang

# 2. 采集新闻与定性数据
python scripts/tavily_search.py --gaofang

# 3. 在 Claude Code 中调用 skill
/briefing
```

Skill 自动完成：读模板 → 采集数据 → 写作 → 组 manifest → 渲染 .docx → 更新版本。

### 手动渲染（已有 manifest 时）

```bash
node src/index.js \
  --template gaofang-reference \
  --manifest output/manifest_v23.json \
  --output output/高访参阅材料_v23.docx
```

---

## Skill 命令

| 命令 | 产出 | 说明 |
|------|------|------|
| `/briefing` | 高访参阅材料（7章） | gaofang-reference 模板 |
| `/briefing financial` | 通用金融简报（5章） | financial-briefing 模板 |
| `/briefing update` | 同上次模板 | 全量重写：数据重采、内容重写 |

---

## 项目结构

```
briefing/
├── src/                          # 渲染器（ESM，零网络调用）
│   ├── index.js                  # CLI: --template --manifest --output
│   ├── styles.js                 # 宋体/黑体/TNR 字体字号常量
│   ├── helpers.js                # paragraph / table / heading helpers
│   ├── renderer.js               # manifest blocks → docx 元素
│   ├── assembler.js              # Document + Packer（A4、页眉页脚）
│   └── template-loader.js        # YAML/JSON 读写合并
│
├── assets/                       # YAML 模板
│   ├── gaofang-reference.yaml    # 7章高访版（27 Bloomberg 系列绑定）
│   └── financial-briefing.yaml   # 5章通用框架
│
├── scripts/                      # 数据采集
│   ├── fetch_bbg.py              # Bloomberg Terminal → xbbg（27系列）
│   └── tavily_search.py          # Tavily AI Search（新闻检索 + 全文提取）
│
├── references/                   # 写作规范
│   ├── yaml-schema.md            # 模板字段定义
│   ├── mcp-data-mapping.md       # Bloomberg 系列 → 章节映射
│   └── tone.md                   # 公文体规范
│
├── SKILL.md                      # Claude Code skill 定义
├── .env.example                  # 环境变量模板（复制为 .env 填写 key）
└── output/                       # 生成物（gitignored）
    ├── manifest_v23.json         # 每版内容存档
    ├── 高访参阅材料_v23.docx     # 最终 Word 文档
    ├── bbg_gaofang.json          # Bloomberg 原始数据
    └── tavily_results.json       # Tavily 搜索结果
```

---

## 数据采集

### Bloomberg Terminal — xbbg 直连

27 个金融系列，一次抓完，无需 API key：

```bash
# 全量抓取
python scripts/fetch_bbg.py --gaofang

# 指定系列
python scripts/fetch_bbg.py --tickers DGS10,BRENT,GOLD --fields px_last,chg_pct_1m

# 加历史数据
python scripts/fetch_bbg.py --gaofang --history 30
```

| 类别 | 系列 | Bloomberg Ticker | 说明 |
|------|------|-----------------|------|
| US 国债收益率 | DGS10 | USGG10YR Index | 10Y |
| | DGS2 | USGG2YR Index | 2Y |
| | DGS30 | USGG30YR Index | 30Y |
| | T10Y2Y | *计算值* | 10Y−2Y = 44bp |
| 政策利率 | EFFR | FEDL01 Index | 联邦基金利率 |
| | SOFR | SOFRRATE Index | SOFR |
| 波动率 | VIX | VIX Index | CBOE VIX |
| | MOVE | MOVE Index | 利率波动 |
| 全球10Y收益率 | DE10Y | GTDEM10Y Govt | 德债 → `YAS_BOND_YLD` |
| | GB10Y | GTGBP10Y Govt | 英债 → `YAS_BOND_YLD` |
| | JP10Y | GTJPY10Y Govt | 日债 → `YAS_BOND_YLD` |
| 信用利差 | IG_OAS | LUACOAS Index | IG OAS 73bp |
| | HY_OAS | LF98OAS Index | HY OAS 261bp |
| | EM_SPREAD | BSSUTRUU Index | EM 主权 169bp → `INDEX_OAS_TSY_BP` |
| 风险资产 | SPX | SPX Index | 标普500 |
| | DXY | DXY Curncy | 美元指数 |
| | BRENT | COA Comdty | 布伦特原油 |
| | GOLD | GOLDS Comdty | 黄金 |
| | SILVER | SILV Comdty | 白银 |
| 港股 / A股 | HSI | HSI Index | 恒指 |
| | HSCEI | HSCEI Index | 红筹 |
| | HSTECH | HSTECH Index | 恒生科技 |
| | SHCOMP | SHCOMP Index | 上证 |
| | SZCOMP | SZCOMP Index | 深证 |
| 汇率 | CNH | USDCNH Curncy | 离岸人民币 |
| | CNY | USDCNY Curncy | 在岸人民币 |
| | USDJPY | USDJPY Curncy | 美日 |

> px_last 对 Govt 类 ticker 返回债券价格而非收益率。全球10Y系列通过 `YAS_BOND_YLD` field 单独取收益率。

### Tavily AI Search — 结构化新闻检索

比 WebSearch 结果更干净、噪音更少，专为 LLM 消费优化：

```bash
# 高访模板预置12条查询
python scripts/tavily_search.py --gaofang

# 单条搜索
python scripts/tavily_search.py --query "Iran war oil price 2026"

# 深度搜索（结果更多但更慢）
python scripts/tavily_search.py --query "长鑫科技科创板IPO" --search-depth advanced

# 提取网页全文
python scripts/tavily_search.py --extract https://reuters.com/article/...
```

每条结果包含：标题、URL、内容摘要、相关性评分、发布日期。`advanced` 模式可选 `raw_content` 全文。

---

## 模板体系

### 高访参阅材料（7章）

```
一、本期要点 ──────── 10条 bold lead-in 要点 ── xbbg + Tavily
二、香港市场
    （一）宏观经济 ─── GDP/CPI/失业/零售 ────── xbbg + Tavily
    （二）银行体系 ──── 存款/贷款/按揭/HIBOR ── Tavily
    （三）资本市场 ──── IPO/ADT/互联互通 ────── xbbg + Tavily
    （四）金融中心 ──── IMF/离岸人民币/北都 ─── Tavily
三、中国宏观
    （一）增长与需求 ── GDP/工业/消费/外贸 ───── Tavily + WebSearch
    （二）物价与货币 ── CPI/PPI/LPR/AIC ─────── Tavily + WebSearch
四、主要经济体
    （一）美国 ───────── GDP/FOMC/沃什交易 ──── xbbg + Tavily
    （二）欧元区 ──────── GDP/HICP/ECB ──────── xbbg + Tavily
    （三）日本 ────────── BOJ/春斗/USDJPY ──── xbbg + Tavily
五、全球金融市场 ──── 利率/权益/商品 ──────── xbbg 27系列
六、热点头条 ──────── 动态选题（每版不同） ── Tavily + WebSearch
七、附录 ──────────── 4张数据速查表 ──────── xbbg + Tavily
```

第六章为**动态章节**——每版由 Claude 根据当期新闻决定选题，不硬编码。方向参考：AI算力产业链、半导体存储IPO、出口管制与供应链、地缘冲突（伊朗）、香港新经济热点。也可出现全新专题。

### 通用金融简报（5章）

概要 → 市场概况 → 重点议题 → 数据表 → 前瞻。适合非高访场景的周期性简报。

---

## 写作规范

参阅材料 = 公文体 + 研究报告，服务于高层决策支持（完整规范见 `references/tone.md`）：

```
✅ bold lead-in + 数据支撑     ❌ "据悉"、"据了解"（模糊来源）
✅ 一句话一个事实              ❌ "值得关注"、"令人瞩目"（主观判断）
✅ 数据必须有出处和时点        ❌ 比喻、排比、感叹号
✅ +5.9% / 1,104亿港元         ❌ Q1（写"一季度"）
✅ 25,000—27,000               ❌ 英文缩写替代中文
```

---

## 数据源优先级

```
xbbg（Bloomberg 直连）  ── 行情数据，最优先
  ↓
Tavily AI Search       ── 新闻/定性数据，结构化、低噪音
  ↓
WebSearch / WebFetch   ── 兜底补充
  ↓
openecon MCP           ── 宏观指标（当前待修复）
```

---

## 版本管理

每次 `/briefing` 触发全量重写——版本号自动递增，所有数字和内容重新采集与写作：

```
state/last-version.json    → 版本号追踪
output/manifest_v{N}.json  → 每版内容存档
output/高访参阅材料_v{N}.docx → 最终 Word 文档
```

当前版本：**v23**（2026-05-28）

---

## 环境变量

```bash
cp .env.example .env
```

| 变量 | 说明 | 获取 |
|------|------|------|
| `TAVILY_API_KEY` | Tavily Search API | [tavily.com](https://tavily.com) 注册 |
| Bloomberg | 通过 xbbg 直连 Terminal | 无需 key，本地 Terminal 运行即可 |

`.env` 已 gitignore，不会泄露 key。

---

## 依赖

| 依赖 | 用途 | 安装 |
|------|------|------|
| Node.js + npm | .docx 渲染 | `npm install` |
| Python + xbbg | Bloomberg 直连 | `pip install xbbg` |
| Python + tavily-python | Tavily Search | `pip install tavily-python python-dotenv` |
| Bloomberg Terminal | 实时行情 | 本地运行 |
| Claude Code | 编排 + 写作 | CLI / Desktop / VS Code |

---

## License

Private repository — internal use only.