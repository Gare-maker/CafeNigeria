import {
  CanvasImageElement,
  DocumentCategory,
  DocumentItem,
  DrawingElement,
} from '../types';
import { getCurrentFormattedDate } from './aiGenerator';

function renderDrawingsAndImagesForPage(
  drawings: DrawingElement[] | undefined,
  images: CanvasImageElement[] | undefined,
  pageIdx: number
): string {
  const pageDrawings = (drawings || []).filter((d) => d.pageIndex === pageIdx);
  const pageImages = (images || []).filter((img) => img.pageIndex === pageIdx);
  if (pageDrawings.length === 0 && pageImages.length === 0) return '';

  const imagesHtml = pageImages
    .map(
      (img) =>
        `<div style="margin: 8pt 0;"><img src="${img.src}" alt="${
          img.caption || 'Document Figure'
        }" style="width: ${img.width}px; height: ${
          img.height
        }px; object-fit: fill; border: 1px solid #E2E8F0;" /></div>`
    )
    .join('\n');

  const shapesSvg = pageDrawings
    .map((d) => {
      const dash =
        d.lineStyle === 'dashed'
          ? 'stroke-dasharray="6,4"'
          : d.lineStyle === 'dotted'
          ? 'stroke-dasharray="2,3"'
          : '';
      const fill = d.fillColor && d.fillColor !== 'transparent' ? d.fillColor : 'none';
      const x = Math.min(d.x1, d.x2);
      const y = Math.min(d.y1, d.y2);
      const w = Math.max(4, Math.abs(d.x2 - d.x1));
      const h = Math.max(4, Math.abs(d.y2 - d.y1));

      if (d.type === 'rect' || d.type === 'square') {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${d.strokeColor}" stroke-width="${d.strokeWidth}" ${dash} />`;
      }
      if (d.type === 'ellipse') {
        return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${
          h / 2
        }" fill="${fill}" stroke="${d.strokeColor}" stroke-width="${
          d.strokeWidth
        }" ${dash} />`;
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
    pageDrawings.length > 0
      ? `<div style="margin: 8pt 0;"><svg width="100%" height="220" viewBox="0 0 794 400" xmlns="http://www.w3.org/2000/svg">${shapesSvg}</svg></div>`
      : '';

  return `${imagesHtml}${svgBlock}`;
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
        `${pHtml}${renderDrawingsAndImagesForPage(
          doc.metadata.drawings,
          doc.metadata.images,
          idx
        )}`
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
        }px;">${pHtml}${renderDrawingsAndImagesForPage(
          doc.metadata.drawings,
          doc.metadata.images,
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

/**
 * Requirement 14: Save Document as an Individual File on User's Computer
 * Uses the File System Access API (showSaveFilePicker) when available, with automatic download fallback.
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

  // 1. If we already have a FileSystemFileHandle from an earlier Open/Save on this session, write directly!
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
      // Fall through to picker if permission expired
    }
  }

  // 2. Use browser File System Access API (showSaveFilePicker) if supported
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
      // Fall through to standard file download if blocked
    }
  }

  // 3. Fallback for browsers without File System Access API
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
    if (parsed && parsed.document && parsed.document.id && parsed.document.content !== undefined) {
      const loadedDoc: DocumentItem = {
        ...parsed.document,
        updatedAt: today,
        metadata: {
          ...(parsed.document.metadata || {}),
          localFileName: fileName,
        },
      };
      return loadedDoc;
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
 * Requirement 14: Open an Individual Document File from the User's Computer
 */
export async function openDocumentFromComputerFile(
  defaultCategory: DocumentCategory = 'projects'
): Promise<{ doc: DocumentItem; handle?: any } | null> {
  const win = window as any;

  // 1. Use File System Access API (showOpenFilePicker) when supported
  if (typeof win.showOpenFilePicker === 'function') {
    try {
      const [fileHandle] = await win.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Nigerian Cafe & Text Documents (.ncdoc, .json, .html, .txt, .md)',
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
      // Fall through to input element if showOpenFilePicker is restricted
    }
  }

  // 2. Fallback file input element
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
