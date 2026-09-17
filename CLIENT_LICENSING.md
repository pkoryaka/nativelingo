# NativeLingo — Client Licensing & Activation Guide

This guide provides step-by-step instructions for activating, managing, and deploying **NativeLingo Commercial Pro**, **Multi-User Team**, and **Enterprise** licenses.

---

## Quick Reference Summary

| License Tier | Typical Customer | Activation Method | Workstations Allowed |
| :--- | :--- | :--- | :--- |
| **Personal & Educational** | Individuals, students, researchers | **Automatic / $0 Forever** (EULA Sec. 3) | Unlimited personal devices |
| **Commercial Pro (Annual / Perpetual)** | Freelancers, consultants, professionals | Manual Key Input (`NL1-...`) | 2 devices per named user |
| **Multi-User Team** | Departments (3–20 seats), CX teams | Manual Key Input or `policy.json` | 2 devices per named user |
| **Enterprise Managed** | Large organizations (20+ seats), banks | Zero-Touch IT Push (`policy.json`) | Fleet-wide via Group Policy / Intune |

---

## 1. How to Activate a License Key (Desktop Client)

If you received a cryptographic license key (formatted as `NL1-...`), activate it directly inside the application:

### Step-by-Step Instructions:

1. **Launch NativeLingo** on your Windows PC.
2. **Open Settings**:
   - Click the **Gear icon** (⚙️) or the **License Badge** in the top-right header, or press `Alt + ,`.
3. **Navigate to the License Tab**:
   - Click **License & Terms** in the left sidebar navigation.
4. **Select Commercial Deployment**:
   - Click the **Commercial & Workplace Deployment** card.
5. **Paste Your License Key**:
   - Paste your full `NL1-...` key into the input box under **Activate Commercial License Key**.
6. **Click Activate**:
   - The application instantly verifies the cryptographic signature offline (in $<1\text{ms}$).
   - You will see a green confirmation badge:
     ```text
     🏢 [Your Organization Name] • [X] Seats Licensed • Active
     🛡️ Ed25519 Cryptographically Signed & Verified (Offline Safe)
     ```

> [!TIP]
> **No Internet Required**: NativeLingo uses asymmetric Ed25519 public-key cryptography. The software verifies your license completely offline on your computer. It never connects to an external licensing server.

---

## 2. Enterprise Fleet Deployment (Zero-Touch IT Rollout)

For IT administrators deploying NativeLingo across dozens or hundreds of employee workstations, manual activation is not required. NativeLingo supports **zero-touch provisioning** via Windows Group Policy (GPO), Microsoft Intune, or SCCM.

### The Machine-Wide Policy File
Drop a `policy.json` configuration file into the global Windows `ProgramData` directory:
```text
C:\ProgramData\NativeLingo\policy.json
```

### Complete `policy.json` Specification

```json
{
  "organizationName": "Acme Global Industries",
  "licenseKey": "NL1-eyJpZCI6Ik5MLVRFQU0tQUNNR...==.SIGNATURE_BYTES...",
  "lockSettings": true,
  "aiProvider": "corporate_gateway",
  "customEndpoint": "https://oneapi.internal.acme.com/v1",
  "customApiKey": "sk-corp-gateway-token",
  "customModel": "gpt-4o",
  "primaryTargetLanguage": "en",
  "disableHistory": true
}
```

### Policy Fields Explained:
- **`organizationName`**: Displays your company name on employee header badges and verifies corporate entitlement.
- **`licenseKey`**: Your corporate Ed25519 signed license token (`NL1-...`).
- **`lockSettings: true`**: Locks configuration settings in the UI so standard users cannot alter endpoints or models.
- **`aiProvider`**: Routes traffic through your preferred gateway (`corporate_gateway`, `openai_compatible`, `openai`, `anthropic`, `deepseek`, or `gemini`).
- **`customEndpoint`**: Directs all API requests to your internal corporate proxy (e.g. One API, LiteLLM, or Azure OpenAI).
- **`disableHistory: true`**: Strict DLP compliance mode. Disables all translation disk caching and clipboard history persistence.

### Automated PowerShell Deployment Script (Intune / SCCM / GPO)

Run the following script with Administrator privileges on target machines:

```powershell
# NativeLingo Enterprise Provisioning Script
$PolicyDir = "C:\ProgramData\NativeLingo"
if (!(Test-Path $PolicyDir)) {
    New-Item -ItemType Directory -Path $PolicyDir -Force | Out-Null
}

$PolicyContent = @'
{
  "organizationName": "Acme Global Industries",
  "licenseKey": "NL1-PASTE_YOUR_LICENSE_KEY_HERE",
  "lockSettings": true,
  "aiProvider": "corporate_gateway",
  "customEndpoint": "https://oneapi.corp.acme.com/v1",
  "customApiKey": "sk-corp-gateway-token",
  "customModel": "gpt-4o",
  "disableHistory": true
}
'@

Set-Content -Path "$PolicyDir\policy.json" -Value $PolicyContent -Encoding UTF8 -Force
Write-Host "NativeLingo enterprise policy successfully provisioned."
```

When employees launch NativeLingo, the app automatically detects the policy, activates the corporate license, locks down the interface, and displays your company badge.

---

## 3. Reassigning or Moving a License

Each named user license permits installation on up to **2 workstations** used exclusively by that individual (e.g. work desktop and personal laptop).

### Moving to a New Computer:
1. On the old workstation:
   - Open **Settings** $\rightarrow$ **License & Terms**.
   - Click the red **Deactivate** button.
2. On the new workstation:
   - Install NativeLingo.
   - Paste your `NL1-...` license key and click **Activate**.

---

## 4. Troubleshooting & FAQ

### Q: Why does it say "Cryptographic signature is invalid"?
- **Cause**: The key string was truncated, modified, or has accidental leading/trailing spaces.
- **Fix**: Ensure you copy the entire key string from `NL1-` all the way to the end of the signature characters.

### Q: Why does it say "This commercial license expired on [Date]"?
- **Cause**: Annual commercial subscriptions must be renewed upon term expiration.
- **Fix**: Contact your organization's IT procurement or email sales for an updated license key.

### Q: The license options are grayed out or locked. Why?
- **Cause**: Your device is managed by enterprise IT via `C:\ProgramData\NativeLingo\policy.json` with `"lockSettings": true`.
- **Fix**: Contact your internal IT helpdesk or system administrator.

### Q: Does NativeLingo transmit employee data or translations to your servers?
- **No.** NativeLingo operates under a strict **Zero-Cloud-Intermediary** architecture. The application contains zero telemetry collectors, zero proxy relays, and zero remote logging. Text flows directly and exclusively between the employee's machine and your configured AI endpoint (Azure, OpenAI, Claude, internal gateway, or local Ollama).

---

## 5. Licensing Support & Inquiries

For seat expansions, invoice requests, or procurement assistance:
- **Commercial Licensing Portal**: [https://businessintelsystem.com](https://businessintelsystem.com)
- **Corporate Procurement & Invoices**: `licensing@businessintelsystem.com`
- **Technical Deployment Inquiries**: `support@businessintelsystem.com`

