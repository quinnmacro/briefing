// Style constants and Document style definitions
// Extracted from build.js lines 12-24, 784-803

export const FONT_BODY = "宋体";
export const FONT_BODY_LATIN = "Times New Roman";
export const FONT_HEAD = "黑体";
export const FONT_HEAD_LATIN = "Arial";

export const SZ_TITLE = 44;
export const SZ_H1 = 36;
export const SZ_H2 = 30;
export const SZ_H3 = 28;
export const SZ_BODY = 28;
export const SZ_TOC = 30;
export const SZ_FOOTER = 20;

const defaults = {
  FONT_BODY, FONT_BODY_LATIN, FONT_HEAD, FONT_HEAD_LATIN,
  SZ_TITLE, SZ_H1, SZ_H2, SZ_H3, SZ_BODY, SZ_TOC, SZ_FOOTER
};

export function mergeStyles(overrides = {}) {
  return {
    FONT_BODY: overrides.body_font || FONT_BODY,
    FONT_BODY_LATIN: overrides.body_font_latin || FONT_BODY_LATIN,
    FONT_HEAD: overrides.head_font || FONT_HEAD,
    FONT_HEAD_LATIN: overrides.head_font_latin || FONT_HEAD_LATIN,
    SZ_TITLE: overrides.title_size || SZ_TITLE,
    SZ_H1: overrides.h1_size || SZ_H1,
    SZ_H2: overrides.h2_size || SZ_H2,
    SZ_H3: overrides.h3_size || SZ_H3,
    SZ_BODY: overrides.body_size || SZ_BODY,
    SZ_TOC: overrides.toc_size || SZ_TOC,
    SZ_FOOTER: overrides.footer_size || SZ_FOOTER,
  };
}

export function defaultDocStyles(s) {
  return {
    default: {
      document: {
        run: {
          font: { ascii: s.FONT_BODY_LATIN, eastAsia: s.FONT_BODY },
          size: s.SZ_BODY
        }
      }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: s.SZ_H1, bold: true, font: { ascii: s.FONT_HEAD_LATIN, eastAsia: s.FONT_HEAD } },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: s.SZ_H2, bold: true, font: { ascii: s.FONT_HEAD_LATIN, eastAsia: s.FONT_HEAD } },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: s.SZ_H3, bold: true, font: { ascii: s.FONT_HEAD_LATIN, eastAsia: s.FONT_HEAD } },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  };
}