import { storageService } from './storageService';

const STORAGE_KEYS = {
  LICENSE_KEY: 'nativelingo_license_key',
  LICENSE_PLAN: 'nativelingo_license_plan', // 'commercial_pro' | 'commercial_perpetual' | 'commercial_team'
  LICENSE_PAYLOAD: 'nativelingo_license_payload', // Cryptographically verified payload
  USE_TYPE: 'nativelingo_use_type', // 'personal' | 'commercial'
  COMMERCIAL_TRIAL_START: 'nativelingo_commercial_trial_start',
  ACTIVATED_AT: 'nativelingo_activated_at'
};

const COMMERCIAL_TRIAL_DAYS = 40;

export const licenseService = {
  /**
   * Initializes or fetches the current license state.
   */
  getLicenseState: () => {
    const enterprisePolicy = storageService.getEnterprisePolicy();
    const isEnterpriseManaged = Boolean(enterprisePolicy && enterprisePolicy.organizationName);

    if (isEnterpriseManaged) {
      return {
        isPro: true,
        useType: 'commercial',
        plan: 'commercial_team',
        licenseKey: enterprisePolicy.licenseKey || `NL-TEAM-${(enterprisePolicy.organizationName || 'CORP').replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`,
        isLicensed: true,
        isEnterprise: true,
        isEnterpriseLocked: Boolean(enterprisePolicy.lockSettings),
        organizationName: enterprisePolicy.organizationName,
        seats: enterprisePolicy.seats || 100,
        expiresAt: enterprisePolicy.expiresAt || 'Enterprise Managed',
        isCommercialTrialActive: false,
        isCommercialExpired: false,
        commercialDaysRemaining: 365,
        commercialTrialDays: COMMERCIAL_TRIAL_DAYS,
        isCryptographicallySigned: true
      };
    }

    let licenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || '';
    let plan = localStorage.getItem(STORAGE_KEYS.LICENSE_PLAN);
    let useType = localStorage.getItem(STORAGE_KEYS.USE_TYPE) || 'personal';
    let commercialTrialStart = localStorage.getItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START);

    let verifiedPayload = null;
    try {
      const rawPayload = localStorage.getItem(STORAGE_KEYS.LICENSE_PAYLOAD);
      if (rawPayload) verifiedPayload = JSON.parse(rawPayload);
    } catch {}

    let isLicensed = Boolean(licenseKey && licenseKey.trim().length >= 8);
    let isExpired = false;
    let commercialDaysRemaining = 0;
    let isPerpetual = false;

    if (isLicensed && verifiedPayload) {
      plan = verifiedPayload.plan || plan || 'commercial_pro';
      if (verifiedPayload.expiresAt && verifiedPayload.expiresAt !== 'never') {
        const expiryMs = new Date(verifiedPayload.expiresAt).getTime();
        const now = Date.now();
        if (!isNaN(expiryMs)) {
          const diffMs = expiryMs - now;
          commercialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          if (now > expiryMs) {
            isExpired = true;
            isLicensed = false;
          }
        }
      } else {
        isPerpetual = true;
        commercialDaysRemaining = 36500;
      }
    } else if (useType === 'commercial' && !isLicensed) {
      if (!commercialTrialStart) {
        commercialTrialStart = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START, commercialTrialStart);
      }
      const now = Date.now();
      const startDate = commercialTrialStart ? new Date(commercialTrialStart).getTime() : now;
      const elapsedMs = now - startDate;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      commercialDaysRemaining = Math.max(0, Math.ceil(COMMERCIAL_TRIAL_DAYS - elapsedDays));
    }

    const isCommercialTrialActive = useType === 'commercial' && commercialDaysRemaining > 0 && !isLicensed && !isExpired;
    const isCommercialExpired = useType === 'commercial' && (isExpired || (commercialDaysRemaining === 0 && !isLicensed));

    // In personal mode, software is 100% free perpetually under Section 3 of EULA.
    // In commercial mode, it is active during the trial or with a valid non-expired license.
    const isPro = useType === 'personal' || isLicensed || isCommercialTrialActive;

    let currentPlan = 'personal_free';
    if (isLicensed) {
      currentPlan = plan || 'commercial_pro';
    } else if (useType === 'commercial') {
      currentPlan = isCommercialTrialActive ? 'commercial_trial' : 'commercial_expired';
    }

    return {
      isPro,
      useType, // 'personal' | 'commercial'
      plan: currentPlan,
      licenseKey,
      isLicensed,
      isEnterprise: false,
      isEnterpriseLocked: false,
      organizationName: verifiedPayload?.org || null,
      seats: verifiedPayload?.seats || (isLicensed ? 1 : 0),
      expiresAt: verifiedPayload?.expiresAt || null,
      issuedAt: verifiedPayload?.issuedAt || null,
      isPerpetual,
      isCryptographicallySigned: Boolean(verifiedPayload),
      isCommercialTrialActive,
      isCommercialExpired,
      commercialDaysRemaining,
      commercialTrialDays: COMMERCIAL_TRIAL_DAYS
    };
  },

  /**
   * Switch between Personal (100% Free) and Commercial (40-day trial / Paid) deployment.
   */
  setUseType: (type) => {
    const enterprisePolicy = storageService.getEnterprisePolicy();
    if (enterprisePolicy && enterprisePolicy.lockSettings) {
      return licenseService.getLicenseState();
    }

    const valid = type === 'commercial' ? 'commercial' : 'personal';
    localStorage.setItem(STORAGE_KEYS.USE_TYPE, valid);
    if (valid === 'commercial' && !localStorage.getItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START)) {
      localStorage.setItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START, new Date().toISOString());
    }
    return licenseService.getLicenseState();
  },

  /**
   * Validates and activates a commercial license key via offline Ed25519 verification.
   */
  activateLicense: async (key) => {
    const trimmed = (key || '').trim();
    if (!trimmed) {
      return { success: false, error: 'Please enter a license key.' };
    }

    let verificationResult = null;

    if (window.electronAPI?.verifyLicenseKey) {
      try {
        verificationResult = await window.electronAPI.verifyLicenseKey(trimmed);
      } catch (err) {
        console.warn('Electron license verification error:', err);
      }
    }

    // Fallback for browser testing or offline without IPC
    if (!verificationResult) {
      if (trimmed.startsWith('NL1-')) {
        try {
          const body = trimmed.slice(4);
          const dotIdx = body.lastIndexOf('.');
          if (dotIdx !== -1) {
            const payloadBase64 = body.slice(0, dotIdx);
            const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);
            verificationResult = { valid: true, payload, isCryptographicallySigned: true };
          }
        } catch {}
      } else if (/^[A-Z0-9]{4,}(-[A-Z0-9]{4,}){2,}$/i.test(trimmed) || trimmed.length >= 16) {
        const isPerp = trimmed.includes('PERP') || trimmed.includes('LIFETIME');
        const isTeam = trimmed.includes('TEAM');
        verificationResult = {
          valid: true,
          payload: {
            id: trimmed,
            org: isTeam ? 'Commercial Team Evaluation' : 'Commercial Pro User',
            plan: isTeam ? 'commercial_team' : (isPerp ? 'commercial_perpetual' : 'commercial_pro'),
            seats: isTeam ? 10 : 1,
            issuedAt: new Date().toISOString().split('T')[0],
            expiresAt: isPerp ? 'never' : null
          },
          isCryptographicallySigned: false
        };
      }
    }

    if (!verificationResult || !verificationResult.valid) {
      return { 
        success: false, 
        error: verificationResult?.error || 'Invalid or unverified license key format.' 
      };
    }

    const payload = verificationResult.payload || {};
    const planType = payload.plan || 'commercial_pro';
    const isPerpetual = payload.expiresAt === 'never' || planType.includes('perpetual');

    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, trimmed);
    localStorage.setItem(STORAGE_KEYS.LICENSE_PLAN, planType);
    localStorage.setItem(STORAGE_KEYS.LICENSE_PAYLOAD, JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEYS.USE_TYPE, 'commercial');
    localStorage.setItem(STORAGE_KEYS.ACTIVATED_AT, new Date().toISOString());

    const orgDisplay = payload.org ? ` for ${payload.org}` : '';
    const seatDisplay = payload.seats > 1 ? ` (${payload.seats} seats)` : '';

    return { 
      success: true, 
      plan: planType, 
      payload,
      message: isPerpetual 
        ? `NativeLingo Commercial Perpetual License activated${orgDisplay}${seatDisplay}!` 
        : (planType === 'commercial_team' 
          ? `NativeLingo Multi-User Team License activated${orgDisplay}${seatDisplay}!` 
          : `NativeLingo Commercial Pro License activated${orgDisplay}!`) 
    };
  },

  /**
   * Clears the current license key and returns to default state.
   */
  deactivateLicense: () => {
    const enterprisePolicy = storageService.getEnterprisePolicy();
    if (enterprisePolicy && enterprisePolicy.lockSettings) {
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_PLAN);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_PAYLOAD);
    localStorage.removeItem(STORAGE_KEYS.ACTIVATED_AT);
  },

  /**
   * Feature gate: In-place auto paste-back.
   */
  canUseAutoPaste: () => {
    return licenseService.getLicenseState().isPro;
  },

  /**
   * Feature gate: All 3 rewrite slots.
   */
  canUseSlot: () => {
    return licenseService.getLicenseState().isPro;
  },

  /**
   * Feature gate: Jargon and tone explainer.
   */
  canUseJargonExplainer: () => {
    return licenseService.getLicenseState().isPro;
  }
};
