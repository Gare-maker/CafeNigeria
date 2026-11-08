import React, { useState, useEffect } from 'react';
import { DocumentCategory, DocumentItem } from './types';
import { INITIAL_DOCUMENTS } from './services/aiGenerator';
import {
  exportToDocx,
  exportToPdf,
  exportToTxt,
} from './services/exportService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CategoryPageView } from './components/CategoryPageView';
import { WorkspaceView } from './components/WorkspaceView';
import { CreateDocumentModal } from './components/CreateDocumentModal';
import { SettingsView } from './components/TemplatesAndSettingsView';

const STORAGE_KEY = 'nigerian_cafe_documents_v3';

export function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_DOCUMENTS;
  });

  const [activeView, setActiveView] = useState<
    'dashboard' | 'category' | 'workspace' | 'settings'
  >('dashboard');

  const [activeCategory, setActiveCategory] =
    useState<DocumentCategory>('projects');
  const [activeDocumentId, setActiveDocumentId] = useState<string>(
    INITIAL_DOCUMENTS[0].id
  );
  const [createModalCategory, setCreateModalCategory] =
    useState<DocumentCategory | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist documents automatically on every change (Section 8)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch {
      // ignore quota error
    }
  }, [documents]);

  // Apply Dark/Light theme attribute
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    );
  }, [darkMode]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => triggerReconnectionSync();
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerReconnectionSync = () => {
    setIsOnline(true);
    setIsSyncing(true);
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) => ({
          ...d,
          syncStatus: 'saved',
        }))
      );
      setIsSyncing(false);
    }, 650);
  };

  const handleToggleOnline = () => {
    if (isOnline) {
      setIsOnline(false);
    } else {
      triggerReconnectionSync();
    }
  };

  const pendingSyncCount = documents.filter(
    (d) => d.syncStatus === 'offline-pending'
  ).length;

  const handleOpenDocument = (docId: string) => {
    setActiveDocumentId(docId);
    setActiveView('workspace');
  };

  const handleUpdateDocument = (updated: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  };

  const handleRenameDocument = (docId: string, newTitle: string) => {
    const now = new Date();
    const updatedAt = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              title: newTitle,
              updatedAt,
              syncStatus: isOnline ? 'saved' : 'offline-pending',
            }
          : d
      )
    );
  };

  const handleDuplicateDocument = (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const copy: DocumentItem = {
      ...target,
      id: `doc-${Date.now()}`,
      title: `${target.title} (Copy)`,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: isOnline ? 'saved' : 'offline-pending',
    };
    setDocuments((prev) => [copy, ...prev]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const activeDocument =
    documents.find((d) => d.id === activeDocumentId) || documents[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header (Shown on Homepage, Category Pages and Settings) */}
      {activeView !== 'workspace' && (
        <Navbar
          activeView={activeView}
          activeCategory={activeCategory}
          onNavigateHome={() => {
            setSearchQuery('');
            setActiveView('dashboard');
          }}
          onNavigateSettings={() => setActiveView('settings')}
          onOpenCreateModal={(cat) => setCreateModalCategory(cat)}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          pendingSyncCount={pendingSyncCount}
          isSyncing={isSyncing}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <main style={{ flex: 1 }}>
        {activeView === 'dashboard' && (
          <DashboardView
            documents={documents}
            searchQuery={searchQuery}
            onSelectCategory={(cat) => {
              setSearchQuery('');
              setActiveCategory(cat);
              setActiveView('category');
            }}
            onOpenDocument={handleOpenDocument}
          />
        )}

        {activeView === 'category' && (
          <CategoryPageView
            category={activeCategory}
            documents={documents}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBackHome={() => {
              setSearchQuery('');
              setActiveView('dashboard');
            }}
            onOpenDocument={handleOpenDocument}
            onRenameDocument={handleRenameDocument}
            onDuplicateDocument={handleDuplicateDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeView === 'workspace' && activeDocument && (
          <WorkspaceView
            document={activeDocument}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onBack={() => {
              setActiveCategory(activeDocument.category);
              setActiveView('category');
            }}
            onUpdateDocument={handleUpdateDocument}
            onExportDocx={exportToDocx}
            onExportPdf={exportToPdf}
            onExportTxt={exportToTxt}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            onBackHome={() => {
              setSearchQuery('');
              setActiveView('dashboard');
            }}
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
            pendingSyncCount={pendingSyncCount}
            onForceSyncNow={triggerReconnectionSync}
            totalDocuments={documents.length}
            onResetDemoData={() => {
              setDocuments(INITIAL_DOCUMENTS);
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(INITIAL_DOCUMENTS)
              );
            }}
          />
        )}
      </main>

      {/* Specific Creation Modal (Section 4) */}
      {createModalCategory && (
        <CreateDocumentModal
          category={createModalCategory}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          onClose={() => setCreateModalCategory(null)}
          onDocumentCreated={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
            setCreateModalCategory(null);
            handleOpenDocument(newDoc.id);
          }}
        />
      )}
    </div>
  );
}
export default App;
