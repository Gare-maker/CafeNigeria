import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Sliders,
  Columns as ColumnsIcon,
  AlignLeft,
  Palette,
  RotateCcw,
  Check,
} from 'lucide-react';
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

type LayoutTab = 'dimensions' | 'margins' | 'columns' | 'spacing' | 'appearance';

type MarginField =
  | 'marginTopMm'
  | 'marginBottomMm'
  | 'marginLeftMm'
  | 'marginRightMm';

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
  const [activeTab, setActiveTab] = useState<LayoutTab>('dimensions');

  // Local state for validated numerical inputs to avoid jitter while typing
  const [rawMargins, setRawMargins] = useState<Record<MarginField, string>>({
    marginTopMm: String(layout.marginTopMm ?? 25),
    marginBottomMm: String(layout.marginBottomMm ?? 25),
    marginLeftMm: String(layout.marginLeftMm ?? 25),
    marginRightMm: String(layout.marginRightMm ?? 25),
  });

  const [rawColumnCount, setRawColumnCount] = useState<string>(
    String(
      (layout.sectionColumns && layout.sectionColumns[activePageIndex]) ||
        layout.columns ||
        1
    )
  );

  const [rawColumnGap, setRawColumnGap] = useState<string>(
    String(layout.columnGapPx ?? 28)
  );

  const [rawLineSpacing, setRawLineSpacing] = useState<string>(
    String(layout.lineSpacing || '1.5')
  );

  const [rawHeaderSpacing, setRawHeaderSpacing] = useState<string>(
    String(layout.headerSpacingPx ?? 18)
  );

  const [rawFooterSpacing, setRawFooterSpacing] = useState<string>(
    String(layout.footerSpacingPx ?? 24)
  );

  const [columnScope, setColumnScope] = useState<'document' | 'page'>('document');
  const [borderScope, setBorderScope] = useState<'document' | 'page'>('document');

  // Synchronize when external layout changes
  useEffect(() => {
    setRawMargins({
      marginTopMm: String(layout.marginTopMm ?? 25),
      marginBottomMm: String(layout.marginBottomMm ?? 25),
      marginLeftMm: String(layout.marginLeftMm ?? 25),
      marginRightMm: String(layout.marginRightMm ?? 25),
    });
    setRawColumnGap(String(layout.columnGapPx ?? 28));
    setRawLineSpacing(String(layout.lineSpacing || '1.5'));
    setRawHeaderSpacing(String(layout.headerSpacingPx ?? 18));
    setRawFooterSpacing(String(layout.footerSpacingPx ?? 24));
    setRawColumnCount(
      String(
        (layout.sectionColumns && layout.sectionColumns[activePageIndex]) ||
          layout.columns ||
          1
      )
    );
  }, [layout, activePageIndex]);

  // Margin Handlers with Validation
  const handleMarginChange = (field: MarginField, val: string) => {
    setRawMargins((prev) => ({ ...prev, [field]: val }));
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onChangeLayout((prev) => ({
        ...prev,
        marginPreset: 'custom',
        [field]: parsed,
      }));
    }
  };

  const handleMarginBlur = (field: MarginField) => {
    const current = parseInt(rawMargins[field], 10);
    const clamped = isNaN(current) ? 25 : Math.max(0, Math.min(80, current));
    setRawMargins((prev) => ({ ...prev, [field]: String(clamped) }));
    onChangeLayout((prev) => ({
      ...prev,
      marginPreset: 'custom',
      [field]: clamped,
    }));
  };

  // Column Handlers with Validation
  const applyColumns = (cols: number) => {
    const clamped = Math.max(1, Math.min(6, cols));
    setRawColumnCount(String(clamped));
    if (columnScope === 'page') {
      onChangeLayout((prev) => ({
        ...prev,
        sectionColumns: {
          ...(prev.sectionColumns || {}),
          [activePageIndex]: clamped,
        },
      }));
    } else {
      onChangeLayout((prev) => ({
        ...prev,
        columns: clamped,
      }));
    }
  };

  const handleColumnGapChange = (val: string) => {
    setRawColumnGap(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 4 && parsed <= 80) {
      onChangeLayout((prev) => ({ ...prev, columnGapPx: parsed }));
    }
  };

  const handleColumnGapBlur = () => {
    const parsed = parseInt(rawColumnGap, 10);
    const clamped = isNaN(parsed) ? 28 : Math.max(4, Math.min(80, parsed));
    setRawColumnGap(String(clamped));
    onChangeLayout((prev) => ({ ...prev, columnGapPx: clamped }));
  };

  // Line Spacing Handlers with Validation
  const handleLineSpacingChange = (val: string) => {
    setRawLineSpacing(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0.8 && parsed <= 4.0) {
      onChangeLayout((prev) => ({ ...prev, lineSpacing: String(parsed) }));
    }
  };

  const handleLineSpacingBlur = () => {
    const parsed = parseFloat(rawLineSpacing);
    const clamped = isNaN(parsed) ? 1.5 : Math.max(0.8, Math.min(3.5, parsed));
    const formatted = clamped.toFixed(2).replace(/\.00$/, '');
    setRawLineSpacing(formatted);
    onChangeLayout((prev) => ({ ...prev, lineSpacing: formatted }));
  };

  // Header & Footer Spacing Handlers with Validation
  const handleHeaderSpacingChange = (val: string) => {
    setRawHeaderSpacing(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 80) {
      onChangeLayout((prev) => ({ ...prev, headerSpacingPx: parsed }));
    }
  };

  const handleHeaderSpacingBlur = () => {
    const parsed = parseInt(rawHeaderSpacing, 10);
    const clamped = isNaN(parsed) ? 18 : Math.max(0, Math.min(60, parsed));
    setRawHeaderSpacing(String(clamped));
    onChangeLayout((prev) => ({ ...prev, headerSpacingPx: clamped }));
  };

  const handleFooterSpacingChange = (val: string) => {
    setRawFooterSpacing(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 80) {
      onChangeLayout((prev) => ({ ...prev, footerSpacingPx: parsed }));
    }
  };

  const handleFooterSpacingBlur = () => {
    const parsed = parseInt(rawFooterSpacing, 10);
    const clamped = isNaN(parsed) ? 24 : Math.max(0, Math.min(60, parsed));
    setRawFooterSpacing(String(clamped));
    onChangeLayout((prev) => ({ ...prev, footerSpacingPx: clamped }));
  };

  const currentCols =
    (columnScope === 'page' &&
      layout.sectionColumns &&
      layout.sectionColumns[activePageIndex]) ||
    layout.columns ||
    1;

  return (
    <div className="nc-modal-backdrop no-print">
      <div
        className="nc-modal-dialog"
        style={{
          maxWidth: '640px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
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
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--ink-navy)',
                margin: 0,
              }}
            >
              Change Page Layout
            </h2>
            <p
              style={{
                fontSize: '11.5px',
                color: 'var(--ink-muted)',
                margin: '2px 0 0',
              }}
            >
              Configure dimensions, margins, flexible multi-columns, spacing, and styling.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ed-subtle"
            style={{ padding: '6px' }}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Grouped Section Tabs (Requirement 5) */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-stone)',
            padding: '0 10px',
          }}
        >
          {[
            { id: 'dimensions' as const, label: 'Dimensions & Orientation', icon: Maximize2 },
            { id: 'margins' as const, label: 'Margins', icon: Sliders },
            { id: 'columns' as const, label: 'Columns', icon: ColumnsIcon },
            { id: 'spacing' as const, label: 'Spacing & Alignment', icon: AlignLeft },
            { id: 'appearance' as const, label: 'Appearance', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive
                    ? '2px solid var(--accent-blue)'
                    : '2px solid transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--ink-muted)',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease',
                }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flex: 1,
          }}
        >
          {/* =================================================================
              SECTION 1: PAGE DIMENSIONS AND ORIENTATION
          ================================================================== */}
          {activeTab === 'dimensions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="nc-grid-2col">
                <div>
                  <label className="ed-field-label">Paper Size</label>
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
                          style={{
                            flex: 1,
                            padding: '8px',
                            textTransform: 'capitalize',
                          }}
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
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-stone)',
                  border: '1px solid var(--border-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--ink-navy)',
                    }}
                  >
                    Apply Orientation Scope
                  </span>
                  <p
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--ink-muted)',
                      margin: '2px 0 0',
                    }}
                  >
                    Choose whether orientation applies to the entire document or current page only.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onChangeScope('document')}
                    className={
                      layoutScope === 'document'
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ padding: '5px 10px', fontSize: '10px' }}
                  >
                    Entire Document
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeScope('page')}
                    className={
                      layoutScope === 'page' ? 'btn-ed-primary' : 'btn-ed-subtle'
                    }
                    style={{ padding: '5px 10px', fontSize: '10px' }}
                  >
                    Page {activePageIndex + 1} Only
                  </button>
                </div>
              </div>

              {layout.pageSize === 'Custom' && (
                <div className="nc-grid-2col">
                  <div>
                    <label className="ed-field-label">Custom Width (mm)</label>
                    <input
                      type="number"
                      min={100}
                      max={600}
                      value={layout.customWidthMm || 210}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || '210', 10);
                        if (!isNaN(v) && v > 50) {
                          onChangeLayout((prev) => ({
                            ...prev,
                            customWidthMm: v,
                          }));
                        }
                      }}
                      className="ed-input"
                    />
                  </div>
                  <div>
                    <label className="ed-field-label">Custom Height (mm)</label>
                    <input
                      type="number"
                      min={100}
                      max={800}
                      value={layout.customHeightMm || 297}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || '297', 10);
                        if (!isNaN(v) && v > 50) {
                          onChangeLayout((prev) => ({
                            ...prev,
                            customHeightMm: v,
                          }));
                        }
                      }}
                      className="ed-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              SECTION 2: PAGE MARGINS
          ================================================================== */}
          {activeTab === 'margins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="ed-field-label">Margin Presets</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                      onClick={() => {
                        setRawMargins({
                          marginTopMm: String(val),
                          marginBottomMm: String(val),
                          marginLeftMm: String(val),
                          marginRightMm: String(val),
                        });
                        onChangeLayout((prev) => ({
                          ...prev,
                          marginPreset: preset,
                          marginTopMm: val,
                          marginBottomMm: val,
                          marginLeftMm: val,
                          marginRightMm: val,
                        }));
                      }}
                      className={
                        layout.marginPreset === preset
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="ed-field-label">Custom Margin Values (mm)</label>
                <div className="nc-grid-4col">
                  {(
                    [
                      ['marginTopMm', 'Top Margin'],
                      ['marginBottomMm', 'Bottom Margin'],
                      ['marginLeftMm', 'Left Margin'],
                      ['marginRightMm', 'Right Margin'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--ink-muted)',
                          display: 'block',
                          marginBottom: '3px',
                        }}
                      >
                        {label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={rawMargins[field]}
                        onChange={(e) => handleMarginChange(field, e.target.value)}
                        onBlur={() => handleMarginBlur(field)}
                        className="ed-input"
                        style={{ padding: '6px 8px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.5,
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-stone)',
                }}
              >
                Tip: Standard Nigerian academic coursework typically uses 25mm (1 inch) margins on all sides.
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 3: COLUMN CONFIGURATION (Requirement 4 & 6)
          ================================================================== */}
          {activeTab === 'columns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="ed-field-label">Quick Column Presets</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => applyColumns(col)}
                      className={
                        currentCols === col ? 'btn-ed-primary' : 'btn-ed-subtle'
                      }
                      style={{ flex: 1, padding: '8px 6px', fontSize: '11px' }}
                    >
                      {col === 1 ? '1 Single' : `${col} Columns`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="nc-grid-2col">
                <div>
                  <label className="ed-field-label">
                    Exact Column Count (1 to 6)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={rawColumnCount}
                    onChange={(e) => {
                      setRawColumnCount(e.target.value);
                      const parsed = parseInt(e.target.value, 10);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
                        applyColumns(parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(rawColumnCount, 10);
                      const clamped = isNaN(parsed) ? 1 : Math.max(1, Math.min(6, parsed));
                      applyColumns(clamped);
                    }}
                    className="ed-input"
                  />
                </div>

                <div>
                  <label className="ed-field-label">
                    Column Gap / Spacing (px)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={80}
                    value={rawColumnGap}
                    onChange={(e) => handleColumnGapChange(e.target.value)}
                    onBlur={handleColumnGapBlur}
                    className="ed-input"
                  />
                </div>
              </div>

              {/* Column Scope Control (Per Document or Per Page / Section) */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-stone)',
                  border: '1px solid var(--border-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--ink-navy)',
                    }}
                  >
                    Column Application Scope
                  </span>
                  <p
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--ink-muted)',
                      margin: '2px 0 0',
                    }}
                  >
                    Apply columns to all pages or create a multi-column section on Page {activePageIndex + 1}.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setColumnScope('document');
                      onChangeLayout((prev) => ({
                        ...prev,
                        columns: currentCols,
                        sectionColumns: {},
                      }));
                    }}
                    className={
                      columnScope === 'document'
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ padding: '5px 10px', fontSize: '10px' }}
                  >
                    Entire Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setColumnScope('page');
                      onChangeLayout((prev) => ({
                        ...prev,
                        sectionColumns: {
                          ...(prev.sectionColumns || {}),
                          [activePageIndex]: currentCols,
                        },
                      }));
                    }}
                    className={
                      columnScope === 'page'
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{ padding: '5px 10px', fontSize: '10px' }}
                  >
                    Page {activePageIndex + 1} Only
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 4: SPACING & ALIGNMENT (Requirement 6)
          ================================================================== */}
          {activeTab === 'spacing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="ed-field-label">Line Spacing Presets</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: '1.0', label: '1.0 Single' },
                    { id: '1.15', label: '1.15 Normal' },
                    { id: '1.5', label: '1.5 Academic (Thesis)' },
                    { id: '2.0', label: '2.0 Double' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setRawLineSpacing(preset.id);
                        onChangeLayout((prev) => ({
                          ...prev,
                          lineSpacing: preset.id,
                        }));
                      }}
                      className={
                        (layout.lineSpacing || '1.5') === preset.id
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="ed-field-label">
                  Custom Line Spacing Multiplier
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.8"
                  max="3.5"
                  value={rawLineSpacing}
                  onChange={(e) => handleLineSpacingChange(e.target.value)}
                  onBlur={handleLineSpacingBlur}
                  className="ed-input"
                  style={{ maxWidth: '240px' }}
                />
              </div>

              <div className="nc-grid-2col">
                <div>
                  <label className="ed-field-label">
                    Header Spacing (px)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={rawHeaderSpacing}
                    onChange={(e) => handleHeaderSpacingChange(e.target.value)}
                    onBlur={handleHeaderSpacingBlur}
                    className="ed-input"
                  />
                </div>

                <div>
                  <label className="ed-field-label">
                    Footer Spacing (px)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={rawFooterSpacing}
                    onChange={(e) => handleFooterSpacingChange(e.target.value)}
                    onBlur={handleFooterSpacingBlur}
                    className="ed-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 5: PAGE APPEARANCE
          ================================================================== */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label className="ed-field-label">Page Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={layout.pageBackground || '#FFFFFF'}
                      onChange={(e) =>
                        onChangeLayout((prev) => ({
                          ...prev,
                          pageBackground: e.target.value,
                        }))
                      }
                      style={{
                        width: '38px',
                        height: '34px',
                        border: '1px solid var(--border-stone)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={layout.pageBackground || '#FFFFFF'}
                      onChange={(e) =>
                        onChangeLayout((prev) => ({
                          ...prev,
                          pageBackground: e.target.value,
                        }))
                      }
                      className="ed-input"
                      style={{ padding: '6px 8px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="ed-field-label">Border Style</label>
                  <select
                    value={
                      (layout.sectionBorders && layout.sectionBorders[activePageIndex]?.borderStyle) ||
                      layout.borderStyle ||
                      'none'
                    }
                    onChange={(e) => {
                      const newStyle = e.target.value as PageLayoutSettings['borderStyle'];
                      if (borderScope === 'page') {
                        onChangeLayout((prev) => ({
                          ...prev,
                          sectionBorders: {
                            ...(prev.sectionBorders || {}),
                            [activePageIndex]: {
                              borderStyle: newStyle,
                              borderWidthPx: prev.sectionBorders?.[activePageIndex]?.borderWidthPx ?? prev.borderWidthPx ?? 1,
                              borderColor: prev.sectionBorders?.[activePageIndex]?.borderColor ?? prev.borderColor ?? '#0A194E',
                              borderInsetMm: prev.sectionBorders?.[activePageIndex]?.borderInsetMm ?? prev.borderInsetMm ?? 10,
                            },
                          },
                        }));
                      } else {
                        onChangeLayout((prev) => ({
                          ...prev,
                          borderStyle: newStyle,
                        }));
                      }
                    }}
                    className="ed-select"
                  >
                    <option value="none">None</option>
                    <option value="solid">Solid</option>
                    <option value="double">Double</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>

                <div>
                  <label className="ed-field-label">Border Width</label>
                  <select
                    value={
                      (layout.sectionBorders && layout.sectionBorders[activePageIndex]?.borderWidthPx) ||
                      layout.borderWidthPx ||
                      1
                    }
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value, 10);
                      if (borderScope === 'page') {
                        onChangeLayout((prev) => ({
                          ...prev,
                          sectionBorders: {
                            ...(prev.sectionBorders || {}),
                            [activePageIndex]: {
                              borderStyle: prev.sectionBorders?.[activePageIndex]?.borderStyle ?? prev.borderStyle ?? 'solid',
                              borderWidthPx: newWidth,
                              borderColor: prev.sectionBorders?.[activePageIndex]?.borderColor ?? prev.borderColor ?? '#0A194E',
                              borderInsetMm: prev.sectionBorders?.[activePageIndex]?.borderInsetMm ?? prev.borderInsetMm ?? 10,
                            },
                          },
                        }));
                      } else {
                        onChangeLayout((prev) => ({
                          ...prev,
                          borderWidthPx: newWidth,
                        }));
                      }
                    }}
                    className="ed-select"
                  >
                    <option value={1}>1 px</option>
                    <option value={2}>2 px</option>
                    <option value={3}>3 px</option>
                    <option value={4}>4 px</option>
                    <option value={5}>5 px</option>
                    <option value={6}>6 px</option>
                    <option value={8}>8 px</option>
                  </select>
                </div>

                <div>
                  <label className="ed-field-label">Border Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={
                        (layout.sectionBorders && layout.sectionBorders[activePageIndex]?.borderColor) ||
                        layout.borderColor ||
                        '#0A194E'
                      }
                      onChange={(e) => {
                        const newColor = e.target.value;
                        if (borderScope === 'page') {
                          onChangeLayout((prev) => ({
                            ...prev,
                            sectionBorders: {
                              ...(prev.sectionBorders || {}),
                              [activePageIndex]: {
                                borderStyle: prev.sectionBorders?.[activePageIndex]?.borderStyle ?? prev.borderStyle ?? 'solid',
                                borderWidthPx: prev.sectionBorders?.[activePageIndex]?.borderWidthPx ?? prev.borderWidthPx ?? 1,
                                borderColor: newColor,
                                borderInsetMm: prev.sectionBorders?.[activePageIndex]?.borderInsetMm ?? prev.borderInsetMm ?? 10,
                              },
                            },
                          }));
                        } else {
                          onChangeLayout((prev) => ({
                            ...prev,
                            borderColor: newColor,
                          }));
                        }
                      }}
                      style={{
                        width: '38px',
                        height: '34px',
                        border: '1px solid var(--border-stone)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={
                        (layout.sectionBorders && layout.sectionBorders[activePageIndex]?.borderColor) ||
                        layout.borderColor ||
                        '#0A194E'
                      }
                      onChange={(e) => {
                        const newColor = e.target.value;
                        if (borderScope === 'page') {
                          onChangeLayout((prev) => ({
                            ...prev,
                            sectionBorders: {
                              ...(prev.sectionBorders || {}),
                              [activePageIndex]: {
                                borderStyle: prev.sectionBorders?.[activePageIndex]?.borderStyle ?? prev.borderStyle ?? 'solid',
                                borderWidthPx: prev.sectionBorders?.[activePageIndex]?.borderWidthPx ?? prev.borderWidthPx ?? 1,
                                borderColor: newColor,
                                borderInsetMm: prev.sectionBorders?.[activePageIndex]?.borderInsetMm ?? prev.borderInsetMm ?? 10,
                              },
                            },
                          }));
                        } else {
                          onChangeLayout((prev) => ({
                            ...prev,
                            borderColor: newColor,
                          }));
                        }
                      }}
                      className="ed-input"
                      style={{ padding: '6px 8px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="ed-field-label">Border Inset (mm)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={
                      (layout.sectionBorders && layout.sectionBorders[activePageIndex]?.borderInsetMm !== undefined
                        ? layout.sectionBorders[activePageIndex]?.borderInsetMm
                        : layout.borderInsetMm !== undefined
                        ? layout.borderInsetMm
                        : 10)
                    }
                    onChange={(e) => {
                      const inset = Math.max(0, Math.min(30, parseInt(e.target.value, 10) || 0));
                      if (borderScope === 'page') {
                        onChangeLayout((prev) => ({
                          ...prev,
                          sectionBorders: {
                            ...(prev.sectionBorders || {}),
                            [activePageIndex]: {
                              borderStyle: prev.sectionBorders?.[activePageIndex]?.borderStyle ?? prev.borderStyle ?? 'solid',
                              borderWidthPx: prev.sectionBorders?.[activePageIndex]?.borderWidthPx ?? prev.borderWidthPx ?? 1,
                              borderColor: prev.sectionBorders?.[activePageIndex]?.borderColor ?? prev.borderColor ?? '#0A194E',
                              borderInsetMm: inset,
                            },
                          },
                        }));
                      } else {
                        onChangeLayout((prev) => ({
                          ...prev,
                          borderInsetMm: inset,
                        }));
                      }
                    }}
                    className="ed-input"
                    style={{ padding: '6px 8px', fontSize: '11px' }}
                  />
                </div>
              </div>

              {/* Border Application Scope */}
              <div
                style={{
                  borderTop: '1px solid var(--border-stone)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <label className="ed-field-label" style={{ marginBottom: '2px' }}>
                    Apply Border To:
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Choose whether this border applies to the entire document or only Page {activePageIndex + 1}.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setBorderScope('document')}
                    className={borderScope === 'document' ? 'btn-ed-primary' : 'btn-ed-subtle'}
                    style={{ padding: '5px 12px', fontSize: '11px' }}
                  >
                    Entire Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorderScope('page')}
                    className={borderScope === 'page' ? 'btn-ed-primary' : 'btn-ed-subtle'}
                    style={{ padding: '5px 12px', fontSize: '11px' }}
                  >
                    Page {activePageIndex + 1} Only
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={12} />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={onApplyAndClose}
            className="btn-ed-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={13} />
            <span>Apply Layout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
