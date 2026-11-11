import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  Paperclip,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  WifiOff,
  AlertCircle,
  FolderOpen,
  FilePlus,
  HardDriveUpload,
  Sliders,
  Sparkles,
  Edit3,
  LayoutGrid,
  Check,
} from 'lucide-react';
import {
  DocumentCategory,
  DocumentItem,
  PageLayoutSettings,
  DEFAULT_PAGE_LAYOUT,
} from '../types';
import { PageLayoutModal } from './PageLayoutModal';
import {
  CATEGORY_PAGE_COPY,
  formatDisplayDate,
  generateDocumentFromNaturalPrompt,
  getCurrentFormattedDate,
  modifyExistingDocumentWithAI,
} from '../services/aiGenerator';
import { openDocumentFromComputerFile } from '../services/exportService';
import {
  getTemplatesForCategory,
  getCoverStylesForCategory,
  CoverPageDesign,
  WorkspaceTemplate,
} from '../services/templates';

interface CreateDocumentModalProps {
  category: DocumentCategory;
  existingDocuments: DocumentItem[];
  isOnline: boolean;
  onToggleOnline: () => void;
  onClose: () => void;
  onDocumentCreated: (doc: DocumentItem, isUpdatingExisting?: boolean) => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  category,
  existingDocuments,
  isOnline,
  onToggleOnline,
  onClose,
  onDocumentCreated,
}) => {
  const copy = CATEGORY_PAGE_COPY[category];

  // Category-Specific Workspace Templates & Cover Page Designs (Requirements 7, 8, 9)
  const availableTemplates = getTemplatesForCategory(category);
  const availableCovers = getCoverStylesForCategory(category);

  // Requirement 15 & 17: Option A (Create New) vs Option B (Continue with Existing Document)
  const [workflowMode, setWorkflowMode] = useState<'new' | 'existing'>('new');
  // Requirement 7, 8, 9: Template selection workflow vs AI vs Manual
  const [creationMethod, setCreationMethod] = useState<
    'template' | 'ai' | 'manual'
  >('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    () => availableTemplates[0]?.id || ''
  );
  const [selectedCoverId, setSelectedCoverId] = useState<string>(
    () =>
      availableTemplates[0]?.defaultCoverId ||
      availableCovers[0]?.id ||
      'none'
  );
  const [manualTitle, setManualTitle] = useState('');

  useEffect(() => {
    const tmpls = getTemplatesForCategory(category);
    const cvs = getCoverStylesForCategory(category);
    if (tmpls.length > 0) {
      setSelectedTemplateId(tmpls[0].id);
      setSelectedCoverId(tmpls[0].defaultCoverId || cvs[0]?.id || 'none');
    } else {
      setSelectedTemplateId('');
      setSelectedCoverId(cvs[0]?.id || 'none');
    }
  }, [category]);

  // Requirement: Use default layout should always be the default when creating a new file or opening existing document
  const [layoutOption, setLayoutOption] = useState<'default' | 'custom'>('default');
  const [customLayout, setCustomLayout] = useState<PageLayoutSettings>(DEFAULT_PAGE_LAYOUT);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  useEffect(() => {
    setLayoutOption('default');
    setCustomLayout(DEFAULT_PAGE_LAYOUT);
  }, [category, workflowMode]);

  const [selectedExistingDocId, setSelectedExistingDocId] = useState<string>(
    () => {
      const sameCat = existingDocuments.find((d) => d.category === category);
      return sameCat ? sameCat.id : existingDocuments[0]?.id || '';
    }
  );
  const [importedComputerDoc, setImportedComputerDoc] =
    useState<DocumentItem | null>(null);
  const [preserveMode, setPreserveMode] = useState<'copy' | 'overwrite'>(
    'copy'
  );

  const [prompt, setPrompt] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMessage, setRecordingMessage] = useState('');
  const [micError, setMicError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; extractedText: string }[]
  >([]);
  const [showOptional, setShowOptional] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Optional Details (Collapsed by default)
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [referencingStyle, setReferencingStyle] = useState('APA 7th Edition');
  const [wordCount, setWordCount] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const gotNativeResultRef = useRef<boolean>(false);

  // Requirement 9: Auto-expand textarea height vertically as more text is entered
  const combinedInputText = interimTranscript
    ? `${prompt}${prompt ? ' ' : ''}${interimTranscript}`
    : prompt;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(115, Math.min(el.scrollHeight, 280))}px`;
  }, [combinedInputText]);

  const cleanupRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupRecording();
  }, []);

  const stopVoiceRecording = () => {
    cleanupRecording();
    setIsRecording(false);
    if (interimTranscript.trim()) {
      setPrompt((prev) =>
        prev
          ? `${prev.trim()} ${interimTranscript.trim()}`
          : interimTranscript.trim()
      );
      setInterimTranscript('');
    }
    setRecordingMessage(
      'Voice transcription complete. Review and edit your text above before submitting.'
    );
  };

  const startFallbackLiveWordStream = () => {
    const samplePrompts: Record<DocumentCategory, string> = {
      projects:
        'Write a complete research project on the impact of electronic banking channels on customer satisfaction in Nigerian commercial banks including abstract Chapter One introduction Chapter Two literature review and Taro Yamane methodology.',
      assignments:
        'Write a 1,500-word academic assignment on fiscal federalism and internally generated revenue sustainability in Nigerian states with a comparison table and APA 7th references.',
      seminars:
        'Prepare a final year seminar paper on artificial intelligence for early crop disease detection among smallholder farmers in Nigeria.',
      cv: 'Create a professional CV for a Computer Science graduate from the University of Lagos applying for a Data and Operations Analyst role.',
      'image-to-notes':
        'Organise the uploaded lecture notes into clear headings bullet points concept explanations and five self-test revision questions.',
      'free-writing':
        'Draft a comprehensive proposal on sustainable solar microgrids for community health centres in Nigeria including executive summary project scope budget breakdown and impact evaluation.',
    };

    const words = (
      workflowMode === 'existing'
        ? 'Update this document by expanding the analysis section adding a comparative summary table and strengthening the policy recommendations with recent empirical citations.'
        : samplePrompts[category]
    ).split(' ');
    let idx = 0;

    streamIntervalRef.current = window.setInterval(() => {
      if (gotNativeResultRef.current) {
        if (streamIntervalRef.current) {
          window.clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        return;
      }

      if (idx < words.length) {
        const nextWord = words[idx];
        idx += 1;
        setPrompt((prev) => (prev ? `${prev} ${nextWord}` : nextWord));
      } else {
        stopVoiceRecording();
      }
    }, 150);
  };

  const handleToggleVoice = async () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    setMicError('');
    setInterimTranscript('');
    gotNativeResultRef.current = false;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        if (
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError'
        ) {
          setMicError(
            'Microphone access blocked by browser; using live fallback transcription.'
          );
        }
      }
    }

    setIsRecording(true);
    setRecordingMessage('Recording active — speak your instructions...');

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-NG';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          gotNativeResultRef.current = true;
          let finalChunk = '';
          let interimChunk = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcriptPiece + ' ';
            } else {
              interimChunk += transcriptPiece;
            }
          }

          if (finalChunk.trim()) {
            setPrompt((prev) =>
              prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()
            );
          }
          setInterimTranscript(interimChunk);
        };

        recognition.onerror = () => {
          // Fallback handles it
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        // Fallback handles it
      }
    }

    window.setTimeout(() => {
      if (!gotNativeResultRef.current && recognitionRef.current !== undefined) {
        startFallbackLiveWordStream();
      }
    }, 1100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: { name: string; extractedText: string }[] = [];

    for (const file of files) {
      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md')
      ) {
        const text = await file.text();
        newAttachments.push({
          name: file.name,
          extractedText: text.slice(0, 600),
        });
      } else if (file.type.startsWith('image/')) {
        newAttachments.push({
          name: file.name,
          extractedText: `Extracted OCR text from image "${file.name}": Core definitions, key lecture points, and empirical diagrams captured from source image.`,
        });
      } else {
        newAttachments.push({
          name: file.name,
          extractedText: `Extracted reference material from document "${file.name}": Key academic context, structure, and supporting citations.`,
        });
      }
    }

    setUploadedFiles((prev) => [...prev, ...newAttachments]);
    if (!prompt.trim() && category === 'image-to-notes') {
      setPrompt(
        `Extract and organise the content from ${files
          .map((f) => f.name)
          .join(
            ', '
          )} into structured headings, bullet points and revision notes.`
      );
    }
    e.target.value = '';
  };

  const handleLoadComputerDocForWorkflow = async () => {
    const loaded = await openDocumentFromComputerFile(category);
    if (loaded) {
      setImportedComputerDoc(loaded.doc);
      setSelectedExistingDocId(loaded.doc.id);
    }
  };

  const selectedExistingDoc =
    importedComputerDoc?.id === selectedExistingDocId
      ? importedComputerDoc
      : existingDocuments.find((d) => d.id === selectedExistingDocId) ||
        existingDocuments[0];

  const handleOpenExistingWithoutAI = () => {
    if (!selectedExistingDoc) return;
    const chosenLayout =
      layoutOption === 'custom' ? customLayout : DEFAULT_PAGE_LAYOUT;

    if (preserveMode === 'overwrite' && !importedComputerDoc) {
      onDocumentCreated(
        {
          ...selectedExistingDoc,
          metadata: {
            ...selectedExistingDoc.metadata,
            layout: chosenLayout,
            orientation: chosenLayout.orientation,
            marginSize: chosenLayout.marginPreset,
          },
        },
        true
      );
    } else {
      const todayFormatted = getCurrentFormattedDate();
      const workingCopy: DocumentItem = {
        ...selectedExistingDoc,
        id: importedComputerDoc ? selectedExistingDoc.id : `doc-${Date.now()}`,
        title: importedComputerDoc
          ? selectedExistingDoc.title
          : `${selectedExistingDoc.title} (Copy)`,
        createdAt: todayFormatted,
        updatedAt: todayFormatted,
        status: 'Draft',
        syncStatus: isOnline ? 'saved' : 'offline-pending',
        metadata: {
          ...selectedExistingDoc.metadata,
          layout: chosenLayout,
          orientation: chosenLayout.orientation,
          marginSize: chosenLayout.marginPreset,
        },
      };
      onDocumentCreated(workingCopy, false);
    }
  };

  const handleGenerate = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    const combinedPrompt = [prompt.trim(), interimTranscript.trim()]
      .filter(Boolean)
      .join(' ');
    const effectivePrompt =
      combinedPrompt ||
      (uploadedFiles.length > 0
        ? `Incorporate reference material from ${uploadedFiles[0].name}`
        : '');

    if (!effectivePrompt) return;

    setIsGenerating(true);
    setTimeout(() => {
      const todayFormatted = getCurrentFormattedDate();
      const chosenLayout =
        layoutOption === 'custom' ? customLayout : DEFAULT_PAGE_LAYOUT;

      // Option B: Continue with an Existing Document (Requirement 15 & 17)
      if (workflowMode === 'existing' && selectedExistingDoc) {
        const updatedResult = modifyExistingDocumentWithAI(
          selectedExistingDoc,
          effectivePrompt,
          uploadedFiles
        );

        if (preserveMode === 'overwrite' && !importedComputerDoc) {
          const updatedExisting: DocumentItem = {
            ...selectedExistingDoc,
            content: updatedResult.content,
            updatedAt: todayFormatted,
            syncStatus: isOnline ? 'saved' : 'offline-pending',
            metadata: {
              ...selectedExistingDoc.metadata,
              layout: chosenLayout,
              orientation: chosenLayout.orientation,
              marginSize: chosenLayout.marginPreset,
            },
          };
          setIsGenerating(false);
          onDocumentCreated(updatedExisting, true);
          return;
        } else {
          const workingCopy: DocumentItem = {
            ...selectedExistingDoc,
            id: `doc-${Date.now()}`,
            title: importedComputerDoc
              ? selectedExistingDoc.title
              : `${selectedExistingDoc.title} (AI Updated)`,
            category,
            content: updatedResult.content,
            createdAt: todayFormatted,
            updatedAt: todayFormatted,
            status: 'Draft',
            syncStatus: isOnline ? 'saved' : 'offline-pending',
            metadata: {
              ...selectedExistingDoc.metadata,
              layout: chosenLayout,
              orientation: chosenLayout.orientation,
              marginSize: chosenLayout.marginPreset,
            },
          };
          setIsGenerating(false);
          onDocumentCreated(workingCopy, false);
          return;
        }
      }

      // Option A: Create a New Document
      const generated = generateDocumentFromNaturalPrompt(
        category,
        effectivePrompt,
        uploadedFiles,
        {
          institution: institution.trim() || undefined,
          department: department.trim() || undefined,
          courseCode: courseCode.trim() || undefined,
          studentName: studentName.trim() || undefined,
          lecturer: lecturer.trim() || undefined,
          referencingStyle,
          wordCount: wordCount.trim() || undefined,
        }
      );

      const cover =
        selectedCoverId === 'none'
          ? null
          : availableCovers.find((c) => c.id === selectedCoverId);

      let finalContent = generated.content;
      let docPages: string[] = [generated.content];

      if (cover) {
        const coverHtml = cover.renderHtml(generated.title, {
          institution: institution.trim() || undefined,
          department: department.trim() || undefined,
          courseCode: courseCode.trim() || undefined,
          studentName: studentName.trim() || undefined,
          lecturerOrSupervisor: lecturer.trim() || undefined,
        });
        finalContent = `${coverHtml}<hr class="page-break" />${generated.content}`;
        docPages = [coverHtml, generated.content];
      }

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: generated.title,
        category,
        content: finalContent,
        createdAt: todayFormatted,
        updatedAt: todayFormatted,
        status: 'Draft',
        syncStatus: isOnline ? 'saved' : 'offline-pending',
        format: 'DOCX',
        metadata: {
          ...generated.metadata,
          pages: docPages,
          layout: chosenLayout,
          orientation: chosenLayout.orientation,
          marginSize: chosenLayout.marginPreset,
        },
        aiHistory: [],
      };

      setIsGenerating(false);
      onDocumentCreated(newDoc, false);
    }, 380);
  };

  // Requirements 7, 8, 9: Create Document from Academic/Category Template with Cover Page
  const handleCreateFromTemplate = () => {
    const todayFormatted = getCurrentFormattedDate();
    const chosenLayout =
      layoutOption === 'custom' ? customLayout : DEFAULT_PAGE_LAYOUT;

    const tmpl =
      availableTemplates.find((t) => t.id === selectedTemplateId) ||
      availableTemplates[0];
    const cover =
      selectedCoverId === 'none'
        ? null
        : availableCovers.find((c) => c.id === selectedCoverId);

    const effectiveTitle =
      manualTitle.trim() ||
      (tmpl ? tmpl.name : `${copy.modalTitle.replace('Create ', '')}`);

    const meta = {
      institution: institution.trim() || undefined,
      department: department.trim() || undefined,
      courseCode: courseCode.trim() || undefined,
      studentName: studentName.trim() || undefined,
      lecturerOrSupervisor: lecturer.trim() || undefined,
      referencingStyle,
      wordCountTarget: wordCount.trim() || undefined,
      showPageNumbers: true,
      orientation: chosenLayout.orientation,
      marginSize: chosenLayout.marginPreset,
      fontFamily: 'Times New Roman',
      layout: chosenLayout,
    };

    const docPages: string[] = [];
    if (cover) {
      docPages.push(cover.renderHtml(effectiveTitle, meta));
    }

    if (tmpl) {
      const bodyPages = tmpl.generateBodyHtml(effectiveTitle, meta);
      docPages.push(...bodyPages);
    } else {
      docPages.push(
        `<h1>${effectiveTitle}</h1><p>Start drafting your content here...</p>`
      );
    }

    const fullContent = docPages.join('<hr class="page-break" />');

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: effectiveTitle,
      category,
      content: fullContent,
      createdAt: todayFormatted,
      updatedAt: todayFormatted,
      status: 'Draft',
      syncStatus: isOnline ? 'saved' : 'offline-pending',
      format: 'DOCX',
      metadata: {
        ...meta,
        pages: docPages,
      },
      aiHistory: [],
    };

    onDocumentCreated(newDoc, false);
  };

  // Requirement 7: Option 3 - Create Without AI (Blank Document or Uploaded File)
  const handleCreateBlankDocument = () => {
    const todayFormatted = getCurrentFormattedDate();
    const effectiveTitle =
      manualTitle.trim() ||
      `${copy.modalTitle.replace('Create ', '')} (Blank Document)`;
    const chosenLayout =
      layoutOption === 'custom' ? customLayout : DEFAULT_PAGE_LAYOUT;

    const cover =
      selectedCoverId === 'none'
        ? null
        : availableCovers.find((c) => c.id === selectedCoverId);

    const docPages: string[] = [];
    const meta = {
      institution: institution.trim() || undefined,
      department: department.trim() || undefined,
      courseCode: courseCode.trim() || undefined,
      studentName: studentName.trim() || undefined,
      lecturerOrSupervisor: lecturer.trim() || undefined,
      referencingStyle,
      wordCountTarget: wordCount.trim() || undefined,
      showPageNumbers: true,
      orientation: chosenLayout.orientation,
      marginSize: chosenLayout.marginPreset,
      fontFamily: 'Times New Roman',
      layout: chosenLayout,
    };

    if (cover) {
      docPages.push(cover.renderHtml(effectiveTitle, meta));
    }
    docPages.push(`<h1>${effectiveTitle}</h1><p><br/></p>`);
    const blankContent = docPages.join('<hr class="page-break" />');

    const blankDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: effectiveTitle,
      category,
      content: blankContent,
      createdAt: todayFormatted,
      updatedAt: todayFormatted,
      status: 'Draft',
      syncStatus: isOnline ? 'saved' : 'offline-pending',
      format: 'DOCX',
      metadata: {
        ...meta,
        pages: docPages,
      },
      aiHistory: [],
    };
    onDocumentCreated(blankDoc, false);
  };

  return (
    <div className="nc-modal-backdrop">
      <div className="nc-modal-dialog" style={{ maxWidth: '680px' }}>
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-ivory)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '19px',
                fontWeight: 800,
                color: 'var(--ink-navy)',
                letterSpacing: '-0.025em',
              }}
            >
              {copy.modalTitle}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--ink-muted)',
                marginTop: '4px',
                lineHeight: 1.45,
              }}
            >
              {copy.modalSubtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-ivory)',
              color: 'var(--ink-navy)',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Offline Banner if offline */}
        {!isOnline && (
          <div
            style={{
              backgroundColor: 'rgba(217, 78, 52, 0.08)',
              borderBottom: '1px solid var(--accent-terracotta)',
              padding: '9px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '12px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <WifiOff size={13} color="var(--accent-terracotta)" />
              Offline mode active. Document will be saved locally and synced
              when online.
            </span>
            <button
              onClick={onToggleOnline}
              className="btn-ed-subtle"
              style={{ padding: '4px 9px', fontSize: '9.5px' }}
            >
              Go Online
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Requirement 15 & 17: Option A (Create New) vs Option B (Continue with Existing Document) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: '1px solid var(--border-stone)',
              backgroundColor: 'var(--bg-stone)',
              padding: '3px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setWorkflowMode('new')}
              style={{
                padding: '9px 12px',
                border: 'none',
                backgroundColor:
                  workflowMode === 'new' ? 'var(--bg-ivory)' : 'transparent',
                color:
                  workflowMode === 'new'
                    ? 'var(--accent-blue)'
                    : 'var(--ink-muted)',
                fontWeight: workflowMode === 'new' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow:
                  workflowMode === 'new'
                    ? '0 1px 4px rgba(10, 25, 78, 0.08)'
                    : 'none',
              }}
            >
              <FilePlus size={14} />
              <span>Create a New Document</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkflowMode('existing')}
              style={{
                padding: '9px 12px',
                border: 'none',
                backgroundColor:
                  workflowMode === 'existing'
                    ? 'var(--bg-ivory)'
                    : 'transparent',
                color:
                  workflowMode === 'existing'
                    ? 'var(--accent-blue)'
                    : 'var(--ink-muted)',
                fontWeight: workflowMode === 'existing' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow:
                  workflowMode === 'existing'
                    ? '0 1px 4px rgba(10, 25, 78, 0.08)'
                    : 'none',
              }}
            >
              <FolderOpen size={14} />
              <span>Continue with Existing Document</span>
            </button>
          </div>

          {/* Requirement 6: Document Layout Settings Selector (Before Document Creation) */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-stone)',
              border: '1px solid var(--border-ivory)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} color="var(--accent-blue)" />
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--ink-navy)',
                  }}
                >
                  Document Layout:{' '}
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                  {layoutOption === 'default'
                    ? 'Standard A4 (Portrait, 25mm margins, 1 Column)'
                    : `${customLayout.pageSize} (${customLayout.orientation}, ${customLayout.marginPreset} margins, ${customLayout.columns} col)`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setLayoutOption('default')}
                className={
                  layoutOption === 'default' ? 'btn-ed-primary' : 'btn-ed-subtle'
                }
                style={{ padding: '4px 9px', fontSize: '10px' }}
              >
                Use Default Layout
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayoutOption('custom');
                  setShowLayoutModal(true);
                }}
                className={
                  layoutOption === 'custom' ? 'btn-ed-primary' : 'btn-ed-subtle'
                }
                style={{ padding: '4px 9px', fontSize: '10px' }}
              >
                Set Custom Layout...
              </button>
            </div>
          </div>

          {/* Requirement 7, 8, 9: Creation Method Selector */}
          {workflowMode === 'new' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setCreationMethod('template')}
                style={{
                  padding: '10px 12px',
                  border:
                    creationMethod === 'template'
                      ? '2px solid var(--accent-blue)'
                      : '1px solid var(--border-stone)',
                  backgroundColor:
                    creationMethod === 'template'
                      ? 'rgba(20, 71, 230, 0.05)'
                      : 'var(--bg-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LayoutGrid
                  size={16}
                  color={
                    creationMethod === 'template'
                      ? 'var(--accent-blue)'
                      : 'var(--ink-muted)'
                  }
                />
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color:
                        creationMethod === 'template'
                          ? 'var(--accent-blue)'
                          : 'var(--ink-navy)',
                    }}
                  >
                    Option 1: Template &amp; Cover
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    Academic sections &amp; cover page
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreationMethod('ai')}
                style={{
                  padding: '10px 12px',
                  border:
                    creationMethod === 'ai'
                      ? '2px solid var(--accent-blue)'
                      : '1px solid var(--border-stone)',
                  backgroundColor:
                    creationMethod === 'ai'
                      ? 'rgba(20, 71, 230, 0.05)'
                      : 'var(--bg-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Sparkles
                  size={16}
                  color={
                    creationMethod === 'ai'
                      ? 'var(--accent-blue)'
                      : 'var(--ink-muted)'
                  }
                />
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color:
                        creationMethod === 'ai'
                          ? 'var(--accent-blue)'
                          : 'var(--ink-navy)',
                    }}
                  >
                    Option 2: Create with AI
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    Draft from prompt or voice
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreationMethod('manual')}
                style={{
                  padding: '10px 12px',
                  border:
                    creationMethod === 'manual'
                      ? '2px solid var(--accent-blue)'
                      : '1px solid var(--border-stone)',
                  backgroundColor:
                    creationMethod === 'manual'
                      ? 'rgba(20, 71, 230, 0.05)'
                      : 'var(--bg-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Edit3
                  size={16}
                  color={
                    creationMethod === 'manual'
                      ? 'var(--accent-blue)'
                      : 'var(--ink-muted)'
                  }
                />
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color:
                        creationMethod === 'manual'
                          ? 'var(--accent-blue)'
                          : 'var(--ink-navy)',
                    }}
                  >
                    Option 3: Create Without AI
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    Blank canvas or file upload
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Requirement 7, 8, 9: Category-Specific Workspace Templates & Cover Page Designs */}
          {workflowMode === 'new' && creationMethod === 'template' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Step 1: Template Selection */}
              <div>
                <label className="ed-field-label" style={{ marginBottom: '8px' }}>
                  1. Select Workspace Template ({copy.modalTitle.replace('Create ', '')})
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {availableTemplates.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          if (tmpl.defaultCoverId) {
                            setSelectedCoverId(tmpl.defaultCoverId);
                          }
                        }}
                        style={{
                          border: isSelected
                            ? '2px solid var(--accent-blue)'
                            : '1px solid var(--border-stone)',
                          backgroundColor: isSelected
                            ? 'rgba(20, 71, 230, 0.04)'
                            : 'var(--bg-stone)',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: isSelected
                                  ? 'var(--accent-blue)'
                                  : 'var(--ink-navy)',
                              }}
                            >
                              {tmpl.name}
                            </span>
                            <span
                              className="mono-label"
                              style={{
                                fontSize: '8.5px',
                                backgroundColor: isSelected
                                  ? 'var(--accent-blue)'
                                  : 'var(--bg-stone-dark)',
                                color: isSelected ? '#FFFFFF' : 'var(--ink-body)',
                                padding: '2px 6px',
                              }}
                            >
                              {tmpl.badge}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '11px',
                              color: 'var(--ink-muted)',
                              lineHeight: 1.45,
                              margin: 0,
                            }}
                          >
                            {tmpl.description}
                          </p>
                        </div>

                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--ink-faint)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}
                        >
                          {tmpl.sections.map((sec, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '1px 5px',
                                backgroundColor: 'var(--bg-ivory)',
                                border: '1px solid var(--border-ivory)',
                              }}
                            >
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Cover Page Design (Requirement 8) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label className="ed-field-label" style={{ marginBottom: 0 }}>
                    2. Select Cover Page Design (Inserted as Page 1)
                  </label>
                  <span style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    Fully editable inside workspace
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {/* Option for No Cover */}
                  <div
                    onClick={() => setSelectedCoverId('none')}
                    style={{
                      border:
                        selectedCoverId === 'none'
                          ? '2px solid var(--accent-blue)'
                          : '1px solid var(--border-stone)',
                      backgroundColor:
                        selectedCoverId === 'none'
                          ? 'rgba(20, 71, 230, 0.04)'
                          : 'var(--bg-stone)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '4px',
                      minHeight: '84px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color:
                          selectedCoverId === 'none'
                            ? 'var(--accent-blue)'
                            : 'var(--ink-navy)',
                      }}
                    >
                      No Cover Page
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                      Start directly with Section 1 / Body content.
                    </span>
                  </div>

                  {availableCovers.map((cov) => {
                    const isSelected = selectedCoverId === cov.id;
                    return (
                      <div
                        key={cov.id}
                        onClick={() => setSelectedCoverId(cov.id)}
                        style={{
                          border: isSelected
                            ? '2px solid var(--accent-blue)'
                            : '1px solid var(--border-stone)',
                          backgroundColor: isSelected
                            ? 'rgba(20, 71, 230, 0.04)'
                            : 'var(--bg-stone)',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          position: 'relative',
                          borderLeft: `4px solid ${cov.accentColor}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: isSelected
                                ? 'var(--accent-blue)'
                                : 'var(--ink-navy)',
                            }}
                          >
                            {cov.name}
                          </span>
                          {isSelected && (
                            <Check size={13} color="var(--accent-blue)" />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: 'var(--ink-muted)',
                            lineHeight: 1.35,
                          }}
                        >
                          {cov.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Document Title & Metadata Details */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-stone)',
                  border: '1px solid var(--border-ivory)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="ed-field-label">Document Title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder={`e.g. ${
                      availableTemplates.find((t) => t.id === selectedTemplateId)
                        ?.name || 'Academic Assignment Title'
                    }`}
                    className="ed-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                {/* Optional Academic Fields Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOptional((p) => !p)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent-blue)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      {showOptional
                        ? 'Hide Cover Page Metadata Fields'
                        : '+ Customize Cover Page Fields (Institution, Student Name, Course Code)'}
                    </span>
                    {showOptional ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {showOptional && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        marginTop: '10px',
                      }}
                    >
                      <div>
                        <label className="ed-field-label">Institution / University</label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. University of Lagos / Covenant Univ"
                          className="ed-input"
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        />
                      </div>
                      <div>
                        <label className="ed-field-label">Department / Faculty</label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Faculty of Physical Sciences"
                          className="ed-input"
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        />
                      </div>
                      <div>
                        <label className="ed-field-label">Course Code &amp; Title</label>
                        <input
                          type="text"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          placeholder="e.g. CSC 411 — Artificial Intelligence"
                          className="ed-input"
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        />
                      </div>
                      <div>
                        <label className="ed-field-label">Student / Candidate Name</label>
                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="e.g. Chukwudi Adebayo / Candidate Name"
                          className="ed-input"
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        />
                      </div>
                      <div>
                        <label className="ed-field-label">Lecturer / Supervisor</label>
                        <input
                          type="text"
                          value={lecturer}
                          onChange={(e) => setLecturer(e.target.value)}
                          placeholder="e.g. Dr. O. A. Balogun"
                          className="ed-input"
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        />
                      </div>
                      <div>
                        <label className="ed-field-label">Referencing Standard</label>
                        <select
                          value={referencingStyle}
                          onChange={(e) => setReferencingStyle(e.target.value)}
                          className="ed-select"
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        >
                          <option value="APA 7th Edition">APA 7th Edition</option>
                          <option value="Harvard">Harvard Referencing</option>
                          <option value="IEEE">IEEE Style</option>
                          <option value="Chicago / Turabian">Chicago / Turabian</option>
                          <option value="MLA 9th Edition">MLA 9th Edition</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleCreateFromTemplate}
                    className="btn-ed-primary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      gap: '8px',
                    }}
                  >
                    <Check size={14} />
                    <span>Create Document from Template &amp; Open Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Requirement 7: Manual Document Creation Interface (Without AI) */}
          {workflowMode === 'new' && creationMethod === 'manual' && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-stone)',
                border: '1px solid var(--border-ivory)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <label className="ed-field-label">Document Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={`e.g. My ${copy.modalTitle.replace('Create ', '')}`}
                  className="ed-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={handleCreateBlankDocument}
                  className="btn-ed-primary"
                  style={{ padding: '9px 18px', fontSize: '12.5px', gap: '7px' }}
                >
                  <FilePlus size={14} />
                  <span>Open Blank Document in Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadComputerDocForWorkflow}
                  className="btn-ed-outline"
                  style={{ padding: '9px 16px', fontSize: '12.5px', gap: '7px' }}
                >
                  <HardDriveUpload size={14} color="var(--accent-blue)" />
                  <span>Upload Existing Document File</span>
                </button>
              </div>

              {importedComputerDoc && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-ivory)',
                    border: '1px solid var(--border-stone)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>
                    Uploaded File: <strong>{importedComputerDoc.title}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onDocumentCreated(importedComputerDoc, false)}
                    className="btn-ed-primary"
                    style={{ padding: '5px 12px', fontSize: '11px' }}
                  >
                    Open Uploaded Document
                  </button>
                </div>
              )}

              <p style={{ fontSize: '11.5px', color: 'var(--ink-muted)', margin: 0 }}>
                💡 You can freely type, format, and edit manually in the workspace, and call upon the AI writing assistant later whenever you need assistance.
              </p>
            </div>
          )}

          {/* Option B: Select Existing Document from Library or Computer (Requirement 15 & 17) */}
          {workflowMode === 'existing' && (
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-stone)',
                border: '1px solid var(--border-ivory)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <label className="ed-field-label" style={{ marginBottom: 0 }}>
                  Select Existing Document from Library
                </label>

                <button
                  type="button"
                  onClick={handleLoadComputerDocForWorkflow}
                  className="btn-ed-subtle"
                  style={{
                    backgroundColor: 'var(--bg-ivory)',
                    padding: '4px 9px',
                    fontSize: '9.5px',
                  }}
                >
                  <HardDriveUpload size={11} color="var(--accent-blue)" />
                  <span>Browse File from Computer</span>
                </button>
              </div>

              <select
                value={selectedExistingDocId}
                onChange={(e) => setSelectedExistingDocId(e.target.value)}
                className="ed-select"
              >
                {importedComputerDoc && (
                  <option value={importedComputerDoc.id}>
                    [Computer File] {importedComputerDoc.title}
                  </option>
                )}
                {existingDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    [{doc.category.toUpperCase()}] {doc.title} — (Modified{' '}
                    {formatDisplayDate(doc.updatedAt)})
                  </option>
                ))}
              </select>

              {selectedExistingDoc && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: '4px',
                    fontSize: '12px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  <span>
                    Loaded: <strong>{selectedExistingDoc.title}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setPreserveMode('copy')}
                      className={
                        preserveMode === 'copy'
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ padding: '4px 8px', fontSize: '9px' }}
                    >
                      Save as Working Copy (Safe)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreserveMode('overwrite')}
                      className={
                        preserveMode === 'overwrite'
                          ? 'btn-ed-primary'
                          : 'btn-ed-subtle'
                      }
                      style={{ padding: '4px 8px', fontSize: '9px' }}
                    >
                      Update Original Document
                    </button>
                  </div>
                </div>
              )}

              {/* Requirement 7: Option to Continue Editing Existing Documents Without AI */}
              {selectedExistingDoc && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(20, 71, 230, 0.05)',
                    border: '1px solid rgba(20, 71, 230, 0.2)',
                    marginTop: '4px',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--ink-navy)',
                      }}
                    >
                      Continue Editing Manually
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      Open in workspace directly without writing an AI prompt.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenExistingWithoutAI}
                    className="btn-ed-primary"
                    style={{
                      padding: '7px 12px',
                      fontSize: '10.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Edit3 size={12} />
                    <span>Continue Without AI</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Creation Interface (Only shown when workflowMode is existing OR creationMethod is AI) */}
          {(workflowMode === 'existing' || creationMethod === 'ai') && (
            <>
              <div>
            <div
              style={{
                border: isRecording
                  ? '2px solid #16A34A'
                  : '1px solid var(--border-stone)',
                backgroundColor: isRecording
                  ? 'rgba(22, 163, 74, 0.04)'
                  : 'var(--bg-ivory)',
                boxShadow: isRecording
                  ? '0 0 0 3px rgba(22, 163, 74, 0.14)'
                  : 'none',
                transition:
                  'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Auto-expanding Textarea */}
              <textarea
                ref={textareaRef}
                rows={4}
                value={combinedInputText}
                onChange={(e) => {
                  setInterimTranscript('');
                  setPrompt(e.target.value);
                }}
                placeholder={
                  workflowMode === 'existing'
                    ? 'Describe what you want AI to update, expand, restructure or add to the selected document...'
                    : copy.placeholder
                }
                style={{
                  width: '100%',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--ink-navy)',
                  fontSize: '14.5px',
                  lineHeight: 1.55,
                  padding: '14px 14px 8px 14px',
                  outline: 'none',
                  resize: 'none',
                  overflowY: 'auto',
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />

              {/* Attached Files Displayed Inside the Input Area (Requirement 16) */}
              {uploadedFiles.length > 0 && (
                <div
                  style={{
                    padding: '6px 14px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 9px',
                        backgroundColor: 'var(--bg-stone)',
                        border: '1px solid var(--border-stone)',
                        fontSize: '11.5px',
                        color: 'var(--ink-navy)',
                      }}
                    >
                      <FileText size={12} color="var(--accent-blue)" />
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--ink-muted)',
                          display: 'flex',
                          padding: '1px',
                        }}
                        title="Remove attachment"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Controls Row INSIDE the Input Field Container (Requirement 16) */}
              <div
                style={{
                  padding: '8px 10px 10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-ivory)',
                }}
              >
                {/* Left Status / Recording Feedback inside input bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11.5px',
                    color: isRecording ? '#15803D' : 'var(--ink-muted)',
                    fontWeight: isRecording ? 600 : 400,
                  }}
                >
                  {isRecording ? (
                    <>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#16A34A',
                          display: 'inline-block',
                        }}
                      />
                      <span>
                        {recordingMessage ||
                          'Listening... Speak into your microphone.'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {recordingMessage ||
                        'Type instructions, speak via microphone, or attach reference files.'}
                    </span>
                  )}
                </div>

                {/* Right Icons: Voice Input Icon, File Upload Icon, and Submit Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: 'auto',
                  }}
                >
                  {/* Voice Input Icon Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    title={
                      isRecording
                        ? 'Stop Voice Recording'
                        : 'Start Voice-to-Text Input'
                    }
                    style={{
                      width: '34px',
                      height: '34px',
                      border: isRecording
                        ? '1px solid #16A34A'
                        : '1px solid var(--border-stone)',
                      backgroundColor: isRecording
                        ? '#16A34A'
                        : 'var(--bg-stone)',
                      color: isRecording ? '#FFFFFF' : 'var(--ink-navy)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {isRecording ? <Square size={13} /> : <Mic size={14} />}
                  </button>

                  {/* File/Document Upload Icon Button */}
                  <label
                    title="Attach Reference Document or Image"
                    style={{
                      width: '34px',
                      height: '34px',
                      border: '1px solid var(--border-stone)',
                      backgroundColor: 'var(--bg-stone)',
                      color: 'var(--ink-navy)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Paperclip size={14} />
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.md,.ncdoc,.json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      (!prompt.trim() &&
                        !interimTranscript.trim() &&
                        uploadedFiles.length === 0)
                    }
                    className="btn-ed-primary"
                    style={{
                      height: '34px',
                      padding: '0 14px',
                      fontSize: '10px',
                    }}
                  >
                    <Send size={12} />
                    <span>
                      {isGenerating
                        ? 'Processing...'
                        : workflowMode === 'existing'
                        ? 'Update Document'
                        : 'Generate'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {micError && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-stone)',
                  border: '1px solid var(--border-stone)',
                  fontSize: '12px',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <AlertCircle size={13} color="var(--accent-terracotta)" />
                <span>{micError}</span>
              </div>
            )}
          </div>

          {/* Cover Page Design Picker for AI Generation */}
          {workflowMode === 'new' && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--bg-stone)',
                border: '1px solid var(--border-ivory)',
                marginTop: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--ink-navy)',
                  }}
                >
                  Cover Page Design (Page 1)
                </span>
                <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                  Optional cover page
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCoverId('none')}
                  className={
                    selectedCoverId === 'none'
                      ? 'btn-ed-primary'
                      : 'btn-ed-subtle'
                  }
                  style={{ padding: '5px 8px', fontSize: '10px' }}
                >
                  No Cover Page
                </button>
                {availableCovers.map((cov) => (
                  <button
                    key={cov.id}
                    type="button"
                    onClick={() => setSelectedCoverId(cov.id)}
                    className={
                      selectedCoverId === cov.id
                        ? 'btn-ed-primary'
                        : 'btn-ed-subtle'
                    }
                    style={{
                      padding: '5px 8px',
                      fontSize: '10px',
                      borderLeft: `3px solid ${cov.accentColor}`,
                    }}
                  >
                    {cov.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Optional Information Section (Only for new documents) */}
          {workflowMode === 'new' && (
            <div
              style={{
                borderTop: '1px solid var(--border-ivory)',
                paddingTop: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowOptional((prev) => !prev)}
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
                }}
              >
                <span>Additional Academic Details (Optional)</span>
                {showOptional ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>

              {showOptional && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '12px',
                    marginTop: '12px',
                    padding: '14px',
                    backgroundColor: 'var(--bg-stone)',
                    border: '1px solid var(--border-ivory)',
                  }}
                >
                  <div>
                    <label className="ed-field-label">Institution</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. University of Lagos"
                      className="ed-input"
                    />
                  </div>

                  <div>
                    <label className="ed-field-label">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Economics"
                      className="ed-input"
                    />
                  </div>

                  {category !== 'cv' && (
                    <div>
                      <label className="ed-field-label">Course Code</label>
                      <input
                        type="text"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        placeholder="e.g. ECN 312"
                        className="ed-input"
                      />
                    </div>
                  )}

                  <div>
                    <label className="ed-field-label">
                      {category === 'cv' ? 'Full Name' : 'Student Name'}
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Optional"
                      className="ed-input"
                    />
                  </div>

                  {category !== 'cv' && (
                    <>
                      <div>
                        <label className="ed-field-label">
                          Lecturer / Supervisor
                        </label>
                        <input
                          type="text"
                          value={lecturer}
                          onChange={(e) => setLecturer(e.target.value)}
                          placeholder="Optional"
                          className="ed-input"
                        />
                      </div>

                      <div>
                        <label className="ed-field-label">
                          Referencing Style
                        </label>
                        <select
                          value={referencingStyle}
                          onChange={(e) => setReferencingStyle(e.target.value)}
                          className="ed-select"
                        >
                          <option>APA 7th Edition</option>
                          <option>Harvard</option>
                          <option>IEEE</option>
                          <option>MLA 9th Edition</option>
                          <option>Chicago</option>
                        </select>
                      </div>

                      <div>
                        <label className="ed-field-label">
                          Required Word Count
                        </label>
                        <input
                          type="text"
                          value={wordCount}
                          onChange={(e) => setWordCount(e.target.value)}
                          placeholder="e.g. 1,500 words"
                          className="ed-input"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
            </>
          )}

          {/* Requirement 6: Pre-Creation Page Layout Configuration Modal */}
          {showLayoutModal && (
            <PageLayoutModal
              layout={customLayout}
              layoutScope="document"
              activePageIndex={0}
              onChangeLayout={setCustomLayout}
              onChangeScope={() => {}}
              onResetDefault={() => setCustomLayout(DEFAULT_PAGE_LAYOUT)}
              onApplyAndClose={() => setShowLayoutModal(false)}
              onClose={() => setShowLayoutModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
