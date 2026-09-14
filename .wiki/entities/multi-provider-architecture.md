# Multi-Provider Architecture & Unified AI Model Gateway

## Overview
NativeLingo provides a unified, low-latency AI gateway across 8 mainstream AI ecosystems:
1. **Google Gemini** (`https://generativelanguage.googleapis.com`): Direct Gemini REST API (`v1beta`) with greedy decoding and prompt minimization.
2. **OpenAI** (`https://api.openai.com/v1`): Official OpenAI REST endpoint (`gpt-4o-mini`, `gpt-4o`, `o3-mini`).
3. **Anthropic Claude** (`https://api.anthropic.com/v1`): Direct Claude Messages API (`/v1/messages`) with `anthropic-version: 2023-06-01` and SSE streaming.
4. **DeepSeek** (`https://api.deepseek.com/v1`): Official DeepSeek API (`deepseek-chat`, `deepseek-reasoner`).
5. **Groq LPU** (`https://api.groq.com/openai/v1`): Sub-100ms ultra-fast inference (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`).
6. **OpenRouter** (`https://openrouter.ai/api/v1`): Universal model aggregator with `HTTP-Referer` and `X-Title` identification.
7. **Corporate One API / LiteLLM** (`https://oneapi.corp.internal/v1`): Centralized enterprise corporate proxy gateway.
8. **Local Offline LLMs** (`http://localhost:11434/v1`): 100% private air-gapped local inference via Ollama or LM Studio.

## Streaming Protocols & Response Parsing
The Electron main process (`electron/main.cjs`) implements native Libuv/Undici SSE streaming:
- **Anthropic Messages Protocol**:
  - Endpoint: `POST {endpoint}/messages`
  - Headers: `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`, `content-type: application/json`
  - Payload: `{ model, max_tokens: 1024, stream: true, system: "...", messages: [{ role: "user", content: "..." }] }`
  - Stream Parser: Extracts `content_block_delta` events (`delta.text`), handles `message_delta`, and finalizes on `message_stop`.
- **OpenAI-Compatible Protocol**:
  - Used by OpenAI, DeepSeek, Groq, OpenRouter, Corporate One API, and Local Ollama.
  - Endpoint: `POST {endpoint}/chat/completions`
  - Headers: `Authorization: Bearer {apiKey}`, `HTTP-Referer`, `X-Title` (for OpenRouter).
  - Stream Parser: Parses `data: ` SSE chunks, concatenating `choices[0].delta.content`.
- **Gemini Direct Protocol**:
  - Endpoint: `POST {endpoint}/v1beta/models/{model}:streamGenerateContent?key={apiKey}`
  - Stream Parser: Parses JSON chunks for `candidates[0].content.parts[0].text`.

## Isolated Key Persistence & Settings Management
- **Per-Provider Key Isolation**: In `storageService.js`, keys are stored independently under `gemini_translator_provider_keys` (`{ openai: '...', anthropic: '...', ... }`), preventing key erasure when switching between providers.
- **Dynamic Header & UI Sync**:
  - `Header.jsx` dynamically renders the active provider's brand icon, color-matched status pill, and currently selected model.
  - `SettingsModal.jsx` provides an 8-provider grid, popular model quick-selection chips, collapsible custom endpoint configuration, and live latency ping testing (`endpoint:test` IPC).
- **Enterprise BYOM Policy Guard**:
  - If corporate enterprise policy defines `aiProvider`, `customEndpoint`, or `lockSettings`, local configuration is enforced and locked per commercial licensing agreements.
