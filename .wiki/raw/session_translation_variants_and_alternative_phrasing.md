# Session Note: Translation Variants & Alternative Phrasing

## User Directive
When a user translates the same phrase a second time, or wants an alternative phrasing, the app should provide a distinct variant of the translation rather than returning the identical cached result.

## Architecture & Implementation
1. **Dynamic Alternative Generation**:
   - `geminiService.js`: When `isAlternative` is enabled, the cache lookup is bypassed.
   - Temperature is dynamically adjusted from 0.0 to 0.7 for alternative variations to explore natural phrasing choices.
   - System instruction directs the model to maintain exact factual accuracy while varying vocabulary, synonyms, and sentence structure relative to previous translation output.
2. **Automatic Re-Translate Detection**:
   - `App.jsx`: Tracks `lastTranslatedSource` and `lastTargetLang`.
   - When the user presses "Translate" or Ctrl+Enter on the same input phrase without modifying it, the app automatically detects re-translation and requests a new variant.
3. **Dedicated UI Controls & History Navigation**:
   - Added a `🔄 Alternative` button in the Translation panel footer.
   - When multiple variants have been generated for a phrase, a stepper indicator (`Variant 1/3`, `‹`, `›`) appears next to character count, allowing instant client-side cycling between all generated variations without repeating API calls.
4. **IPC Engine Parity**:
   - `electron/main.cjs`: Updated `native:translate` IPC handler to support `isAlternative` and `previousTranslation` across Anthropic Claude, OpenAI-compatible, and Google Gemini backends.
