# Smart Reply Assistant Mode

## Concept & Architecture
The **Smart Reply Assistant Mode** provides a zero-tab-switching conversational response workflow within NativeLingo. When a user highlights incoming text (or a thread) in external apps like Slack, Microsoft Teams, Outlook, or web browsers and triggers `Ctrl + Alt + R` (Slot 4), or clicks the Reply icon in NativeLingo's Header or Mini HUD:
1. **Automatic Language & Tone Determination**: The application analyzes the incoming message, detecting its source language and tone (e.g. Formal, Demanding, Friendly, Inquiring) along with a concise summary.
2. **Interactive Reply Formulation**: A dedicated modal appears (`ReplyModal.jsx`) allowing the user to dictate what they wish to reply (e.g., *"reply to him that I don't want it anymore"*), choose from quick intent chips (Decline, Confirm, Need time, Inquire), adjust reply tone, and select the target response language (defaults to the incoming language).
3. **Non-Editable Output Window**: The drafted reply is streamed/rendered directly into a strictly `readOnly` preview window within the same modal.
4. **Instant Auto-Copy & One-Click Insert**: Upon completion, the drafted response is automatically written to the system clipboard with prominent visual confirmation. Users can immediately press `Ctrl + V` or click "Insert & Paste into App" (`window:insert-reply`), which automatically hides the modal and synthesizes a native paste keystroke into the target application.

## Key Components
- [`ReplyModal.jsx`](file:///c:/AI%20Projects/Personal/Translation/src/components/ReplyModal.jsx): Glassmorphic modal containing incoming context with language/tone pills, editable intent textarea with quick presets, tone selector, and the dedicated non-editable output window.
- [`geminiService.js`](file:///c:/AI%20Projects/Personal/Translation/src/services/geminiService.js): Exports `detectIncomingMessageInfo(text)` and `draftSmartReply(options)` supporting all LLM backends (Gemini, Claude, OpenAI, DeepSeek, Groq, local Ollama).
- [`main.cjs`](file:///c:/AI%20Projects/Personal/Translation/electron/main.cjs): Manages Slot 4 hotkey (`Ctrl + Alt + R`), routes payload with `isReplyMode: true`, and handles IPC `window:insert-reply` for direct background insertion.
