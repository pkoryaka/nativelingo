import React from 'react';
import { HelpCircle, Info, Sparkles, Tag, Globe2, BookOpen, X } from 'lucide-react';

export function JargonExplainerCard({ explanationData, onClose }) {
  if (!explanationData) return null;

  const {
    plainLanguageMeaning,
    detectedTone,
    jargonBreakdown = [],
    culturalNotes,
    detectedSourceLanguage
  } = explanationData;

  return (
    <div className="jargon-results-container">
      <div className="jargon-results-header">
        <div className="jargon-results-title">
          <BookOpen size={18} color="var(--accent-purple)" />
          <span>Plain Language & Jargon Breakdown</span>
          {detectedSourceLanguage && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              (Detected: {detectedSourceLanguage})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {detectedTone && (
            <div className="tone-badge" title="Detected tone of the original message">
              <Sparkles size={13} />
              <span>Tone: {detectedTone}</span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              title="Close Explanation Card"
              aria-label="Close"
              style={{ width: '28px', height: '28px', padding: 0, cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Plain Language Meaning Box */}
      {plainLanguageMeaning && (
        <div className="plain-meaning-box">
          <div className="plain-meaning-label">What the person actually meant:</div>
          <div>{plainLanguageMeaning}</div>
        </div>
      )}

      {/* Jargon / Slang / Idiom Term Breakdown */}
      {jargonBreakdown && jargonBreakdown.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', marginBottom: '6px' }}>
            Demystified Terms & Slang ({jargonBreakdown.length}):
          </div>
          <div className="jargon-terms-grid">
            {jargonBreakdown.map((item, idx) => (
              <div key={`jargon-${idx}`} className="jargon-term-card">
                <div className="term-header">
                  <span className="term-name">"{item.term}"</span>
                  {item.literalMeaning && (
                    <span className="term-literal">Lit: {item.literalMeaning}</span>
                  )}
                </div>
                <div className="term-intended">
                  <strong>Means:</strong> {item.intendedMeaning}
                </div>
                {item.nuance && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    💡 {item.nuance}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Context / Nuance */}
      {culturalNotes && (
        <div className="cultural-notes-box">
          <Globe2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Cultural / Context Note:</strong> {culturalNotes}
          </div>
        </div>
      )}
    </div>
  );
}
