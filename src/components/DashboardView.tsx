import React from 'react';
import {
  FileText,
  BookOpen,
  Presentation,
  UserCheck,
  ScanText,
  ArrowRight,
  HardDriveUpload,
} from 'lucide-react';
import { DocumentCategory, DocumentItem } from '../types';
import {
  CATEGORIES,
  formatDisplayDate,
  searchDocumentMatch,
} from '../services/aiGenerator';

interface DashboardViewProps {
  documents: DocumentItem[];
  searchQuery: string;
  onSelectCategory: (category: DocumentCategory) => void;
  onOpenDocument: (docId: string) => void;
  onOpenComputerFile?: () => void;
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
  onOpenComputerFile,
}) => {
  const getCategoryCount = (catId: DocumentCategory) =>
    documents.filter((d) => d.category === catId).length;

  const trimmedSearch = searchQuery.trim();
  const matchingResults = trimmedSearch
    ? documents
        .map((doc) => ({
          doc,
          match: searchDocumentMatch(doc, trimmedSearch),
        }))
        .filter((item) => item.match.matched)
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
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '36px',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
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

          {onOpenComputerFile && (
            <button
              onClick={onOpenComputerFile}
              className="btn-ed-outline"
              style={{ height: '36px', padding: '0 14px', fontSize: '10px' }}
              title="Open a saved document file from your computer"
            >
              <HardDriveUpload size={13} color="var(--accent-blue)" />
              <span>Open File from Computer</span>
            </button>
          )}
        </div>

        {/* Search Results (Searches titles, metadata, and full document content) */}
        {trimmedSearch && (
          <div style={{ marginBottom: '32px' }}>
            <div
              className="mono-label"
              style={{ color: 'var(--ink-muted)', marginBottom: '10px' }}
            >
              Search Results across Titles &amp; Document Content ({matchingResults.length})
            </div>
            {matchingResults.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-ivory)',
                  color: 'var(--ink-muted)',
                  fontSize: '13.5px',
                }}
              >
                No documents or content match "{searchQuery}".
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border-ivory)' }}>
                {matchingResults.map(({ doc, match }, idx) => (
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
                        idx < matchingResults.length - 1
                          ? '1px solid var(--border-ivory)'
                          : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'var(--ink-navy)',
                          }}
                        >
                          {doc.title}
                        </span>
                        {match.matchLocation && (
                          <span
                            className="mono-label"
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              backgroundColor: 'var(--bg-stone)',
                              border: '1px solid var(--border-stone)',
                              color: 'var(--accent-blue)',
                            }}
                          >
                            Matched in {match.matchLocation}
                          </span>
                        )}
                      </div>

                      {match.snippet && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--ink-body)',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}
                        >
                          "{match.snippet}"
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--ink-muted)',
                          marginTop: '3px',
                        }}
                      >
                        Modified {formatDisplayDate(doc.updatedAt)}
                      </div>
                    </div>
                    <span
                      className="mono-label"
                      style={{
                        color: 'var(--accent-blue)',
                        fontSize: '10px',
                        flexShrink: 0,
                      }}
                    >
                      Open →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact, Balanced Category Cards Grid */}
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
