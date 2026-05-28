# Briefing — 金融参阅材料生成器

YAML 模板驱动的金融参阅材料 Word 文档（.docx）生成工具。Claude 编排数据采集与内容写作，Node.js 纯渲染器输出排版文档。

## 架构

```
/briefing → Claude 读 YAML 模板 → 调 xbbg/WebSearch/MCP 拿数据 → 写 manifest JSON
  → node src/index.js 读 YAML + JSON → 渲染 .docx → 输出文件
```

Node.js generator 不做任何网络调用、不调 MCP、不写内容。它只做一件事：读 YAML 模板 + JSON manifest → 输出排版规范的 .docx。

## 项目结构

```
├── src/                          # docx 渲染器（ESM，纯渲染）
│   ├── index.js                  # CLI: --template --manifest --output
│   ├── styles.js                 # 字体/字号常量
│   ├── helpers.js                # run/para/bodyPara/h1-h3/table helpers
│   ├── renderer.js               # manifest blocks → docx elements
│   ├── assembler.js              # Document shell + Packer
│   └── template-loader.js        # YAML + JSON 读写合并
│
├── assets/                       # YAML 模板
│   ├── gaofang-reference.yaml    # 高访参阅材料（7章完整版）
│   ├── financial-briefing.yaml   # 通用金融简报（5章框架）
│
├── scripts/
│   └── fetch_bbg.py              # Bloomberg 数据抓取（xbbg + BLPAPI）
│
├── references/
│   ├── yaml-schema.md            # YAML 模板字段规范
│   ├── mcp-data-mapping.md       # Bloomberg series → data_slot 对照表
│   └── tone.md                   # 公文体写作规范
│
├── SKILL.md                      # Claude Code skill 定义
├── state/                        # 版本状态（gitignored）
└── output/                       # 生成的 manifest + .docx（gitignored）
```

## 使用方式

### Claude Code Skill

在 Claude Code 中直接调用 skill：

```
/briefing           → 高访参阅材料（gaofang-reference）
/briefing financial → 通用金融简报（financial-briefing）
/briefing update    → 重新采集数据 + 全量重写
```

Skill 工作流：读模板 → xbbg 采集 Bloomberg 数据 → WebSearch 补充宏观/新闻 → 公文体写作 → 组 manifest JSON → 渲染 .docx → 更新版本号。

### 手动渲染

已有 manifest JSON 后可直接渲染：

```bash
node src/index.js --template gaofang-reference --manifest output/manifest_v23.json --output output/高访参阅材料_v23.docx
```

### Bloomberg 数据采集

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

输出 `output/bbg_gaofang.json`，包含 27 个系列的实时值 + 月度/日度涨跌幅。特殊处理：
- **10Y-2Y 利差**：由 DGS10 - DGS2 计算（无直接 ticker）
- **全球 10Y 国债收益率**：通过 `YAS_BOND_YLD` field 取收益率（px_last 返回债券价格）
- **IG/HY OAS**：专用 OAS ticker（`LUACOAS Index` / `LF98OAS Index`），PX_LAST 直接返回利差
- **EM 主权利差**：`BSSUTRUU Index` + `INDEX_OAS_TSY_BP` field

## 模板体系

### 高访参阅材料（7章）

| 章节 | 内容 | 数据源 |
|------|------|--------|
| 一、本期要点 | 10条 bold lead-in 要点 | Bloomberg + WebSearch |
| 二、香港市场 | 宏观/银行/IPO/金融中心 | Bloomberg + openecon |
| 三、中国宏观 | 增长/物价/产业政策 | openecon + WebSearch |
| 四、主要经济体 | 美国/欧元区/日本 | Bloomberg + WebSearch |
| 五、全球金融 | 利率/权益/商品 | Bloomberg 27系列 |
| 六、热点头条 | 动态选题（每版不同） | WebSearch |
| 七、附录 | 4张数据速查表 | Bloomberg + WebSearch |

第六章（热点头条）为动态章节，每版由 Claude 根据当期新闻决定选题，不硬编码。

### 通用金融简报（5章）

精简框架：概要 / 市场概况 / 重点议题 / 数据表 / 前瞻。适合非高访场景的周期性简报。

## 依赖

| 依赖 | 用途 |
|------|------|
| Node.js + npm | .docx 渲染（docx, yaml 包） |
| Python + xbbg | Bloomberg Terminal 直连数据采集 |
| Bloomberg Terminal | 实时金融数据源 |
| Claude Code | 数据编排、内容写作、skill 调用 |
| WebSearch/WebFetch | 新闻与定性数据补充 |

## 版本管理

- `state/last-version.json` 跟踪版本号（每次 /briefing 自增）
- `output/manifest_v{N}.json` 为每版内容存档
- `output/{title}_v{N}.docx` 为最终输出文档
- 每次更新为全量重写——数字和内容均重新采集与写作