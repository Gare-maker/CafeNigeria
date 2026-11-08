import React, { useState } from 'react';
import {
  Monitor,
  Globe,
  RefreshCw,
  HardDrive,
  User,
  ArrowLeft,
} from 'lucide-react';

interface SettingsViewProps {
  onBackHome: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingSyncCount: number;
  onForceSyncNow: () => void;
  totalDocuments: number;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBackHome,
  isOnline,
  onToggleOnline,
  pendingSyncCount,
  onForceSyncNow,
  totalDocuments,
  onResetDemoData,
}) => {
  const [operatorName, setOperatorName] = useState(
    'Nigerian Cafe Document Centre'
  );
  const [operatorEmail, setOperatorEmail] = useState(
    'operator@nigeriancafe.ng'
  );
  const [defaultRefStyle, setDefaultRefStyle] = useState('APA 7th Edition');
  const [defaultFont, setDefaultFont] = useState('Times New Roman');
  const [savedNotice, setSavedNotice] = useState(false);

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-ivory)',
        minHeight: 'calc(100vh - 60px)',
        paddingTop: '40px',
        paddingBottom: '72px',
      }}
    >
      <div className="nc-container">
        {/* Section 1: Clearly Visible Back to Home Navigation Option */}
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

        <h1 className="display-heading">Settings</h1>
        <p
          style={{
            fontSize: '14.5px',
            color: 'var(--ink-muted)',
            marginTop: '8px',
            marginBottom: '32px',
          }}
        >
          Manage your account preferences, default formatting and offline
          synchronisation.
        </p>

        <div className="nc-settings-grid">
          {/* User Account & Operator Profile */}
          <div
            style={{
              border: '1px solid var(--border-ivory)',
              padding: '20px',
              backgroundColor: 'var(--bg-ivory)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginBottom: '18px',
              }}
            >
              <User size={17} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '15.5px', fontWeight: 700 }}>
                Account &amp; Document Defaults
              </h2>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <label className="ed-field-label">Account / Centre Name</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="ed-input"
                />
              </div>

              <div>
                <label className="ed-field-label">
                  Synchronisation Email
                </label>
                <input
                  type="email"
                  value={operatorEmail}
                  onChange={(e) => setOperatorEmail(e.target.value)}
                  className="ed-input"
                />
              </div>

              <div className="nc-grid-2col">
                <div>
                  <label className="ed-field-label">Default Citation</label>
                  <select
                    value={defaultRefStyle}
                    onChange={(e) => setDefaultRefStyle(e.target.value)}
                    className="ed-select"
                  >
                    <option>APA 7th Edition</option>
                    <option>Harvard</option>
                    <option>IEEE</option>
                    <option>MLA 9th Edition</option>
                  </select>
                </div>
                <div>
                  <label className="ed-field-label">Default Font</label>
                  <select
                    value={defaultFont}
                    onChange={(e) => setDefaultFont(e.target.value)}
                    className="ed-select"
                  >
                    <option>Times New Roman</option>
                    <option>Georgia</option>
                    <option>Plus Jakarta Sans</option>
                    <option>Calibri</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <button
                  onClick={() => {
                    setSavedNotice(true);
                    setTimeout(() => setSavedNotice(false), 2500);
                  }}
                  className="btn-ed-primary"
                >
                  Save Preferences
                </button>
                {savedNotice && (
                  <span
                    className="mono-label"
                    style={{ color: '#16A34A', fontSize: '10px' }}
                  >
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Offline Synchronisation & Desktop Engine */}
          <div
            style={{
              border: '1px solid var(--border-ivory)',
              padding: '24px',
              backgroundColor: 'var(--bg-stone)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginBottom: '16px',
                }}
              >
                <HardDrive size={17} color="var(--accent-blue)" />
                <h2 style={{ fontSize: '15.5px', fontWeight: 700 }}>
                  Offline Persistence &amp; Synchronisation
                </h2>
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                }}
              >
                Documents are automatically saved locally so you can continue
                editing offline. Changes synchronise automatically when
                connectivity returns.
              </p>

              <div
                style={{
                  border: '1px solid var(--border-ivory)',
                  backgroundColor: 'var(--bg-ivory)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12.5px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Connection Status:
                  </span>
                  <strong
                    style={{
                      color: isOnline ? '#16A34A' : 'var(--accent-terracotta)',
                    }}
                  >
                    {isOnline ? 'Online (Synced)' : 'Offline (Local Storage)'}
                  </strong>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Documents in Library:
                  </span>
                  <strong>{totalDocuments}</strong>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--ink-muted)' }}>
                    Pending Offline Changes:
                  </span>
                  <strong>{pendingSyncCount}</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '20px',
              }}
            >
              <button onClick={onToggleOnline} className="btn-ed-outline">
                {isOnline ? 'Simulate Offline' : 'Reconnect Online'}
              </button>

              <button
                onClick={onForceSyncNow}
                disabled={!isOnline}
                className="btn-ed-primary"
              >
                <RefreshCw size={12} />
                <span>Sync Now</span>
              </button>

              <button onClick={onResetDemoData} className="btn-ed-subtle">
                Reset Demo Docs
              </button>
            </div>
          </div>
        </div>

        {/* Desktop & Web Platform Info */}
        <div
          style={{
            marginTop: '20px',
            border: '1px solid var(--border-ivory)',
            padding: '18px 22px',
            backgroundColor: 'var(--bg-ivory)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
            <strong style={{ color: 'var(--ink-navy)' }}>
              Web + Desktop Synchronisation:
            </strong>{' '}
            Your document library stays consistent across Web, Windows Desktop
            and macOS Desktop.
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="mono-label"
              style={{
                padding: '6px 10px',
                border: '1px solid var(--border-ivory)',
                fontSize: '9.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Monitor size={12} /> Desktop Ready
            </span>
            <span
              className="mono-label"
              style={{
                padding: '6px 10px',
                border: '1px solid var(--border-ivory)',
                fontSize: '9.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Globe size={12} /> Web Active
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
