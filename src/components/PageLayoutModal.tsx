import React from 'react';
import { X } from 'lucide-react';
import { PageLayoutSettings } from '../types';

interface PageLayoutModalProps {
  layout: PageLayoutSettings;
  layoutScope: 'document' | 'page';
  activePageIndex: number;
  onChangeLayout: React.Dispatch<React.SetStateAction<PageLayoutSettings>>;
  onChangeScope: (scope: 'document' | 'page') => void;
  onResetDefault: () => void;
  onApplyAndClose: () => void;
  onClose: () => void;
}

export const PageLayoutModal: React.FC<PageLayoutModalProps> = ({
  layout,
  layoutScope,
  activePageIndex,
  onChangeLayout,
  onChangeScope,
  onResetDefault,
  onApplyAndClose,
  onClose,
}) => {
  return (
    <div className="nc-modal-backdrop no-print">
      <div className="nc-modal-dialog" style={{ maxWidth: '580px' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-ivory)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800 }}>
              Change Page Layout
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
              Customise page size, orientation, margins, columns and appearance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ed-subtle"
            style={{ padding: '5px' }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Page Size & Orientation */}
          <div className="nc-grid-2col">
            <div>
              <label className="ed-field-label">Page Size</label>
              <select
                value={layout.pageSize}
                onChange={(e) =>
                  onChangeLayout((prev) => ({
                    ...prev,
                    pageSize: e.target.value as PageLayoutSettings['pageSize'],
                  }))
                }
                className="ed-select"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="Letter">Letter (216 × 279 mm)</option>
                <option value="Legal">Legal (216 × 356 mm)</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            <div>
              <label className="ed-field-label">Page Orientation</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['portrait', 'landscape'] as const).map((orient) => {
                  const currentOrient =
                    layoutScope === 'page'
                      ? layout.sectionOrientations?.[activePageIndex] ||
                        layout.orientation
                      : layout.orientation;
                  return (
                    <button
                      key={orient}
                      type="button"
                      onClick={() => {
                        if (layoutScope === 'page') {
                          onChangeLayout((prev) => ({
                            ...prev,
                            sectionOrientations: {
                              ...(prev.sectionOrientations || {}),
                              [activePageIndex]: orient,
                            },
                          }));
                        } else {
                          onChangeLayout((prev) => ({
                            ...prev,
                            orientation: orient,
                            sectionOrientations: {},
                          }));
                        }
                      }}
                      className={
                        currentOrient === orient
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ flex: 1, padding: '8px' }}
                    >
                      {orient}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scope for Orientation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span className="ed-field-label" style={{ marginBottom: 0 }}>
              Apply Orientation To:
            </span>
            <button
              type="button"
              onClick={() => onChangeScope('document')}
              className={
                layoutScope === 'document' ? 'btn-ed-primary' : 'btn-ed-subtle'
              }
              style={{ padding: '4px 10px', fontSize: '9.5px' }}
            >
              Entire Document
            </button>
            <button
              type="button"
              onClick={() => onChangeScope('page')}
              className={
                layoutScope === 'page' ? 'btn-ed-primary' : 'btn-ed-subtle'
              }
              style={{ padding: '4px 10px', fontSize: '9.5px' }}
            >
              Page {activePageIndex + 1} Only
            </button>
          </div>

          {layout.pageSize === 'Custom' && (
            <div className="nc-grid-2col">
              <div>
                <label className="ed-field-label">Custom Width (mm)</label>
                <input
                  type="number"
                  value={layout.customWidthMm || 210}
                  onChange={(e) =>
                    onChangeLayout((prev) => ({
                      ...prev,
                      customWidthMm: parseInt(e.target.value || '210', 10),
                    }))
                  }
                  className="ed-input"
                />
              </div>
              <div>
                <label className="ed-field-label">Custom Height (mm)</label>
                <input
                  type="number"
                  value={layout.customHeightMm || 297}
                  onChange={(e) =>
                    onChangeLayout((prev) => ({
                      ...prev,
                      customHeightMm: parseInt(e.target.value || '297', 10),
                    }))
                  }
                  className="ed-input"
                />
              </div>
            </div>
          )}

          {/* Page Margins */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '6px',
              }}
            >
              <label className="ed-field-label" style={{ marginBottom: 0 }}>
                Page Margins (mm)
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {(
                  [
                    ['normal', 'Normal (25mm)', 25],
                    ['narrow', 'Narrow (13mm)', 13],
                    ['wide', 'Wide (35mm)', 35],
                  ] as const
                ).map(([preset, label, val]) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      onChangeLayout((prev) => ({
                        ...prev,
                        marginPreset: preset,
                        marginTopMm: val,
                        marginBottomMm: val,
                        marginLeftMm: val,
                        marginRightMm: val,
                      }))
                    }
                    className="btn-ed-subtle"
                    style={{ padding: '3px 7px', fontSize: '9px' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="nc-grid-4col">
              {(
                [
                  ['marginTopMm', 'Top'],
                  ['marginBottomMm', 'Bottom'],
                  ['marginLeftMm', 'Left'],
                  ['marginRightMm', 'Right'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="ed-field-label">{label}</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={layout[field]}
                    onChange={(e) =>
                      onChangeLayout((prev) => ({
                        ...prev,
                        marginPreset: 'custom',
                        [field]: parseInt(e.target.value || '20', 10),
                      }))
                    }
                    className="ed-input"
                    style={{ padding: '6px 8px' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Page Columns */}
          <div className="nc-grid-2col">
            <div>
              <label className="ed-field-label">Page Columns</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {([1, 2, 3] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onChangeLayout((prev) => ({ ...prev, columns: col }))
                    }
                    className={
                      layout.columns === col
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ flex: 1, padding: '7px' }}
                  >
                    {col} Col
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="ed-field-label">Column Spacing (px)</label>
              <input
                type="number"
                min={10}
                max={64}
                value={layout.columnGapPx}
                onChange={(e) =>
                  onChangeLayout((prev) => ({
                    ...prev,
                    columnGapPx: parseInt(e.target.value || '24', 10),
                  }))
                }
                className="ed-input"
                style={{ padding: '6px 8px' }}
              />
            </div>
          </div>

          {/* Page Appearance */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label className="ed-field-label">Page Background</label>
              <input
                type="color"
                value={layout.pageBackground}
                onChange={(e) =>
                  onChangeLayout((prev) => ({
                    ...prev,
                    pageBackground: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  height: '34px',
                  border: '1px solid var(--border-stone)',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div>
              <label className="ed-field-label">Page Border</label>
              <select
                value={layout.borderStyle}
                onChange={(e) =>
                  onChangeLayout((prev) => ({
                    ...prev,
                    borderStyle: e.target
                      .value as PageLayoutSettings['borderStyle'],
                  }))
                }
                className="ed-select"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="double">Double</option>
                <option value="dashed">Dashed</option>
              </select>
            </div>

            <div>
              <label className="ed-field-label">Border Thickness</label>
              <select
                value={layout.borderWidthPx}
                onChange={(e) =>
                  onChangeLayout((prev) => ({
                    ...prev,
                    borderWidthPx: parseInt(e.target.value, 10),
                  }))
                }
                className="ed-select"
              >
                <option value={1}>1 px</option>
                <option value={2}>2 px</option>
                <option value={4}>4 px</option>
                <option value={6}>6 px</option>
              </select>
            </div>

            <div>
              <label className="ed-field-label">Border Colour</label>
              <input
                type="color"
                value={layout.borderColor}
                onChange={(e) =>
                  onChangeLayout((prev) => ({
                    ...prev,
                    borderColor: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  height: '34px',
                  border: '1px solid var(--border-stone)',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-stone)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onResetDefault}
            className="btn-ed-subtle"
          >
            Reset to Default
          </button>

          <button
            type="button"
            onClick={onApplyAndClose}
            className="btn-ed-primary"
          >
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
};
