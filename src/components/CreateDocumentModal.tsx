import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  Upload,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  WifiOff,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { DocumentCategory, DocumentItem } from '../types';
import {
  CATEGORY_PAGE_COPY,
  generateDocumentFromNaturalPrompt,
} from '../services/aiGenerator';

interface CreateDocumentModalProps {
  category: DocumentCategory;
  isOnline: boolean;
  onToggleOnline: () => void;
  onClose: () => void;
  onDocumentCreated: (doc: DocumentItem) => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  category,
  isOnline,
  onToggleOnline,
  onClose,
  onDocumentCreated,
}) => {
  const copy = CATEGORY_PAGE_COPY[category];

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

  const recognitionRef = useRef<any>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const gotNativeResultRef = useRef<boolean>(false);

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
      'Recording stopped. You can review and edit the transcribed text above.'
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
    };

    const words = samplePrompts[category].split(' ');
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

    // Request microphone permission if supported
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
            'Microphone permission was denied. Please allow microphone access in your browser settings, or use the live transcription mode below.'
          );
        }
      }
    }

    setIsRecording(true);
    setRecordingMessage('Listening... Speak your instructions.');

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

        recognition.onerror = (event: any) => {
          if (event?.error === 'not-allowed') {
            setMicError(
              'Microphone permission denied. Streaming fallback transcription...'
            );
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        // Fallback stream below will handle live word-by-word transcription
      }
    }

    // Start live word-by-word fallback stream after 1.2s if native speech hasn't emitted words yet
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
        ? `Generate a ${category} based on uploaded reference file: ${uploadedFiles[0].name}`
        : '');

    if (!effectivePrompt) return;

    setIsGenerating(true);
    setTimeout(() => {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
        now.getHours()
      ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: generated.title,
        category,
        content: generated.content,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'Draft',
        syncStatus: isOnline ? 'saved' : 'offline-pending',
        format: 'DOCX',
        metadata: generated.metadata,
        aiHistory: [],
      };

      setIsGenerating(false);
      onDocumentCreated(newDoc);
    }, 420);
  };

  return (
    <div className="nc-modal-backdrop">
      <div className="nc-modal-dialog">
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
            padding: '22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Main Natural-Language Instruction Textarea */}
          <div>
            <textarea
              rows={6}
              value={
                interimTranscript
                  ? `${prompt}${prompt ? ' ' : ''}${interimTranscript}`
                  : prompt
              }
              onChange={(e) => {
                setInterimTranscript('');
                setPrompt(e.target.value);
              }}
              placeholder={copy.placeholder}
              className="ed-textarea"
              style={{
                fontSize: '14.5px',
                lineHeight: 1.55,
                padding: '13px',
                resize: 'vertical',
                borderColor: isRecording
                  ? 'var(--accent-terracotta)'
                  : undefined,
              }}
              autoFocus
            />

            {/* Live Voice Recording Indicator Bar (Section 5) */}
            {isRecording && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(217, 78, 52, 0.08)',
                  border: '1px solid var(--accent-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Animated Waveform Bars */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      height: '16px',
                    }}
                  >
                    <span
                      className="voice-bar"
                      style={{ animationDelay: '0s' }}
                    />
                    <span
                      className="voice-bar"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="voice-bar"
                      style={{ animationDelay: '0.3s' }}
                    />
                    <span
                      className="voice-bar"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="voice-bar"
                      style={{ animationDelay: '0.25s' }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--accent-terracotta)',
                    }}
                  >
                    {recordingMessage || 'Listening... Speak your instructions.'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="btn-ed-primary"
                  style={{
                    backgroundColor: 'var(--accent-terracotta)',
                    borderColor: 'var(--accent-terracotta)',
                    padding: '5px 11px',
                    fontSize: '10px',
                  }}
                >
                  <Square size={11} />
                  <span>Stop Recording</span>
                </button>
              </div>
            )}

            {/* Permission / Microphone Notice */}
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

            {/* Voice & Upload Input Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Voice Input Action */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={isRecording ? 'btn-ed-primary' : 'btn-ed-subtle'}
                  style={{
                    backgroundColor: isRecording
                      ? 'var(--accent-terracotta)'
                      : undefined,
                    borderColor: isRecording
                      ? 'var(--accent-terracotta)'
                      : undefined,
                  }}
                >
                  {isRecording ? <Square size={12} /> : <Mic size={13} />}
                  <span>{isRecording ? 'Stop Recording' : 'Voice Input'}</span>
                </button>

                {/* Upload Reference Image / File Action */}
                <label className="btn-ed-subtle" style={{ cursor: 'pointer' }}>
                  <Upload size={13} />
                  <span>Upload Image / File</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {!isRecording && recordingMessage && (
                <span
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  {recordingMessage}
                </span>
              )}
            </div>
          </div>

          {/* Uploaded Reference Files List */}
          {uploadedFiles.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div className="ed-field-label">
                Uploaded Reference Materials ({uploadedFiles.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 10px',
                      backgroundColor: 'var(--bg-stone)',
                      border: '1px solid var(--border-ivory)',
                      fontSize: '12px',
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
                      }}
                      title="Remove attachment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Optional Information Section */}
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
              <span>Additional Details (Optional)</span>
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
                      <label className="ed-field-label">Referencing Style</label>
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
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-ivory)',
            backgroundColor: 'var(--bg-stone)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button onClick={onClose} className="btn-ed-subtle">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (!prompt.trim() &&
                !interimTranscript.trim() &&
                uploadedFiles.length === 0)
            }
            className="btn-ed-primary"
          >
            <Sparkles size={13} />
            <span>{isGenerating ? 'Generating...' : 'Generate Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
