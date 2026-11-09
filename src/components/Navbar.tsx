import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Search,
  Settings,
  RefreshCw,
  Plus,
  ChevronDown,
  X,
} from 'lucide-react';
import { DocumentCategory } from '../types';
import { CATEGORY_PAGE_COPY } from '../services/aiGenerator';

interface NavbarProps {
  activeView: 'dashboard' | 'category' | 'workspace' | 'settings';
  activeCategory: DocumentCategory;
  onNavigateHome: () => void;
  onNavigateSettings: () => void;
  onOpenCreateModal: (category: DocumentCategory) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingSyncCount: number;
  isSyncing: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CREATE_DROPDOWN_ITEMS: { label: string; category: DocumentCategory }[] = [
  { label: 'Create Project', category: 'projects' },
  { label: 'Create Assignment', category: 'assignments' },
  { label: 'Create Seminar', category: 'seminars' },
  { label: 'Create CV', category: 'cv' },
  { label: 'Create Notes from Image', category: 'image-to-notes' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  activeCategory,
  onNavigateHome,
  onNavigateSettings,
  onOpenCreateModal,
  isOnline,
  onToggleOnline,
  pendingSyncCount,
  isSyncing,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
}) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCategoryView = activeView === 'category';
  const contextualLabel = isCategoryView
    ? CATEGORY_PAGE_COPY[activeCategory].buttonLabel
    : 'Create';

  return (
    <header
      className="no-print"
      style={{
        backgroundColor: 'var(--bg-ivory)',
        borderBottom: '1px solid var(--border-ivory)',
        position: 'sticky',
        top: 0,
        zIndex: 60,
      }}
    >
      <div
        className="nc-container"
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Left section: Nigerian Cafe application logo + Application name */}
        <button
          onClick={onNavigateHome}
          style={{
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
          title="Nigerian Cafe Home"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <rect x="10" y="2" width="4" height="8" fill="var(--ink-navy)" />
            <rect x="10" y="14" width="4" height="8" fill="var(--ink-navy)" />
            <rect x="2" y="10" width="8" height="4" fill="var(--ink-navy)" />
            <rect x="14" y="10" width="8" height="4" fill="var(--accent-blue)" />
            <rect x="15" y="4" width="4" height="4" fill="var(--accent-blue)" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: '17px',
              letterSpacing: '-0.03em',
              color: 'var(--ink-navy)',
            }}
          >
            Nigerian Cafe
          </span>
        </button>

        {/* Right section:
            - On Category/Details Page (Requirement 1): ONLY Theme toggle, Settings, and Create [Category] button (No search bar in header).
            - On Homepage: Search, Sync indicator, Theme toggle, Settings, and Global Create dropdown.
        */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {!isCategoryView && (
            <>
              {/* Search Input (Homepage Desktop) */}
              <div
                className="hide-on-mobile"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    color: 'var(--ink-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search documents & content..."
                  style={{
                    backgroundColor: 'var(--bg-ivory)',
                    border: '1px solid var(--border-ivory)',
                    padding: '6px 10px 6px 28px',
                    fontSize: '12.5px',
                    color: 'var(--ink-navy)',
                    width: '195px',
                    height: '34px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Search Toggle Button (Homepage Mobile) */}
              <button
                onClick={() => setShowMobileSearch((prev) => !prev)}
                className="show-on-mobile"
                title="Search documents"
                style={{
                  width: '34px',
                  height: '34px',
                  border: '1px solid var(--border-ivory)',
                  backgroundColor: showMobileSearch
                    ? 'var(--bg-stone)'
                    : 'transparent',
                  color: 'var(--ink-navy)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Search size={14} />
              </button>

              {/* Online/Offline Synchronisation Indicator */}
              <button
                onClick={onToggleOnline}
                title="Click to toggle Online / Offline synchronisation state"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '34px',
                  padding: '0 10px',
                  border: '1px solid var(--border-ivory)',
                  backgroundColor: isOnline
                    ? 'transparent'
                    : 'rgba(217, 78, 52, 0.08)',
                  color: isOnline
                    ? 'var(--ink-navy)'
                    : 'var(--accent-terracotta)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={12} color="var(--accent-blue)" />
                    <span className="hide-on-mobile">Syncing...</span>
                  </>
                ) : isOnline ? (
                  <>
                    <Wifi size={12} color="#16A34A" />
                    <span className="hide-on-mobile">Saved</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} color="var(--accent-terracotta)" />
                    <span>
                      Offline{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ''}
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            title="Switch Light / Dark Mode"
            style={{
              width: '34px',
              height: '34px',
              border: '1px solid var(--border-ivory)',
              backgroundColor: 'transparent',
              color: 'var(--ink-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Settings */}
          <button
            onClick={onNavigateSettings}
            title="Settings"
            style={{
              height: '34px',
              padding: '0 10px',
              border: '1px solid var(--border-ivory)',
              backgroundColor:
                activeView === 'settings' ? 'var(--bg-stone)' : 'transparent',
              color: 'var(--ink-navy)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12.5px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Settings size={14} />
            <span className="hide-on-mobile">Settings</span>
          </button>

          {/* Contextual Create Button on Category Pages vs Global Create Dropdown on Homepage */}
          {isCategoryView ? (
            <button
              onClick={() => onOpenCreateModal(activeCategory)}
              className="btn-ed-primary"
              style={{
                height: '34px',
                padding: '0 14px',
                fontSize: '10.5px',
              }}
            >
              <Plus size={13} />
              <span>{contextualLabel}</span>
            </button>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowCreateMenu((prev) => !prev)}
                className="btn-ed-primary"
                style={{
                  height: '34px',
                  padding: '0 14px',
                  fontSize: '10.5px',
                }}
              >
                <Plus size={13} />
                <span>Create</span>
                <ChevronDown size={12} />
              </button>

              {showCreateMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '215px',
                    backgroundColor: 'var(--bg-ivory)',
                    border: '1px solid var(--border-stone)',
                    boxShadow: '0 8px 24px rgba(10, 25, 78, 0.12)',
                    zIndex: 120,
                  }}
                >
                  {CREATE_DROPDOWN_ITEMS.map((item, idx) => (
                    <button
                      key={item.category}
                      onClick={() => {
                        setShowCreateMenu(false);
                        onOpenCreateModal(item.category);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom:
                          idx < CREATE_DROPDOWN_ITEMS.length - 1
                            ? '1px solid var(--border-ivory)'
                            : 'none',
                        color: 'var(--ink-navy)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'var(--bg-stone)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <span>{item.label}</span>
                      <span
                        style={{ color: 'var(--ink-muted)', fontSize: '11px' }}
                      >
                        →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Search Bar for Homepage Mobile Screens */}
      {!isCategoryView && showMobileSearch && (
        <div
          className="nc-container"
          style={{
            paddingTop: '8px',
            paddingBottom: '8px',
            borderTop: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-stone)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents & content..."
            className="ed-input"
            style={{ padding: '7px 11px', fontSize: '13px' }}
            autoFocus
          />
          <button
            onClick={() => setShowMobileSearch(false)}
            className="btn-ed-subtle"
            style={{ padding: '7px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </header>
  );
};
