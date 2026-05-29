// Assembler: Document shell + Packer output
// Creates the final Document object with styles, page layout, header/footer

import { Document, Packer, Header, Footer, Paragraph, TextRun,
         AlignmentType, BorderStyle, PageNumber, WidthType } from "docx";
import { mergeStyles, defaultDocStyles, SZ_FOOTER, FONT_BODY, FONT_BODY_LATIN, FONT_HEAD, FONT_HEAD_LATIN } from "./styles.js";

const PAGE_SIZES = {
  A4: { width: 11906, height: 16838 },
};

export function assembleDocument(config, contentElements) {
  const s = mergeStyles(config.styles || {});
  const docStyles = defaultDocStyles(s);

  const pageSize = PAGE_SIZES[config.page?.size] || PAGE_SIZES.A4;
  const pageConfig = {
    size: pageSize,
    margin: config.page?.margins || { top: 1500, right: 1300, bottom: 1500, left: 1300 }
  };

  // Header
  const headerTemplate = config.document?.header_template || "{title}  ·  {subtitle}";
  const headerText = headerTemplate
    .replace("{title}", config.document?.title || "")
    .replace("{subtitle}", config.document?.subtitle || "");

  const header = new Header({
    children: [new Paragraph({
      children: [new TextRun({
        text: headerText,
        font: { ascii: s.FONT_BODY_LATIN, eastAsia: s.FONT_BODY },
        size: s.SZ_FOOTER, color: "606060"
      })],
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "808080", space: 4 } }
    })]
  });

  // Footer: "第 X 页，共 Y 页"
  const footer = new Footer({
    children: [new Paragraph({
      children: [
        new TextRun({ text: "— 第 ", font: { ascii: s.FONT_BODY_LATIN, eastAsia: s.FONT_BODY }, size: s.SZ_FOOTER, color: "606060" }),
        new TextRun({ children: [PageNumber.CURRENT], size: s.SZ_FOOTER, color: "606060" }),
        new TextRun({ text: " 页，共 ", font: { ascii: s.FONT_BODY_LATIN, eastAsia: s.FONT_BODY }, size: s.SZ_FOOTER, color: "606060" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: s.SZ_FOOTER, color: "606060" }),
        new TextRun({ text: " 页 —", font: { ascii: s.FONT_BODY_LATIN, eastAsia: s.FONT_BODY }, size: s.SZ_FOOTER, color: "606060" }),
      ],
      alignment: AlignmentType.CENTER
    })]
  });

  const doc = new Document({
    creator: config.document?.creator || "Briefing Generator",
    title: config.document?.title || "Briefing",
    description: config.document?.subtitle || "",
    styles: docStyles,
    sections: [{
      properties: { page: pageConfig },
      headers: { default: header },
      footers: { default: footer },
      children: contentElements
    }]
  });

  return doc;
}

export async function packToBuffer(doc) {
  return await Packer.toBuffer(doc);
}

export async function packToFile(doc, outputPath) {
  const { writeFileSync } = await import("fs");
  const buffer = await packToBuffer(doc);
  writeFileSync(outputPath, buffer);
  return outputPath;
}
