# NativeLingo Enterprise BYOM Deployment & Administration Guide

NativeLingo is a single, unified, lightweight Windows desktop assistant engineered for privacy-conscious enterprises, global consulting firms, and engineering teams.

This guide provides IT administrators and security teams with instructions for **zero-touch, machine-wide deployment**, **BYOM (Bring Your Own Model) endpoint configuration**, **settings locking**, and **compliance enforcement**.

---

## 1. Enterprise Architecture & Security Overview

| Security Attribute | NativeLingo Enterprise Implementation |
| :--- | :--- |
| **Data Flow Architecture** | **Direct Point-to-Point TLS.** Text is sent directly from the employee's workstation to your designated corporate AI endpoint (Azure OpenAI, Google Gemini Cloud, or internal Ollama/vLLM servers). |
| **Intermediary Servers** | **None (Zero Middlemen).** The software contains zero proprietary proxy servers, telemetry collectors, or remote user tracking. |
| **Token Cost Model** | **100% BYOM / BYOK ($0 Token Markup).** The enterprise pays its own cloud provider or internal compute directly. NativeLingo charges no token margin. |
| **Workstation Privacy & DLP** | **Optional Zero-Persistence Mode.** Setting `"disableHistory": true` prevents all translations, rewrites, and summaries from being saved to the local disk. |
| **Tamper Protection** | Configuration is governed via `C:\ProgramData\NativeLingo\policy.json`. Standard non-admin user accounts cannot modify or override machine-wide settings. |

---

## 2. Machine-Wide Policy Configuration (`policy.json`)

To configure NativeLingo across your organization, deploy a `policy.json` file to the machine-wide `ProgramData` directory:

```
C:\ProgramData\NativeLingo\policy.json
```

*(Alternative fallback location: `%LOCALAPPDATA%\nativelingo\enterprise_policy.json` for per-user or portable testing).*

### Configuration Examples

#### Scenario A: Central Corporate "One API" or LiteLLM Proxy Gateway
```json
{
  "organizationName": "Acme Global Corp",
  "licenseKey": "NL-TEAM-ACME-2026-X88F",
  "lockSettings": true,
  "aiProvider": "corporate_gateway",
  "customEndpoint": "https://oneapi.corp.acme.com/v1",
  "customApiKey": "sk-corp-oneapi-master-token",
  "customModel": "gpt-4o",
  "primaryTargetLanguage": "en",
  "disableHistory": true
}
```

#### Scenario B: Local Offline LLM (Ollama / LM Studio)
```json
{
  "organizationName": "Acme R&D Lab",
  "licenseKey": "NL-TEAM-ACME-2026-X88F",
  "lockSettings": true,
  "aiProvider": "openai_compatible",
  "customEndpoint": "http://localhost:11434/v1",
  "customModel": "llama3.3-70b-instruct",
  "primaryTargetLanguage": "en",
  "disableHistory": true
}
```

#### Scenario C: Corporate Google Cloud Gemini Enterprise Key
```json
{
  "organizationName": "Contoso Consulting",
  "licenseKey": "NL-TEAM-CONTOSO-2026-99K2",
  "lockSettings": true,
  "aiProvider": "gemini",
  "apiKey": "AIzaSyCorpEnterpriseGeminiKey12345",
  "model": "gemini-flash-lite-latest",
  "primaryTargetLanguage": "uk",
  "disableHistory": false
}
```

---

## 3. Policy Parameters Reference

| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `organizationName` | `string` | **Yes** | Displays company branding in the UI header and Settings dialog (e.g. `🏢 Acme Global Corp`). |
| `licenseKey` | `string` | Optional | Corporate Team License key. Auto-activates all seats without prompting employees. |
| `lockSettings` | `boolean` | Optional | When `true`, disables user UI inputs for AI provider, endpoints, model names, and API keys. |
| `aiProvider` | `string` | **Yes** | `"corporate_gateway"` (Central One API / LiteLLM Proxy), `"openai_compatible"` (Local LLM), or `"gemini"`. |
| `customEndpoint` | `string` | For Gateway/BYOM | Base OpenAI-compatible URL (e.g. `https://oneapi.corp.com/v1` or `http://localhost:11434/v1`). |
| `customApiKey` | `string` | Optional | Bearer authentication token for corporate One API gateway. Automatically masked in the UI. |
| `customModel` | `string` | For Gateway/BYOM | Target model ID (e.g. `gpt-4o`, `claude-3-5-sonnet`, `llama3.3-70b-instruct`, `deepseek-chat`). |
| `apiKey` | `string` | For Gemini | Corporate Google Cloud Gemini API Key. |
| `model` | `string` | For Gemini | Gemini model identifier (default: `gemini-flash-lite-latest`). |
| `disableHistory` | `boolean` | Optional | **Data Loss Prevention (DLP):** If `true`, translation history is never persisted to disk. |
| `primaryTargetLanguage`| `string` | Optional | Default 2-letter language code (e.g. `"en"`, `"de"`, `"uk"`, `"fr"`, `"es"`). |

---

## 4. Automated Intune / SCCM / PowerShell Deployment Script

Administrators can deploy NativeLingo silently and write the enterprise policy using the following PowerShell script:

```powershell
# ==============================================================================
# NativeLingo Zero-Touch Enterprise Deployment Script
# Compatible with Microsoft Intune, SCCM, and Group Policy Startup Scripts
# ==============================================================================

$ErrorActionPreference = "Stop"

$InstallerUrl = "https://github.com/pkoryaka/nativelingo/releases/latest/download/NativeLingo-Setup.exe"
$TempInstaller = "$env:TEMP\NativeLingo-Setup.exe"
$PolicyDir     = "C:\ProgramData\NativeLingo"
$PolicyFile    = "$PolicyDir\policy.json"

# 1. Create Machine-Wide Policy Directory
if (!(Test-Path $PolicyDir)) {
    New-Item -ItemType Directory -Path $PolicyDir -Force | Out-Null
}

# 2. Write Corporate Policy JSON
$PolicyContent = @'
{
  "organizationName": "Acme Global Corp",
  "licenseKey": "NL-TEAM-ACME-2026-X88F",
  "lockSettings": true,
  "aiProvider": "openai_compatible",
  "customEndpoint": "https://ai-proxy.corp.acme.com/v1",
  "customApiKey": "corp-internal-secret-token",
  "customModel": "llama3.3-70b-instruct",
  "primaryTargetLanguage": "en",
  "disableHistory": true
}
'@

[System.IO.File]::WriteAllText($PolicyFile, $PolicyContent, [System.Text.Encoding]::UTF8)
Write-Host "Corporate policy deployed to $PolicyFile"

# 3. Lock Permissions (Administrators: Full Control, Users: Read-Only)
$Acl = Get-Acl $PolicyFile
$Acl.SetAccessRuleProtection($true, $false)
$AdminRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "Allow")
$SystemRule = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM", "FullControl", "Allow")
$UserRule  = New-Object System.Security.AccessControl.FileSystemAccessRule("Users", "ReadAndExecute", "Allow")
$Acl.SetAccessRule($AdminRule)
$Acl.AddAccessRule($SystemRule)
$Acl.AddAccessRule($UserRule)
Set-Acl $PolicyFile $Acl
Write-Host "Tamper-proofing permissions configured."

# 4. Download and Silently Install NativeLingo
Write-Host "Downloading NativeLingo installer..."
Invoke-WebRequest -Uri $InstallerUrl -OutFile $TempInstaller

Write-Host "Installing NativeLingo silently..."
Start-Process -FilePath $TempInstaller -ArgumentList "/S" -Wait

# 5. Clean up temporary installer
Remove-Item $TempInstaller -Force
Write-Host "NativeLingo Enterprise Deployment Completed Successfully."
```

---

## 5. Group Policy (GPO) Central Deployment

To enforce policy via Active Directory Group Policy Objects:
1. Open **Group Policy Management** (`gpmc.msc`).
2. Create or edit a GPO targeting your workstations (e.g. `NativeLingo-Corporate-Config`).
3. Navigate to:
   ```
   Computer Configuration -> Preferences -> Windows Settings -> Files
   ```
4. Right-click **Files** $\rightarrow$ **New** $\rightarrow$ **File**:
   - **Action**: `Update` or `Replace`
   - **Source file(s)**: `\\your-domain.local\SYSVOL\Policies\NativeLingo\policy.json`
   - **Destination File**: `C:\ProgramData\NativeLingo\policy.json`
5. Apply the GPO. Upon next `gpupdate /force` or workstation reboot, all NativeLingo clients will automatically lock to corporate endpoints.

---

## 6. Corporate Licensing & Procurement

Under the [NativeLingo EULA (LICENSE.md)](./LICENSE.md), commercial entities with greater than 1 commercial user are required to obtain a **Multi-User Team License** ($24/seat/year) or **Single-User Commercial License** ($17/year or $29 perpetual) after a 40-day evaluation.

- **Purchase & Invoicing:** Contact `licensing@businessintel.co.site`.
- **Tax/VAT Receipts:** Lemon Squeezy and Stripe provide automatic tax compliance, VAT reverse charges, and formal PDF corporate receipts.
- **Offline License Key Delivery:** Multi-seat offline Ed25519 keys (`NL1-...`) can be issued for strictly air-gapped corporate environments.


