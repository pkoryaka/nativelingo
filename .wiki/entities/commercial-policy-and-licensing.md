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
- **Commercial Single-User Pro (Annual)**: $17 / year ($1.42/month equivalent). 1 named user across 2 workstations, all updates, priority support.
- **Commercial Single-User Pro (Perpetual)**: $37 one-time ($29 launch promo for first 200 copies). 12 months updates included, optional $12/year renewal.
- **Multi-User Team (Annual)**: $24 / seat / year (~$2.00/month, min 3 seats). Centralized license management, corporate tax/VAT invoices, priority SLA.
- **Enterprise Managed**: $45 / seat / year (25-seat min) with offline Ed25519 signing and MDM/Intune deployment.

## Cryptographic Offline License Verification (Ed25519 Asymmetric Signatures)
- **Zero-Cloud Air-Gapped Security**: Commercial enterprise clients on secure intranets or air-gapped workstations can activate their software without pinging an external server.
- **Asymmetric Keypair**:
  - Master Private Key (`scripts/keys/ed25519_private.pem`) is retained by developer/sales.
  - Master Public Key is embedded into `electron/licenseVerifier.cjs`.
- **Token Format**:
  - `NL1-<base64url(payloadJSON)>.<base64url(signature)>`
  - Payload JSON contains: `{ id, org, email, plan, seats, issuedAt, expiresAt }`.
  - Signature is generated over the exact UTF-8 payload Base64 string using `crypto.sign(null, data, privateKey)`.
- **Verification Engine**:
  - `electron/licenseVerifier.cjs` validates the signature using `crypto.verify(null, data, publicKey, signature)`.
  - Enforces expiration dates (`expiresAt: 'never'` or `YYYY-MM-DD`). If expired, returns `{ valid: false, expired: true }`.
  - Tampered payloads fail digital signature checks immediately.
- **Developer CLI**:
  - `scripts/generate_license.cjs` allows issuing signed keys with custom parameters:
    `node scripts/generate_license.cjs --org "Siemens Energy" --seats 50 --plan commercial_team --days 365`
- **UI & State Binding**:
  - `licenseService.js` and `SettingsModal.jsx` display verified organization badges, seat allocations, expiration dates, and the green `Ed25519 Cryptographically Signed & Verified (Offline Safe)` shield.

