import {
  CanvasImageElement,
  DocumentCategory,
  DocumentItem,
  DrawingElement,
  ExportScopeOptions,
  PageGroup,
} from '../types';
import { getCurrentFormattedDate } from './aiGenerator';

function stripTemporaryHighlightMarkers(html: string): string {
  return html.replace(
    /<mark[^>]*class=["'][^"']*ai-persistent-selection[^"']*["'][^>]*>([\s\S]*?)<\/mark>/gi,
    '$1'
  );
}

interface ResolvedExportPage {
  originalPageIndex: number;
  html: string;
  groups: PageGroup[];
  drawings: DrawingElement[];
  images: CanvasImageElement[];
}

function resolveExportPayload(
  doc: DocumentItem,
  options?: ExportScopeOptions
): {
  exportTitle: string;
  fileSuffix: string;
  pages: ResolvedExportPage[];
  activeGroups: PageGroup[];
} {
  const rawPages =
    doc.metadata.pages && doc.metadata.pages.length > 0
      ? doc.metadata.pages
      : doc.content.split(/<hr[^>]*class=["']?page-break["']?[^>]*>/i);

  const allGroups = doc.metadata.pageGroups || [];
  const allDrawings = doc.metadata.drawings || [];
  const allImages = doc.metadata.images || [];

  let targetIndices: number[] = rawPages.map((_, i) => i);
  let fileSuffix = '';
  let exportTitle = doc.title;

  if (options?.scope === 'page' && typeof options.pageIndex === 'number') {
    const idx = Math.max(0, Math.min(rawPages.length - 1, options.pageIndex));
    targetIndices = [idx];
    fileSuffix = `_Page_${idx + 1}`;
    exportTitle = `${doc.title} — Page ${idx + 1}`;
  } else if (options?.scope === 'group' && options.groupId) {
    const grp = allGroups.find((g) => g.id === options.groupId);
    if (grp && grp.pageIndices.length > 0) {
      targetIndices = grp.pageIndices.filter(
        (i) => i >= 0 && i < rawPages.length
      );
      const safeGrp = grp.name
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 32);
      fileSuffix = `_${safeGrp || 'Group'}`;
      exportTitle = `${doc.title} — ${grp.name}`;
    }
  }

  if (targetIndices.length === 0) {
    targetIndices = [0];
  }

  const pages: ResolvedExportPage[] = targetIndices.map((origIdx) => ({
    originalPageIndex: origIdx,
    html: stripTemporaryHighlightMarkers(rawPages[origIdx] || '<p></p>'),
    groups: allGroups.filter((g) => g.pageIndices.includes(origIdx)),
    drawings: allDrawings.filter((d) => d.pageIndex === origIdx),
    images: allImages.filter((im) => im.pageIndex === origIdx),
  }));

  const activeGroups = allGroups.filter((g) =>
    g.pageIndices.some((i) => targetIndices.includes(i))
  );

  return {
    exportTitle,
    fileSuffix,
    pages,
    activeGroups,
  };
}

function renderDrawingsAndImagesForHtmlExport(
  drawings: DrawingElement[],
  images: CanvasImageElement[]
): string {
  if (drawings.length === 0 && images.length === 0) return '';

  const imagesHtml = images
    .map(
      (img) =>
        `<div style="margin: 10pt 0;"><img src="${img.src}" width="${Math.round(
          img.width
        )}" height="${Math.round(img.height)}" alt="${
          img.caption || 'Document Figure'
        }" style="width: ${Math.round(img.width)}px; height: ${Math.round(
          img.height
        )}px; object-fit: contain; display: block;" /></div>`
    )
    .join('\n');

  const shapesSvg = drawings
    .map((d) => {
      const dash =
        d.lineStyle === 'dashed'
          ? 'stroke-dasharray="6,4"'
          : d.lineStyle === 'dotted'
          ? 'stroke-dasharray="2,3"'
          : '';
      const fill =
        d.fillColor && d.fillColor !== 'transparent' ? d.fillColor : 'none';
      const x = Math.min(d.x1, d.x2);
      const y = Math.min(d.y1, d.y2);
      const w = Math.max(4, Math.abs(d.x2 - d.x1));
      const h = Math.max(4, Math.abs(d.y2 - d.y1));

      if (d.type === 'rect' || d.type === 'square') {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      if (d.type === 'ellipse') {
        return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${
          w / 2
        }" ry="${h / 2}" fill="${fill}" stroke="${
          d.strokeColor
        }" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      if (d.type === 'triangle') {
        const pts = `${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`;
        return `<polygon points="${pts}" fill="${fill}" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      if (d.type === 'diamond') {
        const pts = `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${
          y + h
        } ${x},${y + h / 2}`;
        return `<polygon points="${pts}" fill="${fill}" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      if (d.type === 'freehand' && d.points && d.points.length > 1) {
        const pathData = d.points
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');
        return `<path d="${pathData}" fill="none" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      return `<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
    })
    .join('\n');

  const svgBlock =
    drawings.length > 0
      ? `<div style="margin: 10pt 0;"><svg width="100%" height="220" viewBox="0 0 794 400" xmlns="http://www.w3.org/2000/svg">${shapesSvg}</svg></div>`
      : '';

  return `${imagesHtml}${svgBlock}`;
}

/**
 * Minimal PKZIP builder so we can output a genuine .docx OpenXML archive
 */
function createZipArchive(files: { name: string; data: Uint8Array }[]): Blob {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  const crc32 = (bytes: Uint8Array): number => {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, file.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  let centralSize = 0;
  for (const cp of centralParts) centralSize += cp.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Requirement 10: Export to Word (.docx)
 * Supports exporting the entire document, an individual group, or a specific page,
 * preserving document structure, formatting, tables, images, shapes, and page groups.
 */
export function exportToDocx(doc: DocumentItem, options?: ExportScopeOptions) {
  const { exportTitle, fileSuffix, pages, activeGroups } = resolveExportPayload(
    doc,
    options
  );
  const fontFamily = doc.metadata.fontFamily || 'Times New Roman';
  const layout = doc.metadata.layout;
  const orientation =
    layout?.orientation || doc.metadata.orientation || 'portrait';

  const groupsSummaryHtml =
    activeGroups.length > 0 && (!options || options.scope === 'document')
      ? `<div style="margin-bottom: 14pt; padding: 8pt 10pt; border: 1pt solid #CBD5E1; background-color: #F8FAFC;">
          <p style="margin: 0 0 4pt 0; font-size: 9.5pt; font-weight: bold; color: #0A194E; text-transform: uppercase;">Document Page Groups</p>
          ${activeGroups
            .map(
              (g) =>
                `<p style="margin: 2pt 0; font-size: 9.5pt; color: #334155;">• <strong>${
                  g.name
                }</strong> (Page${g.pageIndices.length > 1 ? 's' : ''} ${g.pageIndices
                  .map((i) => i + 1)
                  .join(', ')})</p>`
            )
            .join('')}
        </div>`
      : '';

  const pagesHtml = pages
    .map((p, idx) => {
      const groupBanner =
        p.groups.length > 0
          ? `<p style="margin: 0 0 8pt 0; font-size: 9pt; color: #1447E6; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">[${p.groups
              .map((g) => g.name)
              .join(' • ')} — Page ${p.originalPageIndex + 1}]</p>`
          : `<p style="margin: 0 0 8pt 0; font-size: 8.5pt; color: #64748B;">Page ${
              p.originalPageIndex + 1
            }</p>`;

      const backDrawings = p.drawings.filter((d) => (d.zIndex ?? 10) < 10);
      const frontDrawings = p.drawings.filter((d) => (d.zIndex ?? 10) >= 10);
      const backImages = p.images.filter((im) => (im.zIndex ?? 12) < 10);
      const frontImages = p.images.filter((im) => (im.zIndex ?? 12) >= 10);

      const pageBreakTag =
        idx < pages.length - 1
          ? '<br clear="all" style="page-break-before:always;" />'
          : '';

      return `
        <div>
          ${groupBanner}
          ${renderDrawingsAndImagesForHtmlExport(backDrawings, backImages)}
          ${p.html}
          ${renderDrawingsAndImagesForHtmlExport(frontDrawings, frontImages)}
        </div>
        ${pageBreakTag}
      `;
    })
    .join('\n');

  const xhtmlChunk = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <title>${exportTitle}</title>
  <style>
    body {
      font-family: "${fontFamily}", "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #111827;
      background-color: ${layout?.pageBackground || '#FFFFFF'};
    }
    h1 { font-size: 16pt; font-weight: bold; color: #0A194E; margin-top: 14pt; margin-bottom: 6pt; }
    h2 { font-size: 13.5pt; font-weight: bold; color: #0D1B4C; margin-top: 12pt; margin-bottom: 5pt; }
    h3 { font-size: 12pt; font-weight: bold; color: #1E2B58; margin-top: 10pt; margin-bottom: 4pt; }
    p { margin-top: 0pt; margin-bottom: 8pt; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1pt solid #64748B; padding: 6pt 8pt; font-size: 11pt; }
    th { background-color: #F1F5F9; font-weight: bold; }
  </style>
</head>
<body>
  ${
    doc.metadata.headerText
      ? `<p style="font-size: 9pt; color: #64748B; border-bottom: 1px solid #E2E8F0; padding-bottom: 4pt; margin-bottom: 12pt;">${doc.metadata.headerText}</p>`
      : ''
  }
  ${groupsSummaryHtml}
  ${pagesHtml}
  ${
    doc.metadata.footerText
      ? `<p style="font-size: 9pt; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 6pt; margin-top: 18pt;">${doc.metadata.footerText}</p>`
      : ''
  }
</body>
</html>`;

  const wTwips = orientation === 'landscape' ? 16838 : 11906;
  const hTwips = orientation === 'landscape' ? 11906 : 16838;
  const mTop = Math.round((layout?.marginTopMm ?? 25) * 56.7);
  const mBottom = Math.round((layout?.marginBottomMm ?? 25) * 56.7);
  const mLeft = Math.round((layout?.marginLeftMm ?? 25) * 56.7);
  const mRight = Math.round((layout?.marginRightMm ?? 25) * 56.7);

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="htm" ContentType="text/html"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="htmlChunk1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.htm"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:altChunk r:id="htmlChunk1"/>
    <w:sectPr>
      <w:pgSz w:w="${wTwips}" w:h="${hTwips}" w:orient="${orientation}"/>
      <w:pgMar w:top="${mTop}" w:right="${mRight}" w:bottom="${mBottom}" w:left="${mLeft}" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const encoder = new TextEncoder();
  const docxBlob = createZipArchive([
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { name: '_rels/.rels', data: encoder.encode(rootRelsXml) },
    { name: 'word/_rels/document.xml.rels', data: encoder.encode(docRelsXml) },
    { name: 'word/document.xml', data: encoder.encode(documentXml) },
    { name: 'word/afchunk.htm', data: encoder.encode(xhtmlChunk) },
  ]);

  const url = URL.createObjectURL(docxBlob);
  const link = document.createElement('a');
  const safeName = doc.title
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  link.href = url;
  link.download = `${safeName || 'Document'}${fileSuffix}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Requirement 10: Export to Plain Text (.txt)
 * Supports Entire Document, Individual Group, or Specific Page.
 */
export function exportToTxt(doc: DocumentItem, options?: ExportScopeOptions) {
  const { exportTitle, fileSuffix, pages, activeGroups } = resolveExportPayload(
    doc,
    options
  );

  const groupsBlock =
    activeGroups.length > 0
      ? `Groups Included: ${activeGroups
          .map(
            (g) =>
              `${g.name} (Pages ${g.pageIndices.map((i) => i + 1).join(', ')})`
          )
          .join(' | ')}\n`
      : '';

  const bodyText = pages
    .map((p) => {
      const temp = document.createElement('div');
      temp.innerHTML = p.html
        .replace(/<\/h1>/gi, '\n========================================\n\n')
        .replace(/<\/h2>/gi, '\n----------------------------------------\n\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '  • ');
      const grpLabel =
        p.groups.length > 0
          ? `[${p.groups.map((g) => g.name).join(' • ')} — Page ${
              p.originalPageIndex + 1
            }]\n`
          : `[Page ${p.originalPageIndex + 1}]\n`;
      return `${grpLabel}${(temp.textContent || temp.innerText || '').trim()}`;
    })
    .join('\n\n--- [PAGE BREAK] ---\n\n');

  const plainText = `${exportTitle.toUpperCase()}\nCategory: ${doc.category.toUpperCase()} | Last Modified: ${
    doc.updatedAt
  }\n${groupsBlock}========================================\n\n${bodyText}`;

  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = doc.title
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  link.href = url;
  link.download = `${safeName || 'Document'}${fileSuffix}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to load a DataURL image for canvas PDF rendering
 */
function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Draws a single shape onto a 2D canvas context
 */
function drawShapeOnCanvas(ctx: CanvasRenderingContext2D, d: DrawingElement) {
  ctx.save();
  ctx.strokeStyle = d.strokeColor || '#1447E6';
  ctx.lineWidth = d.strokeWidth || 2;
  if (d.lineStyle === 'dashed') ctx.setLineDash([6, 4]);
  else if (d.lineStyle === 'dotted') ctx.setLineDash([2, 3]);

  const hasFill = d.fillColor && d.fillColor !== 'transparent';
  if (hasFill) ctx.fillStyle = d.fillColor!;

  const x = Math.min(d.x1, d.x2);
  const y = Math.min(d.y1, d.y2);
  const w = Math.max(4, Math.abs(d.x2 - d.x1));
  const h = Math.max(4, Math.abs(d.y2 - d.y1));

  ctx.beginPath();
  if (d.type === 'rect' || d.type === 'square') {
    if (hasFill) ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  } else if (d.type === 'ellipse') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    if (hasFill) ctx.fill();
    ctx.stroke();
  } else if (d.type === 'triangle') {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (hasFill) ctx.fill();
    ctx.stroke();
  } else if (d.type === 'diamond') {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    if (hasFill) ctx.fill();
    ctx.stroke();
  } else if (d.type === 'freehand' && d.points && d.points.length > 1) {
    ctx.moveTo(d.points[0].x, d.points[0].y);
    for (let i = 1; i < d.points.length; i++) {
      ctx.lineTo(d.points[i].x, d.points[i].y);
    }
    ctx.stroke();
  } else {
    ctx.moveTo(d.x1, d.y1);
    ctx.lineTo(d.x2, d.y2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders a ResolvedExportPage onto a high-resolution canvas so we can pack it into a real downloadable .pdf file
 */
async function renderPageToCanvas(
  doc: DocumentItem,
  page: ResolvedExportPage,
  totalExportedPages: number,
  exportIdx: number
): Promise<HTMLCanvasElement> {
  const layout = doc.metadata.layout;
  const orientation =
    layout?.sectionOrientations?.[page.originalPageIndex] ||
    layout?.orientation ||
    doc.metadata.orientation ||
    'portrait';

  const pageW = orientation === 'landscape' ? 1122 : 794;
  const pageH = orientation === 'landscape' ? 794 : 1122;
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = pageW * scale;
  canvas.height = pageH * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // 1. Page Background
  ctx.fillStyle = layout?.pageBackground || '#FFFFFF';
  ctx.fillRect(0, 0, pageW, pageH);

  // Page Border if configured
  if (layout && layout.borderStyle && layout.borderStyle !== 'none') {
    ctx.save();
    ctx.strokeStyle = layout.borderColor || '#0A194E';
    ctx.lineWidth = layout.borderWidthPx || 2;
    if (layout.borderStyle === 'dotted') {
      ctx.setLineDash([ctx.lineWidth, ctx.lineWidth * 1.8]);
    } else if (layout.borderStyle === 'dashed') {
      ctx.setLineDash([8, 4]);
    }
    const insetPx = Math.round((layout.borderInsetMm ?? 10) * 3.78);
    ctx.strokeRect(insetPx, insetPx, pageW - (insetPx * 2), pageH - (insetPx * 2));
    ctx.restore();
  }

  const padLeft = Math.round((layout?.marginLeftMm ?? 25) * 3.2);
  const padRight = Math.round((layout?.marginRightMm ?? 25) * 3.2);
  const padTop = Math.round((layout?.marginTopMm ?? 25) * 3.2);
  const padBottom = Math.round((layout?.marginBottomMm ?? 25) * 3.2);
  const contentW = pageW - padLeft - padRight;
  const fontFamily = doc.metadata.fontFamily || 'Times New Roman';

  // 2. Draw background shapes & images (zIndex < 10)
  const backItems: (
    | { kind: 'shape'; z: number; d: DrawingElement }
    | { kind: 'image'; z: number; img: CanvasImageElement }
  )[] = [
    ...page.drawings
      .filter((d) => (d.zIndex ?? 10) < 10)
      .map((d) => ({ kind: 'shape' as const, z: d.zIndex ?? 5, d })),
    ...page.images
      .filter((im) => (im.zIndex ?? 12) < 10)
      .map((img) => ({ kind: 'image' as const, z: img.zIndex ?? 5, img })),
  ].sort((a, b) => a.z - b.z);

  for (const item of backItems) {
    if (item.kind === 'shape') {
      drawShapeOnCanvas(ctx, item.d);
    } else {
      const loaded = await loadImageElement(item.img.src);
      if (loaded) {
        ctx.drawImage(
          loaded,
          item.img.x,
          item.img.y,
          item.img.width,
          item.img.height
        );
      }
    }
  }

  // 3. Running Header & Group Badge
  let cursorY = padTop;
  ctx.fillStyle = '#64748B';
  ctx.font = `11px "${fontFamily}", serif`;
  const headerStr = (doc.metadata.headerText || doc.title.slice(0, 48)).toUpperCase();
  ctx.fillText(headerStr, padLeft, cursorY);

  if (page.groups.length > 0) {
    const grpLabel = page.groups.map((g) => g.name).join(' • ');
    ctx.fillStyle = '#1447E6';
    ctx.font = `bold 10px sans-serif`;
    const gw = ctx.measureText(grpLabel).width;
    ctx.fillText(grpLabel, pageW - padRight - gw, cursorY);
  }

  cursorY += 8;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, cursorY);
  ctx.lineTo(pageW - padRight, cursorY);
  ctx.stroke();
  cursorY += 20;

  // 4. Render Rich HTML Blocks (Headings, Paragraphs, Lists, Tables with alignment & bold)
  const temp = document.createElement('div');
  temp.innerHTML = page.html;

  const drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    align: string,
    fontStr: string,
    colorStr: string
  ): number => {
    ctx.font = fontStr;
    ctx.fillStyle = colorStr;
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    let line = '';
    let curY = y;

    const flushLine = (ln: string) => {
      const cleanLn = ln.trim();
      if (!cleanLn) return;
      let drawX = x;
      const lw = ctx.measureText(cleanLn).width;
      if (align === 'center') drawX = x + (maxWidth - lw) / 2;
      else if (align === 'right') drawX = x + maxWidth - lw;
      ctx.fillText(cleanLn, drawX, curY);
      curY += lineHeight;
    };

    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        flushLine(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) flushLine(line);
    return curY;
  };

  const renderElementBlock = (el: Element) => {
    if (cursorY > pageH - padBottom - 40) return;
    const tag = el.tagName.toUpperCase();
    const htmlEl = el as HTMLElement;
    const align =
      htmlEl.style?.textAlign || htmlEl.getAttribute('align') || 'left';

    if (tag === 'H1') {
      cursorY += 6;
      cursorY = drawWrappedText(
        el.textContent || '',
        padLeft,
        cursorY,
        contentW,
        26,
        align,
        `bold 20px "${fontFamily}", serif`,
        '#0A194E'
      );
      cursorY += 6;
    } else if (tag === 'H2') {
      cursorY += 4;
      cursorY = drawWrappedText(
        el.textContent || '',
        padLeft,
        cursorY,
        contentW,
        22,
        align,
        `bold 16.5px "${fontFamily}", serif`,
        '#0D1B4C'
      );
      cursorY += 4;
    } else if (tag === 'H3') {
      cursorY += 3;
      cursorY = drawWrappedText(
        el.textContent || '',
        padLeft,
        cursorY,
        contentW,
        20,
        align,
        `bold 15px "${fontFamily}", serif`,
        '#1E2B58'
      );
      cursorY += 3;
    } else if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(el.querySelectorAll('li'));
      items.forEach((li, idx) => {
        const bullet = tag === 'OL' ? `${idx + 1}. ` : '• ';
        cursorY = drawWrappedText(
          `${bullet}${li.textContent || ''}`,
          padLeft + 14,
          cursorY,
          contentW - 14,
          21,
          'left',
          `15px "${fontFamily}", serif`,
          '#111827'
        );
        cursorY += 3;
      });
      cursorY += 4;
    } else if (tag === 'TABLE') {
      cursorY += 4;
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length > 0) {
        const colCount = Math.max(
          1,
          ...rows.map((r) => r.children.length)
        );
        const colW = contentW / colCount;

        for (const r of rows) {
          const cells = Array.from(r.children) as HTMLElement[];
          const rowH = Math.max(
            28,
            parseInt(r.style.height || '0', 10) || 32
          );
          cells.forEach((c, cIdx) => {
            const cx = padLeft + cIdx * colW;
            const isTh = c.tagName.toUpperCase() === 'TH';
            if (isTh) {
              ctx.fillStyle = '#F1F5F9';
              ctx.fillRect(cx, cursorY - 14, colW, rowH);
            }
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx, cursorY - 14, colW, rowH);

            const hasBold =
              isTh ||
              c.style.fontWeight === 'bold' ||
              Number(c.style.fontWeight) >= 600 ||
              Boolean(c.querySelector('strong, b'));
            const cellAlign =
              c.style.textAlign || c.getAttribute('align') || 'left';

            drawWrappedText(
              c.textContent || '',
              cx + 6,
              cursorY + 2,
              colW - 12,
              16,
              cellAlign,
              `${hasBold ? 'bold ' : ''}13px "${fontFamily}", serif`,
              '#111827'
            );
          });
          cursorY += rowH;
        }
      }
      cursorY += 10;
    } else if (tag === 'DIV' && el.children.length > 0 && !el.querySelector('svg')) {
      Array.from(el.children).forEach((child) => renderElementBlock(child));
    } else {
      const hasBold =
        htmlEl.style?.fontWeight === 'bold' ||
        Number(htmlEl.style?.fontWeight) >= 600;
      cursorY = drawWrappedText(
        el.textContent || '',
        padLeft,
        cursorY,
        contentW,
        22,
        align,
        `${hasBold ? 'bold ' : ''}15.5px "${fontFamily}", serif`,
        '#111827'
      );
      cursorY += 8;
    }
  };

  Array.from(temp.children).forEach((child) => renderElementBlock(child));

  // 5. Draw foreground shapes & images (zIndex >= 10)
  const frontItems: (
    | { kind: 'shape'; z: number; d: DrawingElement }
    | { kind: 'image'; z: number; img: CanvasImageElement }
  )[] = [
    ...page.drawings
      .filter((d) => (d.zIndex ?? 10) >= 10)
      .map((d) => ({ kind: 'shape' as const, z: d.zIndex ?? 12, d })),
    ...page.images
      .filter((im) => (im.zIndex ?? 12) >= 10)
      .map((img) => ({ kind: 'image' as const, z: img.zIndex ?? 12, img })),
  ].sort((a, b) => a.z - b.z);

  for (const item of frontItems) {
    if (item.kind === 'shape') {
      drawShapeOnCanvas(ctx, item.d);
    } else {
      const loaded = await loadImageElement(item.img.src);
      if (loaded) {
        ctx.drawImage(
          loaded,
          item.img.x,
          item.img.y,
          item.img.width,
          item.img.height
        );
      }
    }
  }

  // 6. Footer & Page Numbers
  const footerY = pageH - padBottom;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, footerY - 16);
  ctx.lineTo(pageW - padRight, footerY - 16);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = `11px "${fontFamily}", serif`;
  ctx.fillText(
    doc.metadata.footerText || doc.metadata.institution || '',
    padLeft,
    footerY
  );
  const pgLabel = `Page ${page.originalPageIndex + 1} (${
    exportIdx + 1
  } of ${totalExportedPages})`;
  const pw = ctx.measureText(pgLabel).width;
  ctx.fillText(pgLabel, pageW - padRight - pw, footerY);

  return canvas;
}

/**
 * Packs rendered page canvases into a genuine multi-page PDF 1.4 binary file and downloads it with .pdf extension
 */
function buildPdfBlobFromJpegs(
  pages: { jpegBytes: Uint8Array; widthPx: number; heightPx: number; pdfW: number; pdfH: number }[]
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let currentOffset = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    currentOffset += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    currentOffset += b.length;
  };
  const startObj = (id: number) => {
    offsets[id] = currentOffset;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => {
    pushStr(`\nendobj\n`);
  };

  pushStr(`%PDF-1.4\n%\xFF\xFF\xFF\xFF\n`);

  // Object 1: Catalog, Object 2: Pages
  const pageCount = pages.length;
  const pageObjIds: number[] = [];
  let nextObjId = 3;

  for (let i = 0; i < pageCount; i++) {
    const imgObjId = nextObjId++;
    const contentObjId = nextObjId++;
    const pageObjId = nextObjId++;
    pageObjIds.push(pageObjId);

    const p = pages[i];

    // Image XObject
    startObj(imgObjId);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(p.jpegBytes);
    pushStr(`\nendstream`);
    endObj();

    // Content stream drawing the page image
    const contentStream = `q ${p.pdfW} 0 0 ${p.pdfH} 0 0 cm /Im0 Do Q`;
    const contentBytes = encoder.encode(contentStream);
    startObj(contentObjId);
    pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr(`\nendstream`);
    endObj();

    // Page Object
    startObj(pageObjId);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.pdfW} ${p.pdfH}] /Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );
    endObj();
  }

  startObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>`);
  endObj();

  startObj(2);
  pushStr(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`
  );
  endObj();

  const totalObjs = nextObjId;
  const xrefOffset = currentOffset;
  pushStr(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`);
  for (let id = 1; id < totalObjs; id++) {
    const offStr = String(offsets[id] || 0).padStart(10, '0');
    pushStr(`${offStr} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Requirement 10: Export to PDF (.pdf)
 * Supports exporting the entire document, an individual group, or a specific page,
 * and downloads a genuine .pdf file directly to the user's device.
 */
export async function exportToPdf(
  doc: DocumentItem,
  options?: ExportScopeOptions
) {
  const { fileSuffix, pages } = resolveExportPayload(doc, options);

  const renderedPages: {
    jpegBytes: Uint8Array;
    widthPx: number;
    heightPx: number;
    pdfW: number;
    pdfH: number;
  }[] = [];

  for (let i = 0; i < pages.length; i++) {
    const canvas = await renderPageToCanvas(doc, pages[i], pages.length, i);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1] || '';
    const binaryStr = window.atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let j = 0; j < binaryStr.length; j++) {
      bytes[j] = binaryStr.charCodeAt(j);
    }
    const isLandscape = canvas.width > canvas.height;
    renderedPages.push({
      jpegBytes: bytes,
      widthPx: canvas.width,
      heightPx: canvas.height,
      pdfW: isLandscape ? 842 : 595,
      pdfH: isLandscape ? 595 : 842,
    });
  }

  const pdfBlob = buildPdfBlobFromJpegs(renderedPages);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  const safeName = doc.title
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  link.href = url;
  link.download = `${safeName || 'Document'}${fileSuffix}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Requirement 14: Save Document as an Individual File on User's Computer
 */
export async function saveDocumentToComputerFile(
  doc: DocumentItem,
  existingHandle?: any
): Promise<{ fileName: string; handle?: any; saved: boolean }> {
  const safeName =
    doc.title
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'Nigerian_Cafe_Document';

  const serialized = JSON.stringify(
    {
      _format: 'nigerian-cafe-document-v1',
      savedAt: getCurrentFormattedDate(),
      document: doc,
    },
    null,
    2
  );

  if (existingHandle && typeof existingHandle.createWritable === 'function') {
    try {
      const writable = await existingHandle.createWritable();
      await writable.write(serialized);
      await writable.close();
      return {
        fileName: existingHandle.name || `${safeName}.ncdoc`,
        handle: existingHandle,
        saved: true,
      };
    } catch {
      // Fall through to picker
    }
  }

  const win = window as any;
  if (typeof win.showSaveFilePicker === 'function') {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: `${safeName}.ncdoc`,
        types: [
          {
            description: 'Nigerian Cafe Editable Document (.ncdoc)',
            accept: {
              'application/json': ['.ncdoc', '.json'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(serialized);
      await writable.close();
      return {
        fileName: handle.name || `${safeName}.ncdoc`,
        handle,
        saved: true,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { fileName: '', saved: false };
      }
    }
  }

  const blob = new Blob([serialized], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.ncdoc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    fileName: `${safeName}.ncdoc`,
    saved: true,
  };
}

/**
 * Parses a raw file string (.ncdoc, .json, .html, .txt, .md) into a DocumentItem
 */
export function parseComputerFileIntoDocument(
  fileName: string,
  rawText: string,
  defaultCategory: DocumentCategory = 'projects'
): DocumentItem {
  const today = getCurrentFormattedDate();

  try {
    const parsed = JSON.parse(rawText);
    if (
      parsed &&
      parsed.document &&
      parsed.document.id &&
      parsed.document.content !== undefined
    ) {
      return {
        ...parsed.document,
        updatedAt: today,
        metadata: {
          ...(parsed.document.metadata || {}),
          localFileName: fileName,
        },
      };
    }
    if (parsed && parsed.title && parsed.content !== undefined) {
      return {
        ...parsed,
        id: parsed.id || `doc-${Date.now()}`,
        category: parsed.category || defaultCategory,
        createdAt: parsed.createdAt || today,
        updatedAt: today,
        status: parsed.status || 'Draft',
        syncStatus: 'saved',
        format: 'DOCX',
        metadata: {
          ...(parsed.metadata || {}),
          localFileName: fileName,
        },
        aiHistory: parsed.aiHistory || [],
      };
    }
  } catch {
    // Not JSON; treat as HTML or Plain Text document
  }

  const baseTitle = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  const isHtml = /<[a-z][\s\S]*>/i.test(rawText);
  const htmlContent = isHtml
    ? rawText
    : rawText
        .split(/\n\s*\n/)
        .map((para) => `<p>${para.trim().replace(/\n/g, '<br/>')}</p>`)
        .join('\n');

  return {
    id: `doc-${Date.now()}`,
    title: baseTitle || 'Imported Computer Document',
    category: defaultCategory,
    content: htmlContent || `<p>${rawText}</p>`,
    createdAt: today,
    updatedAt: today,
    status: 'Draft',
    syncStatus: 'saved',
    format: 'DOCX',
    metadata: {
      fontFamily: 'Times New Roman',
      showPageNumbers: true,
      orientation: 'portrait',
      marginSize: 'normal',
      localFileName: fileName,
    },
    aiHistory: [],
  };
}

/**
 * Open an Individual Document File from the User's Computer (for Dashboard and Category views)
 */
export async function openDocumentFromComputerFile(
  defaultCategory: DocumentCategory = 'projects'
): Promise<{ doc: DocumentItem; handle?: any } | null> {
  const win = window as any;

  if (typeof win.showOpenFilePicker === 'function') {
    try {
      const [fileHandle] = await win.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description:
              'Nigerian Cafe & Text Documents (.ncdoc, .json, .html, .txt, .md)',
            accept: {
              'application/json': ['.ncdoc', '.json'],
              'text/html': ['.html', '.htm'],
              'text/plain': ['.txt', '.md'],
            },
          },
        ],
      });
      if (!fileHandle) return null;
      const file = await fileHandle.getFile();
      const text = await file.text();
      const doc = parseComputerFileIntoDocument(
        file.name,
        text,
        defaultCategory
      );
      return { doc, handle: fileHandle };
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ncdoc,.json,.html,.htm,.txt,.md,.doc';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const text = await file.text();
      const doc = parseComputerFileIntoDocument(
        file.name,
        text,
        defaultCategory
      );
      resolve({ doc });
    };
    input.click();
  });
}
