# In-Place Rewrite Variant Cycling and Button Fix

## Date: 2026-09-29

### 1. Root Cause for "Buttons Don't Work"
- In `src/App.jsx`, `executeTranslationWithMode` was missing the 5th parameter `options = {}` in its parameter signature while referencing `options.isAlternative`, `options.previousTranslation`, and `options.forceFresh`.
- Evaluating `options` caused a fatal JavaScript `ReferenceError: options is not defined`, breaking all button triggers (`handleTranslate`, `handleGetAlternative`, `handleMiniTargetLangChange`, and Ctrl+Enter hotkey).
- Fixed by declaring `options = {}` in `executeTranslationWithMode(textToTranslate, explicitTargetLang, explicitExplainMode, explicitCustomPrompt, options = {})`.

### 2. Sequential In-Place Rewrite Cycling
- Added session tracking in `electron/main.cjs` (`lastQuickRewrite = { slotId, originalText, variants, lastVariant, timestamp }`).
- When the user presses the hotkey combination for an in-place rewrite slot (`pasteBack: true`):
  - If text is selected and matches the last variant or previous variants or original text within 45s: NativeLingo uses the stored `originalText` (preventing translation degradation) and requests an alternative variation.
  - If nothing is selected (cursor left at end of previous paste without re-selection) within 15s: NativeLingo uses `undopaste` (Ctrl+Z to restore original selection, followed by Ctrl+V to paste the new variant).
- Expanded `electron/CopyNative.cs` and compiled `copy_native.exe` to support `undopaste` (synthesizing Ctrl+Z, waiting for editor undo, then Ctrl+V) and `undo`.
- Updated `electron/copy.vbs` fallback to support `undopaste`.
- Raised temperature to `0.75` for alternative cycles and prompted the model with negative constraints: `You MUST NOT repeat or closely mimic any of these previous variants: ${avoidList}.`
