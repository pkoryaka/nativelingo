# Session Note: UI Overflow & Jargon Layout Fix

## Issue Summary
When "Explain Jargon & Meaning" was toggled on and translations with slang/jargon analysis were processed, the bottom action buttons on both "Source Text" and "Translation" panels (the "Translate", "Listen", and character counters) were pushed off-screen and disappeared.

## Root Cause Analysis
1. `.app-container` in `src/index.css` had a fixed `height: 100vh;` with no vertical scroll capability (`overflow-y: auto`).
2. `.panels-grid` and `.panel-textarea` had rigid `min-height` constraints (280px and 200px) that could not shrink to accommodate the `JargonExplainerCard`.
3. `.panel-footer` lacked `flex-shrink: 0;`, meaning the bottom buttons were vulnerable to being compressed or forced outside the Electron window boundary when the explanation card mounted.
4. When "Explain Jargon & Meaning" was toggled off, `explanationData` was not cleared in `App.jsx`, leaving the card occupying vertical space.

## Solution & Architecture Changes
1. **Container Flexibility**:
   - Updated `body` to include `overflow-y: auto;` with custom sleek webkit scrollbars.
   - Converted `.app-container` to `min-height: 100vh; padding-bottom: 28px;` so it gracefully adapts and scrolls when secondary cards render.
2. **Panel Rigidity & Action Guarantees**:
   - Added `flex-shrink: 0;` to `.panel-header` and `.panel-footer` so translation control buttons (Translate, Listen, Copy, Clear) are guaranteed to never shrink or be cut off.
   - Set `.panel-textarea-wrapper` and `.panel-textarea` to `min-height: 120px; flex: 1 1 auto; overflow-y: auto;` so long text scrolls internally within the textarea.
3. **Jargon Card Lifecycle & Dismissal**:
   - Added an explicit `onClose` dismiss button (`X`) to `<JargonExplainerCard />`.
   - Updated `LanguageSelector` toggle in `App.jsx` to immediately clear `explanationData` whenever "Explain Jargon & Meaning" is toggled off.
