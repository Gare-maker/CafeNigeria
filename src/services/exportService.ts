import { DocumentItem, DrawingElement } from '../types';

function renderDrawingsSvgForPage(
  drawings: DrawingElement[] | undefined,
  pageIdx: number
): string {
  const pageDrawings = (drawings || []).filter((d) => d.pageIndex === pageIdx);
  if (pageDrawings.length === 0) return '';

  const shapesSvg = pageDrawings
    .map((d) => {
      const dash =
        d.lineStyle === 'dashed'
          ? 'stroke-dasharray="6,4"'
          : d.lineStyle === 'dotted'
          ? 'stroke-dasharray="2,3"'
          : '';
      const x = Math.min(d.x1, d.x2);
      const y = Math.min(d.y1, d.y2);
      const w = Math.max(4, Math.abs(d.x2 - d.x1));
      const h = Math.max(4, Math.abs(d.y2 - d.y1));

      if (d.type === 'rect' || d.type === 'square') {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      if (d.type === 'ellipse') {
        return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="none" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
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

  return `<div style="margin: 8pt 0;"><svg width="100%" height="140" viewBox="0 0 650 180" xmlns="http://www.w3.org/2000/svg">${shapesSvg}</svg></div>`;
}

export function exportToDocx(doc: DocumentItem) {
  const fontFamily = doc.metadata.fontFamily || 'Times New Roman';
  const layout = doc.metadata.layout;
  const orientation =
    layout?.orientation || doc.metadata.orientation || 'portrait';

  const pageSize =
    orientation === 'landscape' ? '29.7cm 21.0cm' : '21.0cm 29.7cm';
  const margin = layout
    ? `${layout.marginTopMm}mm ${layout.marginRightMm}mm ${layout.marginBottomMm}mm ${layout.marginLeftMm}mm`
    : doc.metadata.marginSize === 'narrow'
    ? '12.7mm'
    : doc.metadata.marginSize === 'wide'
    ? '31.8mm'
    : '25.4mm';

  const rawPages = doc.content.split(/<hr[^>]*class=["']?page-break["']?[^>]*>/i);
  const pagesWithDrawings = rawPages
    .map(
      (pHtml, idx) =>
        `${pHtml}${renderDrawingsSvgForPage(doc.metadata.drawings, idx)}`
    )
    .join(
      '<br clear="all" style="page-break-before:always; mso-break-type:section-break" />'
    );

  const wordDocument = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>${doc.title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: ${pageSize};
          margin: ${margin};
          mso-header-margin: 1.25cm;
          mso-footer-margin: 1.25cm;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: "${fontFamily}", serif;
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
      <div class="Section1">
        ${
          doc.metadata.headerText
            ? `<p style="font-size: 9pt; color: #64748B; border-bottom: 1px solid #E2E8F0; padding-bottom: 4pt; margin-bottom: 14pt;">${doc.metadata.headerText}</p>`
            : ''
        }
        ${pagesWithDrawings}
        ${
          doc.metadata.footerText
            ? `<p style="font-size: 9pt; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 6pt; margin-top: 24pt;">${doc.metadata.footerText}</p>`
            : ''
        }
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocument], {
    type: 'application/vnd.ms-word;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = doc.title
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  link.href = url;
  link.download = `${safeName || 'Document'}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToTxt(doc: DocumentItem) {
  const temp = document.createElement('div');
  temp.innerHTML = doc.content
    .replace(/<\/h1>/gi, '\n========================================\n\n')
    .replace(/<\/h2>/gi, '\n----------------------------------------\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  • ')
    .replace(/<hr[^>]*>/gi, '\n--- [PAGE BREAK] ---\n\n');

  const plainText = `${doc.title.toUpperCase()}\nCategory: ${doc.category.toUpperCase()} | Last Modified: ${
    doc.updatedAt
  }\n========================================\n\n${
    temp.textContent || temp.innerText || ''
  }`;

  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = doc.title
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  link.href = url;
  link.download = `${safeName || 'Document'}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPdf(doc: DocumentItem) {
  const printWindow = window.open('', '_blank', 'width=900,height=780');
  if (!printWindow) {
    window.print();
    return;
  }
  const fontFamily = doc.metadata.fontFamily || 'Times New Roman';
  const layout = doc.metadata.layout;
  const orientation =
    layout?.orientation || doc.metadata.orientation || 'portrait';
  const pageSizeName = layout?.pageSize || 'A4';
  const marginCss = layout
    ? `${layout.marginTopMm}mm ${layout.marginRightMm}mm ${layout.marginBottomMm}mm ${layout.marginLeftMm}mm`
    : '22mm';

  const rawPages = doc.content.split(/<hr[^>]*class=["']?page-break["']?[^>]*>/i);
  const processedHtml = rawPages
    .map(
      (pHtml, idx) =>
        `<div style="page-break-after: ${
          idx < rawPages.length - 1 ? 'always' : 'auto'
        }; column-count: ${layout?.columns || 1}; column-gap: ${
          layout?.columnGapPx || 24
        }px;">${pHtml}${renderDrawingsSvgForPage(
          doc.metadata.drawings,
          idx
        )}</div>`
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${doc.title}</title>
        <style>
          @page {
            size: ${pageSizeName === 'Custom' ? 'A4' : pageSizeName} ${orientation};
            margin: ${marginCss};
          }
          body {
            font-family: "${fontFamily}", Georgia, serif;
            font-size: 12pt;
            line-height: 1.65;
            color: #111827;
            background-color: ${layout?.pageBackground || '#FFFFFF'};
            margin: 0;
            padding: 0;
          }
          h1 { font-size: 17pt; color: #0A194E; margin: 14pt 0 6pt; }
          h2 { font-size: 13.5pt; color: #0D1B4C; margin: 12pt 0 5pt; }
          h3 { font-size: 12pt; color: #1E2B58; margin: 10pt 0 4pt; }
          p { margin: 0 0 8pt 0; }
          table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
          th, td { border: 1px solid #94A3B8; padding: 6pt 8pt; text-align: left; font-size: 10.5pt; }
          th { background-color: #F1F5F9; font-weight: bold; }
        </style>
      </head>
      <body>
        ${processedHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
