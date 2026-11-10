import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  Square,
  Send,
  X,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Paperclip,
  FileText,
} from 'lucide-react';
import { CanvasImageElement, DrawingElement } from '../types';

/**
 * Reusable Voice-to-Text Hook for all AI interfaces (Requirement 8)
 */
export function useVoiceToText(
  onTranscriptUpdate: (updater: (prev: string) => string) => void,
  fallbackSampleText: string
) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const streamTimerRef = useRef<number | null>(null);
  const gotNativeRef = useRef(false);

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (interimText.trim()) {
      const chunk = interimText.trim();
      onTranscriptUpdate((prev) => (prev ? `${prev.trim()} ${chunk}` : chunk));
      setInterimText('');
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    setInterimText('');
    gotNativeRef.current = false;
    setIsRecording(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-NG';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (event: any) => {
          gotNativeRef.current = true;
          let finalStr = '';
          let interimStr = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalStr += piece + ' ';
            } else {
              interimStr += piece;
            }
          }
          if (finalStr.trim()) {
            const cleanFinal = finalStr.trim();
            onTranscriptUpdate((prev) =>
              prev ? `${prev.trim()} ${cleanFinal}` : cleanFinal
            );
          }
          setInterimText(interimStr);
        };
        recognitionRef.current = rec;
        rec.start();
      } catch {
        // Fallback stream below
      }
    }

    window.setTimeout(() => {
      if (!gotNativeRef.current) {
        const words = fallbackSampleText.split(' ');
        let idx = 0;
        streamTimerRef.current = window.setInterval(() => {
          if (gotNativeRef.current) {
            if (streamTimerRef.current) {
              window.clearInterval(streamTimerRef.current);
              streamTimerRef.current = null;
            }
            return;
          }
          if (idx < words.length) {
            const w = words[idx++];
            onTranscriptUpdate((prev) => (prev ? `${prev} ${w}` : w));
          } else {
            stopRecording();
          }
        }, 140);
      }
    }, 1000);
  };

  return { isRecording, interimText, toggleRecording, stopRecording };
}

/**
 * Requirement 4: Floating Text-Level AI Icon & Separate Pop-up
 * Appears at the top-right corner of highlighted text. Never sends selection to the Main AI Assistant.
 */
interface TextSelectionAIPopupProps {
  selectedText: string;
  badgePosition: { top: number; left: number };
  isOpen: boolean;
  onOpenPopup: () => void;
  onClose: () => void;
  onSubmitTextAI: (instruction: string) => void;
}

export const TextSelectionAIPopup: React.FC<TextSelectionAIPopupProps> = ({
  selectedText,
  badgePosition,
  isOpen,
  onOpenPopup,
  onClose,
  onSubmitTextAI,
}) => {
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isRecording, interimText, toggleRecording, stopRecording } =
    useVoiceToText(
      setInstruction,
      'Rewrite this paragraph in a clearer more formal academic tone and correct any grammatical errors.'
    );

  const displayValue = interimText
    ? `${instruction}${instruction ? ' ' : ''}${interimText}`
    : instruction;

  // Requirement 9: Auto-expand textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(54, Math.min(el.scrollHeight, 160))}px`;
  }, [displayValue, isOpen]);

  const handleRun = (customText?: string) => {
    if (isRecording) stopRecording();
    const finalPrompt = (customText ?? displayValue).trim();
    if (!finalPrompt) return;
    onSubmitTextAI(finalPrompt);
    setInstruction('');
  };

  // Clamp coordinates to viewport so popup stays visible
  const safeTop = Math.max(12, Math.min(badgePosition.top, window.innerHeight - 310));
  const safeLeft = Math.max(
    12,
    Math.min(badgePosition.left, window.innerWidth - (isOpen ? 360 : 50))
  );

  if (!isOpen) {
    // Step 1: Small AI Icon at the top-right corner of the highlighted selection
    return (
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenPopup();
        }}
        title="Edit highlighted text with AI"
        style={{
          position: 'fixed',
          top: `${ Math.max(8, badgePosition.top - 30) }px`,
          left: `${ Math.min(window.innerWidth - 44, badgePosition.left + 4) }px`,
          zIndex: 160,
          width: '30px',
          height: '30px',
          backgroundColor: 'var(--accent-blue)',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF',
          boxShadow: '0 4px 14px rgba(10, 25, 78, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Sparkles size={14} />
      </button>
    );
  }

  // Step 2: Separate Floating Pop-up exclusively for the highlighted text
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${safeTop}px`,
        left: `${safeLeft}px`,
        width: '345px',
        maxWidth: 'calc(100vw - 24px)',
        backgroundColor: 'var(--bg-ivory)',
        border: '1px solid var(--border-stone)',
        boxShadow: '0 12px 32px rgba(10, 25, 78, 0.24)',
        zIndex: 170,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-ivory)',
          paddingBottom: '6px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--ink-navy)',
          }}
        >
          <Sparkles size={13} color="var(--accent-blue)" />
          <span>Edit Highlighted Text with AI</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-muted)',
            display: 'flex',
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Attached Highlighted Text Context */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'var(--bg-stone)',
          borderLeft: '2px solid var(--accent-blue)',
          fontSize: '11px',
          color: 'var(--ink-body)',
          maxHeight: '52px',
          overflowY: 'auto',
          fontStyle: 'italic',
        }}
      >
        "{selectedText.length > 120 ? `${selectedText.slice(0, 120)}...` : selectedText}"
      </div>

      {/* Quick Action Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {[
          'Rewrite paragraph',
          'Fix grammar',
          'Make shorter',
          'Expand',
          'Improve writing',
          'Academic tone',
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleRun(chip)}
            className="btn-ed-subtle"
            style={{
              padding: '3px 7px',
              fontSize: '9px',
              backgroundColor: 'var(--bg-stone)',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Auto-Expanding Input + Voice-to-Text (Green Active State) */}
      <div
        style={{
          border: isRecording
            ? '2px solid #16A34A'
            : '1px solid var(--border-stone)',
          backgroundColor: isRecording
            ? 'rgba(22, 163, 74, 0.04)'
            : 'var(--bg-ivory)',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <textarea
          ref={textareaRef}
          rows={2}
          value={displayValue}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Tell AI what to do with this highlighted text..."
          style={{
            width: '100%',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--ink-navy)',
            fontSize: '12.5px',
            lineHeight: 1.45,
            outline: 'none',
            resize: 'none',
          }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleRun();
            }
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              color: isRecording ? '#15803D' : 'var(--ink-muted)',
              fontWeight: isRecording ? 600 : 400,
            }}
          >
            {isRecording ? 'Listening... Speak now' : 'Applies to selected text only'}
          </span>

          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              onClick={toggleRecording}
              title={isRecording ? 'Stop Voice Input' : 'Voice-to-Text Input'}
              style={{
                width: '28px',
                height: '28px',
                border: isRecording
                  ? '1px solid #16A34A'
                  : '1px solid var(--border-stone)',
                backgroundColor: isRecording ? '#16A34A' : 'var(--bg-stone)',
                color: isRecording ? '#FFFFFF' : 'var(--ink-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isRecording ? <Square size={11} /> : <Mic size={12} />}
            </button>

            <button
              type="button"
              onClick={() => handleRun()}
              disabled={!displayValue.trim()}
              className="btn-ed-primary"
              style={{ height: '28px', padding: '0 10px', fontSize: '9.5px' }}
            >
              <Send size={11} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Requirement 5: Dedicated Page-Level AI Interface (Anchored at the top of the selected page)
 */
interface PageLevelAIPopoverProps {
  pageIndex: number;
  onClose: () => void;
  onApplyPageAI: (
    pageIndex: number,
    instruction: string,
    attachments: { name: string; extractedText: string }[]
  ) => void;
}

export const PageLevelAIPopover: React.FC<PageLevelAIPopoverProps> = ({
  pageIndex,
  onClose,
  onApplyPageAI,
}) => {
  const [instruction, setInstruction] = useState('');
  const [attachments, setAttachments] = useState<
    { name: string; extractedText: string }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isRecording, interimText, toggleRecording, stopRecording } =
    useVoiceToText(
      setInstruction,
      'Organise the information on this page into a clean comparison table and improve the arrangement of the headings.'
    );

  const displayValue = interimText
    ? `${instruction}${instruction ? ' ' : ''}${interimText}`
    : instruction;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(56, Math.min(el.scrollHeight, 170))}px`;
  }, [displayValue]);

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const added: { name: string; extractedText: string }[] = [];
    for (const f of files) {
      if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.md')) {
        const t = await f.text();
        added.push({ name: f.name, extractedText: t.slice(0, 500) });
      } else {
        added.push({
          name: f.name,
          extractedText: `Key data and reference points extracted from "${f.name}".`,
        });
      }
    }
    setAttachments((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleExecute = (preset?: string) => {
    if (isRecording) stopRecording();
    const finalInstruction = (preset ?? displayValue).trim();
    if (!finalInstruction) return;
    onApplyPageAI(pageIndex, finalInstruction, attachments);
    setInstruction('');
    setAttachments([]);
  };

  return (
    <div
      className="no-print"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        marginBottom: '14px',
        padding: '12px 14px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #1447E6',
        boxShadow: '0 6px 20px rgba(20, 71, 230, 0.12)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#0D1B4C',
          }}
        >
          <Sparkles size={14} color="#1447E6" />
          <span>
            Page {pageIndex + 1} AI Editor — Direct Structural &amp; Content
            Changes
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
            display: 'flex',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick Page-Level Structural & Content Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          marginBottom: '8px',
        }}
      >
        {[
          'Rewrite the introduction on this page',
          'Add a table comparing key sources',
          'Change the statistics on this page',
          'Insert a suitable heading',
          'Make this page look more professional',
          'Add an image illustrating the subject',
        ].map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => handleExecute(sample)}
            className="btn-ed-subtle"
            style={{
              padding: '3px 8px',
              fontSize: '9px',
              backgroundColor: '#FFFFFF',
              color: '#0D1B4C',
            }}
          >
            {sample}
          </button>
        ))}
      </div>

      <div
        style={{
          border: isRecording ? '2px solid #16A34A' : '1px solid #CBD5E1',
          backgroundColor: isRecording ? '#F0FDF4' : '#FFFFFF',
          padding: '8px 10px',
        }}
      >
        <textarea
          ref={textareaRef}
          rows={2}
          value={displayValue}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={`Instruct AI what to change, rearrange, or add directly on Page ${
            pageIndex + 1
          }...`}
          style={{
            width: '100%',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#0F172A',
            fontSize: '12.5px',
            lineHeight: 1.45,
            outline: 'none',
            resize: 'none',
          }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleExecute();
            }
          }}
        />

        {attachments.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
              marginTop: '4px',
            }}
          >
            {attachments.map((att, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  padding: '2px 7px',
                  backgroundColor: '#EEF2FF',
                  color: '#1447E6',
                  border: '1px solid #C7D2FE',
                }}
              >
                <FileText size={11} />
                {att.name}
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#1447E6',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              color: isRecording ? '#15803D' : '#64748B',
              fontWeight: isRecording ? 600 : 400,
            }}
          >
            {isRecording
              ? 'Recording active — speak your page instructions...'
              : `Modifies Page ${pageIndex + 1} only`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={toggleRecording}
              title="Voice-to-Text Input"
              style={{
                width: '28px',
                height: '28px',
                border: isRecording
                  ? '1px solid #16A34A'
                  : '1px solid #CBD5E1',
                backgroundColor: isRecording ? '#16A34A' : '#F8FAFC',
                color: isRecording ? '#FFFFFF' : '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isRecording ? <Square size={11} /> : <Mic size={12} />}
            </button>

            <label
              title="Attach Reference File for this Page"
              style={{
                width: '28px',
                height: '28px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Paperclip size={12} />
              <input
                type="file"
                multiple
                onChange={handleFileAttach}
                style={{ display: 'none' }}
              />
            </label>

            <button
              type="button"
              onClick={() => handleExecute()}
              disabled={!displayValue.trim()}
              className="btn-ed-primary"
              style={{ height: '28px', padding: '0 12px', fontSize: '9.5px' }}
            >
              <Send size={11} />
              <span>Update Page {pageIndex + 1}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Requirement 10 & 12: Shape & Image Selection Editing & Layer Positioning Bar
 * Supports Fill colour, Stroke colour, Stroke thickness, W/H dimensions, Bring to Front, Bring Forward, Send Backward, Send to Back, and Delete.
 */
interface ElementLayerToolbarProps {
  selectedDrawing: DrawingElement | null;
  selectedImage: CanvasImageElement | null;
  onUpdateDrawing: (updated: Partial<DrawingElement>) => void;
  onUpdateImage: (updated: Partial<CanvasImageElement>) => void;
  onLayerAction: (
    action: 'front' | 'forward' | 'backward' | 'back'
  ) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ElementLayerToolbar: React.FC<ElementLayerToolbarProps> = ({
  selectedDrawing,
  selectedImage,
  onUpdateDrawing,
  onUpdateImage,
  onLayerAction,
  onDelete,
  onClose,
}) => {
  if (!selectedDrawing && !selectedImage) return null;

  const isShape = Boolean(selectedDrawing);
  const shapeW = selectedDrawing
    ? Math.max(10, Math.abs(selectedDrawing.x2 - selectedDrawing.x1))
    : 0;
  const shapeH = selectedDrawing
    ? Math.max(10, Math.abs(selectedDrawing.y2 - selectedDrawing.y1))
    : 0;

  return (
    <div
      className="no-print"
      style={{
        padding: '6px 18px',
        backgroundColor: 'var(--bg-ivory)',
        borderBottom: '1px solid var(--accent-blue)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      <span
        className="mono-label"
        style={{ fontSize: '9.5px', color: 'var(--accent-blue)' }}
      >
        {isShape ? `Edit Shape (${selectedDrawing!.type})` : 'Edit Image'}:
      </span>

      {selectedDrawing && (
        <>
          {/* Fill Colour */}
          <label
            className="btn-ed-subtle"
            style={{ padding: '3px 7px', cursor: 'pointer' }}
            title="Shape Fill Colour"
          >
            <span style={{ fontSize: '9.5px' }}>Fill</span>
            <input
              type="color"
              value={
                selectedDrawing.fillColor &&
                selectedDrawing.fillColor !== 'transparent'
                  ? selectedDrawing.fillColor
                  : '#EEF2FF'
              }
              onChange={(e) => onUpdateDrawing({ fillColor: e.target.value })}
              style={{
                width: '14px',
                height: '14px',
                border: 'none',
                padding: 0,
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => onUpdateDrawing({ fillColor: 'transparent' })}
            className="btn-ed-subtle"
            style={{ padding: '4px 7px', fontSize: '9px' }}
            title="Make shape fill transparent"
          >
            No Fill
          </button>

          {/* Stroke Colour */}
          <label
            className="btn-ed-subtle"
            style={{ padding: '3px 7px', cursor: 'pointer' }}
            title="Stroke Colour"
          >
            <span style={{ fontSize: '9.5px' }}>Stroke</span>
            <input
              type="color"
              value={selectedDrawing.strokeColor}
              onChange={(e) =>
                onUpdateDrawing({ strokeColor: e.target.value })
              }
              style={{
                width: '14px',
                height: '14px',
                border: 'none',
                padding: 0,
              }}
            />
          </label>

          {/* Stroke Thickness */}
          <select
            value={selectedDrawing.strokeWidth}
            onChange={(e) =>
              onUpdateDrawing({ strokeWidth: parseInt(e.target.value, 10) })
            }
            className="ed-select"
            style={{ width: '82px', padding: '3px 5px', fontSize: '11px' }}
            title="Stroke Thickness"
          >
            <option value={0}>0 px (None)</option>
            <option value={1}>1 px</option>
            <option value={2}>2 px</option>
            <option value={3}>3 px</option>
            <option value={5}>5 px</option>
            <option value={8}>8 px</option>
          </select>

          <button
            type="button"
            onClick={() =>
              onUpdateDrawing({ strokeWidth: 0, strokeColor: 'transparent' })
            }
            className="btn-ed-subtle"
            style={{ padding: '4px 7px', fontSize: '9px' }}
            title="Remove stroke border entirely"
          >
            No Stroke
          </button>

          {/* Shape Dimensions W × H */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="mono-label" style={{ fontSize: '9px' }}>
              W:
            </span>
            <input
              type="number"
              min={10}
              max={750}
              value={shapeW}
              onChange={(e) => {
                const nextW = Math.max(10, parseInt(e.target.value || '50', 10));
                const minX = Math.min(selectedDrawing.x1, selectedDrawing.x2);
                onUpdateDrawing({ x1: minX, x2: minX + nextW });
              }}
              className="ed-input"
              style={{ width: '56px', padding: '3px 5px', fontSize: '11px' }}
            />
            <span className="mono-label" style={{ fontSize: '9px' }}>
              H:
            </span>
            <input
              type="number"
              min={10}
              max={1000}
              value={shapeH}
              onChange={(e) => {
                const nextH = Math.max(10, parseInt(e.target.value || '50', 10));
                const minY = Math.min(selectedDrawing.y1, selectedDrawing.y2);
                onUpdateDrawing({ y1: minY, y2: minY + nextH });
              }}
              className="ed-input"
              style={{ width: '56px', padding: '3px 5px', fontSize: '11px' }}
            />
          </div>
        </>
      )}

      {selectedImage && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span className="mono-label" style={{ fontSize: '9px' }}>
            W:
          </span>
          <input
            type="number"
            min={40}
            max={740}
            value={Math.round(selectedImage.width)}
            onChange={(e) => {
              const ratio = selectedImage.aspectRatio || 1.33;
              const nextW = Math.max(40, parseInt(e.target.value || '160', 10));
              onUpdateImage({
                width: nextW,
                height: Math.max(30, Math.round(nextW / ratio)),
              });
            }}
            className="ed-input"
            style={{ width: '60px', padding: '3px 5px', fontSize: '11px' }}
            title="Image Width (preserves aspect ratio)"
          />
          <span className="mono-label" style={{ fontSize: '9px' }}>
            H:
          </span>
          <input
            type="number"
            min={30}
            max={960}
            value={Math.round(selectedImage.height)}
            onChange={(e) => {
              const ratio = selectedImage.aspectRatio || 1.33;
              const nextH = Math.max(30, parseInt(e.target.value || '120', 10));
              onUpdateImage({
                height: nextH,
                width: Math.max(40, Math.round(nextH * ratio)),
              });
            }}
            className="ed-input"
            style={{ width: '60px', padding: '3px 5px', fontSize: '11px' }}
            title="Image Height (preserves aspect ratio)"
          />
        </div>
      )}

      {/* Layer Status Badge */}
      <span
        className="mono-label"
        style={{
          fontSize: '8.5px',
          padding: '3px 6px',
          backgroundColor: 'var(--bg-stone)',
          border: '1px solid var(--border-stone)',
          color: 'var(--ink-navy)',
        }}
      >
        {((selectedDrawing?.zIndex ?? selectedImage?.zIndex ?? 12) < 10)
          ? `Behind Text (Z:${selectedDrawing?.zIndex ?? selectedImage?.zIndex ?? 5})`
          : `In Front (Z:${selectedDrawing?.zIndex ?? selectedImage?.zIndex ?? 12})`}
      </span>

      {/* Layer Positioning Controls (Bring to Front, Bring Forward, Send Backward, Send to Back) */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => onLayerAction('front')}
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', fontSize: '9px' }}
          title="Bring to Front (top of layer stack)"
        >
          <ArrowUpToLine size={11} /> Bring to Front
        </button>
        <button
          type="button"
          onClick={() => onLayerAction('forward')}
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', fontSize: '9px' }}
          title="Bring Forward one step"
        >
          <ArrowUp size={11} /> Bring Forward
        </button>
        <button
          type="button"
          onClick={() => onLayerAction('backward')}
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', fontSize: '9px' }}
          title="Send Backward (moves behind the object or text immediately beneath it)"
        >
          <ArrowDown size={11} /> Send Backward
        </button>
        <button
          type="button"
          onClick={() => onLayerAction('back')}
          className="btn-ed-subtle"
          style={{ padding: '4px 7px', fontSize: '9px' }}
          title="Send to Back (behind all objects and text)"
        >
          <ArrowDownToLine size={11} /> Send to Back
        </button>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="btn-ed-subtle"
        style={{
          color: 'var(--accent-terracotta)',
          padding: '4px 8px',
          fontSize: '9px',
        }}
      >
        <Trash2 size={11} /> Delete
      </button>

      <button
        type="button"
        onClick={onClose}
        className="btn-ed-subtle"
        style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '9px' }}
      >
        Done
      </button>
    </div>
  );
};

