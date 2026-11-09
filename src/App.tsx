import React, { useState, useEffect, useRef } from 'react';
import { DocumentCategory, DocumentItem } from './types';
import {
  INITIAL_DOCUMENTS,
  getCurrentFormattedDate,
} from './services/aiGenerator';
import {
  exportToDocx,
  exportToPdf,
  exportToTxt,
  saveDocumentToComputerFile,
  openDocumentFromComputerFile,
} from './services/exportService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CategoryPageView } from './components/CategoryPageView';
import { WorkspaceView } from './components/WorkspaceView';
import { CreateDocumentModal } from './components/CreateDocumentModal';
import { SettingsView } from './components/TemplatesAndSettingsView';

const STORAGE_KEY = 'nigerian_cafe_documents_v4';

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

  // Store local computer file handles keyed by document ID (Requirement 14)
  const fileHandlesRef = useRef<Record<string, any>>({});

  // Persist documents automatically on every change
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
    const updatedAt = getCurrentFormattedDate();

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
    const timestamp = getCurrentFormattedDate();

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

  // Requirement 14: Save document directly to local computer file
  const handleSaveToComputer = async (doc: DocumentItem) => {
    try {
      const existingHandle = fileHandlesRef.current[doc.id];
      const result = await saveDocumentToComputerFile(doc, existingHandle);
      if (result.handle) {
        fileHandlesRef.current[doc.id] = result.handle;
      }
      if (result.fileName) {
        handleUpdateDocument({
          ...doc,
          metadata: {
            ...doc.metadata,
            localFileName: result.fileName,
          },
        });
      }
    } catch {
      // user cancelled or error
    }
  };

  // Requirement 14: Open document from local computer file into the workspace
  const handleOpenFromComputer = async () => {
    try {
      const opened = await openDocumentFromComputerFile();
      if (!opened) return;
      const { doc, handle } = opened;
      if (handle) {
        fileHandlesRef.current[doc.id] = handle;
      }
      setDocuments((prev) => {
        const exists = prev.some((d) => d.id === doc.id);
        if (exists) {
          return prev.map((d) => (d.id === doc.id ? doc : d));
        }
        return [doc, ...prev];
      });
      setActiveCategory(doc.category);
      setActiveDocumentId(doc.id);
      setActiveView('workspace');
    } catch (err: any) {
      if (err?.message) {
        alert(err.message);
      }
    }
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
            onOpenComputerFile={handleOpenFromComputer}
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
            onSaveToComputer={handleSaveToComputer}
            onOpenFromComputer={handleOpenFromComputer}
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
            onSaveToComputer={handleSaveToComputer}
            onOpenFromComputer={handleOpenFromComputer}
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

      {/* Specific Creation Modal (Requirements 15, 16, 17) */}
      {createModalCategory && (
        <CreateDocumentModal
          category={createModalCategory}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          onClose={() => setCreateModalCategory(null)}
          existingDocuments={documents}
          onDocumentCreated={(newDoc, isUpdatingExisting) => {
            if (isUpdatingExisting) {
              setDocuments((prev) =>
                prev.map((d) => (d.id === newDoc.id ? newDoc : d))
              );
            } else {
              setDocuments((prev) => [newDoc, ...prev]);
            }
            setCreateModalCategory(null);
            handleOpenDocument(newDoc.id);
          }}
        />
      )}
    </div>
  );
}
export default App;
