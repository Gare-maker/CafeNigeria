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
  Sparkles,
  Edit3,
  LayoutGrid,
  Check,
  Eye,
  BookOpen,
} from 'lucide-react';
import {
  DocumentCategory,
  DocumentItem,
  DEFAULT_PAGE_LAYOUT,
  AIAttachment,
} from '../types';
import {
  CATEGORY_PAGE_COPY,
  formatDisplayDate,
  generateDocumentFromNaturalPrompt,
  generateDocumentFromNaturalPromptAsync,
  getCurrentFormattedDate,
  modifyExistingDocumentWithAI,
  modifyExistingDocumentWithAIAsync,
  generateDocumentFromImageAI,
} from '../services/aiGenerator';
import { openDocumentFromComputerFile } from '../services/exportService';
import { processMultipleFiles } from '../services/fileProcessing';
import { AIAttachmentsPreview } from './AIAttachmentsPreview';
import {
  getTemplatesForCategory,
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
  const availableTemplates = getTemplatesForCategory(category);

  // Section 7: Option A (Create with AI) vs Option B (Create without AI)
  const [workflowMode, setWorkflowMode] = useState<'new' | 'existing'>('new');
  const [creationMethod, setCreationMethod] = useState<'ai' | 'manual'>('ai');
  const [manualTitle, setManualTitle] = useState('');

  // Selected template & preview state for Option B (Visual Template Gallery)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    () => availableTemplates[0]?.id || ''
  );
  const [previewTemplate, setPreviewTemplate] = useState<WorkspaceTemplate | null>(null);

  // Workflow for continuing with an existing document
  const [selectedExistingDocId, setSelectedExistingDocId] = useState<string>(
    () => {
      const sameCat = existingDocuments.find((d) => d.category === category);
      return sameCat ? sameCat.id : existingDocuments[0]?.id || '';
    }
  );
  const [importedComputerDoc, setImportedComputerDoc] =
    useState<DocumentItem | null>(null);
  const [preserveMode, setPreserveMode] = useState<'copy' | 'overwrite'>('copy');

  // AI Prompt, Voice & Attached Source References (Section 5)
  const [prompt, setPrompt] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMessage, setRecordingMessage] = useState('');
  const [micError, setMicError] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState<AIAttachment[]>([]);
  const [showWorkspaceDocPicker, setShowWorkspaceDocPicker] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>('');

  // Optional Academic Details (Collapsed by default)
  const [showOptional, setShowOptional] = useState(false);
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [referencingStyle, setReferencingStyle] = useState('APA 7th Edition');
  const [wordCount, setWordCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const gotNativeResultRef = useRef<boolean>(false);
  const basePromptRef = useRef<string>('');

  // Auto-expand textarea vertically
  const combinedInputText = prompt;

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

  const stopVoiceRecording = () => {
    cleanupRecording();
    setIsRecording(false);
    setRecordingMessage('');
    setInterimTranscript('');
  };

  const startVoiceRecording = async () => {
    setMicError('');
    setIsRecording(true);
    setRecordingMessage('Listening... as you speak it writes live.');
    gotNativeResultRef.current = false;
    basePromptRef.current = prompt;

    try {
      if (
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
    } catch {
      // ignore
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        try {
          recognition.lang = navigator.language || 'en-NG';
        } catch {
          recognition.lang = 'en-US';
        }

        recognition.onresult = (event: any) => {
          gotNativeResultRef.current = true;
          let sessionTranscript = '';
          let currentInterim = '';
          for (let i = 0; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            sessionTranscript += transcriptChunk;
            if (!event.results[i].isFinal) {
              currentInterim += transcriptChunk;
            }
          }
          setInterimTranscript(currentInterim);
          const base = basePromptRef.current.trim();
          const cleanSession = sessionTranscript.trim();
          const combined = base
            ? (cleanSession ? `${base} ${cleanSession}` : base)
            : cleanSession;
          setPrompt(combined);
        };

        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            setMicError(`Voice input notice: ${e.error || 'Check microphone'}`);
          }
        };

        recognition.onend = () => {
          if (isRecording) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.start();
      } catch (err: any) {
        setMicError('Could not start browser speech engine.');
      }
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Section 5: Add File Local Upload using true file reader engine
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const processed = await processMultipleFiles(files);
      setUploadedFiles((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Failed to process uploaded files:', err);
    }
    e.target.value = '';
  };

  // Section 5: Add File from Existing Workspace Documents
  const handleSelectWorkspaceDocAsReference = (doc: DocumentItem) => {
    const already = uploadedFiles.some((f) => f.id === doc.id);
    if (already) {
      setShowWorkspaceDocPicker(false);
      return;
    }
    const snippet = doc.content.replace(/<[^>]+>/g, ' ').slice(0, 500);
    const newRef: AIAttachment = {
      id: doc.id,
      name: `[Workspace] ${doc.title}`,
      type: 'document',
      fileType: 'workspace',
      sizeFormatted: `${Math.round(doc.content.length / 1024 * 10) / 10} KB`,
      extractedText: `Referenced content from workspace document "${doc.title}":\n${snippet}`,
    };
    setUploadedFiles((prev) => [...prev, newRef]);
    setShowWorkspaceDocPicker(false);
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
    if (preserveMode === 'overwrite' && !importedComputerDoc) {
      onDocumentCreated(selectedExistingDoc, true);
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
      };
      onDocumentCreated(workingCopy, false);
    }
  };

  // Section 7 Option A: Create with AI (Supports Multimodal Image-to-Doc and Reference-Aware Generation)
  const handleGenerate = async () => {
    if (isRecording) stopVoiceRecording();
    const combinedPrompt = [prompt.trim(), interimTranscript.trim()]
      .filter(Boolean)
      .join(' ');

    // For Image-to-Document, task is strictly image reconstruction:
    if (category === 'image-to-notes') {
      const imgAttachment = uploadedFiles.find((f) => f.type === 'image') || uploadedFiles[0];
      if (!imgAttachment) return;

      setIsGenerating(true);
      setExtractionStatus('Reading image and inspecting document layout...');
      const todayFormatted = getCurrentFormattedDate();

      setTimeout(() => {
        setExtractionStatus('Extracting printed & handwritten text and reconstructing tables...');
      }, 700);

      try {
        const generated = await generateDocumentFromImageAI(imgAttachment, combinedPrompt, {
          institution: institution.trim() || undefined,
          department: department.trim() || undefined,
          courseCode: courseCode.trim() || undefined,
          studentName: studentName.trim() || undefined,
        });

        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          title: generated.title || `Converted - ${imgAttachment.name.replace(/\.[^/.]+$/, '')}`,
          category: 'image-to-notes',
          content: generated.content,
          createdAt: todayFormatted,
          updatedAt: todayFormatted,
          status: 'Draft',
          syncStatus: isOnline ? 'saved' : 'offline-pending',
          format: 'DOCX',
          metadata: {
            ...generated.metadata,
            layout: DEFAULT_PAGE_LAYOUT,
            orientation: 'portrait',
            marginSize: 'normal',
          },
          aiHistory: [],
        };

        setIsGenerating(false);
        setExtractionStatus('');
        onDocumentCreated(newDoc, false);
      } catch (err) {
        console.error('Image to document error:', err);
        setIsGenerating(false);
        setExtractionStatus('');
      }
      return;
    }

    const effectivePrompt =
      combinedPrompt ||
      (uploadedFiles.length > 0
        ? `Incorporate reference material from ${uploadedFiles[0].name}`
        : '');

    if (!effectivePrompt) return;

    setIsGenerating(true);
    setExtractionStatus('Analyzing references and preparing document structure...');
    const todayFormatted = getCurrentFormattedDate();

    const refPayload = uploadedFiles.map((f) => ({
      name: f.name,
      extractedText: f.extractedText || `Reference file: ${f.name} (${f.fileType.toUpperCase()})`,
    }));

    setTimeout(async () => {
      try {
        if (workflowMode === 'existing' && selectedExistingDoc) {
          const updatedResult = await modifyExistingDocumentWithAIAsync(
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
            };
            setIsGenerating(false);
            setExtractionStatus('');
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
            };
            setIsGenerating(false);
            setExtractionStatus('');
            onDocumentCreated(workingCopy, false);
            return;
          }
        }

        // New Document with AI
        const generated = await generateDocumentFromNaturalPromptAsync(
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

        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          title: generated.title,
          category,
          content: generated.content,
          createdAt: todayFormatted,
          updatedAt: todayFormatted,
          status: 'Draft',
          syncStatus: isOnline ? 'saved' : 'offline-pending',
          format: 'DOCX',
          metadata: {
            ...generated.metadata,
            layout: DEFAULT_PAGE_LAYOUT,
            orientation: 'portrait',
            marginSize: 'normal',
          },
          aiHistory: [],
        };

        setIsGenerating(false);
        setExtractionStatus('');
        onDocumentCreated(newDoc, false);
      } catch (err) {
        console.error('Document AI generation error:', err);
        setIsGenerating(false);
        setExtractionStatus('');
      }
    }, 200);
  };

  // Section 7 Option B: Create Blank Document
  const handleCreateBlankDocument = () => {
    const todayFormatted = getCurrentFormattedDate();
    const effectiveTitle =
      manualTitle.trim() ||
      `${copy.modalTitle.replace('Create ', '')} (Blank Document)`;
    const blankContent = `<h1>${effectiveTitle}</h1><p><br/></p>`;

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
        institution: institution.trim() || undefined,
        department: department.trim() || undefined,
        courseCode: courseCode.trim() || undefined,
        studentName: studentName.trim() || undefined,
        lecturerOrSupervisor: lecturer.trim() || undefined,
        referencingStyle,
        wordCountTarget: wordCount.trim() || undefined,
        showPageNumbers: true,
        orientation: 'portrait',
        marginSize: 'normal',
        fontFamily: 'Times New Roman',
        layout: DEFAULT_PAGE_LAYOUT,
      },
      aiHistory: [],
    };
    onDocumentCreated(blankDoc, false);
  };

  // Section 7 Option B: Create from Selected Visual Template
  const handleCreateFromTemplate = (template: WorkspaceTemplate) => {
    const todayFormatted = getCurrentFormattedDate();
    const effectiveTitle = manualTitle.trim() || template.name;

    const meta = {
      institution: institution.trim() || undefined,
      department: department.trim() || undefined,
      courseCode: courseCode.trim() || undefined,
      studentName: studentName.trim() || undefined,
      lecturerOrSupervisor: lecturer.trim() || undefined,
      referencingStyle,
      wordCountTarget: wordCount.trim() || undefined,
      showPageNumbers: true,
      orientation: DEFAULT_PAGE_LAYOUT.orientation,
      marginSize: DEFAULT_PAGE_LAYOUT.marginPreset,
      fontFamily: 'Times New Roman',
      layout: DEFAULT_PAGE_LAYOUT,
    };

    const bodyPages = template.generateBodyHtml(effectiveTitle, meta);
    const fullContent = bodyPages.join('<hr class="page-break" />');

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
        pages: bodyPages,
      },
      aiHistory: [],
    };

    onDocumentCreated(newDoc, false);
  };

  return (
    <div className="nc-modal-backdrop">
      <div className="nc-modal-dialog" style={{ maxWidth: '720px' }}>
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
                margin: 0,
              }}
            >
              {copy.modalTitle}
            </h2>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--ink-muted)',
                marginTop: '4px',
                lineHeight: 1.45,
                margin: '4px 0 0',
              }}
            >
              {copy.modalSubtitle}
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

        {/* Offline Banner */}
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
              Offline mode active. Document will be saved locally on your device.
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
          {/* Section 1: Mandatory Image-to-Document AI Conversion */}
          {category === 'image-to-notes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Task Header & Context */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(20, 71, 230, 0.05)',
                  border: '1px solid rgba(20, 71, 230, 0.25)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <Sparkles size={20} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink-navy)' }}>
                    Mandatory AI Image-to-Document Conversion
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '3px', lineHeight: 1.5 }}>
                    Image conversion always uses AI image recognition. The AI model extracts printed text, legible handwritten notes, headings, bulleted lists, and reconstructs structured HTML tables directly into an editable workspace document.
                  </div>
                </div>
              </div>

              {/* Upload Dropzone / Preview Area */}
              {uploadedFiles.length === 0 ? (
                <label
                  style={{
                    border: '2px dashed var(--accent-blue)',
                    backgroundColor: 'rgba(20, 71, 230, 0.02)',
                    borderRadius: '8px',
                    padding: '42px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <HardDriveUpload size={40} color="var(--accent-blue)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-navy)' }}>
                      Select or Drop Document Image Here
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: '4px 0 0' }}>
                      Supports PNG, JPG, JPEG, WEBP — Lecture notes, textbook scans, handwritten summaries, whiteboard diagrams & tables
                    </p>
                  </div>
                  <span
                    className="btn-ed-primary"
                    style={{ padding: '8px 18px', fontSize: '12px', pointerEvents: 'none' }}
                  >
                    Browse Device
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                <div
                  style={{
                    border: '1px solid var(--border-stone)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-stone)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-navy)' }}>
                      Selected Image for Reconstruction:
                    </span>
                    <label
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                      }}
                    >
                      Choose Different Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {/* Immediate Thumbnail Preview & Card */}
                  <AIAttachmentsPreview
                    attachments={uploadedFiles}
                    onRemove={(id) => setUploadedFiles((prev) => prev.filter((f) => f.id !== id))}
                  />

                  {/* Optional extra prompt */}
                  <div>
                    <label className="ed-field-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>
                      Additional Extraction Guidance (Optional)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Focus on the mathematical derivations, preserve table headers, or summarize key takeaways..."
                      rows={2}
                      className="ed-input"
                      style={{ width: '100%', resize: 'none', fontSize: '12.5px' }}
                    />
                  </div>

                  {/* Progressive Loading & Shimmer */}
                  {isGenerating && (
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(20, 71, 230, 0.08)',
                        border: '1px solid rgba(20, 71, 230, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <Sparkles size={16} className="animate-spin" />
                      <span style={{ fontWeight: 600 }}>
                        {extractionStatus || 'Processing image with AI vision OCR engine...'}
                      </span>
                    </div>
                  )}

                  {/* Conversion Button */}
                  <button
                    type="button"
                    disabled={isGenerating || uploadedFiles.length === 0}
                    onClick={handleGenerate}
                    className="btn-ed-primary"
                    style={{
                      padding: '11px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      gap: '8px',
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Sparkles size={15} />
                    <span>{isGenerating ? 'Converting to Document...' : 'Convert Image to Document with AI'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Workflow Toggle: New Document vs Continue Existing */}
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
              }}
            >
              <FilePlus size={14} />
              <span>Create New File</span>
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
              }}
            >
              <FolderOpen size={14} />
              <span>Continue with Existing File</span>
            </button>
          </div>

          {/* Section 7: Option A (Create with AI) vs Option B (Create without AI) */}
          {workflowMode === 'new' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setCreationMethod('ai')}
                style={{
                  padding: '12px 14px',
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
                  gap: '9px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Sparkles
                  size={18}
                  color={
                    creationMethod === 'ai'
                      ? 'var(--accent-blue)'
                      : 'var(--ink-muted)'
                  }
                />
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color:
                        creationMethod === 'ai'
                          ? 'var(--accent-blue)'
                          : 'var(--ink-navy)',
                    }}
                  >
                    Option A: Create with AI
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Prompt, file references, voice instructions
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreationMethod('manual')}
                style={{
                  padding: '12px 14px',
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
                  gap: '9px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LayoutGrid
                  size={18}
                  color={
                    creationMethod === 'manual'
                      ? 'var(--accent-blue)'
                      : 'var(--ink-muted)'
                  }
                />
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color:
                        creationMethod === 'manual'
                          ? 'var(--accent-blue)'
                          : 'var(--ink-navy)',
                    }}
                  >
                    Option B: Create without AI
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Blank canvas or visual template gallery
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* =================================================================
              SECTION 7 OPTION B: CREATE WITHOUT AI (BLANK + VISUAL TEMPLATE GALLERY)
          ================================================================== */}
          {workflowMode === 'new' && creationMethod === 'manual' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Document Title Input */}
              <div>
                <label className="ed-field-label">Document Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={`e.g. My ${copy.modalTitle.replace('Create ', '')}`}
                  className="ed-input"
                  style={{ fontSize: '13.5px' }}
                />
              </div>

              {/* Blank Document Action Card */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-stone)',
                  border: '1px solid var(--border-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-navy)' }}>
                    Start with a Blank Document
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    Clean unformatted canvas. Customize layout, borders, and cover page inside the editor.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCreateBlankDocument}
                    className="btn-ed-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    <FilePlus size={13} />
                    <span>Create Blank Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadComputerDocForWorkflow}
                    className="btn-ed-outline"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                  >
                    <HardDriveUpload size={13} color="var(--accent-blue)" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>

              {/* Visual Template Gallery (Actual visual cards & preview per Section 7) */}
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
                    Visual Template Gallery ({availableTemplates.length} Available)
                  </label>
                  <span style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    Click preview to inspect structure
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {availableTemplates.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        style={{
                          border: isSelected
                            ? '2px solid var(--accent-blue)'
                            : '1px solid var(--border-stone)',
                          backgroundColor: isSelected
                            ? 'rgba(20, 71, 230, 0.04)'
                            : 'var(--bg-stone)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          {/* Visual Header Thumbnail Swatch */}
                          <div
                            style={{
                              height: '42px',
                              backgroundColor: 'var(--bg-ivory)',
                              border: '1px solid var(--border-ivory)',
                              padding: '6px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              className="mono-label"
                              style={{
                                fontSize: '8.5px',
                                backgroundColor: 'var(--bg-stone-dark)',
                                color: 'var(--ink-body)',
                                padding: '2px 6px',
                              }}
                            >
                              {tmpl.badge}
                            </span>
                            <BookOpen size={14} color="var(--accent-blue)" />
                          </div>

                          <h3
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 700,
                              color: 'var(--ink-navy)',
                              margin: '0 0 4px',
                            }}
                          >
                            {tmpl.name}
                          </h3>
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

                        {/* Sections List */}
                        <div
                          style={{
                            fontSize: '9.5px',
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

                        {/* Action Buttons: Preview & Use Template */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border-ivory)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tmpl)}
                            className="btn-ed-subtle"
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              fontSize: '10px',
                              gap: '4px',
                            }}
                          >
                            <Eye size={12} />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplateId(tmpl.id);
                              handleCreateFromTemplate(tmpl);
                            }}
                            className="btn-ed-primary"
                            style={{
                              flex: 1.4,
                              padding: '5px 10px',
                              fontSize: '10px',
                              gap: '4px',
                            }}
                          >
                            <Check size={12} />
                            <span>Use Template</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 7 OPTION A: CREATE WITH AI (PROMPT + ATTACHMENTS + REFS)
          ================================================================== */}
          {(workflowMode === 'existing' || (workflowMode === 'new' && creationMethod === 'ai')) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  border: isRecording
                    ? '2px solid #16A34A'
                    : '1px solid var(--border-stone)',
                  backgroundColor: isRecording
                    ? 'rgba(22, 163, 74, 0.04)'
                    : 'var(--bg-ivory)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
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
                    fontSize: '14px',
                    lineHeight: 1.55,
                    padding: '14px',
                    outline: 'none',
                    resize: 'none',
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />

                {/* Section 5: Attached Local Files & Workspace References Preview */}
                {uploadedFiles.length > 0 && (
                  <div
                    style={{
                      padding: '8px 14px',
                      borderTop: '1px solid var(--border-ivory)',
                      backgroundColor: 'var(--bg-stone)',
                    }}
                  >
                    <AIAttachmentsPreview
                      attachments={uploadedFiles}
                      onRemove={(id) =>
                        setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
                      }
                    />
                  </div>
                )}

                {/* AI Input Toolbar: Add File, Add Workspace Doc, Voice, Run */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderTop: '1px solid var(--border-ivory)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    backgroundColor: 'var(--bg-stone)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Attach Local File */}
                    <label
                      title="Attach Local Document or Image"
                      style={{
                        padding: '5px 9px',
                        border: '1px solid var(--border-stone)',
                        backgroundColor: 'var(--bg-ivory)',
                        color: 'var(--ink-navy)',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <Paperclip size={12} color="var(--accent-blue)" />
                      <span>Attach File</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt,image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Section 5: Select Existing Workspace Document */}
                    {existingDocuments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowWorkspaceDocPicker((p) => !p)}
                        style={{
                          padding: '5px 9px',
                          border: '1px solid var(--border-stone)',
                          backgroundColor: 'var(--bg-ivory)',
                          color: 'var(--ink-navy)',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                        }}
                        title="Add an existing workspace document as reference"
                      >
                        <FolderOpen size={12} color="var(--accent-blue)" />
                        <span>Add Workspace Doc</span>
                      </button>
                    )}

                    {/* Voice to Text */}
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      style={{
                        padding: '5px 9px',
                        border: isRecording
                          ? '1px solid #16A34A'
                          : '1px solid var(--border-stone)',
                        backgroundColor: isRecording
                          ? '#16A34A'
                          : 'var(--bg-ivory)',
                        color: isRecording ? '#FFFFFF' : 'var(--ink-navy)',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      {isRecording ? <Square size={11} /> : <Mic size={12} />}
                      <span>{isRecording ? 'Stop' : 'Voice'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating || (!prompt.trim() && uploadedFiles.length === 0)}
                    onClick={handleGenerate}
                    className="btn-ed-primary"
                    style={{ padding: '6px 14px', fontSize: '11.5px', gap: '6px' }}
                  >
                    <Send size={12} />
                    <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
                  </button>
                </div>
              </div>

              {/* Workspace Doc Selection Popover (Section 5) */}
              {showWorkspaceDocPicker && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-stone)',
                    border: '1px solid var(--border-stone)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-navy)' }}>
                      Select a Document from Your Workspace to Reference:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowWorkspaceDocPicker(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div
                    style={{
                      maxHeight: '130px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {existingDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleSelectWorkspaceDocAsReference(doc)}
                        className="btn-ed-subtle"
                        style={{
                          justifyContent: 'flex-start',
                          padding: '5px 8px',
                          fontSize: '11px',
                          textAlign: 'left',
                        }}
                      >
                        <FileText size={12} color="var(--accent-blue)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          [{doc.category.toUpperCase()}] {doc.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Details Accordion */}
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
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--accent-blue)',
                    cursor: 'pointer',
                  }}
                >
                  <span>{showOptional ? '− Hide Details' : '+ Add Optional Academic Details (Institution, Course, Student Name)'}</span>
                </button>

                {showOptional && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px',
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--bg-stone)',
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
                        style={{ padding: '6px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label className="ed-field-label">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="ed-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label className="ed-field-label">Course Code</label>
                      <input
                        type="text"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        placeholder="e.g. CSC 411"
                        className="ed-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label className="ed-field-label">Student Name</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Chukwudi Adebayo"
                        className="ed-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label className="ed-field-label">Lecturer / Supervisor</label>
                      <input
                        type="text"
                        value={lecturer}
                        onChange={(e) => setLecturer(e.target.value)}
                        placeholder="e.g. Dr. Balogun"
                        className="ed-input"
                        style={{ padding: '6px', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label className="ed-field-label">Referencing Standard</label>
                      <select
                        value={referencingStyle}
                        onChange={(e) => setReferencingStyle(e.target.value)}
                        className="ed-select"
                        style={{ padding: '6px', fontSize: '11px' }}
                      >
                        <option value="APA 7th Edition">APA 7th Edition</option>
                        <option value="Harvard">Harvard Referencing</option>
                        <option value="IEEE">IEEE Style</option>
                        <option value="Chicago">Chicago / Turabian</option>
                        <option value="MLA 9th Edition">MLA 9th Edition</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workflow Mode: Existing Document Option */}
          {workflowMode === 'existing' && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-stone)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <label className="ed-field-label">Select Document to Continue</label>
              <select
                value={selectedExistingDocId}
                onChange={(e) => setSelectedExistingDocId(e.target.value)}
                className="ed-select"
              >
                {existingDocuments.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.category.toUpperCase()}] {d.title}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleOpenExistingWithoutAI}
                  className="btn-ed-primary"
                  style={{ padding: '7px 14px', fontSize: '11px' }}
                >
                  Open in Workspace Directly
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Template Preview Inspection Modal (Section 7) */}
        {previewTemplate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(10, 25, 78, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: '16px',
            }}
            onClick={() => setPreviewTemplate(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-ivory)',
                border: '2px solid var(--border-stone)',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: '22px',
                boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--border-ivory)',
                  paddingBottom: '8px',
                }}
              >
                <div>
                  <span
                    className="mono-label"
                    style={{
                      fontSize: '8.5px',
                      backgroundColor: 'var(--accent-blue)',
                      color: '#FFFFFF',
                      padding: '2px 6px',
                    }}
                  >
                    {previewTemplate.badge}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '6px 0 2px' }}>
                    {previewTemplate.name}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="btn-ed-subtle"
                  style={{ padding: '4px' }}
                >
                  <X size={15} />
                </button>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--ink-body)', lineHeight: 1.5, marginBottom: '14px' }}>
                {previewTemplate.description}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label className="ed-field-label">Included Academic Structure</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {previewTemplate.sections.map((sec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-stone)',
                        borderLeft: '3px solid var(--accent-blue)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--ink-navy)',
                      }}
                    >
                      {sec}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="btn-ed-subtle"
                  style={{ padding: '8px 14px' }}
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmpl = previewTemplate;
                    setPreviewTemplate(null);
                    handleCreateFromTemplate(tmpl);
                  }}
                  className="btn-ed-primary"
                  style={{ padding: '8px 16px' }}
                >
                  <Check size={13} />
                  <span>Create with this Template</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
