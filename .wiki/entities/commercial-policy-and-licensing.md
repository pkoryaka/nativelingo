# Commercial Policy & Dual-Use Licensing Architecture

## Overview
NativeLingo implements a dual-use client-side licensing model with zero token markups, fully aligned with the [NativeLingo EULA](../../LICENSE).

## Dual-Use Licensing Architecture
- **Personal, Educational & Non-Commercial Use (EULA Section 3)**:
  - **100% Free Forever**: Individual human users have a perpetual, royalty-free license across unlimited devices.
  - **All features fully unlocked**: Instant in-place auto-paste, all 3 rewrite hotkey slots, jargon demystifier, and local Ollama + Gemini BYOK.
  - **No trial expiration, no credit card, no forced payment**.
- **Commercial & Corporate Workplace Deployment (EULA Section 2 & 4)**:
  - **40-Day Evaluation**: Commercial entities receive 40 calendar days of fully functional internal evaluation.
  - **Commercial Licensing Requirement**: Continued commercial operations after 40 days require purchasing a commercial license.
- **Inference Philosophy**: 100% BYOK (Bring Your Own Key) and offline local AI via Ollama / LM Studio. NativeLingo charges $0 for AI tokens, and data never traverses proxy relays.

## Commercial License Tiers (For Business Operations)
- **Personal & Educational**: $0 forever (EULA Sec. 3).
- **Commercial Single-User Pro (Annual)**: $34 / year ($2.85/month equivalent). 1 named user across 2 workstations, all updates, priority support.
- **Commercial Single-User Pro (Perpetual)**: $74 one-time ($59 launch promo for first 200 copies). 12 months updates included, optional $24/year renewal.
- **Multi-User Team (Annual)**: $49 / seat / year (min 3 seats). Centralized license management, corporate tax/VAT invoices, priority SLA.

## Implementation Details
- **Engine**: `src/services/licenseService.js`:
  - `useType`: `'personal'` (default, 100% free perpetual) | `'commercial'` (40-day trial / licensed).
  - `isPro`: Always `true` for Personal use, and `true` during active commercial trial or when licensed.
  - Feature gates (`canUseAutoPaste()`, `canUseSlot()`, `canUseJargonExplainer()`): Unlocked for all compliant users.
- **UI Components**:
  - `src/components/SettingsModal.jsx`: Usage type selector (Personal vs Commercial) and commercial activation tools.
  - `src/components/Header.jsx`: Badge displaying `Personal (Free)`, `Evaluation (Xd)`, or `Commercial Pro`.
  - `PRICING.md`: Detailed public pricing and terms of service.
