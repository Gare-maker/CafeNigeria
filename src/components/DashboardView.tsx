import React from 'react';
import {
  FileText,
  BookOpen,
  Presentation,
  UserCheck,
  ScanText,
  ArrowRight,
} from 'lucide-react';
import { DocumentCategory, DocumentItem } from '../types';
import { CATEGORIES } from '../services/aiGenerator';

interface DashboardViewProps {
  documents: DocumentItem[];
  searchQuery: string;
  onSelectCategory: (category: DocumentCategory) => void;
  onOpenDocument: (docId: string) => void;
}

const CATEGORY_ICONS: Record<DocumentCategory, React.ReactNode> = {
  projects: (
    <BookOpen size={18} strokeWidth={1.5} color="var(--accent-blue)" />
  ),
  assignments: (
    <FileText size={18} strokeWidth={1.5} color="var(--accent-blue)" />
  ),
  seminars: (
    <Presentation size={18} strokeWidth={1.5} color="var(--accent-blue)" />
  ),
  cv: <UserCheck size={18} strokeWidth={1.5} color="var(--accent-blue)" />,
  'image-to-notes': (
    <ScanText size={18} strokeWidth={1.5} color="var(--accent-blue)" />
  ),
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  searchQuery,
  onSelectCategory,
  onOpenDocument,
}) => {
  const getCategoryCount = (catId: DocumentCategory) =>
    documents.filter((d) => d.category === catId).length;

  const trimmedSearch = searchQuery.trim().toLowerCase();
  const matchingDocs = trimmedSearch
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(trimmedSearch) ||
          d.category.toLowerCase().includes(trimmedSearch) ||
          (d.metadata.institution || '').toLowerCase().includes(trimmedSearch)
      )
    : [];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: 'var(--bg-ivory)',
        paddingTop: '48px',
        paddingBottom: '72px',
      }}
    >
      <div className="nc-container">
        {/* Introductory Section */}
        <div style={{ maxWidth: '600px', marginBottom: '36px' }}>
          <h1 className="display-heading">
            Create documents with AI, faster than ever.
          </h1>
          <p
            style={{
              marginTop: '10px',
              fontSize: '15px',
              color: 'var(--ink-muted)',
              lineHeight: 1.5,
            }}
          >
            Generate assignments, projects, seminar papers, CVs and organised
            notes in one workspace.
          </p>
        </div>

        {/* Search Results (Only shown when actively searching from Header) */}
        {trimmedSearch && (
          <div style={{ marginBottom: '32px' }}>
            <div
              className="mono-label"
              style={{ color: 'var(--ink-muted)', marginBottom: '10px' }}
            >
              Search Results ({matchingDocs.length})
            </div>
            {matchingDocs.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-ivory)',
                  color: 'var(--ink-muted)',
                  fontSize: '13.5px',
                }}
              >
                No documents match "{searchQuery}".
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-ivory)' }}>
                {matchingDocs.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-ivory)',
                      border: 'none',
                      borderBottom:
                        idx < matchingDocs.length - 1
                          ? '1px solid var(--border-ivory)'
                          : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: 'var(--ink-navy)',
                        }}
                      >
                        {doc.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--ink-muted)',
                          marginTop: '2px',
                        }}
                      >
                        Modified {doc.updatedAt}
                      </div>
                    </div>
                    <span
                      className="mono-label"
                      style={{ color: 'var(--accent-blue)', fontSize: '10px' }}
                    >
                      Open →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact, Balanced Category Cards Grid (Section 2) */}
        <div className="nc-category-grid">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="nc-category-card"
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      marginBottom: '10px',
                    }}
                  >
                    {CATEGORY_ICONS[cat.id]}
                    <h2
                      style={{
                        fontSize: '15.5px',
                        fontWeight: 700,
                        color: 'var(--ink-navy)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {cat.name}
                    </h2>
                  </div>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--ink-muted)',
                      lineHeight: 1.48,
                    }}
                  >
                    {cat.description}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '11px',
                    borderTop: '1px solid var(--border-ivory)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <span
                    className="mono-label"
                    style={{
                      fontSize: '9.5px',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {count} {count === 1 ? 'document' : 'documents'}
                  </span>

                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    color="var(--ink-muted)"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
