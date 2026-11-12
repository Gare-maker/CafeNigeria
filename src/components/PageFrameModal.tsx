import React, { useState } from 'react';
import { X, Check, Frame } from 'lucide-react';
import { PageFrameStyleId } from '../types';

export interface FrameDefinition {
  id: PageFrameStyleId;
  name: string;
  description: string;
  category: 'formal' | 'ornamental' | 'modern' | 'minimal';
  renderPreviewSvg: (color: string) => React.ReactNode;
}

export const FRAME_DEFINITIONS: FrameDefinition[] = [
  {
    id: 'none',
    name: 'No Frame',
    description: 'Clean borderless page without decorative frames.',
    category: 'minimal',
    renderPreviewSvg: () => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
        <text x="60" y="44" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="sans-serif">None</text>
      </svg>
    ),
  },
  {
    id: 'minimal-dotted',
    name: 'Minimal Dotted Frame',
    description: 'Clean, evenly spaced precision dots along the perimeter margins.',
    category: 'minimal',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="15" y="13" width="90" height="54" rx="1" stroke={color} strokeWidth="1.8" strokeDasharray="3 4" fill="none" />
      </svg>
    ),
  },
  {
    id: 'decorative-corner',
    name: 'Decorative Corner Frame',
    description: 'Refined classical corner brackets with elegant intersecting accent flourishes.',
    category: 'ornamental',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="15" y="13" width="90" height="54" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
        {/* Top Left Corner */}
        <path d="M 12 24 L 12 10 L 26 10" stroke={color} strokeWidth="2.2" strokeLinecap="square" fill="none" />
        <path d="M 16 20 L 16 14 L 22 14" stroke={color} strokeWidth="1.2" fill="none" />
        {/* Top Right Corner */}
        <path d="M 108 24 L 108 10 L 94 10" stroke={color} strokeWidth="2.2" strokeLinecap="square" fill="none" />
        <path d="M 104 20 L 104 14 L 98 14" stroke={color} strokeWidth="1.2" fill="none" />
        {/* Bottom Left Corner */}
        <path d="M 12 56 L 12 70 L 26 70" stroke={color} strokeWidth="2.2" strokeLinecap="square" fill="none" />
        <path d="M 16 60 L 16 66 L 22 66" stroke={color} strokeWidth="1.2" fill="none" />
        {/* Bottom Right Corner */}
        <path d="M 108 56 L 108 70 L 94 70" stroke={color} strokeWidth="2.2" strokeLinecap="square" fill="none" />
        <path d="M 104 60 L 104 66 L 98 66" stroke={color} strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  {
    id: 'classic-border',
    name: 'Classic Document Border',
    description: 'Timeless formal perimeter frame with balanced rule weights.',
    category: 'formal',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="14" y="12" width="92" height="56" stroke={color} strokeWidth="1.8" fill="none" />
        <rect x="17" y="15" width="86" height="50" stroke={color} strokeWidth="0.8" fill="none" />
      </svg>
    ),
  },
  {
    id: 'modern-geometric',
    name: 'Modern Geometric Frame',
    description: 'Contemporary architectural frame with cut-corner diamond angles.',
    category: 'modern',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <polygon points="22,12 98,12 108,22 108,58 98,68 22,68 12,58 12,22" stroke={color} strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="22" r="1.5" fill={color} />
        <circle cx="108" cy="22" r="1.5" fill={color} />
        <circle cx="108" cy="58" r="1.5" fill={color} />
        <circle cx="12" cy="58" r="1.5" fill={color} />
      </svg>
    ),
  },
  {
    id: 'floral-ornamental',
    name: 'Floral Ornamental Frame',
    description: 'Botanical scroll motifs and curved flourishes at all four corners.',
    category: 'ornamental',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="16" y="14" width="88" height="52" stroke={color} strokeWidth="1" strokeDasharray="6 3" fill="none" />
        {/* Floral corner petals */}
        <circle cx="16" cy="14" r="3.5" fill={color} opacity="0.8" />
        <circle cx="104" cy="14" r="3.5" fill={color} opacity="0.8" />
        <circle cx="104" cy="66" r="3.5" fill={color} opacity="0.8" />
        <circle cx="16" cy="66" r="3.5" fill={color} opacity="0.8" />
        <path d="M 22 14 C 22 18, 18 22, 16 22" stroke={color} strokeWidth="1.2" fill="none" />
        <path d="M 98 14 C 98 18, 102 22, 104 22" stroke={color} strokeWidth="1.2" fill="none" />
        <path d="M 98 66 C 98 62, 102 58, 104 58" stroke={color} strokeWidth="1.2" fill="none" />
        <path d="M 22 66 C 22 62, 18 58, 16 58" stroke={color} strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  {
    id: 'simple-double',
    name: 'Simple Double-Line Frame',
    description: 'Balanced dual parallel rules providing formal symmetry.',
    category: 'formal',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="14" y="12" width="92" height="56" stroke={color} strokeWidth="1.4" fill="none" />
        <rect x="18" y="16" width="84" height="48" stroke={color} strokeWidth="1.4" fill="none" />
      </svg>
    ),
  },
  {
    id: 'executive-solid',
    name: 'Professional Business Frame',
    description: 'Corporate aesthetic with bold header accent bar and crisp boundary rule.',
    category: 'formal',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="14" y="12" width="92" height="56" stroke={color} strokeWidth="1.2" fill="none" />
        {/* Bold top accent bar */}
        <rect x="14" y="12" width="92" height="5" fill={color} />
        {/* Subtle bottom bar */}
        <rect x="14" y="65" width="92" height="3" fill={color} />
      </svg>
    ),
  },
  {
    id: 'creative-artistic',
    name: 'Creative Artistic Frame',
    description: 'Alternating dash-dot perimeter with diamond corner junctions.',
    category: 'modern',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="15" y="13" width="90" height="54" stroke={color} strokeWidth="1.5" strokeDasharray="8 3 2 3" fill="none" />
        <rect x="13.5" y="11.5" width="3" height="3" transform="rotate(45 15 13)" fill={color} />
        <rect x="103.5" y="11.5" width="3" height="3" transform="rotate(45 105 13)" fill={color} />
        <rect x="103.5" y="65.5" width="3" height="3" transform="rotate(45 105 67)" fill={color} />
        <rect x="13.5" y="65.5" width="3" height="3" transform="rotate(45 15 67)" fill={color} />
      </svg>
    ),
  },
  {
    id: 'double-line-inset',
    name: 'Double-Line Inset Frame',
    description: 'Inner thin hairline paired with a crisp outer boundary rule.',
    category: 'formal',
    renderPreviewSvg: (color) => (
      <svg width="100%" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="10" y="8" width="100" height="64" rx="2" fill="#F8FAFC" />
        <rect x="13" y="11" width="94" height="58" stroke={color} strokeWidth="2" fill="none" />
        <rect x="18" y="16" width="84" height="48" stroke={color} strokeWidth="0.8" fill="none" />
      </svg>
    ),
  },
];

interface PageFrameModalProps {
  pageIndex: number;
  currentFrameStyle?: PageFrameStyleId;
  currentColor?: string;
  onApplyFrame: (frameId: PageFrameStyleId, color: string, applyToAll: boolean) => void;
  onClose: () => void;
}

export const PageFrameModal: React.FC<PageFrameModalProps> = ({
  pageIndex,
  currentFrameStyle = 'none',
  currentColor = '#0A194E',
  onApplyFrame,
  onClose,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<PageFrameStyleId>(currentFrameStyle);
  const [frameColor, setFrameColor] = useState<string>(currentColor || '#0A194E');
  const [applyToAllPages, setApplyToAllPages] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'formal' | 'ornamental' | 'modern' | 'minimal'>('all');

  const filteredFrames = activeTab === 'all'
    ? FRAME_DEFINITIONS
    : FRAME_DEFINITIONS.filter((f) => f.category === activeTab || f.id === 'none');

  const handleApply = () => {
    onApplyFrame(selectedStyle, frameColor, applyToAllPages);
    onClose();
  };

  return (
    <div className="nc-modal-backdrop no-print" style={{ zIndex: 9999 }}>
      <div
        className="nc-modal-dialog"
        style={{
          maxWidth: '680px',
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          backgroundColor: 'var(--bg-ivory)',
          border: '1.5px solid var(--border-stone)',
          boxShadow: '0 20px 50px rgba(10, 25, 78, 0.28)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-ivory)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Frame size={18} color="var(--accent-blue)" />
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--ink-navy)',
                }}
              >
                Page Frame Styles — Page {pageIndex + 1}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--ink-muted)' }}>
                Apply decorative frame designs around page margins without altering text content.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ed-subtle"
            style={{ padding: '6px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Filter Tabs & Color Control */}
        <div
          style={{
            padding: '10px 22px',
            borderBottom: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-stone)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            {(
              [
                ['all', 'All Styles'],
                ['formal', 'Formal & Classic'],
                ['ornamental', 'Decorative & Floral'],
                ['modern', 'Modern Geometric'],
                ['minimal', 'Minimal & Dotted'],
              ] as const
            ).map(([catId, label]) => (
              <button
                key={catId}
                type="button"
                onClick={() => setActiveTab(catId)}
                className={activeTab === catId ? 'btn-ed-primary' : 'btn-ed-subtle'}
                style={{ padding: '4px 9px', fontSize: '10px' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-navy)', fontWeight: 600 }}>
              Frame Color:
            </span>
            <input
              type="color"
              value={frameColor}
              onChange={(e) => setFrameColor(e.target.value)}
              style={{
                width: '26px',
                height: '24px',
                padding: 0,
                border: '1px solid var(--border-stone)',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        {/* Frame Styles Grid */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '14px',
          }}
        >
          {filteredFrames.map((frame) => {
            const isSelected = selectedStyle === frame.id;
            return (
              <div
                key={frame.id}
                onClick={() => setSelectedStyle(frame.id)}
                style={{
                  border: isSelected
                    ? '2px solid var(--accent-blue)'
                    : '1px solid var(--border-stone)',
                  backgroundColor: isSelected
                    ? 'rgba(20, 71, 230, 0.04)'
                    : 'var(--bg-ivory)',
                  padding: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      backgroundColor: 'var(--accent-blue)',
                      color: '#FFFFFF',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={11} />
                  </div>
                )}

                {/* SVG Visual Preview */}
                <div style={{ borderRadius: '3px', overflow: 'hidden' }}>
                  {frame.renderPreviewSvg(frameColor)}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSelected ? 'var(--accent-blue)' : 'var(--ink-navy)',
                    }}
                  >
                    {frame.name}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--ink-muted)',
                      lineHeight: 1.35,
                      marginTop: '3px',
                    }}
                  >
                    {frame.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-stone)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={applyToAllPages}
              onChange={(e) => setApplyToAllPages(e.target.checked)}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--ink-navy)' }}>
              Apply this frame design to all document pages
            </span>
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ed-subtle"
              style={{ padding: '7px 14px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn-ed-primary"
              style={{ padding: '7px 18px', fontWeight: 600 }}
            >
              Apply Frame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

