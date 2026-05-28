---
name: briefing
description: >
  Generate financial briefing Word documents (.docx) from YAML templates and MCP data sources.
  Use when the user asks to produce, update, or draft a 参阅材料, briefing, market report,
  高访参阅材料, financial summary, or any structured document that combines macro data with prose.
  Also use when the user says "/briefing", "生成材料", "更新材料", "写简报", "出参阅材料",
  or mentions producing a periodic market briefing document.
version: "1.0.0"
author: quinnmacro
---

# Briefing Skill — 金融参阅材料生成

## When to Use

Invoke this skill when:
- User says `/briefing`, `/briefing gaofang`, `/briefing financial`
- User asks to produce/update a 参阅材料, 简报, market briefing
- User mentions 高访参阅材料 or similar periodic documents

## Workflow

### Step 1: Select template

| Command | Template |
|---------|----------|
| `/briefing` or `/briefing gaofang` | `gaofang-reference.yaml` (7章高访版) |
| `/briefing financial` | `financial-briefing.yaml` (通用5章框架) |
| `/briefing <template_name>` | Custom template from `assets/` |

If `/briefing financial`, ask user what markets/topics to cover.

### Step 2: Read state and template

1. Read `state/last-version.json` → determine next version number (increment `last_version` by 1)
2. Read selected YAML template from `assets/` → extract chapter structure, data_sources, instructions
3. Read `references/tone.md` → writing register guidance

### Step 3: Gather MCP data

For each `data_sources` entry in the template:

**QuinnMacro Bloomberg MCP** (`quinnmacro_bloomberg`):
- `get_bbg_by_ticker` for each series → current value + 1m change
- `get_bbg_fed_path` when template references Fed rate path
- `get_bbg_by_ticker_history` for trend context (optional)

**xbbg direct (preferred)** — if Bloomberg Terminal is running locally:
- Run `python scripts/fetch_bbg.py --gaofang` to fetch all gaofang tickers at once
- Run `python scripts/fetch_bbg.py --tickers DGS10,BRENT --fields px_last,px_last_1m_chng_pct` for specific tickers
- Output: `output/bbg_data.json` with current values + optional history
- xbbg gives direct Terminal access: faster, more fields, no latency or auth issues
- Ticker mapping: see `scripts/fetch_bbg.py` GAOFANG_TICKERS dict (short IDs → Bloomberg tickers)

**OpenEcon Data MCP** (`openecon_data`):
- `query_data` for each natural language query in data_sources

**WebSearch/WebFetch** for qualitative data not covered by MCP:
- IPO details, policy news, geopolitical developments

**Tavily AI Search** (preferred over WebSearch for structured research):
- Run `python scripts/tavily_search.py --gaofang` for all gaofang briefing queries
- Run `python scripts/tavily_search.py --query "Iran war oil price"` for single query
- Run `python scripts/tavily_search.py --extract URL1,URL2` to pull full article content
- `--search-depth advanced` for deeper research (default: basic)
- Output: `output/tavily_results.json` with structured results per query
- Requires: `TAVILY_API_KEY` in `.env` (get key at tavily.com)

Priority: xbbg > Tavily > WebSearch > openecon MCP

Collect all data into a structured notebook before writing prose.

### Step 4: Compose content

For each chapter/section:
1. Follow `instructions` field for content scope and tone
2. Write fresh prose incorporating MCP numerical data
3. Use tone.md register: bold lead-in + data body, 公文体, no subjective judgments
4. Fill table row data from MCP results for `data_table` blocks

### Step 5: Assemble JSON manifest

Write manifest to `output/manifest_v{N}.json` following the schema in `references/yaml-schema.md`.

Key rules:
- Use `runs` array for mixed bold/normal text paragraphs
- Use `text` shorthand for plain paragraphs
- Use `data_table` blocks with `columns` (from template) + `rows` (from data)
- Insert `page_break` between major chapters

### Step 6: Generate .docx

Run:
```bash
node src/index.js --template {template_name} --manifest output/manifest_v{N}.json --output output/{title}_v{N}.docx
```

The generator is a pure renderer — no network, no MCP, no randomness.

### Step 7: Update state

Write updated `state/last-version.json` with incremented version and date.

### Step 8: Report

Tell user:
- Output file path
- Key data highlights (what changed vs last edition)
- Any data gaps or fallbacks used

## Update Mode

When user says "更新材料" or `/briefing update`:
- Same workflow, but re-gather all MCP data (numbers change, prose may need adjustment)
- Full rewrite — every edition is a complete rebuild
- Manifest and .docx are archived in `output/`

## Output

Files produced:
- `output/manifest_v{N}.json` — archival content record
- `output/{title}_v{N}.docx` — the Word document

## Dependencies

- Node.js + npm (docx, yaml packages) — for .docx generation
- Python + xbbg + Bloomberg Terminal — for direct Bloomberg data fetching
- Python + tavily-python + python-dotenv — for Tavily AI Search
- QuinnMacro Bloomberg MCP (deployed at mcp.quinnmacro.com) — alternative data source
- OpenEcon Data MCP (installed as plugin) — macro indicators
- WebSearch/WebFetch for qualitative data