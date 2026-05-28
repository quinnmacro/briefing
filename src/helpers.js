// Helper functions for docx element construction
// Extracted from build.js lines 27-151
// All functions are pure docx element constructors — no content knowledge

import { TextRun, Paragraph, TableCell, TableRow, Table,
         AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
         TabStopType } from "docx";
import { FONT_BODY, FONT_BODY_LATIN, FONT_HEAD, FONT_HEAD_LATIN,
         SZ_BODY, SZ_H1, SZ_H2, SZ_H3, SZ_TOC, SZ_FOOTER } from "./styles.js";

export function run(text, opts = {}) {
  return new TextRun({
    text,
    font: {
      ascii: opts.headFont ? FONT_HEAD_LATIN : FONT_BODY_LATIN,
      eastAsia: opts.headFont ? FONT_HEAD : FONT_BODY
    },
    size: opts.size || SZ_BODY,
    bold: opts.bold || false,
    color: opts.color || "000000",
  });
}

export function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: opts.before || 0, after: opts.after || 120, line: opts.line || 360 },
    indent: opts.indent || undefined,
  });
}

export function bodyPara(text, opts = {}) {
  return para(
    typeof text === "string" ? run(text, opts) : text,
    { ...opts, indent: { firstLine: 560 }, line: 380, after: 100 }
  );
}

export function flushPara(text, opts = {}) {
  return para(
    typeof text === "string" ? run(text, opts) : text,
    { ...opts, line: 380, after: 80 }
  );
}

export function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({
      text,
      font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
      size: SZ_H1, bold: true, color: "000000"
    })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 240, line: 380 },
  });
}

export function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({
      text,
      font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
      size: SZ_H2, bold: true, color: "000000"
    })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 160, line: 360 },
  });
}

export function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({
      text,
      font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
      size: SZ_H3, bold: true, color: "000000"
    })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120, line: 360 },
  });
}

export function pageBreak() {
  return new Paragraph({
    children: [new TextRun({ break: 1 }), new TextRun({ text: "" })],
    pageBreakBefore: true
  });
}

export function blank(sz) {
  return new Paragraph({
    children: [run("", { size: sz || SZ_BODY })],
    spacing: { after: 60 }
  });
}

export function numItem(n, text) {
  return bodyPara([run(n + "、", { bold: true }), run(text)]);
}

const tBorder = { style: BorderStyle.SINGLE, size: 6, color: "808080" };
const tBorders = { top: tBorder, bottom: tBorder, left: tBorder, right: tBorder };

export function thCell(text, w) {
  return new TableCell({
    borders: tBorders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({
        text,
        font: { ascii: FONT_HEAD_LATIN, eastAsia: FONT_HEAD },
        size: SZ_BODY, bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { line: 320 },
    })]
  });
}

export function tdCell(text, w, align) {
  return new TableCell({
    borders: tBorders,
    width: { size: w, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({
        text,
        font: { ascii: FONT_BODY_LATIN, eastAsia: FONT_BODY },
        size: SZ_BODY
      })],
      alignment: align || AlignmentType.LEFT,
      spacing: { line: 320 },
    })]
  });
}

export function tocEntry(label, page) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, font: { ascii: FONT_BODY_LATIN, eastAsia: FONT_BODY }, size: SZ_TOC }),
      new TextRun({ text: "\t" }),
      new TextRun({ text: page, font: { ascii: FONT_BODY_LATIN, eastAsia: FONT_BODY }, size: SZ_TOC }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 8800, leader: "dot" }],
    spacing: { before: 120, after: 120, line: 380 },
  });
}

export function tocEntrySub(label, page) {
  return new Paragraph({
    children: [
      new TextRun({ text: "    " + label, font: { ascii: FONT_BODY_LATIN, eastAsia: FONT_BODY }, size: SZ_BODY }),
      new TextRun({ text: "\t" }),
      new TextRun({ text: page, font: { ascii: FONT_BODY_LATIN, eastAsia: FONT_BODY }, size: SZ_BODY }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 8800, leader: "dot" }],
    spacing: { before: 60, after: 60, line: 340 },
  });
}