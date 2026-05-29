# Changelog

## [1.0.0] - 2026-05-28

### Added
- **Core renderer**: Node.js ESM docx generator (`src/`) — pure rendering, zero network calls
  - `index.js` CLI entry point: `--template --manifest --output`
  - `styles.js` 宋体/黑体/TNR font and size constants
  - `helpers.js` paragraph, table, heading, TOC helper functions
  - `renderer.js` manifest block → docx element dispatcher
  - `assembler.js` Document shell + Packer (A4, page header/footer)
  - `template-loader.js` YAML/JSON read and merge
- **Templates**: Two YAML templates for different briefing formats
  - `gaofang-reference.yaml` — 7-chapter high-level visit briefing (27 Bloomberg series)
  - `financial-briefing.yaml` — 5-chapter general financial briefing framework
- **Data scripts**: Python data fetchers for Bloomberg and Tavily
  - `fetch_bbg.py` — Bloomberg Terminal via xbbg (27 series, yield/spread/OAS handling)
  - `tavily_search.py` — Tavily AI Search (12 predefined queries, URL extraction)
- **Skill**: `SKILL.md` for Claude Code `/briefing` command
- **References**: Writing style guide (`tone.md`), YAML schema (`yaml-schema.md`), data mapping (`mcp-data-mapping.md`)
- **State tracking**: `state/last-version.json` for version management
- **v23 manifest**: Complete 7-chapter briefing with real Bloomberg data from 2026-05-28

### Security
- Path traversal protection in `template-loader.js` (template name sanitization, manifest path validation)
- Path traversal protection in `fetch_bbg.py` and `tavily_search.py` (output path validated against workspace root)
- `.env` gitignored (TAVILY_API_KEY protection)

### Changed
- Replaced 847-line monolithic `build.js` with modular 3-layer architecture:
  - Data layer (xbbg/Tavily) → Content layer (Claude) → Rendering layer (Node.js)