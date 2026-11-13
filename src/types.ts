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

export interface SourceReference {
  id: string;
  title: string;
  type: 'file' | 'workspace_doc' | 'web' | 'image';
  url?: string;
  fileSize?: string;
  mimeType?: string;
  thumbnail?: string;
  snippet?: string;
  docId?: string;
  verified?: boolean;
}

export interface AIAttachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  fileType: string; // e.g. '.pdf', '.docx', '.png', '.jpg', '.txt'
  sizeFormatted: string;
  dataUrl?: string; // base64 Data URL for thumbnail preview and multimodal vision
  extractedText: string;
  pageCount?: number;
  rawFile?: File;
}

export type PageFrameStyleId =
  | 'none'
  | 'minimal-dotted'
  | 'decorative-corner'
  | 'classic-border'
  | 'modern-geometric'
  | 'floral-ornamental'
  | 'simple-double'
  | 'executive-solid'
  | 'creative-artistic'
  | 'double-line-inset';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  prompt: string;
  chatResponse?: string;
  generatedHtml?: string;
  summary?: string;
  timestamp: string;
  inserted?: boolean;
  targetGroupId?: string;
  targetGroupName?: string;
  targetPageIndex?: number;
  attachments?: string[];
  sources?: SourceReference[];
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
  borderStyle: 'none' | 'solid' | 'double' | 'dashed' | 'dotted';
  borderWidthPx: number;
  borderColor: string;
  borderInsetMm?: number; // distance from page edges
  frameStyle?: PageFrameStyleId;
  headerSpacingPx: number;
  footerSpacingPx: number;
  sectionOrientations?: Record<number, 'portrait' | 'landscape'>;
  sectionColumns?: Record<number, number>;
  sectionBorders?: Record<
    number,
    {
      borderStyle: 'none' | 'solid' | 'double' | 'dashed' | 'dotted';
      borderWidthPx: number;
      borderColor: string;
      borderInsetMm?: number;
      frameStyle?: PageFrameStyleId;
    }
  >;
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
  borderInsetMm: 5,
  headerSpacingPx: 18,
  footerSpacingPx: 24,
  sectionOrientations: {},
  sectionColumns: {},
  sectionBorders: {},
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
    coverPageIndex?: number; // Designated cover page index (Section 6)
    coverPageDesignId?: string;
    sources?: SourceReference[]; // Attached source references (Section 5)
  };
  aiHistory: AIMessage[];
}

export interface ExportScopeOptions {
  scope: 'document' | 'group' | 'page';
  groupId?: string;
  pageIndex?: number;
}

// ============================================================================
// BILLING, SUBSCRIPTION & AI CREDIT WALLET (Sections 11 & 12)
// ============================================================================

export type SubscriptionPlanId = 'free' | 'basic' | 'standard' | 'premium';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceNgn: number;
  monthlyCredits: number;
  badge?: string;
  recommended?: boolean;
  features: string[];
}

export interface UserSubscription {
  planId: SubscriptionPlanId;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  renewalDate: string;
  currentPeriodStart: string;
}

export interface CreditWallet {
  availableCredits: number;
  totalAllocatedCredits: number;
  consumedCredits: number;
  breakdown: {
    subscription: number;
    purchased: number;
    promotional: number;
    adjustment: number;
  };
  renewalDate?: string;
}

export interface AIUsageRecord {
  id: string;
  timestamp: string;
  operation: string; // 'Rewrite', 'Generate', 'Summarize', 'OCR', 'Grouping', 'Document QA', 'Comparison'
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  creditsDeducted: number;
  costNgnEquivalent: number;
  status: 'completed' | 'failed' | 'reversed';
  documentId?: string;
  documentTitle?: string;
}

export interface WalletTransaction {
  id: string;
  timestamp: string;
  type:
    | 'subscription_grant'
    | 'top_up'
    | 'usage_deduction'
    | 'promo_bonus'
    | 'refund';
  credits: number; // positive or negative
  amountNgn?: number;
  reference: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
}

export interface CreditTopUpBundle {
  id: string;
  name: string;
  credits: number;
  priceNgn: number;
  bonusCredits?: number;
  popular?: boolean;
}

// ============================================================================
// REVENUE SHARING (40% COMPANY / 60% USER) & USER EARNINGS (Section 13)
// ============================================================================

export interface RevenueShareTransaction {
  id: string;
  timestamp: string;
  description: string;
  clientOrPayer: string;
  grossAmountNgn: number;
  companyShareNgn: number; // 40%
  userShareNgn: number; // 60%
  companyPercent: number; // 40
  userPercent: number; // 60
  reference: string;
  status: 'verified' | 'pending' | 'refunded';
  category:
    | 'peer_review'
    | 'freelance_formatting'
    | 'template_sale'
    | 'consultation';
}

export interface UserEarningsAccount {
  grossEarningsNgn: number;
  companyCommissionNgn: number;
  netUserEarningsNgn: number;
  availableBalanceNgn: number;
  pendingBalanceNgn: number;
  withdrawnAmountNgn: number;
  transactions: RevenueShareTransaction[];
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
