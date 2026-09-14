const STORAGE_KEYS = {
  LICENSE_KEY: 'nativelingo_license_key',
  LICENSE_PLAN: 'nativelingo_license_plan', // 'commercial_pro' | 'commercial_perpetual' | 'commercial_team'
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
    let licenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || '';
    let plan = localStorage.getItem(STORAGE_KEYS.LICENSE_PLAN);
    let useType = localStorage.getItem(STORAGE_KEYS.USE_TYPE) || 'personal';
    let commercialTrialStart = localStorage.getItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START);

    const isLicensed = Boolean(licenseKey && licenseKey.trim().length >= 8);

    if (useType === 'commercial' && !commercialTrialStart && !isLicensed) {
      commercialTrialStart = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START, commercialTrialStart);
    }

    const now = Date.now();
    const startDate = commercialTrialStart ? new Date(commercialTrialStart).getTime() : now;
    const elapsedMs = now - startDate;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const commercialDaysRemaining = Math.max(0, Math.ceil(COMMERCIAL_TRIAL_DAYS - elapsedDays));

    const isCommercialTrialActive = useType === 'commercial' && commercialDaysRemaining > 0 && !isLicensed;
    const isCommercialExpired = useType === 'commercial' && commercialDaysRemaining === 0 && !isLicensed;

    // In personal mode, software is 100% free perpetually under Section 3 of EULA.
    // In commercial mode, it is active during the 40-day trial or with a valid key.
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
    const valid = type === 'commercial' ? 'commercial' : 'personal';
    localStorage.setItem(STORAGE_KEYS.USE_TYPE, valid);
    if (valid === 'commercial' && !localStorage.getItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START)) {
      localStorage.setItem(STORAGE_KEYS.COMMERCIAL_TRIAL_START, new Date().toISOString());
    }
    return licenseService.getLicenseState();
  },

  /**
   * Validates and activates a commercial license key.
   * Supports offline format verification and Lemon Squeezy / Gumroad license patterns.
   */
  activateLicense: async (key) => {
    const trimmed = (key || '').trim().toUpperCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter a license key.' };
    }

    // Accepts keys like NL-PRO-XXXX-XXXX-XXXX, NL-PERP-XXXX-XXXX, or standard UUID keys
    const isValidFormat = /^[A-Z0-9]{4,}(-[A-Z0-9]{4,}){2,}$/i.test(trimmed) || trimmed.length >= 16;

    if (!isValidFormat) {
      return { success: false, error: 'Invalid license key format. Keys follow the format: NL-PRO-XXXX-XXXX' };
    }

    const isPerpetual = trimmed.includes('PERP') || trimmed.includes('LIFETIME');
    const isTeam = trimmed.includes('TEAM');
    const planType = isTeam ? 'commercial_team' : (isPerpetual ? 'commercial_perpetual' : 'commercial_pro');

    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, trimmed);
    localStorage.setItem(STORAGE_KEYS.LICENSE_PLAN, planType);
    localStorage.setItem(STORAGE_KEYS.USE_TYPE, 'commercial');
    localStorage.setItem(STORAGE_KEYS.ACTIVATED_AT, new Date().toISOString());

    return { 
      success: true, 
      plan: planType, 
      message: isPerpetual 
        ? 'NativeLingo Commercial Perpetual License activated!' 
        : (isTeam ? 'NativeLingo Multi-User Team License activated!' : 'NativeLingo Commercial Pro License activated!') 
    };
  },

  /**
   * Clears the current license key and returns to default state.
   */
  deactivateLicense: () => {
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_PLAN);
    localStorage.removeItem(STORAGE_KEYS.ACTIVATED_AT);
  },

  /**
   * Feature gate: In-place auto paste-back.
   * Free and unlocked for Personal use, and active in Commercial trial/licensed mode.
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
