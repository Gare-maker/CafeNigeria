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
} from 'lucide-react';
import { DocumentCategory, DocumentItem } from '../types';
import { CATEGORY_PAGE_COPY } from '../services/aiGenerator';

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
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const pageCopy = CATEGORY_PAGE_COPY[category];

  // Display ONLY documents belonging to this category
  const categoryDocs = documents
    .filter((doc) => doc.category === category)
    .filter((doc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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

        {/* Page Header (Introductory heading & description only — single Create button is in the top header per Section 3) */}
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
              Previously Created Documents ({categoryDocs.length})
            </h2>

            {/* Search Field */}
            <div className="nc-category-search">
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
                placeholder="Search by document name..."
                className="ed-input"
                style={{ padding: '7px 11px 7px 30px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {categoryDocs.length === 0 ? (
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
                No documents found in this category yet. Use the{' '}
                <strong>{pageCopy.buttonLabel}</strong> button in the header to
                create one.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="nc-doc-table-desktop">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.6fr 1.1fr 1.1fr 0.8fr 1.4fr',
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
                  <div>Document Name</div>
                  <div>Date Created</div>
                  <div>Last Modified</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {categoryDocs.map((doc, idx) => {
                  const isRenaming = editingId === doc.id;
                  const statusLabel = getDisplayStatus(doc);

                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.6fr 1.1fr 1.1fr 0.8fr 1.4fr',
                        padding: '14px 16px',
                        borderBottom:
                          idx < categoryDocs.length - 1
                            ? '1px solid var(--border-ivory)'
                            : 'none',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {/* Document Name */}
                      <div>
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
                            {doc.title}
                          </button>
                        )}
                      </div>

                      {/* Date Created */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        {doc.createdAt}
                      </div>

                      {/* Last Modified */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--ink-body)',
                        }}
                      >
                        {doc.updatedAt}
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

                      {/* Actions: Open, Rename, Duplicate, Delete */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '5px',
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
                {categoryDocs.map((doc) => {
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
                        {doc.title}
                      </button>

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
                        <span>Created: {doc.createdAt}</span>
                        <span>Modified: {doc.updatedAt}</span>
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
