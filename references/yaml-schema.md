# YAML模板字段规范

## 顶层字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `document` | object | ✅ | 文档元信息：title, subtitle, creator, header_template, date_template |
| `page` | object | ✅ | 页面配置：size (A4), margins (DXA单位) |
| `styles` | object | ❌ | 字体/字号覆盖，缺省使用styles.js内置值 |
| `cover` | object | ❌ | 封面配置：title_size, subtitle_size, subtitle_color, rule |
| `toc` | object | ❌ | 目录配置：title, title_size |
| `chapters` | array | ✅ | 章节结构定义 |
| `tables` | array | ❌ | 附录表格schema定义 |

## chapters 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 章节唯一标识，用于manifest中的内容映射 |
| `heading` | string | ✅ | 章节标题（如"一、本期要点"） |
| `instructions` | string | ✅ | Claude写作指引：内容范围、风格、篇幅 |
| `data_sources` | array | ❌ | MCP数据源绑定列表 |
| `sections` | array | ❌ | 子节列表（同chapters格式，但heading为"（一）xxx"） |

## data_sources 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `mcp` | string | MCP服务标识：`quinnmacro_bloomberg`, `openecon_data`, `WebSearch` |
| `tool` | string | MCP工具名（如`get_bbg_by_ticker`） |
| `series` | array | Bloomberg系列ID列表 |
| `queries` | array | openecon自然语言查询列表 |

## tables 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 表格唯一标识 |
| `title` | string | 表标题（如"表一 主要经济体核心指标"） |
| `columns` | array | 列定义：{header, width, align} |
| `data_sources` | array | 同chapters格式 |

## JSON Manifest Schema

Manifest由Claude每版组装，包含所有内容：

```json
{
  "template": "模板名称",
  "version": 版本号,
  "date": "日期",
  "title": "封面标题（可覆盖模板）",
  "subtitle": "封面副标题",
  "chapters": [
    {
      "id": "章节id（匹配模板）",
      "heading": "章节标题（可覆盖模板）",
      "blocks": [...],       // 顶层block列表
      "sections": [
        {
          "id": "子节id",
          "heading": "子节标题",
          "blocks": [...]
        }
      ]
    }
  ]
}
```

## Block类型

| type | 字段 | 说明 |
|------|------|------|
| `body_para` | text 或 runs | 正文段落，首行缩进560 DXA |
| `flush_para` | text 或 runs | 不缩进段落 |
| `num_item` | n, text | 编号要点（如"1、xxx"） |
| `h1` | text | 一级标题 |
| `h2` | text | 二级标题 |
| `h3` | text | 三级标题 |
| `page_break` | 无 | 分页 |
| `blank` | size (可选) | 空行 |
| `data_table` | columns, rows | 数据表格 |
| `rich_text` | runs, alignment, indent, line, after | 自定义段落 |

### runs 数组

```json
[
  { "text": "加粗文字。", "bold": true, "color": "000000" },
  { "text": "正常文字。" }
]
```

### data_table

```json
{
  "type": "data_table",
  "columns": [
    { "header": "列标题", "width": 1500 }
  ],
  "rows": [
    { "cells": ["单元格1", "单元格2"] }
  ]
}
```