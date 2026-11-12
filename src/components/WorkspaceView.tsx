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
  Mic,
  Square,
  Paperclip,
  FileText,
  HardDriveDownload,
  Camera,
  Printer,
  Save,
  HardDrive,
  AlertCircle,
  Coins,
  CreditCard,
  Bookmark,
  BookOpen,
  ExternalLink,
  Globe,
} from 'lucide-react';
import {
  AIMessage,
  CanvasImageElement,
  CreditTopUpBundle,
  DocumentItem,
  DrawingElement,
  ExportScopeOptions,
  PageGroup,
  PageLayoutSettings,
  ShapeType,
  SourceReference,
  SyncStatus,
  AIAttachment,
  PageFrameStyleId,
} from '../types';
import {
  getCurrentFormattedDate,
  runPageLevelAI,
  runPageLevelAIAsync,
  runTextLevelAI,
  runTextLevelAIAsync,
  runWorkspaceAIPrompt,
  runWorkspaceAIPromptAsync,
  getGeminiApiKey,
  WorkspaceAIResult,
  extractSourceReferences,
  parseGroupingInstruction,
} from '../services/aiGenerator';
import {
  billingManager,
  CREDIT_TOP_UP_BUNDLES,
  SUBSCRIPTION_PLANS,
} from '../services/billingService';
import {
  COVER_PAGE_DESIGNS,
  CoverPageDesign,
} from '../services/templates';
import {
  ElementLayerToolbar,
  PageLevelAIPopover,
  TextSelectionAIPopup,
  useVoiceToText,
} from './WorkspaceAIOverlays';
import { PageLayoutModal } from './PageLayoutModal';
import { processMultipleFiles } from '../services/fileProcessing';
import { AIAttachmentsPreview } from './AIAttachmentsPreview';
import { PageFrameModal } from './PageFrameModal';
import { PageFrameOverlay } from './PageFrameOverlay';

interface WorkspaceViewProps {
  document: DocumentItem;
  isOnline: boolean;
  isSyncing: boolean;
  onBack: () => void;
  onUpdateDocument: (updated: DocumentItem) => void;
  onExportDocx: (doc: DocumentItem, options?: ExportScopeOptions) => void;
  onExportPdf: (doc: DocumentItem, options?: ExportScopeOptions) => void;
  onExportTxt: (doc: DocumentItem, options?: ExportScopeOptions) => void;
  onSaveToComputer?: (doc: DocumentItem) => void;
  allDocuments?: DocumentItem[];
  onNavigateSettings?: () => void;
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
  borderInsetMm: 10,
  sectionBorders: {},
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

const SHAPE_OPTIONS: { type: ShapeType; label: string }[] = [
  { type: 'rect', label: 'Rectangle' },
  { type: 'square', label: 'Square' },
  { type: 'ellipse', label: 'Circle / Ellipse' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'line', label: 'Line' },
  { type: 'hline', label: 'Horizontal Line' },
  { type: 'vline', label: 'Vertical Line' },
  { type: 'arrow', label: 'Arrow' },
  { type: 'freehand', label: 'Freehand Draw' },
];

function splitHtmlIntoInitialPages(html: string, docPages?: string[]): string[] {
  if (docPages && docPages.length > 0) {
    return docPages;
  }
  const explicitParts = html
    .split(/<hr[^>]*class=["']?page-break["']?[^>]*>/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (explicitParts.length > 0) {
    return explicitParts;
  }

  return [html || '<p><br/></p>'];
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
  onSaveToComputer,
  allDocuments = [],
  onNavigateSettings,
}) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activePageIdxRef = useRef<number>(0);
  const savedRangeRef = useRef<Range | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const shapeBtnRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeTableCellRef = useRef<HTMLTableCellElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Section 11 & 12: Credit Wallet & Billing
  const [wallet, setWallet] = useState(() => billingManager.getWallet());
  const [subscription, setSubscription] = useState(() => billingManager.getSubscription());
  const [showCreditPopover, setShowCreditPopover] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Section 9: Page Frame Styles Manager (Replaces Cover Page functionality per specification)
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [frameTargetPageIndex, setFrameTargetPageIndex] = useState<number>(0);

  // Section 9: AI-Controlled Page Grouping Proposal State
  const [pendingGroupingProposal, setPendingGroupingProposal] = useState<{
    groupName: string;
    pageIndices: number[];
    originalPrompt?: string;
  } | null>(null);

  // Subscribe to BillingManager live events
  useEffect(() => {
    const unsub = billingManager.subscribe(() => {
      setWallet(billingManager.getWallet());
      setSubscription(billingManager.getSubscription());
    });
    return unsub;
  }, []);

  const [title, setTitle] = useState(doc.title);
  const [pages, setPages] = useState<string[]>(() =>
    splitHtmlIntoInitialPages(doc.content, doc.metadata.pages)
  );
  const [saveState, setSaveState] = useState<SyncStatus>(
    isOnline ? 'saved' : 'offline-pending'
  );
  // Requirement 1: Unsaved changes protection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Requirement 2: Toolbar Heading sync (H1, H2, H3, P)
  const [currentHeading, setCurrentHeading] = useState<'P' | 'H1' | 'H2' | 'H3'>('P');
  // Text formatting: font size & font family state
  const [selectedFontSize, setSelectedFontSize] = useState('12px');
  const [selectedFontFamily, setSelectedFontFamily] = useState(
    doc.metadata.fontFamily || 'Times New Roman'
  );

  // Requirement 8: Camera option for image upload & floating dropdown positioning
  const [imageMenuPos, setImageMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Requirement 9: Shape Editing mode
  const [isEditingShape, setIsEditingShape] = useState(false);

  // Requirement 11: Unified Undo and Redo History
  const historyRef = useRef<
    {
      pages: string[];
      drawings: DrawingElement[];
      images: CanvasImageElement[];
      title: string;
    }[]
  >([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportScope, setExportScope] = useState<'document' | 'group' | 'page'>(
    'document'
  );
  const [exportGroupId, setExportGroupId] = useState<string>('');
  const [exportPageIdx, setExportPageIdx] = useState<number>(0);

  // Requirement: Dedicated Print Scope Menu (Entire Doc, Group, or Page)
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printScope, setPrintScope] = useState<'document' | 'group' | 'page'>(
    'document'
  );
  const [printGroupId, setPrintGroupId] = useState<string>('');
  const [printPageIdx, setPrintPageIdx] = useState<number>(0);
  const printMenuRef = useRef<HTMLDivElement>(null);

  const [showAiPanel, setShowAiPanel] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth > 1024 : true
  );
  const [lineSpacing, setLineSpacing] = useState('1.75');

  // Requirement 4: Separate Floating Text-Level AI Icon & Pop-up State (Never sent to Main AI Assistant)
  const [highlightedText, setHighlightedText] = useState('');
  const [highlightPageIdx, setHighlightPageIdx] = useState<number>(0);
  const [highlightBadgePos, setHighlightBadgePos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showTextAiPopup, setShowTextAiPopup] = useState(false);

  // Requirement 5: Dedicated Page-Level AI Editing State
  const [activePageAiIdx, setActivePageAiIdx] = useState<number | null>(null);

  // Requirement 6 & 7: Main AI Assistant Scope (Entire Document, Selected Group + Group Pages, or Individual Page) + File Uploads
  const [mainAiScope, setMainAiScope] = useState<'document' | 'group' | 'page'>(
    'document'
  );
  const [aiTargetGroupId, setAiTargetGroupId] = useState<string>('');
  const [aiGroupPageSelection, setAiGroupPageSelection] = useState<
    'all' | number
  >('all');
  const [aiTargetSinglePage, setAiTargetSinglePage] = useState<number>(0);
  const [promptInput, setPromptInput] = useState('');
  const [aiUploadedRefs, setAiUploadedRefs] = useState<AIAttachment[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');

  // Requirement 8: Real-time Voice-to-Text in Main AI Assistant (Instant live dictation)
  const {
    isRecording: isMainAiRecording,
    toggleRecording: toggleMainAiVoice,
    stopRecording: stopMainAiVoice,
  } = useVoiceToText(setPromptInput);

  const combinedMainAiInput = promptInput;

  // Requirement 9: Auto-expand Main AI Assistant input box vertically
  useEffect(() => {
    const el = aiTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(58, Math.min(el.scrollHeight, 185))}px`;
  }, [combinedMainAiInput]);

  // Requirement 13: Table Overlay Dropdown & Interactive Table Resizing State
  const [tableMenuPos, setTableMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [newTableRows, setNewTableRows] = useState(3);
  const [newTableCols, setNewTableCols] = useState(3);
  const [isInsideTable, setIsInsideTable] = useState(false);
  const [activeTableRect, setActiveTableRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const tableResizeDragRef = useRef<{
    type: 'col' | 'row';
    targetEl: HTMLElement;
    startX: number;
    startY: number;
    origSize: number;
    pageIdx: number;
  } | null>(null);

  // Requirement 9A: Page Layout State & Modal
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [layout, setLayout] = useState<PageLayoutSettings>(
    () => doc.metadata.layout || DEFAULT_LAYOUT
  );
  const [layoutScope, setLayoutScope] = useState<'document' | 'page'>(
    'document'
  );

  // Requirement 10, 11, 12: Full-Page Shapes & Movable/Resizable Images with Layer Controls
  const [shapeMenuPos, setShapeMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeShapeTool, setActiveShapeTool] = useState<ShapeType | 'select'>(
    'select'
  );
  const [strokeColor, setStrokeColor] = useState('#1447E6');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [lineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [drawings, setDrawings] = useState<DrawingElement[]>(
    () => doc.metadata.drawings || []
  );
  const [canvasImages, setCanvasImages] = useState<CanvasImageElement[]>(
    () => doc.metadata.images || []
  );
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null
  );
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [dragState, setDragState] = useState<{
    targetKind: 'shape' | 'image';
    mode:
      | 'create'
      | 'move'
      | 'resize-nw'
      | 'resize-ne'
      | 'resize-sw'
      | 'resize-se'
      | 'resize-n'
      | 'resize-s'
      | 'resize-w'
      | 'resize-e';
    id: string;
    pageIdx: number;
    startX: number;
    startY: number;
    origX1: number;
    origY1: number;
    origX2: number;
    origY2: number;
    aspectRatio?: number;
  } | null>(null);

  // Section 10: Page Grouping by Section State (Collapsed by default per Requirement 6)
  const [showGroupsSidebar, setShowGroupsSidebar] = useState(false);
  const [pageGroups, setPageGroups] = useState<PageGroup[]>(() =>
    (doc.metadata.pageGroups || []).map((g) => ({
      ...g,
      collapsed: g.collapsed !== undefined ? g.collapsed : true,
    }))
  );
  const [selectedPagesForGrouping, setSelectedPagesForGrouping] = useState<
    number[]
  >([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Requirement 11: Unified Undo and Redo History
  const inputHistoryTimeoutRef = useRef<number | null>(null);

  const pushHistory = useCallback(
    (
      newPages: string[],
      newDrawings: DrawingElement[] = drawings,
      newImages: CanvasImageElement[] = canvasImages,
      newTitle: string = title
    ) => {
      const nextIndex = historyIndexRef.current + 1;
      const newHistory = historyRef.current.slice(0, nextIndex);
      newHistory.push({
        pages: [...newPages],
        drawings: [...newDrawings],
        images: [...newImages],
        title: newTitle,
      });
      if (newHistory.length > 60) newHistory.shift();
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
      setHasUnsavedChanges(true);
    },
    [drawings, canvasImages, title]
  );

  const recordHistorySnapshotDebounced = useCallback(() => {
    if (inputHistoryTimeoutRef.current) {
      window.clearTimeout(inputHistoryTimeoutRef.current);
    }
    inputHistoryTimeoutRef.current = window.setTimeout(() => {
      const currentPages = pages.map((p, i) =>
        pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : p
      );
      const currentHead = historyRef.current[historyIndexRef.current];
      if (
        !currentHead ||
        JSON.stringify(currentHead.pages) !== JSON.stringify(currentPages)
      ) {
        pushHistory(currentPages);
      }
    }, 450);
  }, [pages, pushHistory]);

  const handleUndo = useCallback(() => {
    if (inputHistoryTimeoutRef.current) {
      window.clearTimeout(inputHistoryTimeoutRef.current);
      inputHistoryTimeoutRef.current = null;
    }

    // Flush any uncommitted edits before undoing so the current state isn't lost
    const currentPages = pages.map((p, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : p
    );
    const head = historyRef.current[historyIndexRef.current];
    if (
      head &&
      JSON.stringify(head.pages) !== JSON.stringify(currentPages)
    ) {
      const nextIndex = historyIndexRef.current + 1;
      const newHistory = historyRef.current.slice(0, nextIndex);
      newHistory.push({
        pages: [...currentPages],
        drawings: [...drawings],
        images: [...canvasImages],
        title,
      });
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
    }

    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const snapshot = historyRef.current[historyIndexRef.current];
      setPages([...snapshot.pages]);
      setDrawings([...snapshot.drawings]);
      setCanvasImages([...snapshot.images]);
      setTitle(snapshot.title);
      snapshot.pages.forEach((html, i) => {
        if (pageRefs.current[i]) {
          pageRefs.current[i]!.innerHTML = html;
        }
      });
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
      setHasUnsavedChanges(true);
    } else {
      try {
        window.document.execCommand('undo');
      } catch {}
    }
  }, [pages, drawings, canvasImages, title]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const snapshot = historyRef.current[historyIndexRef.current];
      setPages([...snapshot.pages]);
      setDrawings([...snapshot.drawings]);
      setCanvasImages([...snapshot.images]);
      setTitle(snapshot.title);
      snapshot.pages.forEach((html, i) => {
        if (pageRefs.current[i]) {
          pageRefs.current[i]!.innerHTML = html;
        }
      });
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      setHasUnsavedChanges(true);
    } else {
      try {
        window.document.execCommand('redo');
      } catch {}
    }
  }, []);

  // Re-initialize when switching document
  useEffect(() => {
    const initPages = splitHtmlIntoInitialPages(doc.content, doc.metadata.pages);
    const initDrawings = doc.metadata.drawings || [];
    const initImages = doc.metadata.images || [];
    setTitle(doc.title);
    setPages(initPages);
    setLayout(doc.metadata.layout || DEFAULT_LAYOUT);
    setDrawings(initDrawings);
    setCanvasImages(initImages);
    setPageGroups(
      (doc.metadata.pageGroups || []).map((g) => ({
        ...g,
        collapsed: g.collapsed !== undefined ? g.collapsed : true,
      }))
    );
    setHighlightedText('');
    setHighlightBadgePos(null);
    setShowTextAiPopup(false);
    setActivePageAiIdx(null);
    savedRangeRef.current = null;
    setHasUnsavedChanges(false);

    historyRef.current = [
      {
        pages: initPages,
        drawings: initDrawings,
        images: initImages,
        title: doc.title,
      },
    ];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, [doc.id]);

  // Global Selection Detection ensuring the AI icon reliably shows whenever text is highlighted
  const checkAndUpdateTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      if (!showTextAiPopup) {
        setHighlightedText('');
        setHighlightBadgePos(null);
      }
      return;
    }

    const text = sel.toString().trim();
    if (!text) {
      if (!showTextAiPopup) {
        setHighlightedText('');
        setHighlightBadgePos(null);
      }
      return;
    }

    const range = sel.getRangeAt(0);
    const pageIdx = pageRefs.current.findIndex(
      (el) => el && el.contains(range.commonAncestorContainer)
    );
    if (pageIdx === -1) {
      return;
    }

    savedRangeRef.current = range.cloneRange();
    activePageIdxRef.current = pageIdx;

    let rect = range.getBoundingClientRect();
    if (
      (!rect || (rect.width === 0 && rect.height === 0)) &&
      range.getClientRects().length > 0
    ) {
      rect = range.getClientRects()[0];
    }

    if (rect && (rect.width > 0 || rect.height > 0 || rect.top > 0)) {
      setHighlightedText(text);
      setHighlightPageIdx(pageIdx);
      setHighlightBadgePos({
        top: rect.top,
        left: rect.right,
      });
    }
  }, [showTextAiPopup]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setTimeout(checkAndUpdateTextSelection, 20);
    };
    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow') || e.key === 'Shift') {
        setTimeout(checkAndUpdateTextSelection, 20);
      }
    };
    window.document.addEventListener('mouseup', handleGlobalMouseUp);
    window.document.addEventListener('keyup', handleGlobalKeyUp);
    return () => {
      window.document.removeEventListener('mouseup', handleGlobalMouseUp);
      window.document.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [checkAndUpdateTextSelection]);

  // Automatically hide AI icon as soon as text is deselected anywhere
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        if (!showTextAiPopup) {
          setHighlightedText('');
          setHighlightBadgePos(null);
        }
      }
    };
    window.document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      window.document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [showTextAiPopup]);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Q)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as any).isContentEditable === false)
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          window.document.execCommand('formatBlock', false, '<blockquote>');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleUndo, handleRedo]);

  // Populate DOM page contents when pages array updates, but NEVER overwrite the active element while the user is typing/editing (prevents Space & cursor jumping)
  useEffect(() => {
    pages.forEach((pageHtml, idx) => {
      const el = pageRefs.current[idx];
      if (
        el &&
        window.document.activeElement !== el &&
        !el.contains(window.document.activeElement) &&
        el.innerHTML !== pageHtml
      ) {
        el.innerHTML = pageHtml;
      }
    });
  }, [pages]);

  // Requirement 4 & 9: Keyboard interactions (Backspace/Delete deletes selected shape or image)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = window.document.activeElement as HTMLElement | null;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      if (!isInput && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (selectedDrawingId) {
          e.preventDefault();
          e.stopPropagation();
          setDrawings((prev) => {
            const next = prev.filter((d) => d.id !== selectedDrawingId);
            pushHistory(pages, next, canvasImages);
            triggerAutoSave({ overrideDrawings: next });
            return next;
          });
          setSelectedDrawingId(null);
          setIsEditingShape(false);
        } else if (selectedImageId) {
          e.preventDefault();
          e.stopPropagation();
          setCanvasImages((prev) => {
            const next = prev.filter((img) => img.id !== selectedImageId);
            pushHistory(pages, drawings, next);
            triggerAutoSave({ overrideImages: next });
            return next;
          });
          setSelectedImageId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId, selectedImageId, pages, drawings, canvasImages, pushHistory]);

  // Requirement 11: Reliable autosaving and beforeunload flush
  useEffect(() => {
    const handleBeforeUnload = () => {
      triggerAutoSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pages, title, layout, drawings, canvasImages, pageGroups]);

  // Close overlay dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        printMenuRef.current &&
        !printMenuRef.current.contains(target as Node)
      ) {
        setShowPrintMenu(false);
      }
      if (!target.closest('.nc-image-dropdown-btn') && !target.closest('.nc-image-dropdown-menu')) {
        setImageMenuPos(null);
      }
      if (!target.closest('.nc-table-dropdown-btn') && !target.closest('.nc-table-dropdown-menu')) {
        setTableMenuPos(null);
      }
      if (!target.closest('.nc-shape-dropdown-btn') && !target.closest('.nc-shape-dropdown-menu')) {
        setShapeMenuPos(null);
      }
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    return () =>
      window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCombinedCleanHtml = useCallback(
    (overridePages?: string[]) => {
      const targetPages = overridePages || pages;
      const currentHtmls = targetPages.map((p, idx) => {
        const el = pageRefs.current[idx];
        return overridePages ? p : el ? el.innerHTML : p || '';
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
      overrideImages?: CanvasImageElement[];
      overrideGroups?: PageGroup[];
    }) => {
      setSaveState('saving');
      const combinedHtml =
        opts?.overrideHtml !== undefined
          ? opts.overrideHtml
          : getCombinedCleanHtml();

      const updatedAt = getCurrentFormattedDate();
      const nextSync: SyncStatus = isOnline ? 'saved' : 'offline-pending';
      const nextLayout = opts?.overrideLayout || layout;
      const nextDrawings = opts?.overrideDrawings || drawings;
      const nextImages = opts?.overrideImages || canvasImages;
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
          images: nextImages,
          pageGroups: nextGroups,
          orientation: nextLayout.orientation,
        },
        aiHistory: opts?.overrideAiHistory || doc.aiHistory,
      });

      setTimeout(() => {
        setSaveState(nextSync);
      }, 260);
    },
    [
      canvasImages,
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
      480,
      heightPx - padTopPx - padBottomPx - (layout.headerSpacingPx || 18) - (layout.footerSpacingPx || 24) - 40
    );

    return {
      widthPx,
      heightPx,
      padTopPx,
      padBottomPx,
      padLeftPx,
      padRightPx,
      maxBodyHeight,
    };
  };

  const checkAndFlowPages = useCallback(
    (pageIndex: number) => {
      setHasUnsavedChanges(true);
      const pageEl = pageRefs.current[pageIndex];
      if (!pageEl) return;

      const { maxBodyHeight } = getPageDimensions(pageIndex);

      // Only flow if content genuinely overflows printable boundary with generous threshold
      if (
        pageEl.scrollHeight > maxBodyHeight + 40 &&
        pageEl.children.length > 1
      ) {
        const movedNodes: string[] = [];
        const activeNode = window.document.activeElement;
        while (
          pageEl.scrollHeight > maxBodyHeight &&
          pageEl.children.length > 1
        ) {
          const lastChild = pageEl.lastElementChild as HTMLElement | null;
          if (!lastChild) break;
          // Never move the child element the user is actively typing inside
          if (
            activeNode &&
            (lastChild === activeNode || lastChild.contains(activeNode))
          ) {
            break;
          }
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

  // =========================================================================
  // REQUIREMENT 4: TEXT-LEVEL SELECTION DETECTION (Floating AI Icon Only)
  // =========================================================================
  const handlePageSelection = (
    pageIdx: number,
    e?: React.MouseEvent | React.KeyboardEvent
  ) => {
    activePageIdxRef.current = pageIdx;

    // Detect if cursor is inside a table cell (Requirement 13)
    const targetNode = (e?.target as HTMLElement) || null;
    const cell = targetNode?.closest?.('td, th') as HTMLTableCellElement | null;
    if (cell) {
      activeTableCellRef.current = cell;
      setIsInsideTable(true);
      const tbl = cell.closest('table');
      if (tbl) {
        const r = tbl.getBoundingClientRect();
        setActiveTableRect({ top: r.top, left: r.left, width: r.width });
      }
    } else if (targetNode && pageRefs.current[pageIdx]?.contains(targetNode)) {
      setIsInsideTable(false);
      setActiveTableRect(null);
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      if (!showTextAiPopup) {
        setHighlightedText('');
        setHighlightBadgePos(null);
      }
      return;
    }

    const range = sel.getRangeAt(0);
    const pageEl = pageRefs.current[pageIdx];
    if (!pageEl || !pageEl.contains(range.commonAncestorContainer)) {
      if (!showTextAiPopup) {
        setHighlightedText('');
        setHighlightBadgePos(null);
      }
      return;
    }

    savedRangeRef.current = range.cloneRange();
    const text = sel.toString().trim();

    // Check heading under cursor to synchronize toolbar dropdown (Requirement 2)
    let node: Node | null = range.startContainer;
    let foundHeading: 'P' | 'H1' | 'H2' | 'H3' = 'P';
    while (node && node !== pageEl) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const elTag = (node as HTMLElement).tagName.toUpperCase();
        if (elTag === 'H1') {
          foundHeading = 'H1';
          break;
        } else if (elTag === 'H2') {
          foundHeading = 'H2';
          break;
        } else if (elTag === 'H3') {
          foundHeading = 'H3';
          break;
        }
      }
      node = node.parentNode;
    }
    setCurrentHeading(foundHeading);

    if (text.length >= 2) {
      const rect = range.getBoundingClientRect();
      setHighlightedText(text);
      setHighlightPageIdx(pageIdx);
      setHighlightBadgePos({
        top: rect.top,
        left: rect.right,
      });
    } else {
      if (!showTextAiPopup) {
        setHighlightedText('');
        setHighlightBadgePos(null);
      }
    }
  };

  // Open Text AI popup and keep the text visibly highlighted without shifting or jumping
  const handleOpenTextAiPopup = () => {
    // Preserve the exact browser selection range without modifying DOM nodes so text NEVER jumps or shifts
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current.cloneRange());
        } catch {
          // range preserved
        }
      }
    }
    setShowTextAiPopup(true);
  };

  const handleCloseTextAiPopup = () => {
    setShowTextAiPopup(false);
    setHighlightedText('');
    setHighlightBadgePos(null);
  };

  // Requirement 4: Execute Real Text-Level AI and replace ONLY the highlighted text
  const handleExecuteTextLevelAI = async (
    instruction: string,
    attachments?: AIAttachment[]
  ) => {
    if (!highlightedText) return;
    setIsAiLoading(true);
    setAiProgressMessage('Applying AI edit to selected text...');
    try {
      const result = await runTextLevelAIAsync(highlightedText, instruction, attachments);
      const pageEl = pageRefs.current[highlightPageIdx];

      if (pageEl) {
        if (savedRangeRef.current) {
          try {
            const range = savedRangeRef.current;
            range.deleteContents();
            const frag = range.createContextualFragment(result.updatedHtml);
            range.insertNode(frag);
          } catch {
            pageEl.focus();
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(savedRangeRef.current);
            window.document.execCommand('insertHTML', false, result.updatedHtml);
          }
        }
        checkAndFlowPages(highlightPageIdx);
        const nextPages = pages.map((_, i) => pageRefs.current[i]?.innerHTML || pages[i]);
        setPages(nextPages);
        triggerAutoSave({
          overrideHtml: getCombinedCleanHtml(nextPages),
        });
      }
    } finally {
      setIsAiLoading(false);
      setAiProgressMessage('');
      setShowTextAiPopup(false);
      setHighlightedText('');
      setHighlightBadgePos(null);
    }
  };

  // =========================================================================
  // REQUIREMENT 5: REAL PAGE-LEVEL AI EXECUTION (Modifies the selected page with Gemini)
  // =========================================================================
  const handleExecutePageLevelAI = async (
    pageIndex: number,
    instruction: string,
    attachments: { name: string; extractedText: string }[] = []
  ) => {
    const currentHtml = pageRefs.current[pageIndex]
      ? pageRefs.current[pageIndex]!.innerHTML
      : pages[pageIndex] || '';

    setIsAiLoading(true);
    setAiProgressMessage(`Updating Page ${pageIndex + 1} with AI...`);

    try {
      const attPayload: AIAttachment[] = attachments.map((a, i) => ({
        id: `att-${i}`,
        name: a.name,
        type: 'document',
        fileType: 'TXT',
        sizeFormatted: '',
        extractedText: a.extractedText,
      }));

      const result = await runPageLevelAIAsync(
        currentHtml,
        pageIndex,
        instruction,
        title,
        attPayload
      );

      const nextPages = pages.map((_, i) =>
        pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
      );
      nextPages[pageIndex] = result.updatedPageHtml;
      if (pageRefs.current[pageIndex]) {
        pageRefs.current[pageIndex]!.innerHTML = result.updatedPageHtml;
      }
      setPages(nextPages);
      setActivePageAiIdx(null);
      triggerAutoSave({
        overrideHtml: getCombinedCleanHtml(nextPages),
      });
    } finally {
      setIsAiLoading(false);
      setAiProgressMessage('');
    }
  };

  // =========================================================================
  // FORMATTING & TABLE EDITING (Requirement 2: Heading 1, 2, 3 Sync & Word-style Table Resizing)
  // =========================================================================
  const applyInlineStyleToSelection = (property: string, value: string) => {
    const activeEl = pageRefs.current[activePageIdxRef.current];
    if (activeEl) {
      activeEl.focus();
    }

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      range = sel.getRangeAt(0);
    } else if (savedRangeRef.current && !savedRangeRef.current.collapsed) {
      range = savedRangeRef.current;
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    if (!range || range.collapsed) {
      return;
    }

    // Ensure range is inside editor
    const isInside = pageRefs.current.some(
      (el) => el && el.contains(range!.commonAncestorContainer)
    );
    if (!isInside) return;

    try {
      const span = window.document.createElement('span');
      span.style.setProperty(property, value);
      const extracted = range.extractContents();
      span.appendChild(extracted);
      range.insertNode(span);

      // Re-select newly styled text
      const newRange = window.document.createRange();
      newRange.selectNodeContents(span);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    } catch (err) {
      console.warn('Failed to apply inline style to selection', err);
    }

    setHasUnsavedChanges(true);
    const updatedPages = pages.map((p, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : p
    );
    pushHistory(updatedPages);
    triggerAutoSave();
  };

  const handleApplyFontSize = (sizeStr: string) => {
    const trimmed = sizeStr.trim();
    if (!trimmed) return;
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 6 || num > 120) return;
    const formatted =
      trimmed.endsWith('px') || trimmed.endsWith('pt')
        ? trimmed
        : `${num}px`;
    setSelectedFontSize(formatted);
    applyInlineStyleToSelection('font-size', formatted);
  };

  const handleApplyFontFamily = (family: string) => {
    setSelectedFontFamily(family);
    applyInlineStyleToSelection('font-family', `"${family}", Georgia, serif`);
  };

  const handlePrintWorkspace = (
    scope: 'document' | 'group' | 'page' = printScope,
    groupId: string = printGroupId,
    pageIndex: number = printPageIdx
  ) => {
    setShowPrintMenu(false);

    // Determine target page indices to print
    let targetIndices: number[] = [];
    if (scope === 'document') {
      targetIndices = pages.map((_, i) => i);
    } else if (scope === 'group') {
      const activeGrp =
        pageGroups.find((g) => g.id === groupId) || pageGroups[0];
      targetIndices = activeGrp ? activeGrp.pageIndices : [0];
    } else {
      targetIndices = [Math.max(0, Math.min(pages.length - 1, pageIndex))];
    }

    // Mark pages with data-print-visible attribute
    pages.forEach((_, i) => {
      const pageEl = pageRefs.current[i]?.closest('.doc-a4-page') as HTMLElement | null;
      if (pageEl) {
        pageEl.setAttribute(
          'data-print-visible',
          targetIndices.includes(i) ? 'true' : 'false'
        );
      }
    });

    const orientation = layout.orientation || 'portrait';
    const pageSizeName =
      layout.pageSize === 'Custom'
        ? `${layout.customWidthMm || 210}mm ${layout.customHeightMm || 297}mm`
        : layout.pageSize;

    let styleEl = window.document.getElementById(
      'nc-dynamic-print-style'
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = window.document.createElement('style');
      styleEl.id = 'nc-dynamic-print-style';
      window.document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      @media print {
        @page {
          size: ${pageSizeName} ${orientation};
          margin: 0;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #FFFFFF !important;
        }
        .no-print,
        .nc-header,
        .nc-ai-panel,
        .nc-groups-sidebar,
        .ed-toolbar,
        .nc-modal-backdrop,
        .nc-element-layer-toolbar,
        .nc-image-dropdown-menu {
          display: none !important;
        }
        mark.ai-persistent-selection {
          background: transparent !important;
          color: inherit !important;
          border: none !important;
          box-shadow: none !important;
        }
        .doc-workspace-canvas-wrap {
          background: #FFFFFF !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
        }
        .doc-a4-page {
          display: none !important;
        }
        .doc-a4-page[data-print-visible="true"] {
          display: flex !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: none !important;
          page-break-after: always !important;
          break-after: page !important;
        }
      }
    `;

    setTimeout(() => {
      window.print();
    }, 60);
  };

  const execFormat = (command: string, value?: string) => {
    const activeEl = pageRefs.current[activePageIdxRef.current];
    if (activeEl) {
      activeEl.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
          } catch {
            // ignore
          }
        }
      }
    }

    if (command === 'formatBlock' && value) {
      const tag = value.replace(/[<>]/g, '').toLowerCase();
      setCurrentHeading(tag.toUpperCase() as 'P' | 'H1' | 'H2' | 'H3');
      try {
        window.document.execCommand('formatBlock', false, `<${tag}>`);
      } catch {
        try {
          window.document.execCommand('formatBlock', false, tag);
        } catch {
          // fallback
        }
      }
    } else {
      window.document.execCommand(command, false, value);
    }

    setHasUnsavedChanges(true);
    const updatedPages = pages.map((p, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : p
    );
    pushHistory(updatedPages);
    triggerAutoSave();
  };

  const handleInsertConfiguredTable = (rows: number, cols: number) => {
    const rCount = Math.max(1, Math.min(20, rows));
    const cCount = Math.max(1, Math.min(10, cols));
    let thead = '<thead><tr>';
    for (let c = 0; c < cCount; c++) {
      thead += `<th style="width: ${Math.round(100 / cCount)}%;">Header ${
        c + 1
      }</th>`;
    }
    thead += '</tr></thead>';

    let tbody = '<tbody>';
    for (let r = 0; r < Math.max(1, rCount - 1); r++) {
      tbody += '<tr>';
      for (let c = 0; c < cCount; c++) {
        tbody += `<td>Data ${r + 1}.${c + 1}</td>`;
      }
      tbody += '</tr>';
    }
    tbody += '</tbody>';

    execFormat('insertHTML', `<table>${thead}${tbody}</table><p><br/></p>`);
    setTableMenuPos(null);
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
      | 'table-wider'
      | 'table-narrower'
  ) => {
    const cell = activeTableCellRef.current;
    if (!cell) return;
    const row = cell.closest('tr') as HTMLTableRowElement | null;
    const table = cell.closest('table') as HTMLTableElement | null;
    if (!row || !table) return;

    const colIdx = cell.cellIndex;
    const allRows = Array.from(table.querySelectorAll('tr'));
    const rowIdx = allRows.indexOf(row);

    if (action === 'del-table') {
      table.remove();
      setIsInsideTable(false);
      setActiveTableRect(null);
      triggerAutoSave();
      return;
    }

    if (action === 'table-wider' || action === 'table-narrower') {
      const curW = table.getBoundingClientRect().width;
      const nextW =
        action === 'table-wider' ? curW + 45 : Math.max(220, curW - 45);
      table.style.width = `${Math.round(nextW)}px`;
      triggerAutoSave();
      return;
    }

    if (action === 'add-row-above' || action === 'add-row-below') {
      const newRow = window.document.createElement('tr');
      const colCount = row.children.length;
      for (let i = 0; i < colCount; i++) {
        const td = window.document.createElement('td');
        td.innerHTML = '&nbsp;';
        newRow.appendChild(td);
      }
      if (action === 'add-row-above') {
        row.parentNode?.insertBefore(newRow, row);
      } else {
        row.parentNode?.insertBefore(newRow, row.nextSibling);
      }
    } else if (action === 'add-col-left' || action === 'add-col-right') {
      allRows.forEach((r, rIdx) => {
        const refCell = r.children[colIdx] || r.lastElementChild;
        const isHeader = rIdx === 0 && r.querySelector('th');
        const newCell = window.document.createElement(isHeader ? 'th' : 'td');
        newCell.innerHTML = isHeader ? 'New Header' : '&nbsp;';
        if (action === 'add-col-left') {
          r.insertBefore(newCell, refCell);
        } else {
          r.insertBefore(newCell, refCell ? refCell.nextSibling : null);
        }
      });
    } else if (action === 'del-row') {
      if (allRows.length <= 1) {
        table.remove();
        setIsInsideTable(false);
      } else {
        row.remove();
      }
    } else if (action === 'del-col') {
      const colCount = row.children.length;
      if (colCount <= 1) {
        table.remove();
        setIsInsideTable(false);
      } else {
        allRows.forEach((r) => {
          if (r.children[colIdx]) r.children[colIdx].remove();
        });
      }
    } else if (action === 'row-up' && rowIdx > 0) {
      const prevRow = allRows[rowIdx - 1];
      if (prevRow.parentNode === row.parentNode) {
        row.parentNode?.insertBefore(row, prevRow);
      }
    } else if (action === 'row-down' && rowIdx < allRows.length - 1) {
      const nextRow = allRows[rowIdx + 1];
      if (nextRow.parentNode === row.parentNode) {
        row.parentNode?.insertBefore(nextRow, row);
      }
    } else if (action === 'col-left' && colIdx > 0) {
      allRows.forEach((r) => {
        const cur = r.children[colIdx];
        const prev = r.children[colIdx - 1];
        if (cur && prev) r.insertBefore(cur, prev);
      });
    } else if (action === 'col-right' && colIdx < row.children.length - 1) {
      allRows.forEach((r) => {
        const cur = r.children[colIdx];
        const next = r.children[colIdx + 1];
        if (cur && next) r.insertBefore(next, cur);
      });
    } else if (action === 'col-wider' || action === 'col-narrower') {
      const currentWidth = cell.getBoundingClientRect().width;
      const nextWidth =
        action === 'col-wider'
          ? currentWidth + 25
          : Math.max(50, currentWidth - 25);
      allRows.forEach((r) => {
        const c = r.children[colIdx] as HTMLElement | undefined;
        if (c) c.style.width = `${Math.round(nextWidth)}px`;
      });
    } else if (action === 'row-taller') {
      const currentHeight = row.getBoundingClientRect().height;
      row.style.height = `${Math.round(currentHeight + 14)}px`;
    }

    const r = table.getBoundingClientRect();
    setActiveTableRect({ top: r.top, left: r.left, width: r.width });
    triggerAutoSave();
  };

  // Interactive Mouse & Touch Dragging of Table Column & Row Borders (Requirement 10)
  const handlePageMouseMoveForTableResize = (
    pageIdx: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const target = e.target as HTMLElement;
    const cell = target.closest?.('td, th') as HTMLTableCellElement | null;
    const pageEl = pageRefs.current[pageIdx];
    if (!cell || !pageEl) {
      if (pageEl) pageEl.style.cursor = 'text';
      return;
    }

    const rect = cell.getBoundingClientRect();
    const nearRightEdge = Math.abs(e.clientX - rect.right) <= 8;
    const nearBottomEdge = Math.abs(e.clientY - rect.bottom) <= 8;

    if (nearRightEdge) {
      pageEl.style.cursor = 'col-resize';
    } else if (nearBottomEdge) {
      pageEl.style.cursor = 'row-resize';
    } else {
      pageEl.style.cursor = 'text';
    }
  };

  const handlePageMouseDownForTableResize = (
    pageIdx: number,
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const target = e.target as HTMLElement;
    const cell = target.closest?.('td, th') as HTMLTableCellElement | null;
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const nearRightEdge = Math.abs(clientX - rect.right) <= 8;
    const nearBottomEdge = Math.abs(clientY - rect.bottom) <= 8;

    if (nearRightEdge) {
      e.preventDefault();
      const colIdx = cell.cellIndex;
      const table = cell.closest('table');
      tableResizeDragRef.current = {
        type: 'col',
        targetEl: cell,
        startX: clientX,
        startY: clientY,
        origSize: rect.width,
        pageIdx,
      };

      const handleGlobalMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
        const curX =
          'touches' in moveEvent
            ? moveEvent.touches[0].clientX
            : moveEvent.clientX;
        if (!tableResizeDragRef.current) return;
        const diff = curX - tableResizeDragRef.current.startX;
        const nextW = Math.max(40, tableResizeDragRef.current.origSize + diff);
        if (table) {
          const rows = Array.from(table.rows);
          rows.forEach((row) => {
            if (row.cells[colIdx]) {
              row.cells[colIdx].style.width = `${Math.round(nextW)}px`;
            }
          });
        }
      };

      const handleGlobalMouseUp = () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('touchmove', handleGlobalMouseMove);
        window.removeEventListener('touchend', handleGlobalMouseUp);
        tableResizeDragRef.current = null;
        setHasUnsavedChanges(true);
        triggerAutoSave();
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalMouseMove);
      window.addEventListener('touchend', handleGlobalMouseUp);
    } else if (nearBottomEdge) {
      e.preventDefault();
      const row = cell.closest('tr') as HTMLElement;
      if (row) {
        tableResizeDragRef.current = {
          type: 'row',
          targetEl: row,
          startX: clientX,
          startY: clientY,
          origSize: row.getBoundingClientRect().height,
          pageIdx,
        };

        const handleGlobalMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
          const curY =
            'touches' in moveEvent
              ? moveEvent.touches[0].clientY
              : moveEvent.clientY;
          if (!tableResizeDragRef.current) return;
          const diff = curY - tableResizeDragRef.current.startY;
          const nextH = Math.max(26, tableResizeDragRef.current.origSize + diff);
          row.style.height = `${Math.round(nextH)}px`;
          Array.from(row.children).forEach((c) => {
            (c as HTMLElement).style.height = `${Math.round(nextH)}px`;
          });
        };

        const handleGlobalMouseUp = () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
          window.removeEventListener('touchmove', handleGlobalMouseMove);
          window.removeEventListener('touchend', handleGlobalMouseUp);
          tableResizeDragRef.current = null;
          setHasUnsavedChanges(true);
          triggerAutoSave();
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchmove', handleGlobalMouseMove);
        window.addEventListener('touchend', handleGlobalMouseUp);
      }
    }
  };

  const handlePageMouseUpForTableResize = () => {
    if (tableResizeDragRef.current) {
      tableResizeDragRef.current = null;
      triggerAutoSave();
    }
  };

  // =========================================================================
  // REQUIREMENT 10: IMAGE INSERTION (Toolbar Button OR Drag-and-Drop) & RESIZING
  // =========================================================================
  const addImageFileToPage = (file: File, pageIdx: number, dropX?: number, dropY?: number) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const imgProbe = new window.Image();
      imgProbe.onload = () => {
        const ratio =
          imgProbe.naturalHeight > 0
            ? imgProbe.naturalWidth / imgProbe.naturalHeight
            : 1.4;
        const initW = Math.min(320, Math.max(140, imgProbe.naturalWidth));
        const initH = Math.round(initW / ratio);

        const maxZ = Math.max(
          10,
          ...drawings.map((d) => d.zIndex || 10),
          ...canvasImages.map((im) => im.zIndex || 10)
        );

        const newImg: CanvasImageElement = {
          id: `img-${Date.now()}`,
          pageIndex: pageIdx,
          src: dataUrl,
          x: dropX ?? 120,
          y: dropY ?? 140,
          width: initW,
          height: initH,
          aspectRatio: ratio,
          zIndex: maxZ + 1,
          caption: file.name,
        };

        const nextImages = [...canvasImages, newImg];
        setCanvasImages(nextImages);
        setSelectedImageId(newImg.id);
        setSelectedDrawingId(null);
        triggerAutoSave({ overrideImages: nextImages });
      };
      imgProbe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addImageFileToPage(file, activePageIdxRef.current);
    e.target.value = '';
  };

  const handlePageDrop = (
    pageIdx: number,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    const files = Array.from(e.dataTransfer?.files || []);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    if (!imageFile) return;

    e.preventDefault();
    e.stopPropagation();
    const pageRect = e.currentTarget.getBoundingClientRect();
    const dropX = Math.max(24, Math.round(e.clientX - pageRect.left - 100));
    const dropY = Math.max(40, Math.round(e.clientY - pageRect.top - 70));
    addImageFileToPage(imageFile, pageIdx, dropX, dropY);
  };

  // =========================================================================
  // REQUIREMENT 8: ADD BLANK PAGE & PAGE BREAK
  // =========================================================================
  // REQUIREMENT 5 & 8: ADD BLANK PAGE (ALWAYS AT THE BOTTOM OF THE DOCUMENT)
  // =========================================================================
  const handleAddBlankPage = () => {
    const currentHtmls = pages.map((_, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
    );
    // Requirement 5: ALWAYS append the new page at the BOTTOM of the document
    const nextPages = [...currentHtmls, '<p><br/></p>'];
    const newIdx = nextPages.length - 1;
    setPages(nextPages);
    activePageIdxRef.current = newIdx;
    setTimeout(() => {
      const newPageEl = pageRefs.current[newIdx];
      if (newPageEl) {
        newPageEl.focus();
        newPageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      triggerAutoSave({
        overrideHtml: getCombinedCleanHtml(nextPages),
      });
    }, 60);
  };

  const handleInsertPageBreak = () => {
    const idx = activePageIdxRef.current;
    const pageEl = pageRefs.current[idx];
    if (!pageEl) return;

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
    triggerAutoSave({
      overrideHtml: getCombinedCleanHtml(nextPages),
    });
  };

  // =========================================================================
  // REQUIREMENT 11 & 12: FULL-PAGE FIGMA-LIKE SHAPE DRAWING & LAYER CONTROLS
  // =========================================================================
  const getPageRelativeCoords = (
    pageEl: HTMLElement,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    const rect = pageEl.getBoundingClientRect();
    const clientX =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientY
        : (e as React.MouseEvent).clientY;
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    };
  };

  const handleStartCanvasShapeDraw = (
    pageIdx: number,
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (activeShapeTool === 'select') return;
    e.stopPropagation();
    const pageContainer = e.currentTarget.parentElement;
    if (!pageContainer) return;

    const { x, y } = getPageRelativeCoords(pageContainer, e);
    const maxZ = Math.max(
      10,
      ...drawings.map((d) => d.zIndex || 10),
      ...canvasImages.map((im) => im.zIndex || 10)
    );

    const newId = `drw-${Date.now()}`;
    const newShape: DrawingElement = {
      id: newId,
      pageIndex: pageIdx,
      type: activeShapeTool,
      x1: x,
      y1: y,
      x2: x + 4,
      y2: y + 4,
      points: activeShapeTool === 'freehand' ? [{ x, y }] : undefined,
      strokeColor,
      fillColor,
      strokeWidth,
      lineStyle,
      zIndex: maxZ + 1,
    };

    setDrawings((prev) => [...prev, newShape]);
    setSelectedDrawingId(newId);
    setSelectedImageId(null);
    setDragState({
      targetKind: 'shape',
      mode: 'create',
      id: newId,
      pageIdx,
      startX: x,
      startY: y,
      origX1: x,
      origY1: y,
      origX2: x + 4,
      origY2: y + 4,
    });
  };

  const handleCanvasPointerMove = (
    pageIdx: number,
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!dragState || dragState.pageIdx !== pageIdx) return;
    const { x, y } = getPageRelativeCoords(e.currentTarget, e);
    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    if (dragState.targetKind === 'shape') {
      setDrawings((prev) =>
        prev.map((d) => {
          if (d.id !== dragState.id) return d;

          if (dragState.mode === 'create') {
            if (d.type === 'hline') return { ...d, x2: x, y2: d.y1 };
            if (d.type === 'vline') return { ...d, x2: d.x1, y2: y };
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
            return {
              ...d,
              x1: dragState.origX1 + dx,
              y1: dragState.origY1 + dy,
              x2: dragState.origX2 + dx,
              y2: dragState.origY2 + dy,
            };
          }

          if (dragState.mode === 'resize-nw') return { ...d, x1: x, y1: y };
          if (dragState.mode === 'resize-se') return { ...d, x2: x, y2: y };
          if (dragState.mode === 'resize-ne') return { ...d, x2: x, y1: y };
          if (dragState.mode === 'resize-sw') return { ...d, x1: x, y2: y };
          if (dragState.mode === 'resize-n') return { ...d, y1: y };
          if (dragState.mode === 'resize-s') return { ...d, y2: y };
          if (dragState.mode === 'resize-w') return { ...d, x1: x };
          if (dragState.mode === 'resize-e') return { ...d, x2: x };
          return d;
        })
      );
    } else if (dragState.targetKind === 'image') {
      setCanvasImages((prev) =>
        prev.map((img) => {
          if (img.id !== dragState.id) return img;
          const origW = dragState.origX2 - dragState.origX1;
          const origH = dragState.origY2 - dragState.origY1;
          const ratio = dragState.aspectRatio || img.aspectRatio || 1.33;

          if (dragState.mode === 'move') {
            return {
              ...img,
              x: Math.max(0, dragState.origX1 + dx),
              y: Math.max(0, dragState.origY1 + dy),
            };
          }

          // Corner handles maintain aspect ratio (Requirement 10)
          if (dragState.mode === 'resize-se') {
            const nextW = Math.max(50, origW + dx);
            return {
              ...img,
              width: Math.round(nextW),
              height: Math.round(nextW / ratio),
            };
          }
          if (dragState.mode === 'resize-nw') {
            const nextW = Math.max(50, origW - dx);
            const nextH = Math.round(nextW / ratio);
            return {
              ...img,
              x: dragState.origX2 - nextW,
              y: dragState.origY2 - nextH,
              width: Math.round(nextW),
              height: nextH,
            };
          }
          if (dragState.mode === 'resize-ne') {
            const nextW = Math.max(50, origW + dx);
            const nextH = Math.round(nextW / ratio);
            return {
              ...img,
              y: dragState.origY2 - nextH,
              width: Math.round(nextW),
              height: nextH,
            };
          }
          if (dragState.mode === 'resize-sw') {
            const nextW = Math.max(50, origW - dx);
            const nextH = Math.round(nextW / ratio);
            return {
              ...img,
              x: dragState.origX2 - nextW,
              width: Math.round(nextW),
              height: nextH,
            };
          }

          // Side handles also maintain aspect ratio proportionally (Requirement 3)
          if (dragState.mode === 'resize-e') {
            const nextW = Math.max(40, origW + dx);
            return {
              ...img,
              width: Math.round(nextW),
              height: Math.round(nextW / ratio),
            };
          }
          if (dragState.mode === 'resize-w') {
            const nextW = Math.max(40, origW - dx);
            return {
              ...img,
              x: dragState.origX2 - nextW,
              width: Math.round(nextW),
              height: Math.round(nextW / ratio),
            };
          }
          if (dragState.mode === 'resize-s') {
            const nextH = Math.max(30, origH + dy);
            return {
              ...img,
              height: Math.round(nextH),
              width: Math.round(nextH * ratio),
            };
          }
          if (dragState.mode === 'resize-n') {
            const nextH = Math.max(30, origH - dy);
            const nextW = Math.round(nextH * ratio);
            return {
              ...img,
              y: dragState.origY2 - nextH,
              height: Math.round(nextH),
              width: nextW,
            };
          }
          return img;
        })
      );
    }
  };

  const handleCanvasPointerUp = () => {
    if (!dragState) return;
    if (dragState.mode === 'create') {
      setActiveShapeTool('select');
    }
    setDragState(null);
    triggerAutoSave({
      overrideDrawings: drawings,
      overrideImages: canvasImages,
    });
  };

  // Requirement 2: Fixed Shape & Image Layer Ordering with Intermediate Step Support
  const handleLayerAction = (
    action: 'front' | 'forward' | 'backward' | 'back'
  ) => {
    const pageIdx = activePageIdxRef.current;
    const pageDrawings = drawings.filter((d) => d.pageIndex === pageIdx);
    const pageImages = canvasImages.filter((im) => im.pageIndex === pageIdx);

    // All distinct stacking levels on this page, including the Text layer at zIndex: 6
    const allZs = Array.from(
      new Set([
        ...pageDrawings.map((d) => d.zIndex ?? 10),
        ...pageImages.map((im) => im.zIndex ?? 12),
        6, // Text Layer boundary
      ])
    ).sort((a, b) => a - b);

    const maxZ = allZs[allZs.length - 1] ?? 12;
    const minZ = allZs[0] ?? 1;

    const computeNewZ = (curZ: number) => {
      if (action === 'front') return maxZ + 2;
      if (action === 'back') return Math.max(1, minZ - 2);

      if (action === 'backward') {
        const smaller = allZs.filter((z) => z < curZ);
        if (smaller.length === 0) return Math.max(1, curZ - 1);
        const nextUnder = smaller[smaller.length - 1];
        // Move behind the immediate layer below it
        return Math.max(1, nextUnder - 1);
      }

      if (action === 'forward') {
        const larger = allZs.filter((z) => z > curZ);
        if (larger.length === 0) return curZ + 2;
        const nextOver = larger[0];
        // Move in front of the immediate layer above it
        return nextOver + 1;
      }
      return curZ;
    };

    if (selectedDrawingId) {
      const next = drawings.map((d) => {
        if (d.id !== selectedDrawingId) return d;
        const cur = d.zIndex ?? 10;
        return { ...d, zIndex: computeNewZ(cur) };
      });
      setDrawings(next);
      triggerAutoSave({ overrideDrawings: next });
    } else if (selectedImageId) {
      const next = canvasImages.map((img) => {
        if (img.id !== selectedImageId) return img;
        const cur = img.zIndex ?? 12;
        return { ...img, zIndex: computeNewZ(cur) };
      });
      setCanvasImages(next);
      triggerAutoSave({ overrideImages: next });
    }
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
  // REQUIREMENT 6 & 7: MAIN AI ASSISTANT (Scope + Reference Attachments + Direct Execution)
  // =========================================================================
  const handleMainAiFileAttach = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const processed = await processMultipleFiles(files);
      setAiUploadedRefs((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Failed to attach files in Main AI:', err);
    }
    e.target.value = '';
  };

  const handleSendAiPrompt = () => {
    if (isMainAiRecording) stopMainAiVoice();
    const query = combinedMainAiInput.trim();
    if (!query && aiUploadedRefs.length === 0) return;

    // Check Credit Wallet Status (Section 11 & 12)
    const usageCheck = billingManager.getUsageStatus();
    if (!usageCheck.canUseAI) {
      alert(
        'AI Credit Limit Reached: Manual editing, typing, formatting, and file export remain 100% active. Upgrade your plan or purchase top-up credits to re-enable AI assistance.'
      );
      return;
    }

    const effectiveQuery =
      query ||
      `Update the selected scope using the attached reference material (${aiUploadedRefs
        .map((r) => r.name)
        .join(', ')}).`;

    // Check for AI Grouping Instruction (Section 9)
    const groupingProposal = parseGroupingInstruction(effectiveQuery, pages.length);
    if (groupingProposal) {
      setPendingGroupingProposal({
        groupName: groupingProposal.groupName,
        pageIndices: groupingProposal.pageIndices,
        originalPrompt: effectiveQuery,
      });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      prompt: effectiveQuery,
      timestamp: timeStr,
      attachments: aiUploadedRefs.map((a) => a.name),
    };

    const currentPagesHtml = pages.map((_, i) =>
      pageRefs.current[i] ? pageRefs.current[i]!.innerHTML : pages[i]
    );

    // Determine exact target page indices from Main AI Focus Scope (Requirement 6)
    let explicitGroupId: string | undefined;
    let explicitPageIndices: number[] | undefined;

    if (mainAiScope === 'group' && aiTargetGroupId) {
      explicitGroupId = aiTargetGroupId;
      const grp = pageGroups.find((g) => g.id === aiTargetGroupId);
      if (grp) {
        explicitPageIndices =
          aiGroupPageSelection === 'all'
            ? grp.pageIndices
            : [aiGroupPageSelection];
      }
    } else if (mainAiScope === 'page') {
      explicitPageIndices = [aiTargetSinglePage];
    }

    setPromptInput('');
    setIsAiLoading(true);
    setAiProgressMessage('Reading active document...');

    setTimeout(async () => {
      setAiProgressMessage('Analyzing document structure...');
      await new Promise((r) => setTimeout(r, 220));

      setAiProgressMessage('Generating edits with AI...');

      // Calculate token usage and deduct credits (Section 12)
      const inputTokenEst = Math.ceil(effectiveQuery.length / 4) +
        aiUploadedRefs.reduce((acc, r) => acc + Math.ceil((r.extractedText || '').length / 4), 0);
      const outputTokenEst = 750;
      billingManager.reserveAndDeductCredits(
        'Workspace Assistant Generation',
        'gemini-1.5-flash',
        Math.max(60, inputTokenEst),
        outputTokenEst,
        doc.title
      );

      // Requirement 1 & 2: Call Gemini / Workspace AI with Strict Active Document Context Isolation
      const conversationHistory = (doc.aiHistory || [])
        .map((m) => ({
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          text: m.role === 'assistant' ? (m.summary || m.prompt || 'Document updated') : (m.prompt || ''),
        }))
        .filter((m) => m.text.trim().length > 0);

      const result: WorkspaceAIResult = await runWorkspaceAIPromptAsync(
        effectiveQuery,
        {
          ...doc,
          metadata: { ...doc.metadata, pageGroups },
        },
        '', // Main AI assistant NEVER uses highlighted text (Requirement 4 & 6)
        currentPagesHtml,
        explicitGroupId,
        explicitPageIndices,
        aiUploadedRefs,
        aiUploadedRefs,
        conversationHistory
      );

      setAiProgressMessage('Applying changes to document...');

      // Directly implement the requested changes on the target pages in the workspace!
      const nextPages = [...currentPagesHtml];
      if (result.directPageUpdates) {
        Object.entries(result.directPageUpdates).forEach(([idxStr, newHtml]) => {
          const pIdx = parseInt(idxStr, 10);
          if (pIdx >= 0 && pIdx < nextPages.length) {
            nextPages[pIdx] = newHtml;
            if (pageRefs.current[pIdx]) {
              pageRefs.current[pIdx]!.innerHTML = newHtml;
            }
          }
        });
      }

      // Requirement 4 & 5: If multi-page creation was requested, append ALL generated pages
      if (result.action === 'multi_page_create' && result.newPageHtmls && result.newPageHtmls.length > 0) {
        const firstNewIdx = nextPages.length;
        result.newPageHtmls.forEach((html) => {
          nextPages.push(html);
        });
        activePageIdxRef.current = firstNewIdx;
        setTimeout(() => {
          const firstNewEl = pageRefs.current[firstNewIdx];
          if (firstNewEl) {
            firstNewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (result.action === 'append_page' || result.newPageHtml) {
        const newPageHtml = result.newPageHtml || '<p><br/></p>';
        nextPages.push(newPageHtml);
        const newIdx = nextPages.length - 1;
        activePageIdxRef.current = newIdx;
        setTimeout(() => {
          const newPageEl = pageRefs.current[newIdx];
          if (newPageEl) {
            newPageEl.focus();
            newPageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 80);
      }

      // Apply decorative page frame style or layout updates
      if (result.action === 'frame_update' && (result.frameStyle || (result.layoutUpdates as any)?.frameStyle)) {
        const fStyle = result.frameStyle || (result.layoutUpdates as any)?.frameStyle;
        setLayout((prev) => ({
          ...prev,
          frameStyle: fStyle,
          borderStyle: fStyle === 'none' ? 'none' : 'solid',
        }));
      } else if (result.layoutUpdates) {
        setLayout((prev) => ({
          ...prev,
          ...result.layoutUpdates,
        }));
      }

      setPages(nextPages);

      // Requirement 1: Extract sources STRICTLY from user attachments for this active doc only
      const allCandidateSources = [
        ...aiUploadedRefs.map((r) => ({
          name: r.name,
          extractedText: r.extractedText || '',
          type: 'upload',
        })),
      ];

      const extractedSources = extractSourceReferences(
        result.summary + ' ' + (result.generatedHtml || ''),
        allCandidateSources
      );

      const assistantMsg: AIMessage = {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        prompt: effectiveQuery,
        summary: result.summary,
        generatedHtml: result.generatedHtml,
        timestamp: timeStr,
        inserted: true,
        targetGroupId: result.targetGroupId,
        targetGroupName: result.targetGroupName,
        targetPageIndex: result.targetPageIndices?.[0],
        sources: extractedSources.length > 0 ? extractedSources : undefined,
      };

      const nextHistory = [...doc.aiHistory, userMsg, assistantMsg];
      setAiProgressMessage('Document updated successfully.');

      setTimeout(() => {
        setIsAiLoading(false);
        setAiProgressMessage('');
        setAiUploadedRefs([]);
        triggerAutoSave({
          overrideHtml: getCombinedCleanHtml(nextPages),
          overrideAiHistory: nextHistory,
        });
      }, 350);
    }, 200);
  };

  // Section 9: Apply AI Grouping Proposal with User Confirmation
  const handleApplyPendingGrouping = () => {
    if (!pendingGroupingProposal) return;
    const { groupName, pageIndices } = pendingGroupingProposal;
    const existingIdx = pageGroups.findIndex(
      (g) => g.name.toLowerCase() === groupName.toLowerCase()
    );

    let nextGroups: PageGroup[];
    if (existingIdx >= 0) {
      nextGroups = pageGroups.map((g, idx) =>
        idx === existingIdx
          ? {
              ...g,
              pageIndices: Array.from(new Set([...g.pageIndices, ...pageIndices])),
            }
          : g
      );
    } else {
      const newGroup: PageGroup = {
        id: `grp-${Date.now()}`,
        name: groupName,
        pageIndices: pageIndices,
      };
      nextGroups = [...pageGroups, newGroup];
    }

    setPageGroups(nextGroups);
    setHasUnsavedChanges(true);
    triggerAutoSave({ overrideGroups: nextGroups });
    setPendingGroupingProposal(null);
  };

  // Section 9: Apply Decorative Page Frame Styles (Non-destructive, applies directly to margins)
  const handleApplyFrame = (settings: {
    frameStyle: PageFrameStyleId;
    borderColor: string;
    borderWidthPx: number;
    borderInsetMm: number;
    applyToAll: boolean;
  }) => {
    const updatedLayout = { ...layout };
    if (settings.applyToAll) {
      updatedLayout.frameStyle = settings.frameStyle;
      updatedLayout.borderColor = settings.borderColor;
      updatedLayout.borderWidthPx = settings.borderWidthPx;
      updatedLayout.borderInsetMm = settings.borderInsetMm;
      updatedLayout.borderStyle = settings.frameStyle === 'none' ? 'none' : 'solid';
      updatedLayout.sectionBorders = {};
    } else {
      const sectionBorders = { ...(updatedLayout.sectionBorders || {}) };
      sectionBorders[frameTargetPageIndex] = {
        borderStyle: settings.frameStyle === 'none' ? 'none' : 'solid',
        borderWidthPx: settings.borderWidthPx,
        borderColor: settings.borderColor,
        borderInsetMm: settings.borderInsetMm,
        frameStyle: settings.frameStyle,
      };
      updatedLayout.sectionBorders = sectionBorders;
    }
    setLayout(updatedLayout);
    onUpdateDocument({
      ...doc,
      metadata: {
        ...doc.metadata,
        layout: updatedLayout,
      },
    });
    setHasUnsavedChanges(true);
  };

  const selectedDrawingObj =
    drawings.find((d) => d.id === selectedDrawingId) || null;
  const selectedImageObj =
    canvasImages.find((img) => img.id === selectedImageId) || null;
  const activeGroupObj =
    pageGroups.find((g) => g.id === aiTargetGroupId) || null;

  // Requirement 1: Unsaved Changes Protection on exit
  const handleBackSafely = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };

  const handleConfirmSaveAndLeave = () => {
    triggerAutoSave();
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    setTimeout(() => {
      onBack();
    }, 280);
  };

  const handleConfirmSaveLocallyAndLeave = async () => {
    triggerAutoSave();
    if (onSaveToComputer) {
      try {
        await onSaveToComputer({
          ...doc,
          title,
          content: getCombinedCleanHtml(),
          metadata: {
            ...doc.metadata,
            layout,
            drawings,
            images: canvasImages,
            pageGroups,
            pages,
          },
        });
      } catch {
        // ignore
      }
    }
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    setTimeout(() => {
      onBack();
    }, 280);
  };

  const handleConfirmDiscardAndLeave = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    onBack();
  };

  // Requirement 8: Device Camera Capture Handlers
  const startLiveCamera = async () => {
    setImageMenuPos(null);
    setShowCameraModal(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        cameraStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
      } else {
        cameraInputRef.current?.click();
        setShowCameraModal(false);
      }
    } catch {
      cameraInputRef.current?.click();
      setShowCameraModal(false);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoPreviewRef.current) return;
    const video = videoPreviewRef.current;
    const canvas = window.document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopLiveCamera();

    const maxZ = Math.max(
      10,
      ...drawings.map((d) => d.zIndex || 10),
      ...canvasImages.map((im) => im.zIndex || 10)
    );
    const newImg: CanvasImageElement = {
      id: `img-${Date.now()}`,
      pageIndex: activePageIdxRef.current,
      src: dataUrl,
      x: 120,
      y: 140,
      width: Math.min(320, canvas.width),
      height: Math.round(
        Math.min(320, canvas.width) / (canvas.width / canvas.height)
      ),
      aspectRatio: canvas.width / canvas.height,
      zIndex: maxZ + 1,
      caption: `Camera Photo (${getCurrentFormattedDate()})`,
    };
    const nextImages = [...canvasImages, newImg];
    setCanvasImages(nextImages);
    setSelectedImageId(newImg.id);
    setSelectedDrawingId(null);
    setHasUnsavedChanges(true);
    pushHistory(pages, drawings, nextImages);
    triggerAutoSave({ overrideImages: nextImages });
  };

  const renderShapeElement = (d: DrawingElement) => {
    const isSel = selectedDrawingId === d.id;
    const isEdit = isSel && isEditingShape;
    const dash =
      d.lineStyle === 'dashed'
        ? '6,4'
        : d.lineStyle === 'dotted'
        ? '2,3'
        : undefined;
    const fill =
      d.fillColor && d.fillColor !== 'transparent'
        ? d.fillColor
        : 'transparent';
    const x = Math.min(d.x1, d.x2);
    const y = Math.min(d.y1, d.y2);
    const w = Math.max(4, Math.abs(d.x2 - d.x1));
    const h = Math.max(4, Math.abs(d.y2 - d.y1));

    return (
      <g
        key={d.id}
        style={{
          pointerEvents: 'all',
          cursor: isEdit ? 'crosshair' : 'move',
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDrawingId(d.id);
          setSelectedImageId(null);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setSelectedDrawingId(d.id);
          setSelectedImageId(null);
          setIsEditingShape(true);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setSelectedDrawingId(d.id);
          setSelectedImageId(null);
          const pageEl = e.currentTarget.ownerSVGElement?.parentElement;
          if (!pageEl) return;
          const coords = getPageRelativeCoords(pageEl, e);
          setDragState({
            targetKind: 'shape',
            mode: 'move',
            id: d.id,
            pageIdx: d.pageIndex,
            startX: coords.x,
            startY: coords.y,
            origX1: d.x1,
            origY1: d.y1,
            origX2: d.x2,
            origY2: d.y2,
          });
        }}
      >
        {(d.type === 'rect' || d.type === 'square') && (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={fill}
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
            fill={fill}
            stroke={d.strokeColor}
            strokeWidth={d.strokeWidth}
            strokeDasharray={dash}
          />
        )}

        {d.type === 'triangle' && (
          <polygon
            points={`${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`}
            fill={fill}
            stroke={d.strokeColor}
            strokeWidth={d.strokeWidth}
            strokeDasharray={dash}
          />
        )}

        {d.type === 'diamond' && (
          <polygon
            points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${
              y + h
            } ${x},${y + h / 2}`}
            fill={fill}
            stroke={d.strokeColor}
            strokeWidth={d.strokeWidth}
            strokeDasharray={dash}
          />
        )}

        {d.type === 'freehand' && d.points && d.points.length > 1 && (
          <path
            d={d.points
              .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
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
            strokeWidth={Math.max(3, d.strokeWidth)}
            strokeDasharray={dash}
            markerEnd={
              d.type === 'arrow' ? `url(#arrow-${d.pageIndex})` : undefined
            }
          />
        )}

        {isSel && (
          <>
            <circle
              cx={d.x1}
              cy={d.y1}
              r={6}
              fill="#FFFFFF"
              stroke="#1447E6"
              strokeWidth={2}
              style={{ cursor: 'nwse-resize' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const pageEl =
                  e.currentTarget.ownerSVGElement?.parentElement;
                if (!pageEl) return;
                const coords = getPageRelativeCoords(pageEl, e);
                setDragState({
                  targetKind: 'shape',
                  mode: 'resize-nw',
                  id: d.id,
                  pageIdx: d.pageIndex,
                  startX: coords.x,
                  startY: coords.y,
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
              r={6}
              fill="#FFFFFF"
              stroke="#1447E6"
              strokeWidth={2}
              style={{ cursor: 'nwse-resize' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const pageEl =
                  e.currentTarget.ownerSVGElement?.parentElement;
                if (!pageEl) return;
                const coords = getPageRelativeCoords(pageEl, e);
                setDragState({
                  targetKind: 'shape',
                  mode: 'resize-se',
                  id: d.id,
                  pageIdx: d.pageIndex,
                  startX: coords.x,
                  startY: coords.y,
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
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg-ivory)',
      }}
    >
      {/* Hidden File Input for Toolbar Image Upload (Requirement 10) */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelect}
        style={{ display: 'none' }}
      />
      {/* Hidden File Input for Device Camera Capture (Requirement 8) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageFileSelect}
        style={{ display: 'none' }}
      />

      {/* =====================================================================
          TOP WORKSPACE HEADER (Includes Local File Save per Requirement 14)
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
            onClick={handleBackSafely}
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

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
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
              maxWidth: '340px',
              width: '100%',
              textOverflow: 'ellipsis',
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = 'var(--border-stone)')
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            title="Edit document title"
          />

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

          {/* Section 11 & 12: Persistent Workspace Header AI Credit Indicator & Popover */}
          {(() => {
            const usageStatus = billingManager.getUsageStatus();
            return (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowCreditPopover((v) => !v)}
                  className="btn-ed-subtle"
                  style={{
                    height: '28px',
                    padding: '0 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border:
                      usageStatus.status === 'exhausted'
                        ? '1px solid #DC2626'
                        : usageStatus.status === 'critical_warning'
                        ? '1px solid #EA580C'
                        : '1px solid var(--border-stone)',
                    backgroundColor:
                      usageStatus.status === 'exhausted'
                        ? '#FEF2F2'
                        : 'transparent',
                  }}
                  title="Click to view AI Credit Wallet & Plans"
                >
                  <Coins
                    size={12}
                    color={
                      usageStatus.status === 'exhausted'
                        ? '#DC2626'
                        : 'var(--accent-blue)'
                    }
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color:
                        usageStatus.status === 'exhausted'
                          ? '#DC2626'
                          : 'var(--ink-navy)',
                    }}
                  >
                    {wallet.availableCredits.toLocaleString()} /{' '}
                    {wallet.totalAllocatedCredits.toLocaleString()} cr
                  </span>

                  {/* Micro Progress Bar */}
                  <span
                    className="hide-on-mobile"
                    style={{
                      width: '30px',
                      height: '4px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      display: 'inline-block',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: `${Math.min(100, (wallet.consumedCredits / Math.max(1, wallet.totalAllocatedCredits)) * 100)}%`,
                        height: '100%',
                        backgroundColor:
                          usageStatus.status === 'exhausted'
                            ? '#DC2626'
                            : usageStatus.status === 'critical_warning'
                            ? '#EA580C'
                            : 'var(--accent-blue)',
                      }}
                    />
                  </span>
                </button>

                {/* Interactive Credit Popover */}
                {showCreditPopover && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '34px',
                      left: '0',
                      width: '290px',
                      backgroundColor: 'var(--bg-ivory)',
                      border: '1px solid var(--border-stone)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
                      padding: '16px',
                      zIndex: 9999,
                      fontSize: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <strong style={{ color: 'var(--ink-navy)' }}>AI Credit Wallet</strong>
                      <button
                        type="button"
                        onClick={() => setShowCreditPopover(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-stone)',
                        borderRadius: '2px',
                        marginBottom: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>Current Plan:</span>
                        <strong>
                          {SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId)?.name || 'Standard Pro'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>Renewal:</span>
                        <span>{wallet.renewalDate}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>• Subscription Credits:</span>
                        <strong>{wallet.breakdown.subscription.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>• Top-Up Credits:</span>
                        <strong>{wallet.breakdown.purchased.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>• Promotional:</span>
                        <strong>{wallet.breakdown.promotional.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreditPopover(false);
                          setShowTopUpModal(true);
                        }}
                        className="btn-ed-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '6px', fontSize: '11px' }}
                      >
                        <Coins size={12} />
                        <span>Buy Top-Up Credits</span>
                      </button>
                      {onNavigateSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreditPopover(false);
                            onNavigateSettings();
                          }}
                          className="btn-ed-outline"
                          style={{ width: '100%', justifyContent: 'center', padding: '6px', fontSize: '11px' }}
                        >
                          <CreditCard size={12} />
                          <span>Manage Plans &amp; Billing</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Actions: Undo/Redo, Save File to Computer, Open File, Export, AI Assistant */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {/* Requirement 11: Unified Undo and Redo Controls */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleUndo}
            disabled={!canUndo}
            className="btn-ed-subtle"
            style={{
              height: '32px',
              padding: '0 8px',
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'default',
            }}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRedo}
            disabled={!canRedo}
            className="btn-ed-subtle"
            style={{
              height: '32px',
              padding: '0 8px',
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'default',
            }}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>

          {/* Requirement 14: Save Individual File to Computer */}
          {onSaveToComputer && (
            <button
              onClick={() =>
                onSaveToComputer({
                  ...doc,
                  title,
                  content: getCombinedCleanHtml(),
                  metadata: {
                    ...doc.metadata,
                    layout,
                    drawings,
                    images: canvasImages,
                    pageGroups,
                    pages,
                  },
                })
              }
              className="btn-ed-subtle"
              style={{ height: '32px', padding: '0 10px' }}
              title="Save document as an individual file on your computer"
            >
              <HardDriveDownload size={13} color="var(--accent-blue)" />
              <span className="hide-on-mobile">Save File</span>
            </button>
          )}

          {/* Requirement 10: Export Dropdown with Scope (Entire Doc, Individual Group, or Specific Page) and Formats */}
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
                  position: 'fixed',
                  top: '52px',
                  right: '96px',
                  width: '240px',
                  backgroundColor: 'var(--bg-ivory)',
                  border: '1px solid var(--border-stone)',
                  boxShadow: '0 10px 28px rgba(10, 25, 78, 0.18)',
                  zIndex: 250,
                  padding: '12px',
                }}
              >
                <div
                  className="mono-label"
                  style={{
                    fontSize: '9px',
                    marginBottom: '6px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  1. Export Scope
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExportScope('document')}
                    className={
                      exportScope === 'document'
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}
                  >
                    Entire Doc
                  </button>
                  {pageGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setExportScope('group');
                        if (!exportGroupId && pageGroups[0]) {
                          setExportGroupId(pageGroups[0].id);
                        }
                      }}
                      className={
                        exportScope === 'group'
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}
                    >
                      Group
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExportScope('page')}
                    className={
                      exportScope === 'page'
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}
                  >
                    Page
                  </button>
                </div>

                {exportScope === 'group' && pageGroups.length > 0 && (
                  <select
                    value={exportGroupId || pageGroups[0]?.id}
                    onChange={(e) => setExportGroupId(e.target.value)}
                    className="ed-select"
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      marginBottom: '8px',
                    }}
                  >
                    {pageGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}

                {exportScope === 'page' && (
                  <select
                    value={exportPageIdx}
                    onChange={(e) =>
                      setExportPageIdx(parseInt(e.target.value, 10))
                    }
                    className="ed-select"
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      marginBottom: '8px',
                    }}
                  >
                    {pages.map((_, i) => (
                      <option key={i} value={i}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                )}

                <div
                  className="mono-label"
                  style={{
                    fontSize: '9px',
                    marginBottom: '6px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  2. Choose Format
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportDocx(
                        {
                          ...doc,
                          title,
                          content: getCombinedCleanHtml(),
                          metadata: {
                            ...doc.metadata,
                            layout,
                            drawings,
                            images: canvasImages,
                            pageGroups,
                            pages,
                          },
                        },
                        {
                          scope: exportScope,
                          groupId:
                            exportScope === 'group'
                              ? exportGroupId || pageGroups[0]?.id
                              : undefined,
                          pageIndex:
                            exportScope === 'page' ? exportPageIdx : undefined,
                        }
                      );
                    }}
                    className="btn-ed-subtle"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '6px 10px',
                      fontSize: '11px',
                      textAlign: 'left',
                    }}
                  >
                    Word Document (.DOCX)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportPdf(
                        {
                          ...doc,
                          title,
                          content: getCombinedCleanHtml(),
                          metadata: {
                            ...doc.metadata,
                            layout,
                            drawings,
                            images: canvasImages,
                            pageGroups,
                            pages,
                          },
                        },
                        {
                          scope: exportScope,
                          groupId:
                            exportScope === 'group'
                              ? exportGroupId || pageGroups[0]?.id
                              : undefined,
                          pageIndex:
                            exportScope === 'page' ? exportPageIdx : undefined,
                        }
                      );
                    }}
                    className="btn-ed-subtle"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '6px 10px',
                      fontSize: '11px',
                      textAlign: 'left',
                    }}
                  >
                    PDF Document (.PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportTxt(
                        {
                          ...doc,
                          title,
                          content: getCombinedCleanHtml(),
                          metadata: {
                            ...doc.metadata,
                            layout,
                            drawings,
                            images: canvasImages,
                            pageGroups,
                            pages,
                          },
                        },
                        {
                          scope: exportScope,
                          groupId:
                            exportScope === 'group'
                              ? exportGroupId || pageGroups[0]?.id
                              : undefined,
                          pageIndex:
                            exportScope === 'page' ? exportPageIdx : undefined,
                        }
                      );
                    }}
                    className="btn-ed-subtle"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '6px 10px',
                      fontSize: '11px',
                      textAlign: 'left',
                    }}
                  >
                    Plain Text (.TXT)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Requirement: Dedicated Workspace Print with Scope Selection (Entire Doc, Group, or Page) */}
          <div ref={printMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPrintMenu((prev) => !prev)}
              className="btn-ed-outline"
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '10px',
                backgroundColor: showPrintMenu ? 'var(--bg-stone)' : 'transparent',
              }}
              title="Print document with scope selection"
            >
              <Printer size={13} color="var(--accent-blue)" />
              <span className="hide-on-mobile">Print</span>
              <ChevronDown size={11} />
            </button>

            {showPrintMenu && (
              <div
                style={{
                  position: 'fixed',
                  top: '52px',
                  right: '96px',
                  width: '240px',
                  backgroundColor: 'var(--bg-ivory)',
                  border: '1px solid var(--border-stone)',
                  boxShadow: '0 10px 28px rgba(10, 25, 78, 0.18)',
                  zIndex: 250,
                  padding: '12px',
                }}
              >
                <div
                  className="mono-label"
                  style={{
                    fontSize: '9px',
                    marginBottom: '6px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  1. Print Scope
                </div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPrintScope('document')}
                    className={
                      printScope === 'document'
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}
                  >
                    Entire Doc
                  </button>
                  {pageGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrintScope('group');
                        if (!printGroupId && pageGroups[0]) {
                          setPrintGroupId(pageGroups[0].id);
                        }
                      }}
                      className={
                        printScope === 'group'
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}
                    >
                      Group
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrintScope('page')}
                    className={
                      printScope === 'page' ? 'btn-ed-primary' : 'btn-ed-subtle'
                    }
                    style={{ flex: 1, padding: '4px 6px', fontSize: '9px' }}
                  >
                    Page
                  </button>
                </div>

                {printScope === 'group' && pageGroups.length > 0 && (
                  <select
                    value={printGroupId || pageGroups[0]?.id}
                    onChange={(e) => setPrintGroupId(e.target.value)}
                    className="ed-select"
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      marginBottom: '8px',
                      width: '100%',
                    }}
                  >
                    {pageGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}

                {printScope === 'page' && (
                  <select
                    value={printPageIdx}
                    onChange={(e) =>
                      setPrintPageIdx(parseInt(e.target.value, 10))
                    }
                    className="ed-select"
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      marginBottom: '8px',
                      width: '100%',
                    }}
                  >
                    {pages.map((_, i) => (
                      <option key={i} value={i}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                )}

                <div
                  className="mono-label"
                  style={{
                    fontSize: '9px',
                    marginBottom: '8px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  Layout: {layout.orientation === 'landscape' ? 'Landscape' : 'Portrait'} ({layout.pageSize})
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintWorkspace()}
                  className="btn-ed-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '7px 10px',
                    fontSize: '11px',
                    gap: '6px',
                  }}
                >
                  <Printer size={13} />
                  <span>
                    {printScope === 'page'
                      ? `Print Page ${printPageIdx + 1}`
                      : printScope === 'group'
                      ? 'Print Selected Group'
                      : 'Print Entire Document'}
                  </span>
                </button>
              </div>
            )}
          </div>

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

      {/* Section 12: AI Credit Exhaustion / Critical Warning Banner */}
      {(() => {
        const usageStatus = billingManager.getUsageStatus();
        if (usageStatus.status === 'exhausted') {
          return (
            <div
              className="no-print"
              style={{
                backgroundColor: '#FEF2F2',
                borderBottom: '1px solid #FCA5A5',
                padding: '8px 18px',
                fontSize: '12px',
                color: '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} color="#DC2626" />
                <span>
                  <strong>AI Credit Limit Reached:</strong> Manual document typing, editing, formatting, and file exports remain 100% active. Upgrade your plan or add credits to re-enable AI assistance.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="btn-ed-primary"
                style={{ padding: '3px 10px', fontSize: '11px', height: '24px' }}
              >
                Buy Credits
              </button>
            </div>
          );
        }
        if (usageStatus.status === 'critical_warning') {
          return (
            <div
              className="no-print"
              style={{
                backgroundColor: '#FFFBEB',
                borderBottom: '1px solid #FCD34D',
                padding: '6px 18px',
                fontSize: '11.5px',
                color: '#92400E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} color="#D97706" />
                <span>
                  <strong>Low Credit Warning:</strong> Over 95% of your AI credit balance has been consumed ({wallet.availableCredits.toLocaleString()} credits remaining).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="btn-ed-outline"
                style={{ padding: '2px 8px', fontSize: '10.5px', height: '22px' }}
              >
                Top Up Now
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* =====================================================================
          FORMATTING & INSERTION TOOLBAR
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
        <select
          value={selectedFontFamily}
          onChange={(e) => {
            handleApplyFontFamily(e.target.value);
            triggerAutoSave({
              overrideMeta: { fontFamily: e.target.value },
            });
          }}
          className="ed-select"
          style={{ width: '132px', padding: '4px 7px', fontSize: '12px' }}
        >
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Calibri">Calibri</option>
        </select>

        <select
          value={currentHeading}
          onChange={(e) => execFormat('formatBlock', e.target.value)}
          className="ed-select"
          style={{ width: '108px', padding: '4px 7px', fontSize: '12px' }}
        >
          <option value="P">Normal</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
        </select>

        <select
          value={selectedFontSize}
          onMouseDown={() => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
              savedRangeRef.current = sel.getRangeAt(0).cloneRange();
            }
          }}
          onChange={(e) => handleApplyFontSize(e.target.value)}
          className="ed-select"
          style={{ width: '74px', padding: '4px 6px', fontSize: '12px' }}
          title="Font Size"
        >
          {![
            '9px',
            '10px',
            '11px',
            '12px',
            '13px',
            '14px',
            '16px',
            '18px',
            '20px',
            '22px',
            '24px',
            '28px',
            '32px',
            '36px',
            '48px',
          ].includes(selectedFontSize) && (
            <option value={selectedFontSize}>{selectedFontSize}</option>
          )}
          <option value="9px">9 px</option>
          <option value="10px">10 px</option>
          <option value="11px">11 px</option>
          <option value="12px">12 px</option>
          <option value="13px">13 px</option>
          <option value="14px">14 px</option>
          <option value="16px">16 px</option>
          <option value="18px">18 px</option>
          <option value="20px">20 px</option>
          <option value="22px">22 px</option>
          <option value="24px">24 px</option>
          <option value="28px">28 px</option>
          <option value="32px">32 px</option>
          <option value="36px">36 px</option>
          <option value="48px">48 px</option>
        </select>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('bold')}
          className="btn-ed-subtle"
          style={{ padding: '5px 8px' }}
          title="Bold"
        >
          <Bold size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('italic')}
          className="btn-ed-subtle"
          style={{ padding: '5px 8px' }}
          title="Italic"
        >
          <Italic size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('underline')}
          className="btn-ed-subtle"
          style={{ padding: '5px 8px' }}
          title="Underline"
        >
          <Underline size={13} />
        </button>

        <label
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', cursor: 'pointer' }}
          title="Text Colour (applies to selected text)"
        >
          <span style={{ fontSize: '11px', fontWeight: 700 }}>A</span>
          <input
            type="color"
            defaultValue="#0A194E"
            onChange={(e) => applyInlineStyleToSelection('color', e.target.value)}
            style={{ width: '13px', height: '13px', border: 'none', padding: 0 }}
          />
        </label>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyLeft')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
        >
          <AlignLeft size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyCenter')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
        >
          <AlignCenter size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyRight')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
        >
          <AlignRight size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('justifyFull')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
        >
          <AlignJustify size={13} />
        </button>

        <select
          value={lineSpacing}
          onChange={(e) => setLineSpacing(e.target.value)}
          className="ed-select"
          style={{ width: '74px', padding: '4px 5px', fontSize: '11.5px' }}
        >
          <option value="1.4">1.15x</option>
          <option value="1.75">1.5x</option>
          <option value="2.1">2.0x</option>
        </select>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('insertUnorderedList')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
        >
          <List size={13} />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('insertOrderedList')}
          className="btn-ed-subtle"
          style={{ padding: '5px 7px' }}
        >
          <ListOrdered size={13} />
        </button>

        {/* Requirement 13: Table Button (Opens fixed overlay above workspace, never clipped!) */}
        <button
          ref={tableBtnRef}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShapeMenuPos(null);
            if (tableMenuPos) {
              setTableMenuPos(null);
            } else if (tableBtnRef.current) {
              const r = tableBtnRef.current.getBoundingClientRect();
              setTableMenuPos({
                top: r.bottom + 6,
                left: Math.min(r.left, window.innerWidth - 240),
              });
            }
          }}
          className="btn-ed-subtle"
          style={{
            padding: '5px 9px',
            backgroundColor: tableMenuPos ? 'var(--bg-stone)' : 'transparent',
          }}
        >
          <Table size={13} />
          <span>Table</span>
          <ChevronDown size={11} />
        </button>

        {/* Requirement 8: Image & Camera Upload Options */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            setTableMenuPos(null);
            setShapeMenuPos(null);
            if (imageMenuPos) {
              setImageMenuPos(null);
            } else {
              const r = e.currentTarget.getBoundingClientRect();
              setImageMenuPos({
                top: r.bottom + 6,
                left: Math.min(r.left, window.innerWidth - 220),
              });
            }
          }}
          className="btn-ed-subtle nc-image-dropdown-btn"
          style={{
            padding: '5px 9px',
            backgroundColor: imageMenuPos
              ? 'var(--bg-stone)'
              : 'transparent',
            gap: '4px',
          }}
          title="Insert Image from Device or Camera"
        >
          <ImageIcon size={13} color="var(--accent-blue)" />
          <span>Image</span>
          <ChevronDown size={11} />
        </button>

        {/* Requirement 11 & 13: Shape Dropdown Overlay Button */}
        <button
          ref={shapeBtnRef}
          onClick={() => {
            setTableMenuPos(null);
            if (shapeMenuPos) {
              setShapeMenuPos(null);
            } else if (shapeBtnRef.current) {
              const r = shapeBtnRef.current.getBoundingClientRect();
              setShapeMenuPos({
                top: r.bottom + 6,
                left: Math.min(r.left, window.innerWidth - 220),
              });
            }
          }}
          className={
            activeShapeTool !== 'select' ? 'btn-ed-primary' : 'btn-ed-subtle'
          }
          style={{ padding: '5px 9px' }}
          title="Select a shape and draw anywhere on the page"
        >
          <PenTool size={13} />
          <span>
            {activeShapeTool === 'select'
              ? 'Shapes'
              : `Drawing: ${activeShapeTool}`}
          </span>
          <ChevronDown size={11} />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertPageBreak}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
        >
          <SeparatorHorizontal size={13} />
          <span>Page Break</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddBlankPage}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
        >
          <FilePlus2 size={13} color="var(--accent-blue)" />
          <span>Add Page</span>
        </button>

        <button
          onClick={() => setShowGroupsSidebar((prev) => !prev)}
          className="btn-ed-subtle"
          style={{
            padding: '5px 9px',
            backgroundColor: showGroupsSidebar
              ? 'var(--bg-stone)'
              : 'transparent',
          }}
        >
          <Layers size={13} color="var(--accent-blue)" />
          <span>Group Pages ({pageGroups.length})</span>
        </button>

        <button
          onClick={() => setShowLayoutModal(true)}
          className="btn-ed-subtle"
          style={{ padding: '5px 9px' }}
        >
          <LayoutTemplate size={13} color="var(--accent-blue)" />
          <span>Page Layout</span>
        </button>
      </div>

      {/* =====================================================================
          REQUIREMENT 13: FIXED OVERLAY DROPDOWN FOR TABLE INSERTION
      ===================================================================== */}
      {tableMenuPos && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: `${tableMenuPos.top}px`,
            left: `${tableMenuPos.left}px`,
            width: '230px',
            backgroundColor: 'var(--bg-ivory)',
            border: '1px solid var(--border-stone)',
            boxShadow: '0 12px 28px rgba(10, 25, 78, 0.2)',
            padding: '12px',
            zIndex: 260,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span className="ed-field-label" style={{ marginBottom: 0 }}>
              Insert Table ({newTableRows} × {newTableCols})
            </span>
            <button
              onClick={() => setTableMenuPos(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
              }}
            >
              <X size={13} />
            </button>
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

      {/* =====================================================================
          REQUIREMENT 11 & 13: FIXED OVERLAY DROPDOWN FOR SHAPES
      ===================================================================== */}
      {shapeMenuPos && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: `${shapeMenuPos.top}px`,
            left: `${shapeMenuPos.left}px`,
            width: '215px',
            backgroundColor: 'var(--bg-ivory)',
            border: '1px solid var(--border-stone)',
            boxShadow: '0 12px 28px rgba(10, 25, 78, 0.2)',
            zIndex: 260,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-ivory)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="mono-label" style={{ fontSize: '9.5px' }}>
              Select Shape to Draw
            </span>
            <button
              onClick={() => setShapeMenuPos(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
              }}
            >
              <X size={12} />
            </button>
          </div>
          {SHAPE_OPTIONS.map((sh) => (
            <button
              key={sh.type}
              onClick={() => {
                setActiveShapeTool(sh.type);
                setShapeMenuPos(null);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                border: 'none',
                borderBottom: '1px solid var(--border-ivory)',
                backgroundColor:
                  activeShapeTool === sh.type
                    ? 'var(--bg-stone)'
                    : 'transparent',
                color: 'var(--ink-navy)',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{sh.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>
                Draw
              </span>
            </button>
          ))}
          {activeShapeTool !== 'select' && (
            <button
              onClick={() => {
                setActiveShapeTool('select');
                setShapeMenuPos(null);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'var(--bg-stone)',
                color: 'var(--accent-terracotta)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel Drawing Mode
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          FLOATING OVERLAY DROPDOWN FOR IMAGE INSERTION
      ===================================================================== */}
      {imageMenuPos && (
        <div
          className="no-print nc-image-dropdown-menu"
          style={{
            position: 'fixed',
            top: `${imageMenuPos.top}px`,
            left: `${imageMenuPos.left}px`,
            width: '210px',
            backgroundColor: 'var(--bg-ivory)',
            border: '1px solid var(--border-stone)',
            boxShadow: '0 12px 28px rgba(10, 25, 78, 0.2)',
            zIndex: 260,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setImageMenuPos(null);
              imageInputRef.current?.click();
            }}
            className="btn-ed-subtle"
            style={{
              justifyContent: 'flex-start',
              padding: '7px 10px',
              fontSize: '11.5px',
              gap: '8px',
              width: '100%',
            }}
          >
            <HardDrive size={13} color="var(--accent-blue)" />
            <span>Upload from Device</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImageMenuPos(null);
              startLiveCamera();
            }}
            className="btn-ed-subtle"
            style={{
              justifyContent: 'flex-start',
              padding: '7px 10px',
              fontSize: '11.5px',
              gap: '8px',
              width: '100%',
            }}
          >
            <Camera size={13} color="var(--accent-blue)" />
            <span>Take Photo with Camera</span>
          </button>
        </div>
      )}

      {/* =====================================================================
          REQUIREMENT 10 & 12: SHAPE & IMAGE EDITING + LAYER POSITIONING BAR
      ===================================================================== */}
      <ElementLayerToolbar
        selectedDrawing={selectedDrawingObj}
        selectedImage={selectedImageObj}
        onUpdateDrawing={(upd) => {
          const next = drawings.map((d) =>
            d.id === selectedDrawingId ? { ...d, ...upd } : d
          );
          setDrawings(next);
          triggerAutoSave({ overrideDrawings: next });
        }}
        onUpdateImage={(upd) => {
          const next = canvasImages.map((im) =>
            im.id === selectedImageId ? { ...im, ...upd } : im
          );
          setCanvasImages(next);
          triggerAutoSave({ overrideImages: next });
        }}
        onLayerAction={handleLayerAction}
        onDelete={() => {
          if (selectedDrawingId) {
            const next = drawings.filter((d) => d.id !== selectedDrawingId);
            setDrawings(next);
            setSelectedDrawingId(null);
            triggerAutoSave({ overrideDrawings: next });
          } else if (selectedImageId) {
            const next = canvasImages.filter((im) => im.id !== selectedImageId);
            setCanvasImages(next);
            setSelectedImageId(null);
            triggerAutoSave({ overrideImages: next });
          }
        }}
        onClose={() => {
          setSelectedDrawingId(null);
          setSelectedImageId(null);
        }}
      />

      {/* =====================================================================
          REQUIREMENT 13: CONTEXTUAL TABLE CONTROLS BAR & TOP-RIGHT FLOATING PILL
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
            Table Controls (or drag cell borders directly):
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
            onClick={() => modifyActiveTable('table-wider')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            Table Wider +
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('table-narrower')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            Table Narrower -
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('row-up')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            <ArrowUp size={11} /> Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('row-down')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            <ArrowDown size={11} /> Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('col-left')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            <ArrowLeftIcon size={11} /> Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('col-right')}
            className="btn-ed-subtle"
            style={{ backgroundColor: 'var(--bg-ivory)', padding: '4px 7px' }}
          >
            <ArrowRightIcon size={11} /> Col
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

      {/* Top-Right Floating Quick Table Controls when inside a Table (Requirement 13) */}
      {isInsideTable && activeTableRect && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: `${Math.max(96, activeTableRect.top - 32)}px`,
            left: `${Math.min(
              window.innerWidth - 220,
              activeTableRect.left + activeTableRect.width - 205
            )}px`,
            zIndex: 130,
            backgroundColor: 'var(--bg-ivory)',
            border: '1px solid var(--accent-blue)',
            boxShadow: '0 4px 14px rgba(10, 25, 78, 0.16)',
            display: 'flex',
            gap: '4px',
            padding: '3px 5px',
          }}
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('add-col-right')}
            className="btn-ed-subtle"
            style={{ padding: '2px 6px', fontSize: '9px' }}
          >
            + Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('add-row-below')}
            className="btn-ed-subtle"
            style={{ padding: '2px 6px', fontSize: '9px' }}
          >
            + Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('del-col')}
            className="btn-ed-subtle"
            style={{
              padding: '2px 6px',
              fontSize: '9px',
              color: 'var(--accent-terracotta)',
            }}
          >
            - Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => modifyActiveTable('del-row')}
            className="btn-ed-subtle"
            style={{
              padding: '2px 6px',
              fontSize: '9px',
              color: 'var(--accent-terracotta)',
            }}
          >
            - Row
          </button>
        </div>
      )}

      {/* =====================================================================
          REQUIREMENT 4: FLOATING TEXT-LEVEL AI ICON & SEPARATE POP-UP
      ===================================================================== */}
      {highlightedText && highlightBadgePos && (
        <TextSelectionAIPopup
          selectedText={highlightedText}
          badgePosition={highlightBadgePos}
          isOpen={showTextAiPopup}
          onOpenPopup={handleOpenTextAiPopup}
          onClose={handleCloseTextAiPopup}
          onSubmitTextAI={handleExecuteTextLevelAI}
        />
      )}

      {/* =====================================================================
          MAIN WORKSPACE BODY: [LEFT PAGE GROUPS] + [CENTER PAGES] + [RIGHT AI]
      ===================================================================== */}
      <div className="nc-workspace-body">
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

                {pageGroups.map((grp) => {
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
                                >
                                  P.{pIdx + 1}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => {
                              setMainAiScope('group');
                              setAiTargetGroupId(grp.id);
                              setAiGroupPageSelection('all');
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
                            Select in Main AI Assistant
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* ===================================================================
            MULTI-PAGE DOCUMENT EDITOR CANVAS
        =================================================================== */}
        <div
          className="doc-workspace-canvas-wrap"
          style={{ flex: 1 }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest('g') &&
              !target.closest('.canvas-image-wrap') &&
              !target.closest('.nc-element-layer-toolbar')
            ) {
              setSelectedDrawingId(null);
              setSelectedImageId(null);
              setIsEditingShape(false);
            }
          }}
        >
          {pages.map((_, pageIdx) => {
            const dim = getPageDimensions(pageIdx);
            const belongingGroups = pageGroups.filter((g) =>
              g.pageIndices.includes(pageIdx)
            );
            const pageDrawings = drawings.filter(
              (d) => d.pageIndex === pageIdx
            );
            const pageImages = canvasImages.filter(
              (im) => im.pageIndex === pageIdx
            );

            return (
              <div
                key={pageIdx}
                className={`doc-a4-page ${
                  isAiLoading && activePageIdxRef.current === pageIdx
                    ? 'nc-ai-shimmer'
                    : ''
                }`}
                data-page-index={pageIdx}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    !target.closest('g') &&
                    !target.closest('.canvas-image-wrap') &&
                    !target.closest('.nc-element-layer-toolbar')
                  ) {
                    setSelectedDrawingId(null);
                    setSelectedImageId(null);
                    setIsEditingShape(false);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handlePageDrop(pageIdx, e)}
                onMouseMove={(e) => handleCanvasPointerMove(pageIdx, e)}
                onMouseUp={handleCanvasPointerUp}
                onTouchMove={(e) => handleCanvasPointerMove(pageIdx, e)}
                onTouchEnd={handleCanvasPointerUp}
                style={{
                  width: `${dim.widthPx}px`,
                  minHeight: `${dim.heightPx}px`,
                  padding: `${dim.padTopPx}px ${dim.padRightPx}px ${dim.padBottomPx}px ${dim.padLeftPx}px`,
                  backgroundColor: layout.pageBackground || '#FFFFFF',
                  border: '1px solid var(--border-stone)',
                  position: 'relative',
                  fontFamily: `"${
                    doc.metadata.fontFamily || 'Times New Roman'
                  }", Georgia, serif`,
                }}
              >
                {/* Section 9: Decorative Page Frame Overlay (Non-destructive, applies to margins) */}
                {(() => {
                  const secBorder = layout.sectionBorders?.[pageIdx];
                  const frameStyle: PageFrameStyleId =
                    secBorder?.frameStyle || (layout as any).frameStyle || 'none';
                  const borderWidthPx = secBorder ? secBorder.borderWidthPx : layout.borderWidthPx || 2;
                  const borderColor = secBorder ? secBorder.borderColor : layout.borderColor || '#1E293B';
                  const borderInsetMm = secBorder?.borderInsetMm ?? layout.borderInsetMm ?? 10;
                  const borderStyle = secBorder ? secBorder.borderStyle : layout.borderStyle;

                  // Render SVG / CSS frame overlay if frameStyle is set
                  if (frameStyle && frameStyle !== 'none') {
                    return (
                      <PageFrameOverlay
                        frameStyle={frameStyle}
                        borderColor={borderColor}
                        borderWidthPx={borderWidthPx}
                        insetMm={borderInsetMm}
                      />
                    );
                  }

                  // Fallback for basic borders if borderStyle is not 'none'
                  if (borderStyle && borderStyle !== 'none') {
                    const borderInsetPx = Math.round(borderInsetMm * 3.7795);
                    return (
                      <div
                        className="doc-page-decorative-border"
                        style={{
                          position: 'absolute',
                          top: `${borderInsetPx}px`,
                          left: `${borderInsetPx}px`,
                          right: `${borderInsetPx}px`,
                          bottom: `${borderInsetPx}px`,
                          border: `${borderWidthPx}px ${borderStyle} ${borderColor}`,
                          pointerEvents: 'none',
                          zIndex: 2,
                        }}
                      />
                    );
                  }

                  return null;
                })()}

                {/* Page Running Header + Dedicated Page-Level AI Icon (Requirement 5) */}
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
                    position: 'relative',
                    zIndex: 25,
                  }}
                >
                  <span>
                    {doc.metadata.headerText || title.slice(0, 44).toUpperCase()}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Section 9: Page Frame Selector Button (Replaces Cover Page per Specification) */}
                    <button
                      type="button"
                      className="no-print btn-ed-subtle"
                      onClick={() => {
                        setFrameTargetPageIndex(pageIdx);
                        setShowFrameModal(true);
                      }}
                      style={{
                        padding: '1px 7px',
                        fontSize: '8.5px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Apply decorative frame to page margins without modifying page content"
                    >
                      <span>🖼️</span>
                      <span>Page Frame</span>
                    </button>

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

                    {/* Requirement 5: Dedicated Page-Level AI Editing Button at the Top of Every Page */}
                    <button
                      type="button"
                      className="no-print"
                      onClick={() =>
                        setActivePageAiIdx((prev) =>
                          prev === pageIdx ? null : pageIdx
                        )
                      }
                      title={`Open AI Editor for Page ${pageIdx + 1}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        backgroundColor:
                          activePageAiIdx === pageIdx ? '#1447E6' : '#EEF2FF',
                        color:
                          activePageAiIdx === pageIdx ? '#FFFFFF' : '#1447E6',
                        border: '1px solid #1447E6',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={11} />
                      <span>Page {pageIdx + 1} AI</span>
                    </button>

                    <span>Page {pageIdx + 1}</span>
                  </div>
                </div>

                {/* Requirement 5: Dedicated Page-Level AI Interface when clicked */}
                {activePageAiIdx === pageIdx && (
                  <PageLevelAIPopover
                    pageIndex={pageIdx}
                    onClose={() => setActivePageAiIdx(null)}
                    onApplyPageAI={handleExecutePageLevelAI}
                  />
                )}

                {/* Requirement 10: Movable & Resizable Canvas Images on this Page */}
                {pageImages.map((img) => {
                  const isSel = selectedImageId === img.id;
                  return (
                    <div
                      key={img.id}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedImageId(img.id);
                        setSelectedDrawingId(null);
                        const pageEl = e.currentTarget.parentElement;
                        if (!pageEl) return;
                        const { x, y } = getPageRelativeCoords(pageEl, e);
                        setDragState({
                          targetKind: 'image',
                          mode: 'move',
                          id: img.id,
                          pageIdx,
                          startX: x,
                          startY: y,
                          origX1: img.x,
                          origY1: img.y,
                          origX2: img.x + img.width,
                          origY2: img.y + img.height,
                          aspectRatio: img.aspectRatio,
                        });
                      }}
                      style={{
                        position: 'absolute',
                        left: `${img.x}px`,
                        top: `${img.y}px`,
                        width: `${img.width}px`,
                        height: `${img.height}px`,
                        zIndex: img.zIndex ?? 12,
                        border: isSel
                          ? '2px solid #1447E6'
                          : '1px solid transparent',
                        cursor: 'move',
                        userSelect: 'none',
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.caption || 'Document Figure'}
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          pointerEvents: 'none',
                          imageRendering: 'auto',
                        }}
                      />

                      {/* 8 Resize Handles: Corners (maintain aspect ratio) + Sides (proportional) */}
                      {isSel &&
                        (
                          [
                            ['resize-nw', { top: -5, left: -5, cursor: 'nwse-resize' }],
                            ['resize-ne', { top: -5, right: -5, cursor: 'nesw-resize' }],
                            ['resize-sw', { bottom: -5, left: -5, cursor: 'nesw-resize' }],
                            ['resize-se', { bottom: -5, right: -5, cursor: 'nwse-resize' }],
                            ['resize-n', { top: -5, left: 'calc(50% - 5px)', cursor: 'ns-resize' }],
                            ['resize-s', { bottom: -5, left: 'calc(50% - 5px)', cursor: 'ns-resize' }],
                            ['resize-w', { top: 'calc(50% - 5px)', left: -5, cursor: 'ew-resize' }],
                            ['resize-e', { top: 'calc(50% - 5px)', right: -5, cursor: 'ew-resize' }],
                          ] as const
                        ).map(([mode, posStyle]) => (
                          <span
                            key={mode}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const pageEl =
                                e.currentTarget.parentElement?.parentElement;
                              if (!pageEl) return;
                              const { x, y } = getPageRelativeCoords(pageEl, e);
                              setDragState({
                                targetKind: 'image',
                                mode,
                                id: img.id,
                                pageIdx,
                                startX: x,
                                startY: y,
                                origX1: img.x,
                                origY1: img.y,
                                origX2: img.x + img.width,
                                origY2: img.y + img.height,
                                aspectRatio: img.aspectRatio,
                              });
                            }}
                            style={{
                              position: 'absolute',
                              width: '10px',
                              height: '10px',
                              backgroundColor: '#FFFFFF',
                              border: '2px solid #1447E6',
                              ...posStyle,
                            }}
                          />
                        ))}
                    </div>
                  );
                })}

                {/* Layer Stacking: Background Shapes (zIndex: 2, behind text layer) */}
                {pageDrawings.some((d) => (d.zIndex ?? 10) < 6) && (
                  <svg
                    width="100%"
                    height="100%"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'all',
                      zIndex: 2,
                    }}
                  >
                    <defs>
                      <marker
                        id={`arrow-bg-${pageIdx}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="8"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
                      </marker>
                    </defs>
                    {pageDrawings
                      .filter((d) => (d.zIndex ?? 10) < 6)
                      .map(renderShapeElement)}
                  </svg>
                )}

                {/* Editable Page Content Area (zIndex: 6, transparent background) */}
                <div
                  ref={(el) => {
                    pageRefs.current[pageIdx] = el;
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => {
                    activePageIdxRef.current = pageIdx;
                  }}
                  onClick={(e) => {
                    handlePageSelection(pageIdx, e);
                    setSelectedDrawingId(null);
                    setSelectedImageId(null);
                    setIsEditingShape(false);
                  }}
                  onInput={() => {
                    checkAndFlowPages(pageIdx);
                    recordHistorySnapshotDebounced();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      const sel = window.getSelection();
                      if (
                        sel &&
                        sel.isCollapsed &&
                        sel.anchorOffset === 0 &&
                        pageIdx > 0
                      ) {
                        const pageEl = pageRefs.current[pageIdx];
                        const prevPageEl = pageRefs.current[pageIdx - 1];
                        if (
                          pageEl &&
                          prevPageEl &&
                          (pageEl.innerHTML.trim() === '' ||
                            pageEl.innerHTML === '<p><br></p>' ||
                            pageEl.textContent?.trim() === '')
                        ) {
                          e.preventDefault();
                          setPages((prev) =>
                            prev.filter((_, i) => i !== pageIdx)
                          );
                          prevPageEl.focus();
                          const range = window.document.createRange();
                          range.selectNodeContents(prevPageEl);
                          range.collapse(false);
                          sel.removeAllRanges();
                          sel.addRange(range);
                          setHasUnsavedChanges(true);
                          triggerAutoSave();
                          return;
                        }
                      }
                    }
                  }}
                  onMouseDown={(e) =>
                    handlePageMouseDownForTableResize(pageIdx, e)
                  }
                  onTouchStart={(e) =>
                    handlePageMouseDownForTableResize(pageIdx, e)
                  }
                  onMouseMove={(e) =>
                    handlePageMouseMoveForTableResize(pageIdx, e)
                  }
                  onMouseUp={(e) => {
                    handlePageSelection(pageIdx, e);
                  }}
                  onKeyUp={(e) => handlePageSelection(pageIdx, e)}
                  className="doc-editable-body"
                  style={{
                    position: 'relative',
                    zIndex: 6,
                    background: 'transparent',
                    lineHeight: layout.lineSpacing || lineSpacing || '1.6',
                    columnCount:
                      (layout.sectionColumns &&
                        layout.sectionColumns[pageIdx] !== undefined)
                        ? layout.sectionColumns[pageIdx]
                        : layout.columns || 1,
                    columnGap: `${layout.columnGapPx || 28}px`,
                  }}
                />

                {/* Layer Stacking: Foreground Shapes & Active Canvas Drawing (zIndex: 18, in front of text layer) */}
                {(pageDrawings.some((d) => (d.zIndex ?? 10) >= 6) ||
                  activeShapeTool !== 'select') && (
                  <svg
                    width="100%"
                    height="100%"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents:
                        activeShapeTool !== 'select' ? 'auto' : 'none',
                      cursor:
                        activeShapeTool !== 'select' ? 'crosshair' : 'default',
                      zIndex: 18,
                    }}
                    onMouseDown={(e) => handleStartCanvasShapeDraw(pageIdx, e)}
                    onTouchStart={(e) => handleStartCanvasShapeDraw(pageIdx, e)}
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
                    {pageDrawings
                      .filter((d) => (d.zIndex ?? 10) >= 6)
                      .map(renderShapeElement)}
                  </svg>
                )}

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
            REQUIREMENT 6, 7, 8, 9: MAIN AI ASSISTANT PANEL
            (Dedicated to Entire Document, Selected Group + Group Pages, or Individual Page)
        =================================================================== */}
        {showAiPanel && (
          <aside className="nc-ai-panel no-print">
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
                  fontSize: '13px',
                  color: 'var(--ink-navy)',
                }}
              >
                <Sparkles size={14} color="var(--accent-blue)" />
                <span>AI Assistant</span>
                <span
                  title="Strict context isolation: AI exclusively reads and edits this active document."
                  style={{
                    fontSize: '9.5px',
                    padding: '2px 7px',
                    backgroundColor: 'rgba(20, 71, 230, 0.08)',
                    color: 'var(--accent-blue)',
                    border: '1px solid rgba(20, 71, 230, 0.2)',
                    fontWeight: 600,
                    maxWidth: '190px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Active: {title}
                </span>
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
              >
                <X size={14} />
              </button>
            </div>

            {/* Gemini Live API / Offline Fallback Status Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 14px',
                backgroundColor: Boolean(getGeminiApiKey()) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                borderBottom: '1px solid',
                borderColor: Boolean(getGeminiApiKey()) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.25)',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: Boolean(getGeminiApiKey()) ? '#10b981' : '#f59e0b',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 500, color: 'var(--ink-rich)' }}>
                  {Boolean(getGeminiApiKey()) ? 'Gemini 1.5 Flash Connected' : 'Local Offline AI Fallback'}
                </span>
              </div>
              {!Boolean(getGeminiApiKey()) && onNavigateSettings && (
                <button
                  type="button"
                  onClick={onNavigateSettings}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent-blue)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '11px',
                    textDecoration: 'underline',
                  }}
                >
                  Add API Key
                </button>
              )}
            </div>

            {/* Requirement 6: Granular Focus Scope Selector (Entire Document | Selected Group + Pages | Selected Page) */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-stone)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  className="mono-label"
                  style={{ fontSize: '9.5px', color: 'var(--ink-muted)' }}
                >
                  AI Editing Scope:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(
                    [
                      ['document', 'Entire Doc'],
                      ['group', 'Group'],
                      ['page', 'Single Page'],
                    ] as const
                  ).map(([scopeKey, label]) => (
                    <button
                      key={scopeKey}
                      type="button"
                      onClick={() => {
                        setMainAiScope(scopeKey);
                        if (
                          scopeKey === 'group' &&
                          !aiTargetGroupId &&
                          pageGroups[0]
                        ) {
                          setAiTargetGroupId(pageGroups[0].id);
                        }
                      }}
                      className={
                        mainAiScope === scopeKey
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ padding: '3px 7px', fontSize: '9px' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Scope Details: Select Group + Select All Pages in Group OR Specific Page in Group */}
              {mainAiScope === 'group' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {pageGroups.length === 0 ? (
                    <span
                      style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}
                    >
                      No groups created yet. Use "Group Pages" in the toolbar.
                    </span>
                  ) : (
                    <>
                      <select
                        value={aiTargetGroupId}
                        onChange={(e) => {
                          setAiTargetGroupId(e.target.value);
                          setAiGroupPageSelection('all');
                        }}
                        className="ed-select"
                        style={{ padding: '5px 8px', fontSize: '11.5px' }}
                      >
                        {pageGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} (Pages{' '}
                            {g.pageIndices.map((i) => i + 1).join(', ')})
                          </option>
                        ))}
                      </select>

                      {activeGroupObj && (
                        <div>
                          <div
                            className="mono-label"
                            style={{
                              fontSize: '8.5px',
                              color: 'var(--ink-muted)',
                              marginBottom: '4px',
                            }}
                          >
                            Target Pages in {activeGroupObj.name}:
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setAiGroupPageSelection('all')}
                              className={
                                aiGroupPageSelection === 'all'
                                  ? 'btn-ed-primary'
                                  : 'btn-ed-subtle'
                              }
                              style={{ padding: '3px 7px', fontSize: '9px' }}
                            >
                              All Group Pages (
                              {activeGroupObj.pageIndices
                                .map((i) => i + 1)
                                .join(', ')}
                              )
                            </button>
                            {activeGroupObj.pageIndices.map((pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setAiGroupPageSelection(pIdx)}
                                className={
                                  aiGroupPageSelection === pIdx
                                    ? 'btn-ed-primary'
                                    : 'btn-ed-subtle'
                                }
                                style={{ padding: '3px 7px', fontSize: '9px' }}
                              >
                                Only Page {pIdx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Single Page Scope Selector */}
              {mainAiScope === 'page' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{ fontSize: '11px', color: 'var(--ink-muted)' }}
                  >
                    Select Page:
                  </span>
                  {pages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiTargetSinglePage(idx)}
                      className={
                        aiTargetSinglePage === idx
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ padding: '3px 8px', fontSize: '9.5px' }}
                    >
                      Page {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation History */}
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
                    fontSize: '12px',
                    color: 'var(--ink-muted)',
                    lineHeight: 1.5,
                    padding: '12px',
                    border: '1px solid var(--border-ivory)',
                    backgroundColor: 'var(--bg-stone)',
                  }}
                >
                  Select your target scope above (<strong>Entire Doc</strong>,{' '}
                  <strong>Group</strong>, or <strong>Single Page</strong>),
                  attach optional reference documents/images, and instruct AI to
                  update your document directly.
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
                      {msg.role === 'user'
                        ? 'Instruction'
                        : 'Applied to Workspace'}
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
                    <div>
                      <div
                        style={{ fontSize: '12.5px', color: 'var(--ink-navy)' }}
                      >
                        {msg.prompt}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontSize: '10.5px',
                            color: 'var(--accent-blue)',
                          }}
                        >
                          Attached: {msg.attachments.join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--ink-body)',
                          lineHeight: 1.45,
                        }}
                      >
                        ✓ {msg.summary}
                      </div>

                      {/* Section 5: Source Reference Badges & Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            borderTop: '1px solid var(--border-ivory)',
                            paddingTop: '6px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              color: 'var(--ink-muted)',
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                            }}
                          >
                            Sources &amp; References:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {msg.sources.map((src) => (
                              <div
                                key={src.id}
                                style={{
                                  fontSize: '11px',
                                  backgroundColor: 'var(--bg-stone)',
                                  padding: '5px 8px',
                                  border: '1px solid var(--border-stone)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '6px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {src.type === 'web' ? (
                                    <Globe size={11} color="var(--accent-blue)" />
                                  ) : (
                                    <FileText size={11} color="var(--accent-blue)" />
                                  )}
                                  <span style={{ fontWeight: 600 }}>{src.title}</span>
                                </div>
                                {src.url ? (
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: 'var(--accent-blue)',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '10px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <span>Open</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '9.5px', color: 'var(--ink-muted)', flexShrink: 0 }}>
                                    Verified Source
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Section 9: AI-Controlled Page Grouping User Confirmation Proposal */}
              {pendingGroupingProposal && (
                <div
                  style={{
                    backgroundColor: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    padding: '12px 14px',
                    borderRadius: '2px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <Layers size={14} color="#1447E6" />
                    <strong style={{ fontSize: '12.5px', color: '#1E1B4B' }}>
                      AI Proposes Page Grouping
                    </strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#312E81', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Group Name: <strong>"{pendingGroupingProposal.groupName}"</strong>
                    <br />
                    Target Pages:{' '}
                    <strong>
                      {pendingGroupingProposal.pageIndices.map((p) => p + 1).join(', ')}
                    </strong>
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleApplyPendingGrouping}
                      className="btn-ed-primary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Confirm &amp; Apply Grouping
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingGroupingProposal(null)}
                      className="btn-ed-subtle"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {isAiLoading && (
                <div
                  className="nc-ai-shimmer"
                  style={{
                    padding: '12px 14px',
                    border: '1.5px solid var(--accent-blue)',
                    backgroundColor: 'var(--bg-stone)',
                    color: 'var(--ink-navy)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={15} color="var(--accent-blue)" />
                  <span>{aiProgressMessage || 'Applying changes directly to active document...'}</span>
                </div>
              )}
            </div>

            {/* Requirement 7, 8, 9: Auto-Expanding Input + Document/Image Uploads + Voice-to-Text */}
            <div
              style={{
                padding: '12px 14px',
                borderTop: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-stone)',
              }}
            >
              <div
                style={{
                  border: isMainAiRecording
                    ? '2px solid #16A34A'
                    : '1px solid var(--border-stone)',
                  backgroundColor: isMainAiRecording
                    ? 'rgba(22, 163, 74, 0.05)'
                    : 'var(--bg-ivory)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <textarea
                  ref={aiTextareaRef}
                  rows={2}
                  value={combinedMainAiInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={
                    mainAiScope === 'group' && activeGroupObj
                      ? `Instruct AI for ${activeGroupObj.name}...`
                      : mainAiScope === 'page'
                      ? `Instruct AI for Page ${aiTargetSinglePage + 1}...`
                      : 'Instruct AI for the entire document...'
                  }
                  style={{
                    width: '100%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--ink-navy)',
                    fontSize: '12.5px',
                    lineHeight: 1.45,
                    outline: 'none',
                    resize: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiPrompt();
                    }
                  }}
                />

                {/* Attached Reference Documents & Images inside Main AI Assistant (Requirement 2) */}
                {aiUploadedRefs.length > 0 && (
                  <AIAttachmentsPreview
                    compact
                    attachments={aiUploadedRefs}
                    onRemove={(id) => setAiUploadedRefs((prev) => prev.filter((r) => r.id !== id))}
                  />
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '4px',
                    borderTop: '1px solid var(--border-ivory)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: isMainAiRecording ? '#15803D' : 'var(--ink-muted)',
                      fontWeight: isMainAiRecording ? 600 : 400,
                    }}
                  >
                    {isMainAiRecording
                      ? 'Listening... Speak now'
                      : mainAiScope === 'page'
                      ? `Scope: Page ${aiTargetSinglePage + 1}`
                      : mainAiScope === 'group' && activeGroupObj
                      ? `Scope: ${activeGroupObj.name}`
                      : 'Scope: Entire Document'}
                  </span>

                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      type="button"
                      onClick={toggleMainAiVoice}
                      title="Voice-to-Text Input"
                      style={{
                        width: '28px',
                        height: '28px',
                        border: isMainAiRecording
                          ? '1px solid #16A34A'
                          : '1px solid var(--border-stone)',
                        backgroundColor: isMainAiRecording
                          ? '#16A34A'
                          : 'var(--bg-stone)',
                        color: isMainAiRecording
                          ? '#FFFFFF'
                          : 'var(--ink-navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {isMainAiRecording ? (
                        <Square size={11} />
                      ) : (
                        <Mic size={12} />
                      )}
                    </button>

                    <label
                      title="Upload Reference Document or Image"
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid var(--border-stone)',
                        backgroundColor: 'var(--bg-stone)',
                        color: 'var(--ink-navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Paperclip size={12} />
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.md"
                        onChange={handleMainAiFileAttach}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleSendAiPrompt}
                      disabled={
                        isAiLoading ||
                        (!combinedMainAiInput.trim() &&
                          aiUploadedRefs.length === 0)
                      }
                      className="btn-ed-primary"
                      style={{ padding: '0 10px', height: '28px' }}
                    >
                      <Send size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* =====================================================================
          CHANGE PAGE LAYOUT MODAL
      ===================================================================== */}
      {showLayoutModal && (
        <PageLayoutModal
          layout={layout}
          layoutScope={layoutScope}
          activePageIndex={activePageIdxRef.current}
          onChangeLayout={setLayout}
          onChangeScope={setLayoutScope}
          onResetDefault={() => setLayout(DEFAULT_LAYOUT)}
          onApplyAndClose={() => {
            setShowLayoutModal(false);
            triggerAutoSave({ overrideLayout: layout });
          }}
          onClose={() => setShowLayoutModal(false)}
        />
      )}

      {/* =====================================================================
          REQUIREMENT 1: UNSAVED CHANGES PROTECTION MODAL
      ===================================================================== */}
      {showUnsavedModal && (
        <div className="nc-modal-backdrop no-print" style={{ zIndex: 9999 }}>
          <div
            className="nc-modal-dialog"
            style={{ maxWidth: '480px', padding: 0 }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-ivory)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AlertCircle size={18} color="var(--accent-terracotta)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--ink-navy)',
                  }}
                >
                  Unsaved Changes
                </h3>
              </div>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="btn-ed-subtle"
                style={{ padding: '4px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: '13px',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.5,
                }}
              >
                You have unsaved changes in{' '}
                <strong>"{title || 'Untitled Document'}"</strong>. What would you
                like to do before leaving the workspace?
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={handleConfirmSaveAndLeave}
                  className="btn-ed-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px',
                    fontSize: '12.5px',
                  }}
                >
                  <Save size={14} />
                  <span>Save and Leave</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSaveLocallyAndLeave}
                  className="btn-ed-outline"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px',
                    fontSize: '12.5px',
                  }}
                >
                  <HardDrive size={14} color="var(--accent-blue)" />
                  <span>Save Locally to Computer and Leave</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDiscardAndLeave}
                  className="btn-ed-subtle"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '9px',
                    fontSize: '12px',
                    color: 'var(--accent-terracotta)',
                  }}
                >
                  <span>Discard Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUnsavedModal(false)}
                  className="btn-ed-subtle"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span>Cancel (Stay in Workspace)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          REQUIREMENT 8: DEVICE CAMERA CAPTURE MODAL
      ===================================================================== */}
      {showCameraModal && (
        <div className="nc-modal-backdrop no-print" style={{ zIndex: 9999 }}>
          <div
            className="nc-modal-dialog"
            style={{ maxWidth: '520px', padding: 0 }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-ivory)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Camera size={16} color="var(--accent-blue)" />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '14px',
                    color: 'var(--ink-navy)',
                  }}
                >
                  Take Photo with Device Camera
                </span>
              </div>
              <button
                onClick={stopLiveCamera}
                className="btn-ed-subtle"
                style={{ padding: '4px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '300px',
                  backgroundColor: '#000000',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="btn-ed-primary"
                  style={{ padding: '9px 20px', gap: '8px' }}
                >
                  <Camera size={15} />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="btn-ed-outline"
                  style={{ padding: '9px 16px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 12: CREDIT TOP-UP MODAL
      ===================================================================== */}
      {showTopUpModal && (
        <div className="nc-modal-backdrop no-print" style={{ zIndex: 9999 }}>
          <div
            className="nc-modal-dialog"
            style={{ maxWidth: '640px', padding: 0 }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-ivory)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={18} color="var(--accent-blue)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--ink-navy)',
                  }}
                >
                  Purchase AI Top-Up Credits
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="btn-ed-subtle"
                style={{ padding: '4px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.5,
                  margin: '0 0 16px 0',
                }}
              >
                Purchased credits never expire and roll over indefinitely. They are deducted only after
                your monthly subscription credits are consumed.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                }}
              >
                {CREDIT_TOP_UP_BUNDLES.map((bundle) => (
                  <div
                    key={bundle.id}
                    style={{
                      border: bundle.popular
                        ? '2px solid var(--accent-blue)'
                        : '1px solid var(--border-stone)',
                      backgroundColor: 'var(--bg-ivory)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {bundle.popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-9px',
                          right: '12px',
                          backgroundColor: 'var(--accent-blue)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '8.5px',
                          padding: '1px 6px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        Popular
                      </span>
                    )}

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink-navy)' }}>
                        {bundle.name}
                      </div>
                      <div
                        style={{
                          fontSize: '22px',
                          fontWeight: 800,
                          color: 'var(--ink-navy)',
                          margin: '6px 0',
                        }}
                      >
                        ₦{bundle.priceNgn.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {(bundle.credits + (bundle.bonusCredits || 0)).toLocaleString()} Credits
                        {bundle.bonusCredits !== undefined && bundle.bonusCredits > 0 && (
                          <span style={{ fontSize: '10px', color: '#16A34A', marginLeft: '4px' }}>
                            (+{bundle.bonusCredits.toLocaleString()} bonus)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        billingManager.topUpCredits(bundle);
                        setShowTopUpModal(false);
                      }}
                      className="btn-ed-primary"
                      style={{
                        marginTop: '14px',
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '11px',
                        padding: '7px',
                      }}
                    >
                      <Plus size={12} />
                      <span>Add to Wallet</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 9: PAGE FRAME STYLES MODAL (REPLACES COVER PAGE PER SPECIFICATION)
      ===================================================================== */}
      {showFrameModal && (
        <PageFrameModal
          pageIndex={frameTargetPageIndex}
          currentFrameStyle={
            layout.sectionBorders?.[frameTargetPageIndex]?.frameStyle ||
            (layout as any).frameStyle ||
            'none'
          }
          currentColor={
            layout.sectionBorders?.[frameTargetPageIndex]?.borderColor ||
            layout.borderColor ||
            '#1E293B'
          }
          onApplyFrame={(frameId, color, applyToAll) => {
            handleApplyFrame({
              frameStyle: frameId,
              borderColor: color,
              borderWidthPx: layout.borderWidthPx || 2,
              borderInsetMm: layout.borderInsetMm ?? 10,
              applyToAll,
            });
            setShowFrameModal(false);
          }}
          onClose={() => setShowFrameModal(false)}
        />
      )}
    </div>
  );
};
