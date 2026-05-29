// Renderer: manifest blocks → docx Paragraph/Table elements
// Pure function layer — no network, no MCP, no randomness

import { Paragraph, TextRun, Table, TableRow, Header, Footer,
         AlignmentType, BorderStyle, PageNumber, ShadingType, WidthType } from "docx";
import { SZ_TITLE, SZ_FOOTER, FONT_HEAD, FONT_HEAD_LATIN, FONT_BODY, FONT_BODY_LATIN } from "./styles.js";
import * as H from "./helpers.js";

function renderRuns(runs) {
  return runs.map(r => H.run(r.text, { bold: r.bold || false, color: r.color || "000000" }));
}

function renderBlock(block) {
  switch (block.type) {
    case "body_para":
      if (block.runs) return H.bodyPara(renderRuns(block.runs));
      return H.bodyPara(block.text, { bold: block.bold, color: block.color });

    case "flush_para":
      if (block.runs) return H.flushPara(renderRuns(block.runs));
      return H.flushPara(block.text, { bold: block.bold, color: block.color });

    case "num_item":
      return H.numItem(block.n, block.text);

    case "h1":
      return H.h1(block.text);

    case "h2":
      return H.h2(block.text);

    case "h3":
      return H.h3(block.text);

    case "page_break":
      return H.pageBreak();

    case "blank":
      return H.blank(block.size);

    case "rich_text":
      return H.para(renderRuns(block.runs), {
        alignment: block.alignment || AlignmentType.JUSTIFIED,
        indent: block.indent,
        line: block.line || 380,
        after: block.after || 100,
      });

    case "data_table":
      return renderTable(block);

    default:
      return H.bodyPara(block.text || `[unknown block type: ${block.type}]`);
  }
}

function renderTable(block) {
  const colWidths = block.columns.map(c => c.width || 2000);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  const headerRow = new TableRow({
    children: block.columns.map((c, i) =>
      H.thCell(c.header, colWidths[i])
    )
  });

  const dataRows = block.rows.map(row =>
    new TableRow({
      children: row.cells.map((cell, i) =>
        H.tdCell(cell, colWidths[i], block.columns[i]?.align)
      )
    })
  );

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

export function renderCover(config, manifest) {
  const elements = [];
  const titleSize = config.cover?.title_size || SZ_TITLE;
  const subSize = config.cover?.subtitle_size || 32;
  const subColor = config.cover?.subtitle_color || "404040";

  elements.push(new Paragraph({ children: [H.run("")], spacing: { after: 400 } }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: manifest.title || config.document?.title || "",
      font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
      size: titleSize, bold: true, color: "000000"
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 200, line: 480 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: manifest.subtitle || config.document?.subtitle || "",
      font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
      size: subSize, bold: false, color: subColor
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240, line: 400 },
  }));

  if (config.cover?.rule) {
    elements.push(new Paragraph({
      children: [H.run("")],
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 1 } },
      spacing: { after: 360 }
    }));
  }

  return elements;
}

export function renderTOC(manifest, config) {
  const elements = [];
  const tocTitle = config.toc?.title || "目  录";
  const tocTitleSize = config.toc?.title_size || 34;

  elements.push(new Paragraph({
    children: [new TextRun({
      text: tocTitle,
      font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
      size: tocTitleSize, bold: true
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 360, line: 400 },
  }));

  let page = 1;
  for (const chapter of manifest.chapters) {
    if (chapter.heading) {
      elements.push(H.tocEntry(chapter.heading, String(page)));
    }
    if (chapter.sections) {
      for (const section of chapter.sections) {
        if (section.heading) {
          elements.push(H.tocEntrySub(section.heading, String(page)));
        }
      }
    }
    page++;
  }

  // Date line
  const dateText = manifest.date || "";
  if (dateText) {
    const dateTemplate = config.document?.date_template || "数据截止：{date}";
    const dateStr = dateTemplate.replace("{date}", dateText);
    elements.push(new Paragraph({
      children: [new TextRun({
        text: dateStr,
        font: { ascii: FONT_BODY_LATIN, eastAsia: FONT_BODY },
        size: 24, color: "606060"
      })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 600, after: 0 },
    }));
  }

  return elements;
}

export function renderChapter(chapter) {
  const elements = [];

  if (chapter.heading) elements.push(H.h1(chapter.heading));

  // Render top-level blocks
  if (chapter.blocks) {
    for (const block of chapter.blocks) {
      elements.push(renderBlock(block));
    }
  }

  // Render sub-sections
  if (chapter.sections) {
    for (const section of chapter.sections) {
      if (section.heading) elements.push(H.h2(section.heading));
      if (section.blocks) {
        for (const block of section.blocks) {
          elements.push(renderBlock(block));
        }
      }
    }
  }

  return elements;
}

export function renderAll(manifest, config) {
  const content = [];

  // Cover + TOC
  content.push(...renderCover(config, manifest));
  content.push(...renderTOC(manifest, config));
  content.push(H.pageBreak());

  // Chapters
  for (const chapter of manifest.chapters) {
    content.push(...renderChapter(chapter));
  }

  return content;
}
