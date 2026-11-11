export type DocumentCategory =
  | 'projects'
  | 'assignments'
  | 'seminars'
  | 'cv'
  | 'image-to-notes'
  | 'free-writing';

export type SyncStatus =
  | 'saved'
  | 'saving'
  | 'offline-pending'
  | 'sync-failed';

export type DocumentStatus = 'Completed' | 'In Progress' | 'Draft' | 'Offline Draft';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  prompt: string;
  generatedHtml?: string;
  summary?: string;
  timestamp: string;
  inserted?: boolean;
  targetGroupId?: string;
  targetGroupName?: string;
  targetPageIndex?: number;
  attachments?: string[];
}

export interface PageLayoutSettings {
  pageSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  customWidthMm?: number;
  customHeightMm?: number;
  orientation: 'portrait' | 'landscape';
  marginPreset: 'normal' | 'narrow' | 'wide' | 'custom';
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  columns: number; // 1 to 6
  columnGapPx: number;
  lineSpacing?: string; // e.g. '1.15', '1.5', '2.0', '1.0'
  pageBackground: string;
  borderStyle: 'none' | 'solid' | 'double' | 'dashed';
  borderWidthPx: number;
  borderColor: string;
  headerSpacingPx: number;
  footerSpacingPx: number;
  sectionOrientations?: Record<number, 'portrait' | 'landscape'>;
  sectionColumns?: Record<number, number>;
}

export const DEFAULT_PAGE_LAYOUT: PageLayoutSettings = {
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
  lineSpacing: '1.5',
  pageBackground: '#FFFFFF',
  borderStyle: 'none',
  borderWidthPx: 1,
  borderColor: '#0A194E',
  headerSpacingPx: 18,
  footerSpacingPx: 24,
  sectionOrientations: {},
  sectionColumns: {},
};

export const PAGE_DIMENSIONS_PX: Record<
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

export type ShapeType =
  | 'rect'
  | 'square'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'line'
  | 'hline'
  | 'vline'
  | 'arrow'
  | 'freehand';

export interface DrawingElement {
  id: string;
  pageIndex: number;
  type: ShapeType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  points?: { x: number; y: number }[];
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
}

export interface CanvasImageElement {
  id: string;
  pageIndex: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
  zIndex: number;
  caption?: string;
}

export interface PageGroup {
  id: string;
  name: string;
  pageIndices: number[]; // 0-based page numbers belonging to this group
  collapsed?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  content: string; // Rich HTML content inside the workspace (pages joined by <hr class="page-break" />)
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  syncStatus: SyncStatus;
  format: 'DOCX' | 'PDF' | 'TXT';
  metadata: {
    institution?: string;
    department?: string;
    faculty?: string;
    course?: string;
    courseCode?: string;
    studentName?: string;
    matricNumber?: string;
    matricNo?: string;
    lecturerOrSupervisor?: string;
    submissionDate?: string;
    academicSession?: string;
    referencingStyle?: string;
    wordCountTarget?: string;
    cvLayout?: 'academic' | 'executive' | 'minimal';
    projectChapters?: string[];
    headerText?: string;
    footerText?: string;
    showPageNumbers?: boolean;
    orientation?: 'portrait' | 'landscape';
    marginSize?: 'normal' | 'narrow' | 'wide' | 'custom';
    fontFamily?: string;
    layout?: PageLayoutSettings;
    drawings?: DrawingElement[];
    images?: CanvasImageElement[];
    pageGroups?: PageGroup[];
    pages?: string[];
    localFileName?: string;
  };
  aiHistory: AIMessage[];
}

export interface ExportScopeOptions {
  scope: 'document' | 'group' | 'page';
  groupId?: string;
  pageIndex?: number;
}

export interface CategoryMeta {
  id: DocumentCategory;
  name: string;
  shortName: string;
  code: string;
  description: string;
  longDescription: string;
  workflowSteps: string[];
}
