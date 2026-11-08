import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Image as ImageIcon,
  SeparatorHorizontal,
  Sparkles,
  Send,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  FilePlus2,
  LayoutTemplate,
  PenTool,
  Layers,
  Trash2,
  Plus,
  Edit3,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
} from 'lucide-react';
import {
  AIMessage,
  DocumentItem,
  DrawingElement,
  PageGroup,
  PageLayoutSettings,
  ShapeType,
  SyncStatus,
} from '../types';
import { runWorkspaceAIPrompt } from '../services/aiGenerator';

interface WorkspaceViewProps {
  document: DocumentItem;
  isOnline: boolean;
  isSyncing: boolean;
  onBack: () => void;
  onUpdateDocument: (updated: DocumentItem) => void;
  onExportDocx: (doc: DocumentItem) => void;
  onExportPdf: (doc: DocumentItem) => void;
  onExportTxt: (doc: DocumentItem) => void;
}

const DEFAULT_LAYOUT: PageLayoutSettings = {
  pageSize: 'A4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  marginPreset: 'normal',
  marginTopMm: 25,
  marginBottomMm: 25,
  marginLeftMm: 25,
  marginRightMm: 25,
  columns: 1,
  columnGapPx: 28,
  pageBackground: '#FFFFFF',
  borderStyle: 'none',
  borderWidthPx: 1,
  borderColor: '#0A194E',
  headerSpacingPx: 18,
  footerSpacingPx: 24,
  sectionOrientations: {},
};

const PAGE_DIMENSIONS_PX: Record<
  PageLayoutSettings['pageSize'],
  { w: number; h: number }
> = {
  A4: { w: 794, h: 1122 },
  A3: { w: 1122, h: 1587 },
  A5: { w: 559, h: 794 },
  Letter: { w: 816, h: 1056 },
  Legal: { w: 816, h: 1344 },
  Custom: { w: 794, h: 1122 },
};

function splitHtmlIntoInitialPages(html: string): string[] {
  const explicitParts = html
    .split(/<hr[^>]*class=["']?page-break["']?[^>]*>/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (explicitParts.length > 1) {
    return explicitParts;
  }

  const rawPart = explicitParts[0] || html || '<p><br/></p>';
  const temp = window.document.createElement('div');
  temp.innerHTML = rawPart;
  const children = Array.from(temp.children);
  if (children.length <= 7) {
    return [rawPart];
  }

  const finalPages: string[] = [];
  let bucket = '';
  let charCounter = 0;
  for (const child of children) {
    const outer = child.outerHTML;
    const textLen = (child.textContent || '').length;
    if (charCounter + textLen > 1800 && bucket) {
      finalPages.push(bucket);
      bucket = outer;
      charCounter = textLen;
    } else {
      bucket += outer;
      charCounter += textLen;
    }
  }
  if (bucket) finalPages.push(bucket);
  return finalPages.length > 0 ? finalPages : ['<p><br/></p>'];
}

function stripPersistentMarkers(html: string): string {
  return html.replace(
    /<mark[^>]*class=["']?ai-persistent-selection["']?[^>]*>([\s\S]*?)<\/mark>/gi,
    '$1'
  );
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  document: doc,
  isOnline,
  isSyncing,
  onBack,
  onUpdateDocument,
  onExportDocx,
  onExportPdf,
  onExportTxt,
}) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activePageIdxRef = useRef<number>(0);
  const savedRangeRef = useRef<Range | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const activeTableCellRef = useRef<HTMLTableCellElement | null>(null);

  const [title, setTitle] = useState(doc.title);
  const [pages, setPages] = useState<string[]>(() =>
    splitHtmlIntoInitialPages(doc.content)
  );
  const [saveState, setSaveState] = useState<SyncStatus>(
    isOnline ? 'saved' : 'offline-pending'
  );
  const [selectedText, setSelectedText] = useState('');
  const [selectedPageIdx, setSelectedPageIdx] = useState<number>(0);
  const [promptInput, setPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth > 1024 : true
  );
  const [lineSpacing, setLineSpacing] = useState('1.75');

  // Section 7B: Table Popover & Contextual Table Editing State
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [newTableRows, setNewTableRows] = useState(3);
  const [newTableCols, setNewTableCols] = useState(3);
  const [isInsideTable, setIsInsideTable] = useState(false);

  // Section 9A: Page Layout State & Modal
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [layout, setLayout] = useState<PageLayoutSettings>(
    () => doc.metadata.layout || DEFAULT_LAYOUT
  );
  const [layoutScope, setLayoutScope] = useState<'document' | 'page'>(
    'document'
  );

  // Section 9B–D: Interactive Drawing & Shapes State
  const [showDrawingBar, setShowDrawingBar] = useState(false);
  const [activeShapeTool, setActiveShapeTool] = useState<ShapeType | 'select'>(
    'select'
  );
  const [strokeColor, setStrokeColor] = useState('#1447E6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>(
    'solid'
  );
  const [drawings, setDrawings] = useState<DrawingElement[]>(
    () => doc.metadata.drawings || []
  );
  const [drawingUndoStack, setDrawingUndoStack] = useState<DrawingElement[][]>(
    []
  );
  const [drawingRedoStack, setDrawingRedoStack] = useState<DrawingElement[][]>(
    []
  );
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null
  );
  const [dragState, setDragState] = useState<{
    mode: 'create' | 'move' | 'resize-start' | 'resize-end';
    drawingId: string;
    pageIdx: number;
    startX: number;
    startY: number;
    origX1: number;
    origY1: number;
    origX2: number;
    origY2: number;
  } | null>(null);

  // Section 10 & 11: Page Grouping by Section State & AI Context
  const [showGroupsSidebar, setShowGroupsSidebar] = useState(false);
  const [pageGroups, setPageGroups] = useState<PageGroup[]>(
    () => doc.metadata.pageGroups || []
  );
  const [selectedPagesForGrouping, setSelectedPagesForGrouping] = useState<
    number[]
  >([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [aiTargetGroupId, setAiTargetGroupId] = useState<string>('');

  // Re-initialize when switching document
  useEffect(() => {
    setTitle(doc.title);
    setPages(splitHtmlIntoInitialPages(doc.content));
    setLayout(doc.metadata.layout || DEFAULT_LAYOUT);
    setDrawings(doc.metadata.drawings || []);
    setPageGroups(doc.metadata.pageGroups || []);
    setSelectedText('');
    setAiTargetGroupId('');
    savedRangeRef.current = null;
  }, [doc.id]);

  // Populate DOM page contents when pages array updates
  useEffect(() => {
    pages.forEach((pageHtml, idx) => {
      const el = pageRefs.current[idx];
      if (el && el.innerHTML !== pageHtml) {
        el.innerHTML = pageHtml;
      }
    });
  }, [pages]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        tableMenuRef.current &&
        !tableMenuRef.current.contains(e.target as Node)
      ) {
        setShowTablePicker(false);
      }
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    return () =>
      window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update sync state when online/offline changes
  useEffect(() => {
    if (!isOnline) {
      setSaveState('offline-pending');
    } else if (saveState === 'offline-pending') {
      setSaveState('saving');
      const t = setTimeout(() => setSaveState('saved'), 500);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  const getCombinedCleanHtml = useCallback(
    (overridePages?: string[]) => {
      const targetPages = overridePages || pages;
      const currentHtmls = targetPages.map((p, idx) => {
        const el = pageRefs.current[idx];
        const raw = overridePages ? p : el ? el.innerHTML : p || '';
        return stripPersistentMarkers(raw);
      });
      return currentHtmls.join('\n<hr class="page-break" />\n');
    },
    [pages]
  );

  const triggerAutoSave = useCallback(
    (opts?: {
      overrideHtml?: string;
      overrideTitle?: string;
      overrideMeta?: Partial<DocumentItem['metadata']>;
      overrideAiHistory?: AIMessage[];
      overrideLayout?: PageLayoutSettings;
      overrideDrawings?: DrawingElement[];
      overrideGroups?: PageGroup[];
    }) => {
      setSaveState('saving');
      const combinedHtml =
        opts?.overrideHtml !== undefined
          ? opts.overrideHtml
          : getCombinedCleanHtml();

      const now = new Date();
      const updatedAt = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
        now.getHours()
      ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const nextSync: SyncStatus = isOnline ? 'saved' : 'offline-pending';
      const nextLayout = opts?.overrideLayout || layout;
      const nextDrawings = opts?.overrideDrawings || drawings;
      const nextGroups = opts?.overrideGroups || pageGroups;

      onUpdateDocument({
        ...doc,
        title: opts?.overrideTitle !== undefined ? opts.overrideTitle : title,
        content: combinedHtml,
        updatedAt,
        syncStatus: nextSync,
        metadata: {
          ...doc.metadata,
          ...opts?.overrideMeta,
          layout: nextLayout,
          drawings: nextDrawings,
          pageGroups: nextGroups,
          orientation: nextLayout.orientation,
        },
        aiHistory: opts?.overrideAiHistory || doc.aiHistory,
      });

      setTimeout(() => {
        setSaveState(nextSync);
      }, 300);
    },
    [
      doc,
      drawings,
      getCombinedCleanHtml,
      isOnline,
      layout,
      onUpdateDocument,
      pageGroups,
      title,
    ]
  );

  // Calculate page dimensions & max printable height based on current layout
  const getPageDimensions = (pageIdx: number) => {
    const base =
      layout.pageSize === 'Custom'
        ? {
            w: Math.round((layout.customWidthMm || 210) * 3.78),
            h: Math.round((layout.customHeightMm || 297) * 3.78),
          }
        : PAGE_DIMENSIONS_PX[layout.pageSize];

    const pageOrient =
      layout.sectionOrientations?.[pageIdx] || layout.orientation;
    const widthPx = pageOrient === 'landscape' ? base.h : base.w;
    const heightPx = pageOrient === 'landscape' ? base.w : base.h;

    const padTopPx = Math.round(layout.marginTopMm * 3.2);
    const padBottomPx = Math.round(layout.marginBottomMm * 3.2);
    const padLeftPx = Math.round(layout.marginLeftMm * 3.2);
    const padRightPx = Math.round(layout.marginRightMm * 3.2);

    const maxBodyHeight = Math.max(
      420,
      heightPx - padTopPx - padBottomPx - 120
    );

    return {
      widthPx,
      heightPx,
      padTopPx,
      padBottomPx,
      padLeftPx,
      padRightPx,
      maxBodyHeight,
      pageOrient,
    };
  };

  /**
   * Automatic Multi-Page Content Flow (Section 5.2 & 9E)
   */
  const checkAndFlowPages = useCallback(
    (pageIndex: number) => {
      const pageEl = pageRefs.current[pageIndex];
      if (!pageEl) return;

      const { maxBodyHeight } = getPageDimensions(pageIndex);

      if (
        pageEl.scrollHeight > maxBodyHeight &&
        pageEl.children.length > 1
      ) {
        const movedNodes: string[] = [];
        while (
          pageEl.scrollHeight > maxBodyHeight &&
          pageEl.children.length > 1
        ) {
          const lastChild = pageEl.lastElementChild;
          if (!lastChild) break;
          movedNodes.unshift(lastChild.outerHTML);
          pageEl.removeChild(lastChild);
        }

        if (movedNodes.length > 0) {
          const overflowHtml = movedNodes.join('');
          setPages((prev) => {
            const next = prev.map((_, i) =>
              pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : prev[i]
            );
            next[pageIndex] = pageEl.innerHTML;
            if (pageIndex + 1 < next.length) {
              next[pageIndex + 1] = overflowHtml + next[pageIndex + 1];
              if (pageRefs.current[pageIndex + 1]) {
                pageRefs.current[pageIndex + 1]!.innerHTML =
                  next[pageIndex + 1];
              }
            } else {
              next.push(overflowHtml);
            }
            return next;
          });
        }
      }

      triggerAutoSave();
    },
    [layout, triggerAutoSave]
  );

  const unwrapPersistentMarks = () => {
    pageRefs.current.forEach((pageEl) => {
      if (!pageEl) return;
      const marks = pageEl.querySelectorAll('mark.ai-persistent-selection');
      marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      });
    });
  };

  const handlePageSelection = (pageIdx: number, e?: React.SyntheticEvent) => {
    activePageIdxRef.current = pageIdx;

    // Detect if cursor is inside a table cell (Section 7B)
    const targetNode = (e?.target as HTMLElement) || null;
    const cell =
      targetNode?.closest?.('td, th') ||
      (window.getSelection()?.anchorNode?.parentElement?.closest('td, th') as
        | HTMLTableCellElement
        | null);

    if (cell) {
      activeTableCellRef.current = cell as HTMLTableCellElement;
      setIsInsideTable(true);
    } else {
      setIsInsideTable(false);
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const pageEl = pageRefs.current[pageIdx];
    if (pageEl && pageEl.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }

    const text = sel.toString().trim();
    if (text.length > 0) {
      unwrapPersistentMarks();
      const freshSel = window.getSelection();
      if (freshSel && freshSel.rangeCount > 0) {
        savedRangeRef.current = freshSel.getRangeAt(0).cloneRange();
      }
      setSelectedText(text);
      setSelectedPageIdx(pageIdx);
    }
  };

  const applyVisualSelectionLock = () => {
    if (!selectedText || !savedRangeRef.current) return;
    const pageEl = pageRefs.current[selectedPageIdx];
    if (!pageEl) return;
    if (pageEl.querySelector('mark.ai-persistent-selection')) return;

    try {
      const range = savedRangeRef.current;
      const mark = window.document.createElement('mark');
      mark.className = 'ai-persistent-selection';
      mark.appendChild(range.extractContents());
      range.insertNode(mark);

      const newRange = window.document.createRange();
      newRange.selectNodeContents(mark);
      savedRangeRef.current = newRange;
    } catch {
      // Multi-block selection still preserves savedRangeRef
    }
  };

  const handleClearSelection = () => {
    unwrapPersistentMarks();
    setSelectedText('');
    savedRangeRef.current = null;
    window.getSelection()?.removeAllRanges();
  };

  // Reliable formatting execution (Section 7A)
  const execFormat = (command: string, value?: string) => {
    const targetPage =
      pageRefs.current[activePageIdxRef.current] || pageRefs.current[0];
    if (!targetPage) return;

    unwrapPersistentMarks();
    targetPage.focus();
    if (savedRangeRef.current) {
      try {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRangeRef.current);
      } catch {
        // ignore stale range
      }
    }
    window.document.execCommand(command, false, value);

    const updatedSel = window.getSelection();
    if (updatedSel && updatedSel.rangeCount > 0) {
      savedRangeRef.current = updatedSel.getRangeAt(0).cloneRange();
    }
    checkAndFlowPages(activePageIdxRef.current);
  };

  // =========================================================================
  // SECTION 7B: PROPER EDITABLE TABLES (INSERT, ADD/DELETE/MOVE/RESIZE ROWS & COLS)
  // =========================================================================
  const handleInsertConfiguredTable = (rows: number, cols: number) => {
    const rCount = Math.max(1, Math.min(20, rows));
    const cCount = Math.max(1, Math.min(12, cols));

    const headerCells = Array.from({ length: cCount })
      .map((_, c) => `<th style="width: ${Math.floor(100 / cCount)}%;">Header ${c + 1}</th>`)
      .join('');

    const bodyRows = Array.from({ length: Math.max(1, rCount - 1) })
      .map(
        (_, r) =>
          `<tr>${Array.from({ length: cCount })
            .map((__, c) => `<td>Cell ${r + 1},${c + 1}</td>`)
            .join('')}</tr>`
      )
      .join('');

    const tableHtml = `
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <p><br/></p>
    `;
    setShowTablePicker(false);
    execFormat('insertHTML', tableHtml);
  };

  const modifyActiveTable = (
    action:
      | 'add-row-above'
      | 'add-row-below'
      | 'add-col-left'
      | 'add-col-right'
      | 'del-row'
      | 'del-col'
      | 'del-table'
      | 'row-up'
      | 'row-down'
      | 'col-left'
      | 'col-right'
      | 'col-wider'
      | 'col-narrower'
      | 'row-taller'
      | 'row-shorter'
  ) => {
    const cell = activeTableCellRef.current;
    if (!cell) return;
    const row = cell.closest('tr');
    const table = cell.closest('table');
    if (!row || !table) return;

    const cellIndex = cell.cellIndex;
    const allRows = Array.from(table.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(row);
    const colCount = row.cells.length;

    if (action === 'del-table') {
      table.remove();
      setIsInsideTable(false);
      activeTableCellRef.current = null;
      triggerAutoSave();
      return;
    }

    if (action === 'add-row-above' || action === 'add-row-below') {
      const newRow = window.document.createElement('tr');
      for (let i = 0; i < colCount; i++) {
        const td = window.document.createElement('td');
        td.innerHTML = 'New cell';
        newRow.appendChild(td);
      }
      if (action === 'add-row-above') {
        row.parentNode?.insertBefore(newRow, row);
      } else {
        row.parentNode?.insertBefore(newRow, row.nextSibling);
      }
    } else if (action === 'del-row') {
      if (allRows.length <= 1) {
        table.remove();
        setIsInsideTable(false);
      } else {
        row.remove();
      }
    } else if (action === 'add-col-left' || action === 'add-col-right') {
      allRows.forEach((r) => {
        const refCell = r.cells[cellIndex];
        const isHeader = r.parentElement?.tagName === 'THEAD' || refCell?.tagName === 'TH';
        const newCell = window.document.createElement(isHeader ? 'th' : 'td');
        newCell.innerHTML = isHeader ? 'Header' : 'Cell';
        if (action === 'add-col-left') {
          r.insertBefore(newCell, refCell);
        } else {
          r.insertBefore(newCell, refCell ? refCell.nextSibling : null);
        }
      });
    } else if (action === 'del-col') {
      if (colCount <= 1) {
        table.remove();
        setIsInsideTable(false);
      } else {
        allRows.forEach((r) => {
          if (r.cells[cellIndex]) r.deleteCell(cellIndex);
        });
      }
    } else if (action === 'row-up' && rowIndex > 0) {
      const prevRow = allRows[rowIndex - 1];
      if (prevRow.parentNode === row.parentNode) {
        row.parentNode?.insertBefore(row, prevRow);
      }
    } else if (action === 'row-down' && rowIndex < allRows.length - 1) {
      const nextRow = allRows[rowIndex + 1];
      if (nextRow.parentNode === row.parentNode) {
        row.parentNode?.insertBefore(nextRow, row);
      }
    } else if (action === 'col-left' && cellIndex > 0) {
      allRows.forEach((r) => {
        const cur = r.cells[cellIndex];
        const prev = r.cells[cellIndex - 1];
        if (cur && prev) r.insertBefore(cur, prev);
      });
    } else if (action === 'col-right' && cellIndex < colCount - 1) {
      allRows.forEach((r) => {
        const cur = r.cells[cellIndex];
        const next = r.cells[cellIndex + 1];
        if (cur && next) r.insertBefore(next, cur);
      });
    } else if (action === 'col-wider' || action === 'col-narrower') {
      const currentW = cell.offsetWidth || 120;
      const nextW =
        action === 'col-wider'
          ? currentW + 28
          : Math.max(50, currentW - 28);
      allRows.forEach((r) => {
        if (r.cells[cellIndex]) {
          (r.cells[cellIndex] as HTMLElement).style.width = `${nextW}px`;
        }
      });
    } else if (action === 'row-taller' || action === 'row-shorter') {
      const currentH = row.offsetHeight || 36;
      const nextH =
        action === 'row-taller'
          ? currentH + 14
          : Math.max(24, currentH - 14);
      (row as HTMLElement).style.height = `${nextH}px`;
    }

    triggerAutoSave();
  };

  const handleInsertImage = () => {
    const url = window.prompt(
      'Enter image URL:',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80'
    );
    if (!url) return;
    execFormat(
      'insertHTML',
      `<figure style="margin: 14px 0; text-align: center;"><img src="${url}" alt="Document Image" style="max-width: 100%; height: auto; border: 1px solid #CBD5E1;" /></figure><p><br/></p>`
    );
  };

  // =========================================================================
  // SECTION 8: ADD PAGE vs PAGE BREAK
  // =========================================================================
  const handleAddBlankPage = () => {
    const idx = activePageIdxRef.current;
    const currentHtmls = pages.map((_, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
    );
    const nextPages = [...currentHtmls];
    const insertPos = idx + 1;
    nextPages.splice(insertPos, 0, '<p><br/></p>');
    setPages(nextPages);

    setTimeout(() => {
      const newPageEl = pageRefs.current[insertPos];
      if (newPageEl) {
        newPageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newPageEl.focus();
        activePageIdxRef.current = insertPos;
      }
      triggerAutoSave({
        overrideHtml: nextPages
          .map(stripPersistentMarkers)
          .join('\n<hr class="page-break" />\n'),
      });
    }, 80);
  };

  const handleInsertPageBreak = () => {
    const idx = activePageIdxRef.current;
    const pageEl = pageRefs.current[idx];
    if (!pageEl) return;

    // Move blocks after current cursor (or last block if more than 1) to the next page
    let movedHtml = '<p><br/></p>';
    if (pageEl.children.length > 1) {
      const last = pageEl.lastElementChild!;
      movedHtml = last.outerHTML;
      pageEl.removeChild(last);
    }

    const currentHtmls = pages.map((_, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
    );
    const nextPages = [...currentHtmls];
    if (idx + 1 < nextPages.length) {
      nextPages[idx + 1] = movedHtml + nextPages[idx + 1];
    } else {
      nextPages.push(movedHtml);
    }
    setPages(nextPages);
    setTimeout(() => {
      triggerAutoSave({
        overrideHtml: nextPages
          .map(stripPersistentMarkers)
          .join('\n<hr class="page-break" />\n'),
      });
    }, 60);
  };

  // =========================================================================
  // SECTION 9B–D: INTERACTIVE DRAWING & SHAPES HANDLERS
  // =========================================================================
  const pushDrawingHistory = (nextDrawings: DrawingElement[]) => {
    setDrawingUndoStack((prev) => [...prev.slice(-19), drawings]);
    setDrawingRedoStack([]);
    setDrawings(nextDrawings);
    triggerAutoSave({ overrideDrawings: nextDrawings });
  };

  const handleUndoDrawing = () => {
    if (drawingUndoStack.length === 0) return;
    const prev = drawingUndoStack[drawingUndoStack.length - 1];
    setDrawingRedoStack((r) => [...r, drawings]);
    setDrawingUndoStack((u) => u.slice(0, -1));
    setDrawings(prev);
    triggerAutoSave({ overrideDrawings: prev });
  };

  const handleRedoDrawing = () => {
    if (drawingRedoStack.length === 0) return;
    const next = drawingRedoStack[drawingRedoStack.length - 1];
    setDrawingUndoStack((u) => [...u, drawings]);
    setDrawingRedoStack((r) => r.slice(0, -1));
    setDrawings(next);
    triggerAutoSave({ overrideDrawings: next });
  };

  const getPointerCoords = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientX
        : (e as React.MouseEvent<SVGSVGElement>).clientX;
    const clientY =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientY
        : (e as React.MouseEvent<SVGSVGElement>).clientY;
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    };
  };

  const handlePagePointerDown = (
    pageIdx: number,
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (!showDrawingBar || activeShapeTool === 'select') return;
    e.stopPropagation();
    const { x, y } = getPointerCoords(e);

    const newId = `drw-${Date.now()}`;
    const newShape: DrawingElement = {
      id: newId,
      pageIndex: pageIdx,
      type: activeShapeTool,
      x1: x,
      y1: y,
      x2: x + 2,
      y2: y + 2,
      points: activeShapeTool === 'freehand' ? [{ x, y }] : undefined,
      strokeColor,
      strokeWidth,
      lineStyle,
    };

    setDrawingUndoStack((prev) => [...prev.slice(-19), drawings]);
    setDrawingRedoStack([]);
    setDrawings((prev) => [...prev, newShape]);
    setSelectedDrawingId(newId);
    setDragState({
      mode: 'create',
      drawingId: newId,
      pageIdx,
      startX: x,
      startY: y,
      origX1: x,
      origY1: y,
      origX2: x,
      origY2: y,
    });
  };

  const handlePagePointerMove = (
    pageIdx: number,
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (!dragState || dragState.pageIdx !== pageIdx) return;
    const { x, y } = getPointerCoords(e);

    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id !== dragState.drawingId) return d;

        if (dragState.mode === 'create') {
          if (d.type === 'hline') {
            return { ...d, x2: x, y2: d.y1 };
          }
          if (d.type === 'vline') {
            return { ...d, x2: d.x1, y2: y };
          }
          if (d.type === 'square') {
            const side = Math.max(Math.abs(x - d.x1), Math.abs(y - d.y1));
            return {
              ...d,
              x2: d.x1 + (x >= d.x1 ? side : -side),
              y2: d.y1 + (y >= d.y1 ? side : -side),
            };
          }
          if (d.type === 'freehand') {
            return {
              ...d,
              x2: x,
              y2: y,
              points: [...(d.points || []), { x, y }],
            };
          }
          return { ...d, x2: x, y2: y };
        }

        if (dragState.mode === 'move') {
          const dx = x - dragState.startX;
          const dy = y - dragState.startY;
          return {
            ...d,
            x1: dragState.origX1 + dx,
            y1: dragState.origY1 + dy,
            x2: dragState.origX2 + dx,
            y2: dragState.origY2 + dy,
          };
        }

        if (dragState.mode === 'resize-start') {
          return { ...d, x1: x, y1: y };
        }

        if (dragState.mode === 'resize-end') {
          return { ...d, x2: x, y2: y };
        }

        return d;
      })
    );
  };

  const handlePagePointerUp = () => {
    if (!dragState) return;
    setDragState(null);
    triggerAutoSave({ overrideDrawings: drawings });
  };

  const handleDeleteSelectedDrawing = () => {
    if (!selectedDrawingId) return;
    const next = drawings.filter((d) => d.id !== selectedDrawingId);
    pushDrawingHistory(next);
    setSelectedDrawingId(null);
  };

  // =========================================================================
  // SECTION 10: PAGE GROUPING BY SECTION
  // =========================================================================
  const togglePageSelectionForGroup = (pageIdx: number) => {
    setSelectedPagesForGrouping((prev) =>
      prev.includes(pageIdx)
        ? prev.filter((p) => p !== pageIdx)
        : [...prev, pageIdx].sort((a, b) => a - b)
    );
  };

  const handleCreatePageGroup = () => {
    if (selectedPagesForGrouping.length === 0) return;
    const name =
      newGroupName.trim() ||
      `Group ${pageGroups.length + 1}: Pages ${selectedPagesForGrouping
        .map((p) => p + 1)
        .join(', ')}`;

    const newGroup: PageGroup = {
      id: `grp-${Date.now()}`,
      name,
      pageIndices: selectedPagesForGrouping,
      collapsed: false,
    };

    const nextGroups = [...pageGroups, newGroup];
    setPageGroups(nextGroups);
    setSelectedPagesForGrouping([]);
    setNewGroupName('');
    triggerAutoSave({ overrideGroups: nextGroups });
  };

  const handleDeletePageGroup = (groupId: string) => {
    const nextGroups = pageGroups.filter((g) => g.id !== groupId);
    setPageGroups(nextGroups);
    if (aiTargetGroupId === groupId) setAiTargetGroupId('');
    triggerAutoSave({ overrideGroups: nextGroups });
  };

  const handleCommitGroupRename = (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    const nextGroups = pageGroups.map((g) =>
      g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
    );
    setPageGroups(nextGroups);
    setEditingGroupId(null);
    triggerAutoSave({ overrideGroups: nextGroups });
  };

  const handleTogglePageInGroup = (groupId: string, pageIdx: number) => {
    const nextGroups = pageGroups.map((g) => {
      if (g.id !== groupId) return g;
      const exists = g.pageIndices.includes(pageIdx);
      const nextIndices = exists
        ? g.pageIndices.filter((p) => p !== pageIdx)
        : [...g.pageIndices, pageIdx].sort((a, b) => a - b);
      return { ...g, pageIndices: nextIndices };
    });
    setPageGroups(nextGroups);
    triggerAutoSave({ overrideGroups: nextGroups });
  };

  // =========================================================================
  // SECTION 6.3 & 11: AI CONTENT APPLICATION (INCLUDING GROUP-SCOPED APPLY)
  // =========================================================================
  const handleApplyAiContent = (
    msg: AIMessage,
    mode: 'replace' | 'below' | 'cursor' | 'append' | 'group'
  ) => {
    const generatedHtml = msg.generatedHtml || '';
    if (!generatedHtml) return;

    // Group-specific application (Section 11: modifies ONLY pages in that group)
    if (mode === 'group' && msg.targetGroupId) {
      const targetGroup = pageGroups.find((g) => g.id === msg.targetGroupId);
      if (targetGroup && targetGroup.pageIndices.length > 0) {
        const firstPageIdx = targetGroup.pageIndices[0];
        const nextPages = pages.map((_, i) =>
          pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
        );
        nextPages[firstPageIdx] = generatedHtml;
        if (pageRefs.current[firstPageIdx]) {
          pageRefs.current[firstPageIdx]!.innerHTML = generatedHtml;
        }
        setPages(nextPages);
        const updatedHistory = doc.aiHistory.map((m) =>
          m.id === msg.id ? { ...m, inserted: true } : m
        );
        triggerAutoSave({
          overrideHtml: getCombinedCleanHtml(nextPages),
          overrideAiHistory: updatedHistory,
        });
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
          setShowAiPanel(false);
        }
        return;
      }
    }

    const targetPageIdx = selectedText
      ? selectedPageIdx
      : activePageIdxRef.current;
    const targetPageEl =
      pageRefs.current[targetPageIdx] ||
      pageRefs.current[pageRefs.current.length - 1];

    if (!targetPageEl) return;

    if (mode === 'replace') {
      const persistentMark = targetPageEl.querySelector(
        'mark.ai-persistent-selection'
      );
      if (persistentMark) {
        const temp = window.document.createElement('div');
        temp.innerHTML = generatedHtml;
        persistentMark.replaceWith(...Array.from(temp.childNodes));
      } else if (savedRangeRef.current) {
        targetPageEl.focus();
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRangeRef.current);
        window.document.execCommand('insertHTML', false, generatedHtml);
      } else {
        targetPageEl.innerHTML += generatedHtml;
      }
      handleClearSelection();
      checkAndFlowPages(targetPageIdx);
    } else if (mode === 'below') {
      const persistentMark = targetPageEl.querySelector(
        'mark.ai-persistent-selection'
      );
      if (persistentMark) {
        const blockParent =
          persistentMark.closest('p, h1, h2, h3, li, div') || persistentMark;
        blockParent.insertAdjacentHTML('afterend', generatedHtml);
        unwrapPersistentMarks();
      } else {
        targetPageEl.innerHTML += generatedHtml;
      }
      checkAndFlowPages(targetPageIdx);
    } else if (mode === 'cursor') {
      unwrapPersistentMarks();
      targetPageEl.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRangeRef.current);
        window.document.execCommand('insertHTML', false, generatedHtml);
      } else {
        targetPageEl.innerHTML += generatedHtml;
      }
      checkAndFlowPages(targetPageIdx);
    } else if (mode === 'append') {
      unwrapPersistentMarks();
      const lastIdx = pages.length - 1;
      const lastPageEl = pageRefs.current[lastIdx];
      if (lastPageEl) {
        lastPageEl.innerHTML += `\n${generatedHtml}`;
        checkAndFlowPages(lastIdx);
      }
    }

    const updatedHistory = doc.aiHistory.map((m) =>
      m.id === msg.id ? { ...m, inserted: true } : m
    );
    triggerAutoSave({ overrideAiHistory: updatedHistory });
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setShowAiPanel(false);
    }
  };

  const handleSendAiPrompt = (customInstruction?: string) => {
    const query = (customInstruction ?? promptInput).trim();
    if (!query) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      prompt: query,
      timestamp: timeStr,
    };

    const currentPagesHtml = pages.map((_, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
    );

    setPromptInput('');
    setIsAiLoading(true);

    setTimeout(() => {
      const result = runWorkspaceAIPrompt(
        query,
        {
          ...doc,
          metadata: { ...doc.metadata, pageGroups },
        },
        selectedText,
        currentPagesHtml,
        aiTargetGroupId || undefined
      );

      const assistantMsg: AIMessage = {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        prompt: query,
        summary: result.summary,
        generatedHtml: result.generatedHtml,
        timestamp: timeStr,
        inserted: false,
        targetGroupId: result.targetGroupId,
        targetGroupName: result.targetGroupName,
      };

      const nextHistory = [...doc.aiHistory, userMsg, assistantMsg];
      setIsAiLoading(false);
      triggerAutoSave({ overrideAiHistory: nextHistory });
    }, 360);
  };

  const truncatedSelection =
    selectedText.length > 68
      ? `${selectedText.slice(0, 68).trim()}...`
      : selectedText;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg-ivory)',
      }}
    >
      {/* =====================================================================
          5.1 TOP WORKSPACE HEADER
      ===================================================================== */}
      <header
        className="no-print"
        style={{
          height: '56px',
          padding: '0 18px',
          backgroundColor: 'var(--bg-ivory)',
          borderBottom: '1px solid var(--border-ivory)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        {/* Left Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
            flex: 1,
          }}
        >
          <button
            onClick={onBack}
            className="btn-ed-subtle"
            style={{ height: '32px', padding: '0 10px' }}
            title="Back to Documents"
          >
            <ArrowLeft size={13} />
            <span className="hide-on-mobile">Back</span>
          </button>

          <div
            className="hide-on-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              paddingRight: '10px',
              borderRight: '1px solid var(--border-ivory)',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="10" y="2" width="4" height="8" fill="var(--ink-navy)" />
              <rect x="10" y="14" width="4" height="8" fill="var(--ink-navy)" />
              <rect x="2" y="10" width="8" height="4" fill="var(--ink-navy)" />
              <rect x="14" y="10" width="8" height="4" fill="var(--accent-blue)" />
            </svg>
            <span
              style={{
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '-0.02em',
                color: 'var(--ink-navy)',
              }}
            >
              Nigerian Cafe
            </span>
          </div>

          {/* Editable Document Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerAutoSave({ overrideTitle: e.target.value });
            }}
            style={{
              fontWeight: 700,
              fontSize: '14.5px',
              color: 'var(--ink-navy)',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              padding: '4px 8px',
              outline: 'none',
              minWidth: '100px',
              maxWidth: '360px',
              width: '100%',
              textOverflow: 'ellipsis',
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = 'var(--border-stone)')
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            title="Edit document title"
          />

          {/* Save Status Indicator */}
          <div
            className="mono-label"
            style={{
              fontSize: '10px',
              color: 'var(--ink-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
            }}
          >
            {isSyncing ? (
              <>
                <RefreshCw size={12} color="var(--accent-blue)" />
                <span className="hide-on-mobile">Syncing...</span>
              </>
            ) : saveState === 'saving' ? (
              <>
                <RefreshCw size={12} color="var(--accent-blue)" />
                <span className="hide-on-mobile">Saving...</span>
              </>
            ) : saveState === 'offline-pending' ? (
              <>
                <CloudOff size={12} color="var(--accent-terracotta)" />
                <span style={{ color: 'var(--accent-terracotta)' }}>
                  Offline
                </span>
              </>
            ) : saveState === 'sync-failed' ? (
              <>
                <AlertTriangle size={12} color="#DC2626" />
                <span style={{ color: '#DC2626' }}>Sync failed</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} color="#16A34A" />
                <span className="hide-on-mobile">Saved</span>
              </>
            )}
          </div>
        </div>

        {/* Right Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execFormat('undo')}
            className="btn-ed-subtle"
            style={{ height: '32px', padding: '0 8px' }}
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execFormat('redo')}
            className="btn-ed-subtle"
            style={{ height: '32px', padding: '0 8px' }}
            title="Redo"
          >
            <Redo2 size={14} />
          </button>

          {/* Export Dropdown */}
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="btn-ed-primary"
              style={{ height: '32px', padding: '0 12px', fontSize: '10px' }}
            >
              <Download size={12} />
              <span>Export</span>
              <ChevronDown size={11} />
            </button>

            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '185px',
                  backgroundColor: 'var(--bg-ivory)',
                  border: '1px solid var(--border-stone)',
                  boxShadow: '0 8px 20px rgba(10, 25, 78, 0.12)',
                  zIndex: 100,
                }}
              >
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportDocx({
                      ...doc,
                      title,
                      content: getCombinedCleanHtml(),
                      metadata: {
                        ...doc.metadata,
                        layout,
                        drawings,
                        pageGroups,
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border-ivory)',
                    fontSize: '12.5px',
                    color: 'var(--ink-navy)',
                    cursor: 'pointer',
                  }}
                >
                  Word Document (.DOCX)
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportPdf({
                      ...doc,
                      title,
                      content: getCombinedCleanHtml(),
                      metadata: {
                        ...doc.metadata,
                        layout,
                        drawings,
                        pageGroups,
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border-ivory)',
                    fontSize: '12.5px',
                    color: 'var(--ink-navy)',
                    cursor: 'pointer',
                  }}
                >
                  PDF Document (.PDF)
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportTxt({
                      ...doc,
                      title,
                      content: getCombinedCleanHtml(),
                    });
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    fontSize: '12.5px',
                    color: 'var(--ink-navy)',
                    cursor: 'pointer',
                  }}
                >
                  Plain Text (.TXT)
                </button>
              </div>
            )}
          </div>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setShowAiPanel((p) => !p)}
            className="btn-ed-subtle"
            style={{
              height: '32px',
              padding: '0 10px',
              backgroundColor: showAiPanel ? 'var(--bg-stone)' : 'transparent',
            }}
            title="Toggle AI Assistant"
          >
            <Sparkles size={13} color="var(--accent-blue)" />
            <span className="hide-on-mobile">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          5.3 & 7–10 FORMATTING AND PAGE MANAGEMENT TOOLBAR
      ===================================================================== */}
      <div
        className="no-print"
        style={{
          padding: '6px 18px',
          backgroundColor: 'var(--bg-ivory)',
          borderBottom: '1px solid var(--border-ivory)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {/* Font Family */}
        <select
          value={doc.metadata.fontFamily || 'Times New Roman'}
          onChange={(e) => {
            execFormat('fontName', e.target.value);
            triggerAutoSave({
              overrideMeta: { fontFamily: e.target.value },
            });
          }}
          className="ed-select"
          style={{ width: '136px', padding: '4px 7px', fontSize: '12px' }}
        >
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Calibri">Calibri</option>
        </select>

        {/* Headings */}
        <select
          onChange={(e) => execFormat('formatBlock', e.target.value)}
          defaultValue="P"
          className="ed-select"
          style={{ width: '106px', padding: '4px 7px', fontSize: '12px' }}
        >
          <option value="P">Normal</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => execFormat('fontSize', e.target.value)}
          defaultValue="3"
          className="ed-select"
          style={{ width: '70px', padding: '4px 6px', fontSize: '12px' }}
        >
          <option value="2">10 pt</option>
          <option value="3">12 pt</option>
          <option value="4">14 pt</option>
          <option value="5">18 pt</option>
          <option value="6">24 pt</option>
        </select>

        {/* Bold, Italic, Underline (with preventDefault so focus/selection never drops!) */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('bold')}
          className="btn-ed-subtle"
          style={{ padding: '5px 8px' }}
          title="Bold (Ctrl+B)"
        >
          <Bold size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('italic')}
          className="btn-ed-subtle"
          style={{ padding: '5px 8px' }}
          title="Italic (Ctrl+I)"
        >
          <Italic size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('underline')}
          className="btn-ed-subtle"
          style={{ padding: '5px 8px' }}
          title="Underline (Ctrl+U)"
        >
          <Underline size={13} />
        </button>

        {/* Text Colour & Highlight */}
        <label
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', cursor: 'pointer' }}
          title="Text Colour"
        >
          <span style={{ fontSize: '11px', fontWeight: 700 }}>A</span>
          <input
            type="color"
            defaultValue="#0A194E"
            onChange={(e) => execFormat('foreColor', e.target.value)}
            style={{ width: '13px', height: '13px', border: 'none', padding: 0 }}
          />
        </label>

        <label
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', cursor: 'pointer' }}
          title="Highlight"
        >
          <span
            style={{
              fontSize: '10px',
              backgroundColor: '#FEF08A',
              padding: '0 3px',
              color: '#111',
            }}
          >
            ab
          </span>
          <input
            type="color"
            defaultValue="#FEF08A"
            onChange={(e) => execFormat('hiliteColor', e.target.value)}
            style={{ width: '13px', height: '13px', border: 'none', padding: 0 }}
          />
        </label>

        {/* Alignment */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyLeft')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
          title="Align Left"
        >
          <AlignLeft size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyCenter')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
          title="Align Center"
        >
          <AlignCenter size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyRight')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
          title="Align Right"
        >
          <AlignRight size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyFull')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
          title="Justify"
        >
          <AlignJustify size={13} />
        </button>

        {/* Line Spacing */}
        <select
          value={lineSpacing}
          onChange={(e) => setLineSpacing(e.target.value)}
          className="ed-select"
          style={{ width: '78px', padding: '4px 5px', fontSize: '11.5px' }}
          title="Line Spacing"
        >
          <option value="1.4">1.15x</option>
          <option value="1.75">1.5x</option>
          <option value="2.1">2.0x</option>
        </select>

        {/* Lists */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('insertUnorderedList')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
          title="Bulleted List"
        >
          <List size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('insertOrderedList')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
          title="Numbered List"
        >
          <ListOrdered size={13} />
        </button>

        {/* Section 7B: Editable Table Picker */}
        <div ref={tableMenuRef} style={{ position: 'relative' }}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowTablePicker((prev) => !prev)}
            className="btn-ed-subtle"
            style={{
              padding: '5px 9px',
              backgroundColor: showTablePicker
                ? 'var(--bg-stone)'
                : 'transparent',
            }}
            title="Insert Editable Table"
          >
            <Table size={13} />
            <span>Table</span>
          </button>

          {showTablePicker && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '220px',
                backgroundColor: 'var(--bg-ivory)',
                border: '1px solid var(--border-stone)',
                boxShadow: '0 8px 20px rgba(10, 25, 78, 0.14)',
                padding: '12px',
                zIndex: 110,
              }}
            >
              <div className="ed-field-label" style={{ marginBottom: '8px' }}>
                Insert Table ({newTableRows} × {newTableCols})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <label className="ed-field-label">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newTableRows}
                    onChange={(e) =>
                      setNewTableRows(parseInt(e.target.value || '3', 10))
                    }
                    className="ed-input"
                    style={{ padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label className="ed-field-label">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newTableCols}
                    onChange={(e) =>
                      setNewTableCols(parseInt(e.target.value || '3', 10))
                    }
                    className="ed-input"
                    style={{ padding: '5px 8px', fontSize: '12px' }}
                  />
                </div>
              </div>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  handleInsertConfiguredTable(newTableRows, newTableCols)
                }
                className="btn-ed-primary"
                style={{ width: '100%', padding: '7px 10px', fontSize: '10px' }}
              >
                Insert Table
              </button>
            </div>
          )}
        </div>

        {/* Image */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertImage}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
          title="Insert Image"
        >
          <ImageIcon size={13} />
          <span>Image</span>
        </button>

        {/* Page Break */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertPageBreak}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
          title="Move content to next page"
        >
          <SeparatorHorizontal size={13} />
          <span>Page Break</span>
        </button>

        {/* Section 8: Add Page */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddBlankPage}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
          title="Add a new blank page to document"
        >
          <FilePlus2 size={13} color="var(--accent-blue)" />
          <span>Add Page</span>
        </button>

        {/* Section 10: Group Pages */}
        <button
          onClick={() => setShowGroupsSidebar((prev) => !prev)}
          className="btn-ed-subtle"
          style={{
            padding: '5px 9px',
            backgroundColor: showGroupsSidebar
              ? 'var(--bg-stone)'
              : 'transparent',
          }}
          title="Organise document pages into named sections"
        >
          <Layers size={13} color="var(--accent-blue)" />
          <span>Group Pages ({pageGroups.length})</span>
        </button>

        {/* Section 9A: Change Page Layout */}
        <button
          onClick={() => setShowLayoutModal(true)}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
          title="Change Page Size, Orientation, Margins, Columns & Borders"
        >
          <LayoutTemplate size={13} color="var(--accent-blue)" />
          <span>Change Page Layout</span>
        </button>

        {/* Section 9B: Drawing & Shapes ("Board / Draw") */}
        <button
          onClick={() => setShowDrawingBar((prev) => !prev)}
          className="btn-ed-subtle"
          style={{
            padding: '5px 9px',
            backgroundColor: showDrawingBar
              ? 'var(--bg-stone)'
              : 'transparent',
          }}
          title="Draw lines, arrows, rectangles, circles and freehand shapes"
        >
          <PenTool size={13} color="var(--accent-blue)" />
          <span>Draw / Shapes</span>
        </button>
      </div>

      {/* =====================================================================
          SECTION 7B: CONTEXTUAL TABLE STRUCTURE BAR (Shown when cursor is in a Table)
      ===================================================================== */}
      {isInsideTable && (
        <div
          className="no-print"
          style={{
            padding: '5px 18px',
            backgroundColor: 'var(--bg-stone)',
            borderBottom: '1px solid var(--border-stone)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <span
            className="mono-label"
            style={{ fontSize: '9.5px', color: 'var(--accent-blue)' }}
          >
            Table Controls:
          </span>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('add-row-above')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 8px' }}
          >
            + Row Above
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('add-row-below')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 8px' }}
          >
            + Row Below
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('add-col-left')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 8px' }}
          >
            + Col Left
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('add-col-right')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 8px' }}
          >
            + Col Right
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('row-up')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
            title="Move Row Up"
          >
            <ArrowUp size={11} /> Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('row-down')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
            title="Move Row Down"
          >
            <ArrowDown size={11} /> Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('col-left')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
            title="Move Column Left"
          >
            <ArrowLeftIcon size={11} /> Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('col-right')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
            title="Move Column Right"
          >
            <ArrowRightIcon size={11} /> Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('col-wider')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            Col Width +
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('col-narrower')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            Col Width -
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('row-taller')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            Row Height +
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('del-row')}
            className="btn-ed-subtle"
            style={{
              backgroundColor: 'var(--bg-ivory)',
              color: 'var(--accent-terracotta)',
              padding: '4px 8px',
            }}
          >
            Del Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('del-col')}
            className="btn-ed-subtle"
            style={{
              backgroundColor: 'var(--bg-ivory)',
              color: 'var(--accent-terracotta)',
              padding: '4px 8px',
            }}
          >
            Del Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('del-table')}
            className="btn-ed-subtle"
            style={{
              backgroundColor: 'var(--bg-ivory)',
              color: 'var(--accent-terracotta)',
              padding: '4px 8px',
            }}
          >
            Del Table
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 9B–C: DRAWING & SHAPES TOOLBAR (When Draw / Shapes is active)
      ===================================================================== */}
      {showDrawingBar && (
        <div
          className="no-print"
          style={{
            padding: '6px 18px',
            backgroundColor: 'var(--bg-stone)',
            borderBottom: '1px solid var(--border-stone)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <span
            className="mono-label"
            style={{ fontSize: '9.5px', color: 'var(--ink-navy)' }}
          >
            Shapes &amp; Drawing:
          </span>

          {(
            [
              ['select', 'Select / Move'],
              ['line', 'Line'],
              ['hline', 'Horiz. Line'],
              ['vline', 'Vert. Line'],
              ['arrow', 'Arrow'],
              ['rect', 'Rectangle'],
              ['square', 'Square'],
              ['ellipse', 'Circle / Ellipse'],
              ['freehand', 'Freehand'],
            ] as const
          ).map(([tool, label]) => (
            <button
              key={tool}
              onClick={() => setActiveShapeTool(tool)}
              className={
                activeShapeTool === tool ? 'btn-ed-primary' : 'btn-ed-subtle'
              }
              style={{
                padding: '4px 9px',
                fontSize: '9.5px',
                backgroundColor:
                  activeShapeTool === tool ? undefined : 'var(--bg-ivory)',
              }}
            >
              {label}
            </button>
          ))}

          {/* Stroke Colour */}
          <label
            className="btn-ed-subtle"
            style={{
              padding: '3px 7px',
              backgroundColor: 'var(--bg-ivory)',
              cursor: 'pointer',
            }}
            title="Stroke Colour"
          >
            <span style={{ fontSize: '9.5px' }}>Stroke</span>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => {
                setStrokeColor(e.target.value);
                if (selectedDrawingId) {
                  const next = drawings.map((d) =>
                    d.id === selectedDrawingId
                      ? { ...d, strokeColor: e.target.value }
                      : d
                  );
                  pushDrawingHistory(next);
                }
              }}
              style={{
                width: '14px',
                height: '14px',
                border: 'none',
                padding: 0,
              }}
            />
          </label>

          {/* Stroke Thickness */}
          <select
            value={strokeWidth}
            onChange={(e) => {
              const w = parseInt(e.target.value, 10);
              setStrokeWidth(w);
              if (selectedDrawingId) {
                const next = drawings.map((d) =>
                  d.id === selectedDrawingId ? { ...d, strokeWidth: w } : d
                );
                pushDrawingHistory(next);
              }
            }}
            className="ed-select"
            style={{ width: '68px', padding: '3px 5px', fontSize: '11px' }}
            title="Stroke Thickness"
          >
            <option value={1}>1 px</option>
            <option value={2}>2 px</option>
            <option value={3}>3 px</option>
            <option value={5}>5 px</option>
            <option value={8}>8 px</option>
          </select>

          {/* Line Style */}
          <select
            value={lineStyle}
            onChange={(e) => {
              const s = e.target.value as 'solid' | 'dashed' | 'dotted';
              setLineStyle(s);
              if (selectedDrawingId) {
                const next = drawings.map((d) =>
                  d.id === selectedDrawingId ? { ...d, lineStyle: s } : d
                );
                pushDrawingHistory(next);
              }
            }}
            className="ed-select"
            style={{ width: '78px', padding: '3px 5px', fontSize: '11px' }}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>

          <button
            onClick={handleUndoDrawing}
            disabled={drawingUndoStack.length === 0}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
            title="Undo Drawing"
          >
            <Undo2 size={12} />
          </button>
          <button
            onClick={handleRedoDrawing}
            disabled={drawingRedoStack.length === 0}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
            title="Redo Drawing"
          >
            <Redo2 size={12} />
          </button>

          {selectedDrawingId && (
            <button
              onClick={handleDeleteSelectedDrawing}
              className="btn-ed-subtle"
              style={{
                backgroundColor: 'var(--bg-ivory)',
                color: 'var(--accent-terracotta)',
                padding: '4px 8px',
              }}
            >
              <Trash2 size={12} /> Delete Shape
            </button>
          )}

          <button
            onClick={() => {
              setShowDrawingBar(false);
              setActiveShapeTool('select');
            }}
            className="btn-ed-subtle"
            style={{ marginLeft: 'auto', padding: '4px 8px' }}
          >
            Done
          </button>
        </div>
      )}

      {/* =====================================================================
          MAIN WORKSPACE BODY: [LEFT PAGE GROUPS] + [CENTER PAGES] + [RIGHT AI]
      ===================================================================== */}
      <div className="nc-workspace-body">
        {/* ===================================================================
            SECTION 10: LEFT-HAND PAGE GROUPING & SECTION NAVIGATOR
        =================================================================== */}
        {showGroupsSidebar && (
          <aside className="nc-groups-sidebar no-print">
            <div
              style={{
                height: '44px',
                padding: '0 14px',
                borderBottom: '1px solid var(--border-ivory)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'var(--ink-navy)',
                }}
              >
                Page Groups &amp; Sections
              </span>
              <button
                onClick={() => setShowGroupsSidebar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                padding: '12px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Create New Group Box */}
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-stone)',
                  border: '1px solid var(--border-ivory)',
                }}
              >
                <div className="ed-field-label">1. Select Pages to Group</div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    marginBottom: '8px',
                  }}
                >
                  {pages.map((_, idx) => {
                    const checked = selectedPagesForGrouping.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => togglePageSelectionForGroup(idx)}
                        className="mono-label"
                        style={{
                          padding: '4px 7px',
                          fontSize: '9.5px',
                          border: '1px solid var(--border-stone)',
                          backgroundColor: checked
                            ? 'var(--accent-blue)'
                            : 'var(--bg-ivory)',
                          color: checked ? '#FFFFFF' : 'var(--ink-navy)',
                          cursor: 'pointer',
                        }}
                      >
                        P.{idx + 1}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Group 1: Chapter One"
                  className="ed-input"
                  style={{
                    padding: '6px 8px',
                    fontSize: '12px',
                    marginBottom: '8px',
                  }}
                />

                <button
                  onClick={handleCreatePageGroup}
                  disabled={selectedPagesForGrouping.length === 0}
                  className="btn-ed-primary"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '9.5px',
                  }}
                >
                  <Plus size={11} /> Create Section Group
                </button>
              </div>

              {/* Existing Page Groups List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div className="ed-field-label">
                  Active Groups ({pageGroups.length})
                </div>

                {pageGroups.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                    Select pages above to organise your document into named
                    sections (e.g. Chapter One, Chapter Two, References).
                  </p>
                ) : (
                  pageGroups.map((grp) => {
                    const isEditing = editingGroupId === grp.id;
                    return (
                      <div
                        key={grp.id}
                        style={{
                          border: '1px solid var(--border-ivory)',
                          backgroundColor: 'var(--bg-ivory)',
                          padding: '8px 10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                          }}
                        >
                          <button
                            onClick={() => {
                              const next = pageGroups.map((g) =>
                                g.id === grp.id
                                  ? { ...g, collapsed: !g.collapsed }
                                  : g
                              );
                              setPageGroups(next);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              color: 'var(--ink-navy)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            {grp.collapsed ? (
                              <ChevronRight size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )}
                            <span>{grp.name}</span>
                          </button>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => {
                                setEditingGroupId(grp.id);
                                setEditingGroupName(grp.name);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--ink-muted)',
                              }}
                              title="Rename Group"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeletePageGroup(grp.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--accent-terracotta)',
                              }}
                              title="Ungroup"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '4px',
                              marginTop: '6px',
                            }}
                          >
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) =>
                                setEditingGroupName(e.target.value)
                              }
                              className="ed-input"
                              style={{ padding: '4px 6px', fontSize: '11.5px' }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleCommitGroupRename(grp.id)}
                              className="btn-ed-primary"
                              style={{ padding: '4px 7px' }}
                            >
                              <Check size={11} />
                            </button>
                          </div>
                        )}

                        {!grp.collapsed && (
                          <div style={{ marginTop: '8px' }}>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--ink-muted)',
                                marginBottom: '6px',
                              }}
                            >
                              Pages:{' '}
                              {grp.pageIndices.map((p) => p + 1).join(', ') ||
                                'None'}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px',
                              }}
                            >
                              {pages.map((_, pIdx) => {
                                const inGroup = grp.pageIndices.includes(pIdx);
                                return (
                                  <button
                                    key={pIdx}
                                    onClick={() =>
                                      handleTogglePageInGroup(grp.id, pIdx)
                                    }
                                    style={{
                                      padding: '2px 6px',
                                      fontSize: '10px',
                                      border: '1px solid var(--border-ivory)',
                                      backgroundColor: inGroup
                                        ? 'var(--bg-stone)'
                                        : 'transparent',
                                      color: inGroup
                                        ? 'var(--accent-blue)'
                                        : 'var(--ink-muted)',
                                      fontWeight: inGroup ? 700 : 400,
                                      cursor: 'pointer',
                                    }}
                                    title="Click to add/remove page from this group"
                                  >
                                    P.{pIdx + 1}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              onClick={() => {
                                setAiTargetGroupId(grp.id);
                                setShowAiPanel(true);
                              }}
                              className="btn-ed-subtle"
                              style={{
                                width: '100%',
                                marginTop: '8px',
                                padding: '4px 8px',
                                fontSize: '9.5px',
                              }}
                            >
                              <Sparkles size={10} color="var(--accent-blue)" />{' '}
                              Focus AI on {grp.name}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        )}

        {/* ===================================================================
            5.2 MULTI-PAGE DOCUMENT EDITOR CANVAS
        =================================================================== */}
        <div className="doc-workspace-canvas-wrap" style={{ flex: 1 }}>
          {pages.map((_, pageIdx) => {
            const dim = getPageDimensions(pageIdx);
            const belongingGroups = pageGroups.filter((g) =>
              g.pageIndices.includes(pageIdx)
            );
            const pageDrawings = drawings.filter(
              (d) => d.pageIndex === pageIdx
            );

            return (
              <div
                key={pageIdx}
                className="doc-a4-page"
                style={{
                  width: `${dim.widthPx}px`,
                  minHeight: `${dim.heightPx}px`,
                  padding: `${dim.padTopPx}px ${dim.padRightPx}px ${dim.padBottomPx}px ${dim.padLeftPx}px`,
                  backgroundColor: layout.pageBackground || '#FFFFFF',
                  border:
                    layout.borderStyle !== 'none'
                      ? `${layout.borderWidthPx}px ${layout.borderStyle} ${layout.borderColor}`
                      : '1px solid var(--border-stone)',
                  fontFamily: `"${
                    doc.metadata.fontFamily || 'Times New Roman'
                  }", Georgia, serif`,
                }}
              >
                {/* Page Running Header + Section Group Badge */}
                <div
                  style={{
                    borderBottom: '1px solid #E2E8F0',
                    paddingBottom: '6px',
                    marginBottom: `${layout.headerSpacingPx}px`,
                    fontSize: '9pt',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    userSelect: 'none',
                  }}
                >
                  <span>
                    {doc.metadata.headerText || title.slice(0, 48).toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {belongingGroups.map((g) => (
                      <span
                        key={g.id}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '8.5px',
                          backgroundColor: '#EEF2FF',
                          color: '#1447E6',
                          border: '1px solid #C7D2FE',
                          padding: '1px 6px',
                        }}
                      >
                        {g.name}
                      </span>
                    ))}
                    <span>Page {pageIdx + 1}</span>
                  </div>
                </div>

                {/* Interactive Vector Drawing Layer for this Page (Section 9B–D) */}
                {(pageDrawings.length > 0 || showDrawingBar) && (
                  <svg
                    width="100%"
                    height={showDrawingBar ? 190 : 150}
                    style={{
                      border: showDrawingBar
                        ? '1px dashed rgba(20, 71, 230, 0.45)'
                        : 'none',
                      backgroundColor: showDrawingBar
                        ? 'rgba(20, 71, 230, 0.02)'
                        : 'transparent',
                      marginBottom: '12px',
                       cursor:
                        showDrawingBar && activeShapeTool !== 'select'
                          ? 'crosshair'
                          : 'default',
                      touchAction: showDrawingBar ? 'none' : 'auto',
                      display: 'block',
                      zIndex: 5,
                    }}
                    onMouseDown={(e) => handlePagePointerDown(pageIdx, e)}
                    onMouseMove={(e) => handlePagePointerMove(pageIdx, e)}
                    onMouseUp={handlePagePointerUp}
                    onTouchStart={(e) => handlePagePointerDown(pageIdx, e)}
                    onTouchMove={(e) => handlePagePointerMove(pageIdx, e)}
                    onTouchEnd={handlePagePointerUp}
                  >
                    <defs>
                      <marker
                        id={`arrow-${pageIdx}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="8"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
                      </marker>
                    </defs>

                    {showDrawingBar && pageDrawings.length === 0 && (
                      <text
                        x="12"
                        y="24"
                        fill="#64748B"
                        fontSize="11"
                        fontFamily="sans-serif"
                      >
                        Click and drag here to draw shapes, lines or arrows on
                        Page {pageIdx + 1}...
                      </text>
                    )}

                    {pageDrawings.map((d) => {
                      const isSel = selectedDrawingId === d.id;
                      const dash =
                        d.lineStyle === 'dashed'
                          ? '6,4'
                          : d.lineStyle === 'dotted'
                          ? '2,3'
                          : undefined;
                      const x = Math.min(d.x1, d.x2);
                      const y = Math.min(d.y1, d.y2);
                      const w = Math.max(4, Math.abs(d.x2 - d.x1));
                      const h = Math.max(4, Math.abs(d.y2 - d.y1));

                      return (
                        <g
                          key={d.id}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedDrawingId(d.id);
                            setShowDrawingBar(true);
                            const svgRect =
                              e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                            if (!svgRect) return;
                            setDragState({
                              mode: 'move',
                              drawingId: d.id,
                              pageIdx,
                              startX: Math.round(e.clientX - svgRect.left),
                              startY: Math.round(e.clientY - svgRect.top),
                              origX1: d.x1,
                              origY1: d.y1,
                              origX2: d.x2,
                              origY2: d.y2,
                            });
                          }}
                          style={{ cursor: 'move' }}
                        >
                          {(d.type === 'rect' || d.type === 'square') && (
                            <rect
                              x={x}
                              y={y}
                              width={w}
                              height={h}
                              fill="transparent"
                              stroke={d.strokeColor}
                              strokeWidth={d.strokeWidth}
                              strokeDasharray={dash}
                            />
                          )}

                          {d.type === 'ellipse' && (
                            <ellipse
                              cx={x + w / 2}
                              cy={y + h / 2}
                              rx={w / 2}
                              ry={h / 2}
                              fill="transparent"
                              stroke={d.strokeColor}
                              strokeWidth={d.strokeWidth}
                              strokeDasharray={dash}
                            />
                          )}

                          {d.type === 'freehand' &&
                            d.points &&
                            d.points.length > 1 && (
                              <path
                                d={d.points
                                  .map(
                                    (pt, i) =>
                                      `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`
                                  )
                                  .join(' ')}
                                fill="none"
                                stroke={d.strokeColor}
                                strokeWidth={d.strokeWidth}
                                strokeDasharray={dash}
                              />
                            )}

                          {(d.type === 'line' ||
                            d.type === 'hline' ||
                            d.type === 'vline' ||
                            d.type === 'arrow') && (
                            <line
                              x1={d.x1}
                              y1={d.y1}
                              x2={d.x2}
                              y2={d.y2}
                              stroke={d.strokeColor}
                              strokeWidth={d.strokeWidth}
                              strokeDasharray={dash}
                              markerEnd={
                                d.type === 'arrow'
                                  ? `url(#arrow-${pageIdx})`
                                  : undefined
                              }
                            />
                          )}

                          {/* Selection Handles for Resizing */}
                          {isSel && (
                            <>
                              <circle
                                cx={d.x1}
                                cy={d.y1}
                                r={5}
                                fill="#FFFFFF"
                                stroke="#1447E6"
                                strokeWidth={2}
                                style={{ cursor: 'nwse-resize' }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const svgRect =
                                    e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                  if (!svgRect) return;
                                  setDragState({
                                    mode: 'resize-start',
                                    drawingId: d.id,
                                    pageIdx,
                                    startX: Math.round(e.clientX - svgRect.left),
                                    startY: Math.round(e.clientY - svgRect.top),
                                    origX1: d.x1,
                                    origY1: d.y1,
                                    origX2: d.x2,
                                    origY2: d.y2,
                                  });
                                }}
                              />
                              <circle
                                cx={d.x2}
                                cy={d.y2}
                                r={5}
                                fill="#FFFFFF"
                                stroke="#1447E6"
                                strokeWidth={2}
                                style={{ cursor: 'nwse-resize' }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const svgRect =
                                    e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                  if (!svgRect) return;
                                  setDragState({
                                    mode: 'resize-end',
                                    drawingId: d.id,
                                    pageIdx,
                                    startX: Math.round(e.clientX - svgRect.left),
                                    startY: Math.round(e.clientY - svgRect.top),
                                    origX1: d.x1,
                                    origY1: d.y1,
                                    origX2: d.x2,
                                    origY2: d.y2,
                                  });
                                }}
                              />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                )}

                {/* Editable Page Content Area */}
                <div
                  ref={(el) => {
                    pageRefs.current[pageIdx] = el;
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => {
                    activePageIdxRef.current = pageIdx;
                  }}
                  onClick={(e) => handlePageSelection(pageIdx, e)}
                  onInput={() => checkAndFlowPages(pageIdx)}
                  onMouseUp={(e) => handlePageSelection(pageIdx, e)}
                  onKeyUp={(e) => handlePageSelection(pageIdx, e)}
                  className="doc-editable-body"
                  style={{
                    lineHeight: lineSpacing,
                    columnCount: layout.columns,
                    columnGap: `${layout.columnGapPx}px`,
                  }}
                />

                {/* Page Footer & Page Numbering */}
                <div
                  style={{
                    borderTop: '1px solid #E2E8F0',
                    paddingTop: '8px',
                    marginTop: `${layout.footerSpacingPx}px`,
                    fontSize: '9.5pt',
                    color: '#64748B',
                    display: 'flex',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                  }}
                >
                  <span>{doc.metadata.institution || ''}</span>
                  <span>
                    Page {pageIdx + 1} of {pages.length}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Bottom Add Page Button on Canvas */}
          <button
            onClick={handleAddBlankPage}
            className="btn-ed-outline no-print"
            style={{ backgroundColor: 'var(--bg-ivory)' }}
          >
            <FilePlus2 size={14} color="var(--accent-blue)" />
            <span>+ Add New Blank Page</span>
          </button>
        </div>

        {/* Mobile Floating Quick-Access Action Bar */}
        <div
          className="show-on-mobile no-print"
          style={{
            position: 'fixed',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 42,
            backgroundColor: 'var(--bg-ivory)',
            border: '1px solid var(--border-stone)',
            boxShadow: '0 6px 20px rgba(10, 25, 78, 0.16)',
            padding: '5px 8px',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <button
            onClick={handleAddBlankPage}
            className="btn-ed-subtle"
            style={{ padding: '6px 9px', fontSize: '9.5px' }}
          >
            <FilePlus2 size={12} color="var(--accent-blue)" />
            <span>+ Page</span>
          </button>
          <button
            onClick={() => {
              setShowAiPanel(false);
              setShowGroupsSidebar((p) => !p);
            }}
            className="btn-ed-subtle"
            style={{ padding: '6px 9px', fontSize: '9.5px' }}
          >
            <Layers size={12} color="var(--accent-blue)" />
            <span>Groups ({pageGroups.length})</span>
          </button>
          <button
            onClick={() => {
              setShowGroupsSidebar(false);
              setShowAiPanel((p) => !p);
            }}
            className="btn-ed-primary"
            style={{ padding: '6px 11px', fontSize: '9.5px' }}
          >
            <Sparkles size={12} />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* ===================================================================
            6. & 11. AI ASSISTANT PANEL (With Page Groups & Selection Context)
        =================================================================== */}
        {showAiPanel && (
          <aside
            className="nc-ai-panel no-print"
            onMouseDown={applyVisualSelectionLock}
          >
            {/* Simple Header Labelled "AI Assistant" */}
            <div
              style={{
                height: '44px',
                padding: '0 14px',
                borderBottom: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-ivory)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  color: 'var(--ink-navy)',
                }}
              >
                <Sparkles size={14} color="var(--accent-blue)" />
                <span>AI Assistant</span>
              </div>

              <button
                onClick={() => setShowAiPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
                title="Close AI Assistant"
              >
                <X size={14} />
              </button>
            </div>

            {/* Section 11: Page Group Context Selector (When Page Groups exist) */}
            {pageGroups.length > 0 && (
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--border-ivory)',
                  backgroundColor: 'var(--bg-stone)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span
                  className="mono-label"
                  style={{ fontSize: '9.5px', color: 'var(--ink-muted)' }}
                >
                  Focus Scope:
                </span>
                <select
                  value={aiTargetGroupId}
                  onChange={(e) => setAiTargetGroupId(e.target.value)}
                  className="ed-select"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    flex: 1,
                  }}
                >
                  <option value="">Entire Document / Selection</option>
                  {pageGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (P.{g.pageIndices.map((i) => i + 1).join(',')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clean Conversation Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {doc.aiHistory.length === 0 && (
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.5,
                    padding: '12px',
                    border: '1px solid var(--border-ivory)',
                    backgroundColor: 'var(--bg-stone)',
                  }}
                >
                  Highlight text in the document, select a Page Group above, or
                  enter an instruction below (e.g.{' '}
                  <em>"Rewrite Chapter One in a more academic tone"</em>).
                </div>
              )}

              {doc.aiHistory.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    border: '1px solid var(--border-ivory)',
                    backgroundColor:
                      msg.role === 'user'
                        ? 'var(--bg-stone)'
                        : 'var(--bg-ivory)',
                    padding: '11px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      className="mono-label"
                      style={{
                        fontSize: '9px',
                        color:
                          msg.role === 'user'
                            ? 'var(--ink-muted)'
                            : 'var(--accent-blue)',
                      }}
                    >
                      {msg.role === 'user' ? 'Instruction' : 'AI Response'}
                    </span>

                    {msg.targetGroupName && (
                      <span
                        className="mono-label"
                        style={{
                          fontSize: '8.5px',
                          backgroundColor: 'var(--bg-stone)',
                          padding: '2px 5px',
                          color: 'var(--ink-navy)',
                        }}
                      >
                        {msg.targetGroupName}
                      </span>
                    )}
                  </div>

                  {msg.role === 'user' ? (
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-navy)' }}>
                      {msg.prompt}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--ink-muted)',
                          marginBottom: '8px',
                        }}
                      >
                        {msg.summary}
                      </div>

                      {msg.generatedHtml && (
                        <>
                          <div
                            style={{
                              padding: '9px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--border-ivory)',
                              maxHeight: '150px',
                              overflowY: 'auto',
                              fontSize: '11.5px',
                              color: '#1E293B',
                              lineHeight: 1.45,
                            }}
                            dangerouslySetInnerHTML={{
                              __html: msg.generatedHtml,
                            }}
                          />

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '5px',
                              marginTop: '8px',
                            }}
                          >
                            {msg.targetGroupId ? (
                              <button
                                onClick={() =>
                                  handleApplyAiContent(msg, 'group')
                                }
                                className="btn-ed-primary"
                                style={{
                                  gridColumn: '1 / -1',
                                  padding: '6px 8px',
                                  fontSize: '9.5px',
                                }}
                              >
                                Apply to {msg.targetGroupName} Only
                              </button>
                            ) : null}

                            <button
                              onClick={() =>
                                handleApplyAiContent(msg, 'replace')
                              }
                              className="btn-ed-primary"
                              style={{ padding: '5px 7px', fontSize: '9px' }}
                            >
                              Replace selected
                            </button>

                            <button
                              onClick={() => handleApplyAiContent(msg, 'below')}
                              className="btn-ed-subtle"
                              style={{ padding: '5px 7px', fontSize: '9px' }}
                            >
                              Insert below
                            </button>

                            <button
                              onClick={() =>
                                handleApplyAiContent(msg, 'cursor')
                              }
                              className="btn-ed-subtle"
                              style={{ padding: '5px 7px', fontSize: '9px' }}
                            >
                              Insert at cursor
                            </button>

                            <button
                              onClick={() =>
                                handleApplyAiContent(msg, 'append')
                              }
                              className="btn-ed-subtle"
                              style={{ padding: '5px 7px', fontSize: '9px' }}
                            >
                              Append to doc
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isAiLoading && (
                <div
                  style={{
                    padding: '10px',
                    border: '1px solid var(--border-ivory)',
                    fontSize: '12px',
                    color: 'var(--accent-blue)',
                  }}
                >
                  Generating response...
                </div>
              )}
            </div>

            {/* Bottom Input Section with Persistent Selected Text Indicator */}
            <div
              style={{
                padding: '12px 14px',
                borderTop: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-stone)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {selectedText && (
                <div
                  style={{
                    padding: '7px 10px',
                    backgroundColor: 'var(--bg-ivory)',
                    border: '1px solid var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="mono-label"
                      style={{
                        fontSize: '8.5px',
                        color: 'var(--accent-blue)',
                        marginBottom: '2px',
                      }}
                    >
                      Selected text
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--ink-navy)',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      "{truncatedSelection}"
                    </div>
                  </div>

                  <button
                    onClick={handleClearSelection}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="Clear selection"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <textarea
                  rows={2}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onFocus={applyVisualSelectionLock}
                  placeholder={
                    selectedText
                      ? 'e.g. "Rewrite this in a more academic tone"...'
                      : aiTargetGroupId
                      ? 'Instruct AI for the selected Page Group...'
                      : 'Ask AI to write, expand, rewrite or summarise...'
                  }
                  className="ed-textarea"
                  style={{
                    fontSize: '12.5px',
                    padding: '7px 9px',
                    resize: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiPrompt();
                    }
                  }}
                />

                <button
                  onClick={() => handleSendAiPrompt()}
                  disabled={isAiLoading || !promptInput.trim()}
                  className="btn-ed-primary"
                  style={{ padding: '0 12px', flexShrink: 0 }}
                  title="Send Instruction"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* =====================================================================
          SECTION 9A: CHANGE PAGE LAYOUT MODAL
      ===================================================================== */}
      {showLayoutModal && (
        <div className="nc-modal-backdrop no-print">
          <div className="nc-modal-dialog" style={{ maxWidth: '580px' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-ivory)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800 }}>
                  Change Page Layout
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                  Customise page size, orientation, margins, columns and
                  appearance.
                </p>
              </div>
              <button
                onClick={() => setShowLayoutModal(false)}
                className="btn-ed-subtle"
                style={{ padding: '5px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Page Size & Orientation */}
              <div className="nc-grid-2col">
                <div>
                  <label className="ed-field-label">Page Size</label>
                  <select
                    value={layout.pageSize}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        pageSize: e.target
                          .value as PageLayoutSettings['pageSize'],
                      }))
                    }
                    className="ed-select"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="A3">A3 (297 × 420 mm)</option>
                    <option value="A5">A5 (148 × 210 mm)</option>
                    <option value="Letter">Letter (216 × 279 mm)</option>
                    <option value="Legal">Legal (216 × 356 mm)</option>
                    <option value="Custom">Custom Dimensions</option>
                  </select>
                </div>

                <div>
                  <label className="ed-field-label">Page Orientation</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['portrait', 'landscape'] as const).map((orient) => {
                      const currentOrient =
                        layoutScope === 'page'
                          ? layout.sectionOrientations?.[
                              activePageIdxRef.current
                            ] || layout.orientation
                          : layout.orientation;
                      return (
                        <button
                          key={orient}
                          type="button"
                          onClick={() => {
                            if (layoutScope === 'page') {
                              setLayout((prev) => ({
                                ...prev,
                                sectionOrientations: {
                                  ...(prev.sectionOrientations || {}),
                                  [activePageIdxRef.current]: orient,
                                },
                              }));
                            } else {
                              setLayout((prev) => ({
                                ...prev,
                                orientation: orient,
                                sectionOrientations: {},
                              }));
                            }
                          }}
                          className={
                            currentOrient === orient
                              ? 'btn-ed-primary'
                              : 'btn-ed-subtle'
                          }
                          style={{ flex: 1, padding: '8px' }}
                        >
                          {orient}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Scope for Orientation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <span className="ed-field-label" style={{ marginBottom: 0 }}>
                  Apply Orientation To:
                </span>
                <button
                  type="button"
                  onClick={() => setLayoutScope('document')}
                  className={
                    layoutScope === 'document'
                      ? 'btn-ed-primary'
                      : 'btn-ed-subtle'
                  }
                  style={{ padding: '4px 10px', fontSize: '9.5px' }}
                >
                  Entire Document
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutScope('page')}
                  className={
                    layoutScope === 'page' ? 'btn-ed-primary' : 'btn-ed-subtle'
                  }
                  style={{ padding: '4px 10px', fontSize: '9.5px' }}
                >
                  Page {activePageIdxRef.current + 1} Only
                </button>
              </div>

              {layout.pageSize === 'Custom' && (
                <div className="nc-grid-2col">
                  <div>
                    <label className="ed-field-label">Custom Width (mm)</label>
                    <input
                      type="number"
                      value={layout.customWidthMm || 210}
                      onChange={(e) =>
                        setLayout((prev) => ({
                          ...prev,
                          customWidthMm: parseInt(e.target.value || '210', 10),
                        }))
                      }
                      className="ed-input"
                    />
                  </div>
                  <div>
                    <label className="ed-field-label">Custom Height (mm)</label>
                    <input
                      type="number"
                      value={layout.customHeightMm || 297}
                      onChange={(e) =>
                        setLayout((prev) => ({
                          ...prev,
                          customHeightMm: parseInt(e.target.value || '297', 10),
                        }))
                      }
                      className="ed-input"
                    />
                  </div>
                </div>
              )}

              {/* Page Margins */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <label className="ed-field-label" style={{ marginBottom: 0 }}>
                    Page Margins (mm)
                  </label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {(
                      [
                        ['normal', 'Normal (25mm)', 25],
                        ['narrow', 'Narrow (13mm)', 13],
                        ['wide', 'Wide (35mm)', 35],
                      ] as const
                    ).map(([preset, label, val]) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setLayout((prev) => ({
                            ...prev,
                            marginPreset: preset,
                            marginTopMm: val,
                            marginBottomMm: val,
                            marginLeftMm: val,
                            marginRightMm: val,
                          }))
                        }
                        className="btn-ed-subtle"
                        style={{ padding: '3px 7px', fontSize: '9px' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nc-grid-4col">
                  {(
                    [
                      ['marginTopMm', 'Top'],
                      ['marginBottomMm', 'Bottom'],
                      ['marginLeftMm', 'Left'],
                      ['marginRightMm', 'Right'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className="ed-field-label">{label}</label>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={layout[field]}
                        onChange={(e) =>
                          setLayout((prev) => ({
                            ...prev,
                            marginPreset: 'custom',
                            [field]: parseInt(e.target.value || '20', 10),
                          }))
                        }
                        className="ed-input"
                        style={{ padding: '6px 8px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Page Columns */}
              <div className="nc-grid-2col">
                <div>
                  <label className="ed-field-label">Page Columns</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {([1, 2, 3] as const).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() =>
                          setLayout((prev) => ({ ...prev, columns: col }))
                        }
                        className={
                          layout.columns === col
                            ? 'btn-ed-primary'
                            : 'btn-ed-subtle'
                        }
                        style={{ flex: 1, padding: '7px' }}
                      >
                        {col} Col
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="ed-field-label">
                    Column Spacing (px)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={64}
                    value={layout.columnGapPx}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        columnGapPx: parseInt(e.target.value || '24', 10),
                      }))
                    }
                    className="ed-input"
                    style={{ padding: '6px 8px' }}
                  />
                </div>
              </div>

              {/* Page Appearance (Background, Borders, Header/Footer Spacing) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="ed-field-label">Page Background</label>
                  <input
                    type="color"
                    value={layout.pageBackground}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        pageBackground: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '34px',
                      border: '1px solid var(--border-stone)',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                <div>
                  <label className="ed-field-label">Page Border</label>
                  <select
                    value={layout.borderStyle}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        borderStyle: e.target
                          .value as PageLayoutSettings['borderStyle'],
                      }))
                    }
                    className="ed-select"
                  >
                    <option value="none">None</option>
                    <option value="solid">Solid</option>
                    <option value="double">Double</option>
                    <option value="dashed">Dashed</option>
                  </select>
                </div>

                <div>
                  <label className="ed-field-label">Border Thickness</label>
                  <select
                    value={layout.borderWidthPx}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        borderWidthPx: parseInt(e.target.value, 10),
                      }))
                    }
                    className="ed-select"
                  >
                    <option value={1}>1 px</option>
                    <option value={2}>2 px</option>
                    <option value={4}>4 px</option>
                    <option value={6}>6 px</option>
                  </select>
                </div>

                <div>
                  <label className="ed-field-label">Border Colour</label>
                  <input
                    type="color"
                    value={layout.borderColor}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        borderColor: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      height: '34px',
                      border: '1px solid var(--border-stone)',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-stone)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => {
                  setLayout(DEFAULT_LAYOUT);
                  triggerAutoSave({ overrideLayout: DEFAULT_LAYOUT });
                }}
                className="btn-ed-subtle"
              >
                Reset Default
              </button>
              <button
                onClick={() => {
                  setShowLayoutModal(false);
                  triggerAutoSave({ overrideLayout: layout });
                  setTimeout(() => checkAndFlowPages(0), 60);
                }}
                className="btn-ed-primary"
              >
                Apply Layout Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
