export type DocumentCategory =
  | 'projects'
  | 'assignments'
  | 'seminars'
  | 'cv'
  | 'image-to-notes';

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
  columns: 1 | 2 | 3;
  columnGapPx: number;
  pageBackground: string;
  borderStyle: 'none' | 'solid' | 'double' | 'dashed';
  borderWidthPx: number;
  borderColor: string;
  headerSpacingPx: number;
  footerSpacingPx: number;
  sectionOrientations?: Record<number, 'portrait' | 'landscape'>;
}

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
    lecturerOrSupervisor?: string;
    academicSession?: string;
    referencingStyle?: string;
    wordCountTarget?: string;
    cvLayout?: 'academic' | 'executive' | 'minimal';
    projectChapters?: string[];
    headerText?: string;
    footerText?: string;
    showPageNumbers?: boolean;
    orientation?: 'portrait' | 'landscape';
    marginSize?: 'normal' | 'narrow' | 'wide';
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
