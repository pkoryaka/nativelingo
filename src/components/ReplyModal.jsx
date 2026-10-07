import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquareReply, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  CornerDownLeft, 
  X, 
  Globe, 
  ShieldCheck, 
  Loader2, 
  ChevronDown, 
  RotateCcw, 
  ArrowRight, 
  FileText,
  Lock,
  ThumbsDown,
  ThumbsUp,
  Clock,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, detectIncomingMessageInfo, draftSmartReply } from '../services/geminiService';
import { storageService } from '../services/storageService';

const REPLY_PRESETS = [
  {
    id: 'decline',
    label: "🚫 Don't want it / Decline",
    prompt: "Reply to them that I don't want it anymore. Politely and firmly decline."
  },
  {
    id: 'agree',
    label: "🤝 Agree & Confirm",
    prompt: "Confirm and agree to proceed with the proposed arrangement."
  },
  {
    id: 'review',
    label: "⏳ Need more time",
    prompt: "Acknowledge receipt and say I am reviewing the details and will get back to them tomorrow."
  },
  {
    id: 'details',
    label: "❓ Ask for details",
    prompt: "Ask for more details, clarification on terms, and exact timeline before deciding."
  },
  {
    id: 'counter',
    label: "💡 Suggest alternative",
    prompt: "Politely propose an alternative schedule/scope that works better on our end."
  },
  {
    id: 'thanks',
    label: "🙏 Thank & Close",
    prompt: "Thank them warmly for the update and let them know we're all set."
  }
];

const TONE_OPTIONS = [
  { id: 'Professional Business', label: '💼 Professional Business' },
  { id: 'Diplomatic & Polite', label: '🕊️ Diplomatic & Polite' },
  { id: 'Direct & Concise', label: '🎯 Direct & Concise' },
  { id: 'Friendly & Warm', label: '😊 Friendly & Warm' },
  { id: 'Executive / Formal', label: '👔 Executive / Formal' }
];

export function ReplyModal({ isOpen, onClose, initialContextText = '' }) {
  const [incomingText, setIncomingText] = useState(initialContextText);
  const [userIntent, setUserIntent] = useState('');
  const [replyTone, setReplyTone] = useState('Professional Business');
  const [targetLang, setTargetLang] = useState('auto');
  
  const [detectedInfo, setDetectedInfo] = useState({
    language: 'Auto-Detect',
    languageCode: 'auto',
    tone: 'Analyzing...',
    summary: ''
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedReply, setDraftedReply] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const intentInputRef = useRef(null);
  const detectionTimeoutRef = useRef(null);

  // Sync initial context text whenever modal opens or initialContext changes
  useEffect(() => {
    if (isOpen) {
      const textToUse = initialContextText || '';
      setIncomingText(textToUse);
      setDraftedReply('');
      setErrorMessage('');
      setCopied(false);

      if (textToUse.trim()) {
        runDetection(textToUse.trim());
      } else {
        setDetectedInfo({
          language: 'Auto-Detect',
          languageCode: 'auto',
          tone: 'Neutral',
          summary: ''
        });
      }

      // Auto-focus user intent input after opening
      setTimeout(() => {
        if (intentInputRef.current) {
          intentInputRef.current.focus();
        }
      }, 120);
    }
  }, [isOpen, initialContextText]);

  // Run language and tone detection
  const runDetection = async (text) => {
    if (!text || !text.trim()) return;
    setIsDetecting(true);
    try {
      const info = await detectIncomingMessageInfo(text);
      setDetectedInfo(info);
    } catch (err) {
      console.warn('Language detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  // Debounced language detection if user edits the incoming message directly
  const handleIncomingTextChange = (e) => {
    const val = e.target.value;
    setIncomingText(val);
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }
    if (val.trim().length > 5) {
      detectionTimeoutRef.current = setTimeout(() => {
        runDetection(val.trim());
      }, 600);
    }
  };

  // Draft reply handler
  const handleDraftReply = async (overrideIntent) => {
    const intentToUse = overrideIntent || userIntent;
    if (!incomingText.trim()) {
      setErrorMessage('Please provide the message you want to reply to.');
      return;
    }
    if (!intentToUse.trim()) {
      setErrorMessage('Please type what you want to reply (or click one of the quick presets).');
      return;
    }

    setErrorMessage('');
    setIsDrafting(true);
    setCopied(false);
    setDraftedReply('');

    try {
      const reply = await draftSmartReply({
        incomingText: incomingText.trim(),
        userIntent: intentToUse.trim(),
        tone: replyTone,
        targetLang,
        detectedLang: detectedInfo.language || 'English',
        onStreamChunk: (chunk) => {
          setDraftedReply(chunk);
        }
      });

      if (reply) {
        setDraftedReply(reply);
        // Requirement: "reply should be drafted in another not editable window in same modal and copied to the clipboard"
        await copyToClipboard(reply);
      }
    } catch (err) {
      console.error('Draft reply error:', err);
      setErrorMessage(err.message || 'Failed to draft reply. Please check your network or API key.');
    } finally {
      setIsDrafting(false);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      if (window.electronAPI?.copyToClipboard) {
        await window.electronAPI.copyToClipboard(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleInsertDirectly = async () => {
    if (!draftedReply || !draftedReply.trim()) return;
    try {
      if (window.electronAPI?.insertReply) {
        await window.electronAPI.insertReply(draftedReply.trim());
        if (onClose) onClose();
      } else {
        await copyToClipboard(draftedReply.trim());
        if (onClose) onClose();
      }
    } catch (e) {
      console.error('Insert directly failed:', e);
    }
  };

  // Quick preset click handler
  const handleSelectPreset = (preset) => {
    setUserIntent(preset.prompt);
    if (incomingText.trim()) {
      handleDraftReply(preset.prompt);
    }
  };

  // Handle keyboard shortcut: Ctrl+Enter to draft, Esc to close
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleDraftReply();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div 
        className="modal-content reply-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-modal-title"
      >
        {/* Modal Header */}
        <div className="reply-modal-header">
          <div className="reply-modal-header-left">
            <div className="reply-header-icon-badge">
              <MessageSquareReply size={20} color="var(--primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="reply-modal-title" className="reply-modal-title">AI Reply Assistant</h2>
                <span className="reply-shortcut-badge" title="Global Hotkey">Ctrl + Alt + R</span>
              </div>
              <p className="reply-modal-subtitle">
                Context-aware replies automatically drafted in the sender's language & copied to clipboard
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="reply-modal-close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="reply-modal-body">
          {/* SECTION 1: Incoming Message Context & Detection Badges */}
          <div className="reply-section">
            <div className="reply-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--primary)" />
                <span className="reply-section-label">Incoming Message / Thread</span>
              </div>
              
              <div className="reply-detection-badges">
                {/* Detected Language Badge */}
                <div 
                  className="reply-badge-pill reply-badge-lang"
                  title="Automatically determined language of the incoming message"
                >
                  <Globe size={12} />
                  <span>
                    {isDetecting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Loader2 size={10} className="spin-animation" /> Detecting Language...
                      </span>
                    ) : (
                      `Language: ${detectedInfo.language}`
                    )}
                  </span>
                </div>

                {/* Detected Tone Badge */}
                {detectedInfo.tone && detectedInfo.tone !== 'Neutral' && (
                  <div 
                    className="reply-badge-pill reply-badge-tone"
                    title="Detected tone of the sender"
                  >
                    <span>Tone: {detectedInfo.tone}</span>
                  </div>
                )}
              </div>
            </div>

            <textarea
              className="reply-context-textarea"
              rows={3}
              value={incomingText}
              onChange={handleIncomingTextChange}
              placeholder="Paste or highlight the message you want to reply to here..."
            />
          </div>

          {/* SECTION 2: What would you like to reply? (User Intent & Presets) */}
          <div className="reply-section">
            <div className="reply-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--accent-cyan)" />
                <span className="reply-section-label">How would you like to reply?</span>
              </div>
              <span className="reply-hint-text">
                e.g. "reply to him that I don't want it anymore" or click a preset below
              </span>
            </div>

            {/* Quick Intent Preset Chips */}
            <div className="reply-preset-chips-container">
              {REPLY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="reply-preset-chip"
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isDrafting}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* User Custom Instruction Textarea */}
            <textarea
              ref={intentInputRef}
              className="reply-intent-textarea"
              rows={2}
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="Tell AI what to say (e.g. 'tell him that I don\'t want it anymore and thank him for his time', 'agree to meet tomorrow at 10 AM')..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleDraftReply();
                }
              }}
            />

            {/* Controls: Tone & Language Selectors */}
            <div className="reply-controls-row">
              <div className="reply-control-item">
                <label className="reply-control-label">Reply Tone</label>
                <div className="reply-select-wrapper">
                  <select
                    className="reply-select"
                    value={replyTone}
                    onChange={(e) => setReplyTone(e.target.value)}
                    disabled={isDrafting}
                  >
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="reply-select-arrow" />
                </div>
              </div>

              <div className="reply-control-item">
                <label className="reply-control-label">Target Language</label>
                <div className="reply-select-wrapper">
                  <select
                    className="reply-select"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    disabled={isDrafting}
                  >
                    <option value="auto">
                      🌐 Auto (Same as incoming: {detectedInfo.language || 'Detected'})
                    </option>
                    {SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="reply-select-arrow" />
                </div>
              </div>

              {/* Draft Button */}
              <button
                type="button"
                className="btn-primary reply-draft-btn"
                onClick={() => handleDraftReply()}
                disabled={isDrafting || !incomingText.trim() || !userIntent.trim()}
              >
                {isDrafting ? (
                  <>
                    <Loader2 size={16} className="spin-animation" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Draft Reply</span>
                    <span className="reply-key-shortcut">Ctrl+Enter</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="reply-error-banner">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* SECTION 3: Non-Editable Drafted Reply Window & Auto-Copy Feedback */}
          <div className="reply-section">
            <div className="reply-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} color="var(--accent-emerald)" />
                <span className="reply-section-label">Drafted Reply (Non-Editable Output Window)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="reply-readonly-badge">
                  <Lock size={10} /> Read-Only
                </span>
                {copied && (
                  <span className="reply-copied-badge animate-pulse">
                    <Check size={12} /> Auto-Copied to Clipboard!
                  </span>
                )}
              </div>
            </div>

            {/* Auto-Copy Notification Banner */}
            {copied && (
              <div className="reply-auto-copied-banner">
                <Check size={15} color="#10b981" />
                <span>
                  <strong>Copied to clipboard!</strong> Press <strong>Ctrl + V</strong> in your chat window to paste your reply.
                </span>
              </div>
            )}

            {/* NON-EDITABLE OUTPUT TEXTAREA */}
            <div className="reply-output-wrapper">
              <textarea
                readOnly={true}
                tabIndex={0}
                className="reply-output-textarea"
                rows={4}
                value={draftedReply}
                placeholder={
                  isDrafting
                    ? 'AI is drafting your context-aware reply in ' + (targetLang === 'auto' ? detectedInfo.language : targetLang) + '...'
                    : 'The generated reply will appear here in this non-editable window and automatically be copied to your clipboard...'
                }
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="reply-modal-footer">
          <div className="reply-footer-left">
            {draftedReply && (
              <span className="reply-word-count">
                {draftedReply.trim().split(/\s+/).filter(Boolean).length} words • {draftedReply.length} characters
              </span>
            )}
          </div>

          <div className="reply-footer-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Close (Esc)
            </button>

            {draftedReply && (
              <>
                <button
                  type="button"
                  className="btn-secondary reply-copy-btn"
                  onClick={() => copyToClipboard(draftedReply)}
                  title="Copy reply text to clipboard"
                >
                  {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                  <span>{copied ? 'Copied!' : 'Copy Again'}</span>
                </button>

                <button
                  type="button"
                  className="btn-primary reply-insert-btn"
                  onClick={handleInsertDirectly}
                  title="Paste directly into Slack/Teams/active application and close"
                >
                  <Send size={15} />
                  <span>Insert & Paste into App</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReplyModal;
