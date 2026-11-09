import React, { useState } from 'react';
import {
  Search,
  FolderOpen,
  Edit3,
  Copy,
  Trash2,
  ArrowLeft,
  Check,
  X,
  HardDriveDownload,
  HardDriveUpload,
} from 'lucide-react';
import { DocumentCategory, DocumentItem } from '../types';
import {
  CATEGORY_PAGE_COPY,
  formatDisplayDate,
  searchDocumentMatch,
} from '../services/aiGenerator';

interface CategoryPageViewProps {
  category: DocumentCategory;
  documents: DocumentItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onBackHome: () => void;
  onOpenDocument: (docId: string) => void;
  onRenameDocument: (docId: string, newTitle: string) => void;
  onDuplicateDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  onSaveToComputer?: (doc: DocumentItem) => void;
  onOpenFromComputer?: () => void;
}

function highlightMatchText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        style={{
          backgroundColor: '#FEF08A',
          color: '#0A194E',
          padding: '0 2px',
          fontWeight: 700,
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const CategoryPageView: React.FC<CategoryPageViewProps> = ({
  category,
  documents,
  searchQuery,
  onSearchChange,
  onBackHome,
  onOpenDocument,
  onRenameDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onSaveToComputer,
  onOpenFromComputer,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const pageCopy = CATEGORY_PAGE_COPY[category];

  // Display documents belonging to this category and search across Title, Full Content, and Metadata (Requirement 2)
  const categoryDocsWithMatch = documents
    .filter((doc) => doc.category === category)
    .map((doc) => ({
      doc,
      match: searchDocumentMatch(doc, searchQuery),
    }))
    .filter((item) => item.match.matched);

  const startRename = (doc: DocumentItem) => {
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  };

  const commitRename = (docId: string) => {
    if (editingTitle.trim()) {
      onRenameDocument(docId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const getDisplayStatus = (doc: DocumentItem) =>
    doc.status === 'Completed' ? 'Completed' : 'Draft';

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: 'var(--bg-ivory)',
        paddingTop: '40px',
        paddingBottom: '72px',
      }}
    >
      <div className="nc-container">
        {/* Back to Home link */}
        <button
          onClick={onBackHome}
          style={{
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <ArrowLeft size={13} /> Back to Home
        </button>

        {/* Page Header */}
        <div style={{ maxWidth: '620px', marginBottom: '36px' }}>
          <h1 className="display-heading">{pageCopy.heading}</h1>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--ink-muted)',
              marginTop: '10px',
              lineHeight: 1.5,
            }}
          >
            {pageCopy.supportingText}
          </p>
        </div>

        {/* Previously Created Documents */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--ink-navy)',
              }}
            >
              Previously Created Documents ({categoryDocsWithMatch.length})
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {onOpenFromComputer && (
                <button
                  onClick={onOpenFromComputer}
                  className="btn-ed-subtle"
                  style={{ height: '34px', padding: '0 11px' }}
                  title="Open an individual document file from your computer"
                >
                  <HardDriveUpload size={12} color="var(--accent-blue)" />
                  <span>Open File</span>
                </button>
              )}

              {/* Search Field (Searches both Document Titles and Inside Document Content) */}
              <div className="nc-category-search" style={{ width: '280px' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--ink-muted)',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search titles or content inside docs..."
                  className="ed-input"
                  style={{ padding: '7px 28px 7px 30px', fontSize: '12.5px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-muted)',
                      display: 'flex',
                    }}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {categoryDocsWithMatch.length === 0 ? (
            <div
              style={{
                border: '1px solid var(--border-ivory)',
                backgroundColor: 'var(--bg-stone)',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--ink-muted)',
                }}
              >
                {searchQuery.trim() ? (
                  <>
                    No documents or content inside this category matched "
                    <strong>{searchQuery}</strong>".
                  </>
                ) : (
                  <>
                    No documents found in this category yet. Use the{' '}
                    <strong>{pageCopy.buttonLabel}</strong> button in the header
                    to create one.
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="nc-doc-table-desktop">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.1fr 1.1fr 0.75fr 1.55fr',
                    padding: '11px 16px',
                    backgroundColor: 'var(--bg-stone)',
                    borderBottom: '1px solid var(--border-ivory)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                  }}
                >
                  <div>Document Name &amp; Content Match</div>
                  <div>Date Created</div>
                  <div>Last Modified</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {categoryDocsWithMatch.map(({ doc, match }, idx) => {
                  const isRenaming = editingId === doc.id;
                  const statusLabel = getDisplayStatus(doc);

                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1.1fr 1.1fr 0.75fr 1.55fr',
                        padding: '14px 16px',
                        borderBottom:
                          idx < categoryDocsWithMatch.length - 1
                            ? '1px solid var(--border-ivory)'
                            : 'none',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {/* Document Name + Content Search Snippet */}
                      <div style={{ minWidth: 0 }}>
                        {isRenaming ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="ed-input"
                              style={{ padding: '5px 9px', fontSize: '13px' }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(doc.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => commitRename(doc.id)}
                              className="btn-ed-primary"
                              style={{ padding: '5px 8px' }}
                              title="Save"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-ed-subtle"
                              style={{ padding: '5px 8px' }}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <button
                                onClick={() => onOpenDocument(doc.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  color: 'var(--ink-navy)',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {highlightMatchText(doc.title, searchQuery)}
                              </button>

                              {searchQuery.trim() && match.matchLocation && (
                                <span
                                  className="mono-label"
                                  style={{
                                    fontSize: '8.5px',
                                    padding: '2px 6px',
                                    backgroundColor: 'var(--bg-stone)',
                                    border: '1px solid var(--border-stone)',
                                    color: 'var(--accent-blue)',
                                  }}
                                >
                                  Matched in {match.matchLocation}
                                </span>
                              )}

                              {doc.metadata.localFileName && (
                                <span
                                  className="mono-label"
                                  style={{
                                    fontSize: '8.5px',
                                    padding: '1px 5px',
                                    backgroundColor: 'var(--bg-stone)',
                                    color: 'var(--ink-muted)',
                                  }}
                                  title="Linked to local computer file"
                                >
                                  {doc.metadata.localFileName}
                                </span>
                              )}
                            </div>

                            {searchQuery.trim() && match.snippet && (
                              <div
                                style={{
                                  marginTop: '5px',
                                  padding: '5px 8px',
                                  backgroundColor: 'var(--bg-stone)',
                                  borderLeft: '2px solid var(--accent-blue)',
                                  fontSize: '11.5px',
                                  color: 'var(--ink-body)',
                                  lineHeight: 1.4,
                                }}
                              >
                                {highlightMatchText(match.snippet, searchQuery)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date Created (Month in Words per Requirement 3) */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        {formatDisplayDate(doc.createdAt)}
                      </div>

                      {/* Last Modified (Month in Words per Requirement 3) */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--ink-body)',
                        }}
                      >
                        {formatDisplayDate(doc.updatedAt)}
                      </div>

                      {/* Status */}
                      <div>
                        <span
                          className="mono-label"
                          style={{
                            fontSize: '9.5px',
                            color:
                              statusLabel === 'Completed'
                                ? '#15803D'
                                : 'var(--ink-muted)',
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Actions: Open, Save File, Rename, Duplicate, Delete */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '5px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => onOpenDocument(doc.id)}
                          className="btn-ed-subtle"
                          style={{ padding: '5px 9px' }}
                          title="Open Document"
                        >
                          <FolderOpen size={12} /> Open
                        </button>
                        {onSaveToComputer && (
                          <button
                            onClick={() => onSaveToComputer(doc)}
                            className="btn-ed-subtle"
                            style={{ padding: '5px 7px' }}
                            title="Save as Individual File on Computer"
                          >
                            <HardDriveDownload size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => startRename(doc)}
                          className="btn-ed-subtle"
                          style={{ padding: '5px 7px' }}
                          title="Rename"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => onDuplicateDocument(doc.id)}
                          className="btn-ed-subtle"
                          style={{ padding: '5px 7px' }}
                          title="Duplicate"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="btn-ed-subtle"
                          style={{
                            padding: '5px 7px',
                            color: 'var(--accent-terracotta)',
                          }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Responsive Cards View */}
              <div className="nc-doc-cards-mobile">
                {categoryDocsWithMatch.map(({ doc, match }) => {
                  const statusLabel = getDisplayStatus(doc);
                  return (
                    <div
                      key={doc.id}
                      style={{
                        border: '1px solid var(--border-ivory)',
                        backgroundColor: 'var(--bg-ivory)',
                        padding: '14px 16px',
                      }}
                    >
                      <button
                        onClick={() => onOpenDocument(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: '14.5px',
                          color: 'var(--ink-navy)',
                          cursor: 'pointer',
                          padding: 0,
                          marginBottom: '6px',
                          display: 'block',
                        }}
                      >
                        {highlightMatchText(doc.title, searchQuery)}
                      </button>

                      {searchQuery.trim() && match.snippet && (
                        <div
                          style={{
                            marginBottom: '8px',
                            padding: '6px 8px',
                            backgroundColor: 'var(--bg-stone)',
                            borderLeft: '2px solid var(--accent-blue)',
                            fontSize: '11.5px',
                            color: 'var(--ink-body)',
                          }}
                        >
                          {highlightMatchText(match.snippet, searchQuery)}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '10px',
                          fontSize: '11.5px',
                          color: 'var(--ink-muted)',
                          marginBottom: '12px',
                        }}
                      >
                        <span>Created: {formatDisplayDate(doc.createdAt)}</span>
                        <span>Modified: {formatDisplayDate(doc.updatedAt)}</span>
                        <span
                          className="mono-label"
                          style={{
                            fontSize: '9.5px',
                            color:
                              statusLabel === 'Completed'
                                ? '#15803D'
                                : 'var(--ink-muted)',
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => onOpenDocument(doc.id)}
                          className="btn-ed-primary"
                          style={{ padding: '6px 11px', fontSize: '9.5px' }}
                        >
                          Open
                        </button>
                        {onSaveToComputer && (
                          <button
                            onClick={() => onSaveToComputer(doc)}
                            className="btn-ed-subtle"
                          >
                            Save File
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const next = window.prompt(
                              'Rename document:',
                              doc.title
                            );
                            if (next && next.trim()) {
                              onRenameDocument(doc.id, next.trim());
                            }
                          }}
                          className="btn-ed-subtle"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => onDuplicateDocument(doc.id)}
                          className="btn-ed-subtle"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="btn-ed-subtle"
                          style={{ color: 'var(--accent-terracotta)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
