import React from 'react';
import { FileText, Image as ImageIcon, X, FileSpreadsheet } from 'lucide-react';
import { AIAttachment } from '../types';

interface AIAttachmentsPreviewProps {
  attachments: AIAttachment[];
  onRemove: (id: string) => void;
  compact?: boolean;
}

export const AIAttachmentsPreview: React.FC<AIAttachmentsPreviewProps> = ({
  attachments,
  onRemove,
  compact = false,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div
      className="nc-ai-attachments-container"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: compact ? '6px' : '8px',
        margin: '6px 0',
      }}
    >
      {attachments.map((att) => {
        const isImage = att.type === 'image';

        if (isImage) {
          // A. Image Attachments: Thumbnail preview, filename, image badge, remove button
          return (
            <div
              key={att.id}
              className="ai-attachment-card image-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: compact ? '3px 8px 3px 4px' : '5px 10px 5px 6px',
                backgroundColor: 'var(--bg-stone)',
                border: '1px solid var(--border-stone)',
                borderRadius: '4px',
                maxWidth: compact ? '200px' : '260px',
                position: 'relative',
              }}
            >
              {att.dataUrl ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  style={{
                    width: compact ? '28px' : '36px',
                    height: compact ? '28px' : '36px',
                    objectFit: 'cover',
                    borderRadius: '3px',
                    border: '1px solid var(--border-stone)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: compact ? '28px' : '36px',
                    height: compact ? '28px' : '36px',
                    backgroundColor: '#EFF6FF',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                >
                  <ImageIcon size={16} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: compact ? '11px' : '12px',
                    fontWeight: 600,
                    color: 'var(--ink-navy)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={att.name}
                >
                  {att.name}
                </div>
                <div
                  style={{
                    fontSize: '9.5px',
                    color: 'var(--ink-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(20, 71, 230, 0.1)',
                      color: 'var(--accent-blue)',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 700,
                      fontSize: '8.5px',
                    }}
                  >
                    IMAGE
                  </span>
                  <span>{att.sizeFormatted}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(att.id);
                }}
                title="Remove attachment"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  borderRadius: '50%',
                  marginLeft: '2px',
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        }

        // B. Document Attachments: Document preview card, file type badge, icon, name, size, remove button
        return (
          <div
            key={att.id}
            className="ai-attachment-card document-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: compact ? '4px 8px' : '6px 10px',
              backgroundColor: 'var(--bg-stone)',
              border: '1px solid var(--border-stone)',
              borderRadius: '4px',
              maxWidth: compact ? '210px' : '270px',
            }}
          >
            <div
              style={{
                width: compact ? '28px' : '34px',
                height: compact ? '28px' : '34px',
                backgroundColor:
                  att.fileType === 'PDF'
                    ? 'rgba(220, 38, 38, 0.1)'
                    : att.fileType === 'XLSX' || att.fileType === 'CSV'
                    ? 'rgba(22, 163, 74, 0.1)'
                    : 'rgba(20, 71, 230, 0.1)',
                color:
                  att.fileType === 'PDF'
                    ? '#DC2626'
                    : att.fileType === 'XLSX' || att.fileType === 'CSV'
                    ? '#16A34A'
                    : 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            >
              {att.fileType === 'XLSX' || att.fileType === 'CSV' ? (
                <FileSpreadsheet size={16} />
              ) : (
                <FileText size={16} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: compact ? '11px' : '12px',
                  fontWeight: 600,
                  color: 'var(--ink-navy)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={att.name}
              >
                {att.name}
              </div>
              <div
                style={{
                  fontSize: '9.5px',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.08)',
                    color: 'var(--ink-navy)',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontWeight: 700,
                    fontSize: '8.5px',
                  }}
                >
                  {att.fileType || 'DOC'}
                </span>
                <span>{att.sizeFormatted}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(att.id);
              }}
              title="Remove attachment"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                marginLeft: '2px',
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

