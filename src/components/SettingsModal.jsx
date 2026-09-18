import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Key, ExternalLink, CheckCircle2, AlertCircle, Loader2, Sparkles, 
  Monitor, RotateCw, Power, Keyboard, Zap, BookOpen, Languages, 
  AppWindow, Cpu, Server, Sun, Moon, Palette, Sliders, History,
  Star, Search, Check, Volume2, VolumeX, CreditCard, BadgeCheck, ShieldAlert, Award,
  Building2, Lock, Clock, Bot, Globe, ChevronDown, ChevronUp, ShieldCheck, Copy, Mail
} from 'lucide-react';
import { AVAILABLE_MODELS, SUPPORTED_LANGUAGES, testGeminiApiKey, fetchLiveAvailableModels } from '../services/geminiService';
import { storageService, ROLE_PRESET_PACKS, AI_PROVIDERS } from '../services/storageService';
import { licenseService } from '../services/licenseService';
import { ttsService } from '../services/ttsService';
import { HotkeyRecorder } from './HotkeyRecorder';
import appLogo from '../assets/app-icon.png';

export function SettingsModal({ isOpen, onClose, onSettingsUpdated, theme: initialTheme, onToggleTheme, initialTab = 'models' }) {
  if (!isOpen) return null;

  const enterprisePolicy = storageService.getEnterprisePolicy();
  const isEnterprise = Boolean(enterprisePolicy && enterprisePolicy.organizationName);
  const isLocked = Boolean(isEnterprise && enterprisePolicy.lockSettings);

  const currentSettings = storageService.getSettings();
  const currentKey = storageService.getApiKey();

  const [activeTab, setActiveTab] = useState(initialTab || 'models');
  const [themeMode, setThemeMode] = useState(() => initialTheme || storageService.getTheme());

  const [licenseState, setLicenseState] = useState(() => licenseService.getLicenseState());
  const [inputLicenseKey, setInputLicenseKey] = useState(licenseState.licenseKey || '');
  const [activationMsg, setActivationMsg] = useState(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const initialModel = currentSettings.model || 'gemini-flash-lite-latest';

  const [apiKey, setApiKey] = useState(currentKey);
  const [model, setModel] = useState(initialModel);
  const [modelsList, setModelsList] = useState(() => storageService.getCachedModels() || AVAILABLE_MODELS);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);
  const [temperature, setTemperature] = useState(currentSettings.temperature ?? 0.1);
  const [showKey, setShowKey] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [startMinimized, setStartMinimized] = useState(currentSettings.startMinimized || false);
  const [saveHistory, setSaveHistory] = useState(currentSettings.saveHistory !== false);

  // BYOM & Multi-Provider state
  const [aiProvider, setAiProvider] = useState(currentSettings.aiProvider || 'gemini');
  const [customGeminiModel, setCustomGeminiModel] = useState(currentSettings.customGeminiModel || '');
  const [customEndpoint, setCustomEndpoint] = useState(currentSettings.customEndpoint || 'http://localhost:11434/v1');
  const [customApiKey, setCustomApiKey] = useState(() => storageService.getProviderApiKey(currentSettings.aiProvider || 'gemini'));
  const [customModel, setCustomModel] = useState(currentSettings.customModel || 'llama3.2');
  const [endpointTestStatus, setEndpointTestStatus] = useState(null);
  const [showAdvancedEndpoint, setShowAdvancedEndpoint] = useState(false);

  const handleSelectProvider = (provId) => {
    if (isLocked) return;
    const prov = AI_PROVIDERS.find((p) => p.id === provId);
    if (!prov) return;

    if (aiProvider === 'gemini') {
      storageService.setApiKey(apiKey);
    } else {
      storageService.setProviderApiKey(aiProvider, customApiKey);
    }

    setAiProvider(provId);
    setTestStatus(null);
    setEndpointTestStatus(null);

    if (provId === 'gemini') {
      // Keep Gemini state
    } else {
      const savedKey = storageService.getProviderApiKey(provId);
      setCustomApiKey(savedKey);
      setCustomEndpoint(prov.endpoint);
      setCustomModel(prov.defaultModel);
    }
  };

  // Primary Target Language & Preferred Languages
  const [primaryTargetLanguage, setPrimaryTargetLanguage] = useState(currentSettings.primaryTargetLanguage || 'uk');
  const [preferredLanguages, setPreferredLanguages] = useState(() => storageService.getPreferredLanguages());
  const [langSearch, setLangSearch] = useState('');
  const [instantPopupMode, setInstantPopupMode] = useState(currentSettings.instantPopupMode !== false);
  const [safePreviewMode, setSafePreviewMode] = useState(currentSettings.safePreviewMode || false);
  const [packFeedback, setPackFeedback] = useState(null);

  // High-Quality Text-to-Speech Settings
  const [ttsVoiceGender, setTtsVoiceGender] = useState(currentSettings.ttsVoiceGender || 'female');
  const [ttsSpeed, setTtsSpeed] = useState(currentSettings.ttsSpeed || 1.0);
  const [isTestingTts, setIsTestingTts] = useState(false);

  // Global Hotkeys (Customizable strings)
  const [translateHotkey, setTranslateHotkey] = useState(currentSettings.translateHotkey || 'CommandOrControl+Alt+T');
  const [explainHotkey, setExplainHotkey] = useState(currentSettings.explainHotkey || 'CommandOrControl+Alt+J');

  // 3 Custom Prompt Slots
  const [quickSlots, setQuickSlots] = useState(() => storageService.getQuickSlots());

  const handleApplyRolePack = (packId) => {
    const pack = ROLE_PRESET_PACKS[packId];
    if (pack && pack.slots) {
      setQuickSlots(pack.slots);
      setPackFeedback(`Loaded ${pack.name}!`);
      setTimeout(() => setPackFeedback(null), 3500);
    }
  };

  const [testStatus, setTestStatus] = useState(null); // { loading, success, message }

  // Detect any hotkey conflicts across all 5 hotkeys
  const allHotkeys = [
    { key: translateHotkey, label: 'Quick Translate' },
    { key: explainHotkey, label: 'Explain Jargon' },
    ...quickSlots.map((s, idx) => ({ key: s.hotkey, label: `Slot ${idx + 1} (${s.name || 'Quick Action'})` }))
  ].filter((item) => item.key && item.key.trim());

  const duplicateKey = allHotkeys.find(
    (item, index) => allHotkeys.findIndex((other, otherIdx) => otherIdx !== index && other.key.toLowerCase() === item.key.toLowerCase()) !== -1
  );

  const hasConflict = Boolean(duplicateKey);

  const selectedModelInfo = modelsList.find((m) => m.id === model) || modelsList[0] || AVAILABLE_MODELS[0];

  const handleRefreshModels = async (keyToUse = apiKey) => {
    const key = keyToUse || apiKey || storageService.getApiKey();
    if (!key || !key.trim()) {
      setRefreshMsg({ error: true, text: 'Please enter an API key above first.' });
      return;
    }
    setIsRefreshingModels(true);
    setRefreshMsg(null);
    try {
      const live = await fetchLiveAvailableModels(key.trim());
      if (live && live.length > 0) {
        setModelsList(live);
        storageService.setCachedModels(live);
        if (!live.some((m) => m.id === model)) {
          setModel(live[0].id);
        }
        setRefreshMsg({ error: false, text: `✓ Found ${live.length} live models directly from Google AI` });
        setTimeout(() => setRefreshMsg(null), 5000);
      }
    } catch (err) {
      console.warn('Failed to refresh models list:', err);
      setRefreshMsg({ error: true, text: err.message || 'Failed to query Google API.' });
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    const key = (apiKey && apiKey.trim()) || storageService.getApiKey();
    if (key && key.trim()) {
      handleRefreshModels(key.trim());
    }
  }, []);

  useEffect(() => {
    // Check autostart status
    if (window.electronAPI?.getAutoStart) {
      window.electronAPI.getAutoStart().then((enabled) => {
        setAutoStart(Boolean(enabled));
      }).catch((e) => console.warn('Autostart check failed', e));
    }

    if (window.electronAPI?.getStartMinimized) {
      window.electronAPI.getStartMinimized().then((val) => {
        setStartMinimized(Boolean(val));
      }).catch((e) => console.warn('StartMinimized check failed', e));
    }

    if (window.electronAPI?.getHotkeys) {
      window.electronAPI.getHotkeys().then((keys) => {
        if (keys?.translateHotkey) setTranslateHotkey(keys.translateHotkey);
        if (keys?.explainHotkey) setExplainHotkey(keys.explainHotkey);
        if (keys?.slots && Array.isArray(keys.slots)) setQuickSlots(keys.slots);
      }).catch((e) => console.warn('Failed to load hotkeys', e));
    }
  }, []);

  const handleToggleAutoStart = async (e) => {
    const newValue = e.target.checked;
    setAutoStart(newValue);
    if (window.electronAPI?.setAutoStart) {
      try {
        await window.electronAPI.setAutoStart(newValue);
      } catch (err) {
        console.warn('Failed to set autostart', err);
      }
    }
  };

  const handleSlotChange = (slotId, updates) => {
    setQuickSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot))
    );
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setTestStatus({ loading: true, message: 'Testing connection to Gemini API...' });
    try {
      await testGeminiApiKey(apiKey, model);
      setTestStatus({ success: true, message: 'Connection successful! Model is ready.' });
    } catch (err) {
      setTestStatus({ success: false, message: err.message || 'Connection test failed.' });
    }
  };

  const handleTestCustomEndpoint = async () => {
    const provMeta = AI_PROVIDERS.find((p) => p.id === aiProvider) || AI_PROVIDERS[0];
    const ep = customEndpoint || provMeta.endpoint;
    const keyToTest = (aiProvider === 'gemini') ? apiKey : (customApiKey || storageService.getProviderApiKey(aiProvider));
    const modelToTest = (aiProvider === 'gemini') ? (customGeminiModel || model) : (customModel || provMeta.defaultModel);

    setEndpointTestStatus({ loading: true, message: `Connecting to ${provMeta.name}...` });
    try {
      if (window.electronAPI?.testEndpoint) {
        const res = await window.electronAPI.testEndpoint({
          endpoint: ep,
          model: modelToTest,
          apiKey: keyToTest,
          provider: aiProvider
        });
        if (res.success) {
          setEndpointTestStatus({ success: true, message: res.text || `✓ Connected to ${modelToTest} successfully!` });
        } else {
          setEndpointTestStatus({ success: false, message: res.text || 'Connection test failed.' });
        }
      } else {
        if (aiProvider === 'anthropic') {
          const url = `${ep.replace(/\/+$/, '')}/messages`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': keyToTest,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: modelToTest,
              messages: [{ role: 'user', content: 'Say OK' }],
              max_tokens: 10
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${res.status}`);
          }
          setEndpointTestStatus({ success: true, message: `✓ Connected to ${modelToTest} successfully!` });
        } else {
          const url = `${ep.replace(/\/+$/, '')}/chat/completions`;
          const headers = { 'Content-Type': 'application/json' };
          if (keyToTest && keyToTest.trim()) {
            headers['Authorization'] = `Bearer ${keyToTest.trim()}`;
          }
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: modelToTest,
              messages: [{ role: 'user', content: 'Say OK' }],
              max_tokens: 10
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${res.status}`);
          }
          setEndpointTestStatus({ success: true, message: `✓ Connected to ${modelToTest} successfully!` });
        }
      }
    } catch (err) {
      setEndpointTestStatus({ success: false, message: err.message || 'Connection test failed.' });
    }
  };

  const handleSelectTheme = (newTheme) => {
    setThemeMode(newTheme);
    storageService.setTheme(newTheme);
    if (onToggleTheme && initialTheme !== newTheme) {
      onToggleTheme();
    }
  };

  const handleToggleStar = (langCode, e) => {
    if (e) e.stopPropagation();
    setPreferredLanguages((prev) => {
      let updated;
      if (prev.includes(langCode)) {
        updated = prev.filter((c) => c !== langCode);
        if (updated.length === 0) updated = ['en']; // Keep at least one
      } else {
        updated = [...prev, langCode];
      }
      storageService.setPreferredLanguages(updated);
      return updated;
    });
  };

  const handleTestTts = async () => {
    if (isTestingTts) {
      ttsService.stop();
      setIsTestingTts(false);
      return;
    }

    const demoPhrases = {
      uk: 'Привіт! Якість голосу тепер кришталево чиста та природна.',
      en: 'Hello! Voice quality is now crystal clear, human, and natural.',
      es: '¡Hola! La calidad de voz ahora es natural y de alta definición.',
      de: 'Hallo! Die Sprachqualität ist jetzt kristallklar und natürlich.',
      pl: 'Cześć! Jakość głosu jest teraz naturalna i krystalicznie czysta.',
      fr: 'Bonjour! La qualité vocale est désormais naturelle et d\'une clarté cristalline.',
      ru: 'Привет! Качество голоса теперь чистое и естественное.'
    };

    const phrase = demoPhrases[primaryTargetLanguage] || demoPhrases['en'];

    await ttsService.speak({
      text: phrase,
      lang: primaryTargetLanguage,
      gender: ttsVoiceGender,
      rate: ttsSpeed,
      onStart: () => setIsTestingTts(true),
      onEnd: () => setIsTestingTts(false),
      onError: () => setIsTestingTts(false)
    });
  };

  const handleActivateLicense = async () => {
    setIsActivating(true);
    setActivationMsg(null);
    const res = await licenseService.activateLicense(inputLicenseKey);
    setIsActivating(false);
    if (res.success) {
      setLicenseState(licenseService.getLicenseState());
      setActivationMsg({ success: true, text: res.message });
      if (onSettingsUpdated) onSettingsUpdated();
    } else {
      setActivationMsg({ success: false, text: res.error });
    }
  };

  const handleDeactivate = () => {
    licenseService.deactivateLicense();
    setInputLicenseKey('');
    setLicenseState(licenseService.getLicenseState());
    setActivationMsg({ success: true, text: 'License deactivated. Returned to default state.' });
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const handleSwitchUseType = (type) => {
    const next = licenseService.setUseType(type);
    setLicenseState(next);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const [selectedTier, setSelectedTier] = useState(null);
  const [copiedOrder, setCopiedOrder] = useState(false);

  const handleSelectTier = (tierKey) => {
    setSelectedTier((prev) => (prev === tierKey ? null : tierKey));
    setCopiedOrder(false);
  };

  const handleInstantDemoActivate = async (tierKey) => {
    setIsActivating(true);
    setActivationMsg(null);
    let key = '';
    if (tierKey === 'annual') {
      key = 'NL-PRO-ANNUAL-EVAL-2026';
    } else if (tierKey === 'perpetual') {
      key = 'NL-PERP-LIFETIME-EVAL-2026';
    } else {
      key = 'NL-TEAM-CORP-EVAL-2026';
    }
    setInputLicenseKey(key);
    const res = await licenseService.activateLicense(key);
    setIsActivating(false);
    if (res.success) {
      setLicenseState(licenseService.getLicenseState());
      setActivationMsg({ success: true, text: res.message });
      setSelectedTier(null);
      if (onSettingsUpdated) onSettingsUpdated();
    } else {
      setActivationMsg({ success: false, text: res.error });
    }
  };

  const handleCopyOrderDetails = (tierKey) => {
    let details = '';
    if (tierKey === 'annual') {
      details = `NativeLingo Commercial License Order Request:
- Plan: Commercial Single-User Annual ($17 / year)
- Workstations: 2 PCs included
- Updates & Priority Support: Included
- Contact / Send to: licensing@businessintelsystem.com
- Please send invoice & payment instructions.`;
    } else if (tierKey === 'perpetual') {
      details = `NativeLingo Commercial License Order Request:
- Plan: Commercial Single-User Perpetual ($29 one-time launch deal)
- Workstations: 2 PCs included
- 12 Months Version Updates & Perpetual Right: Included
- Contact / Send to: licensing@businessintelsystem.com
- Please send invoice & payment instructions.`;
    } else {
      details = `NativeLingo Commercial License Order Request:
- Plan: Commercial Multi-User Team ($24 / seat / year)
- Seats: 3 Seats Minimum ($72 / year)
- Cryptographic Offline Keys & Central Management: Included
- Contact / Send to: licensing@businessintelsystem.com
- Please send corporate tax invoice & wire/ACH instructions.`;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(details);
    } else if (window.electronAPI?.copyToClipboard) {
      window.electronAPI.copyToClipboard(details);
    }
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2500);
  };

  const handleEmailOrder = (tierKey) => {
    const title = tierKey === 'annual' 
      ? 'Single-User Annual ($17/yr)' 
      : (tierKey === 'perpetual' ? 'Single-User Perpetual ($29)' : 'Multi-User Team ($24/seat/yr)');
    const subject = encodeURIComponent(`NativeLingo License Order - ${title}`);
    const body = encodeURIComponent(`Hello NativeLingo Licensing Team,

I would like to order a ${title}.

Organization / Company Name: 
License Contact Email: 
Number of Seats / Workstations: 
Preferred Payment Method: Credit Card / Corporate Invoice / Wire

Thank you!`);
    const mailUrl = `mailto:licensing@businessintelsystem.com?subject=${subject}&body=${body}`;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(mailUrl);
    } else {
      window.open(mailUrl, '_blank');
    }
  };

  const handleSave = () => {
    if (hasConflict) return;

    ttsService.stop();
    setIsTestingTts(false);

    storageService.setApiKey(apiKey.trim());
    if (aiProvider !== 'gemini') {
      storageService.setProviderApiKey(aiProvider, customApiKey);
    }
    storageService.saveSettings({
      ...currentSettings,
      model,
      temperature,
      primaryTargetLanguage,
      preferredLanguages,
      instantPopupMode,
      safePreviewMode,
      startMinimized,
      saveHistory,
      translateHotkey,
      explainHotkey,
      ttsVoiceGender,
      ttsSpeed,
      aiProvider,
      customGeminiModel,
      customEndpoint,
      customApiKey,
      customModel,
      theme: themeMode
    });

    storageService.saveQuickSlots(quickSlots);

    if (window.electronAPI?.setStartMinimized) {
      window.electronAPI.setStartMinimized(startMinimized);
    }

    // Update Electron Global Hotkeys & Slots
    if (window.electronAPI?.updateHotkeys) {
      window.electronAPI.updateHotkeys({
        translateKey: translateHotkey,
        explainKey: explainHotkey,
        slots: quickSlots
      });
    }

    if (onSettingsUpdated) {
      onSettingsUpdated();
    }
    onClose();
  };

  // Filter languages based on user search query
  const nonAutoLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto');
  }, []);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return nonAutoLanguages;
    const q = langSearch.toLowerCase().trim();
    return nonAutoLanguages.filter((l) => 
      l.name.toLowerCase().includes(q) || 
      l.nativeName.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q)
    );
  }, [nonAutoLanguages, langSearch]);

  const preferredLanguageObjects = useMemo(() => {
    return preferredLanguages
      .map((code) => nonAutoLanguages.find((l) => l.code === code))
      .filter(Boolean);
  }, [preferredLanguages, nonAutoLanguages]);

  const otherLanguages = useMemo(() => {
    return filteredLanguages.filter((l) => !preferredLanguages.includes(l.code));
  }, [filteredLanguages, preferredLanguages]);

  const selectedProviderMeta = useMemo(() => {
    return AI_PROVIDERS.find((p) => p.id === aiProvider) || AI_PROVIDERS[0];
  }, [aiProvider]);

  const renderProviderIcon = (iconName, color = 'var(--primary)', size = 15) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={size} color={color} />;
      case 'Bot': return <Bot size={size} color={color} />;
      case 'Zap': return <Zap size={size} color={color} />;
      case 'Cpu': return <Cpu size={size} color={color} />;
      case 'Globe': return <Globe size={size} color={color} />;
      case 'Building2': return <Building2 size={size} color={color} />;
      case 'Server': return <Server size={size} color={color} />;
      default: return <Cpu size={size} color={color} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* ================= LEFT SIDEBAR (VERTICAL TABS) ================= */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-brand">
            <img 
              src={appLogo} 
              alt="NativeLingo" 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Settings
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                NativeLingo Desktop
              </p>
            </div>
          </div>

          <nav className="settings-sidebar-nav" aria-label="Settings Categories">
            <button
              type="button"
              className={`settings-tab-btn-vertical ${activeTab === 'models' ? 'active' : ''}`}
              onClick={() => setActiveTab('models')}
            >
              <Cpu size={17} />
              <span>AI Models & BYOM</span>
            </button>

            <button
              type="button"
              className={`settings-tab-btn-vertical ${activeTab === 'languages' ? 'active' : ''}`}
              onClick={() => setActiveTab('languages')}
            >
              <Languages size={17} />
              <span>Languages & Quality</span>
            </button>

            <button
              type="button"
              className={`settings-tab-btn-vertical ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              <Keyboard size={17} />
              <span>Shortcuts & Slots</span>
            </button>

            <button
              type="button"
              className={`settings-tab-btn-vertical ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={17} />
              <span>Appearance & System</span>
            </button>

            <button
              type="button"
              className={`settings-tab-btn-vertical ${activeTab === 'license' ? 'active' : ''}`}
              onClick={() => setActiveTab('license')}
            >
              <Award size={17} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                <span>License & Terms</span>
                <span style={{ fontSize: '0.65rem', color: isEnterprise ? 'var(--primary)' : (licenseState.useType === 'personal' || licenseState.isLicensed ? '#10b981' : (licenseState.isCommercialTrialActive ? 'var(--accent-amber)' : '#f87171')) }}>
                  {isEnterprise ? (enterprisePolicy.organizationName || 'Enterprise Team') : (licenseState.useType === 'personal' ? 'Personal (Free)' : (licenseState.isLicensed ? 'Commercial Pro' : `Eval (${licenseState.commercialDaysRemaining}d)`))}
                </span>
              </div>
            </button>
          </nav>

          {/* Sidebar Footer Hint */}
          <div style={{ padding: '8px', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
            <span>v1.0.0 • Production Release</span>
          </div>
        </aside>

        {/* ================= RIGHT MAIN AREA ================= */}
        <main className="settings-main-container">
          
          {/* Header */}
          <div className="settings-main-header">
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeTab === 'models' && 'AI Engine & Model Configuration'}
                {activeTab === 'languages' && 'Languages & Target Preferences'}
                {activeTab === 'shortcuts' && 'Global Hotkeys & Quick Rewrite Slots'}
                {activeTab === 'appearance' && 'Appearance & System Startup'}
                {activeTab === 'license' && 'License & Edition Terms'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeTab === 'models' && 'Configure Gemini Cloud or Local Offline LLMs (Ollama / LM Studio)'}
                {activeTab === 'languages' && 'Manage default translation target, starred favorites, and creativity'}
                {activeTab === 'shortcuts' && 'Configure global hotkeys and 3 in-place paste-back slot actions'}
                {activeTab === 'appearance' && 'Customize theme modes, instant floating HUD, and Windows startup'}
                {activeTab === 'license' && 'Free perpetual license for personal use • 40-day evaluation for commercial entities'}
              </p>
            </div>
            <button className="btn-icon" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Tab Panel */}
          <div className="settings-main-scrollable">

            {/* TAB 1: AI MODELS & BYOM */}
            {activeTab === 'models' && (
              <div className="settings-tab-body">
                {isEnterprise && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}>
                    <Building2 size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          Managed by {enterprisePolicy.organizationName} IT Policy
                        </strong>
                        {isLocked && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Lock size={10} /> Locked by Admin
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {isLocked
                          ? 'Your AI connection endpoint and model parameters are pre-configured and locked via corporate policy (C:\\ProgramData\\NativeLingo\\policy.json). Direct tampering is disabled.'
                          : 'Your workstation has a corporate deployment policy applied by your IT administrator.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title">
                      <Cpu size={16} color="var(--primary)" />
                      <span>Model Provider</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      {isEnterprise ? 'Enterprise BYOM' : 'BYOM Enabled'}
                    </span>
                  </div>

                  {/* Multi-Provider Selector Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {AI_PROVIDERS.map((prov) => {
                      const isSelected = aiProvider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleSelectProvider(prov.id)}
                          style={{
                            padding: '10px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? `2px solid ${prov.badgeColor}` : '1px solid var(--border-color)',
                            background: isSelected ? `${prov.badgeColor}22` : 'var(--bg-input)',
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            opacity: isLocked && !isSelected ? 0.5 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '4px',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 0 12px ${prov.badgeColor}33` : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {renderProviderIcon(prov.iconName, isSelected ? prov.badgeColor : 'var(--text-muted)', 15)}
                              <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{prov.name}</span>
                            </div>
                            {isSelected && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: prov.badgeColor }} />
                            )}
                          </div>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                            {prov.tagline}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Transparent Data Routing & Security Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    background: `${selectedProviderMeta.badgeColor}12`,
                    border: `1px solid ${selectedProviderMeta.badgeColor}40`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    fontSize: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {renderProviderIcon(selectedProviderMeta.iconName, selectedProviderMeta.badgeColor, 16)}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                        {aiProvider === 'gemini' && '☁️ Direct Cloud Routing (Google AI Studio)'}
                        {aiProvider === 'openai' && '🟢 Direct Cloud Routing (OpenAI Platform)'}
                        {aiProvider === 'anthropic' && '⚡ Direct Claude API Routing (Anthropic)'}
                        {aiProvider === 'deepseek' && '🔵 Direct DeepSeek API Routing'}
                        {aiProvider === 'groq' && '⚡ Ultra-Fast LPU Routing (Groq)'}
                        {aiProvider === 'openrouter' && '🌐 Universal Model Aggregator (OpenRouter)'}
                        {aiProvider === 'corporate_gateway' && '🏢 Central Corporate AI Gateway / One API Routing'}
                        {aiProvider === 'openai_compatible' && '🛡️ 100% Private Local Offline Routing'}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {aiProvider === 'gemini' && 'Text is sent over encrypted TLS directly to Google Gemini using your personal API key. Zero intermediate servers touch your text.'}
                        {aiProvider === 'openai' && 'Text is sent over encrypted TLS directly to OpenAI (api.openai.com/v1) using your personal OpenAI API key. Zero intermediate servers.'}
                        {aiProvider === 'anthropic' && 'Text is sent over encrypted TLS directly to Anthropic (api.anthropic.com/v1) using your personal Claude API key. Zero intermediate servers.'}
                        {aiProvider === 'deepseek' && 'Text is sent over encrypted TLS directly to DeepSeek (api.deepseek.com/v1) using your DeepSeek API key.'}
                        {aiProvider === 'groq' && 'Text is sent over encrypted TLS directly to Groq LPUs (api.groq.com/openai/v1) for sub-100ms ultra-low latency translations.'}
                        {aiProvider === 'openrouter' && 'Text is sent directly to OpenRouter (openrouter.ai/api/v1) using your OpenRouter token with access to 200+ models.'}
                        {aiProvider === 'corporate_gateway' && `Text is routed directly with your corporate bearer token to your organization's centralized One API or LiteLLM gateway (${customEndpoint || 'custom URL'}). Complies with corporate DLP policies.`}
                        {aiProvider === 'openai_compatible' && `Text is sent directly to your local endpoint (${customEndpoint || 'localhost'}). All computation stays 100% on your physical machine with zero internet transmission.`}
                      </span>
                    </div>
                  </div>

                  {/* Provider Specific Configuration */}
                  {aiProvider === 'gemini' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="form-label" htmlFor="api-key-input">Google Gemini API Key</label>
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            Get Free Key <ExternalLink size={12} />
                          </a>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="api-key-input"
                            type={showKey ? 'text' : 'password'}
                            className="form-input"
                            placeholder={isLocked && enterprisePolicy.hasApiKey ? '•••••••••••••••• (Managed by Corporate IT Policy)' : 'AIzaSy...'}
                            disabled={isLocked}
                            value={apiKey}
                            onChange={(e) => {
                              setApiKey(e.target.value);
                              storageService.setApiKey(e.target.value);
                            }}
                            style={{ paddingRight: '70px', fontFamily: 'var(--font-mono)', opacity: isLocked ? 0.75 : 1, cursor: isLocked ? 'not-allowed' : 'text' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            {showKey ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="form-label" htmlFor="model-select">Gemini Model</label>
                          <button
                            type="button"
                            onClick={() => handleRefreshModels()}
                            disabled={isRefreshingModels}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isRefreshingModels ? 'var(--text-muted)' : 'var(--primary)',
                              fontSize: '0.75rem',
                              cursor: isRefreshingModels ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RotateCw size={12} className={isRefreshingModels ? 'spinner' : ''} />
                            {isRefreshingModels ? 'Fetching Models...' : 'Refresh from Google AI'}
                          </button>
                        </div>

                        <select
                          id="model-select"
                          className="form-input"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          style={{ cursor: 'pointer' }}
                        >
                          {modelsList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name || m.id} {m.tag ? `— ${m.tag}` : ''}
                            </option>
                          ))}
                        </select>

                        {refreshMsg && (
                          <span style={{ fontSize: '0.75rem', color: refreshMsg.error ? '#f87171' : '#34d399' }}>
                            {refreshMsg.text}
                          </span>
                        )}

                        {selectedModelInfo && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {selectedModelInfo.description}
                          </p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>
                          Custom Gemini Model ID (Optional Override)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. gemini-2.5-pro or fine-tuned model"
                          value={customGeminiModel}
                          onChange={(e) => setCustomGeminiModel(e.target.value)}
                          style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={handleTestConnection}
                          disabled={testStatus?.loading}
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          {testStatus?.loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Loader2 size={13} className="spinner" /> Testing...
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={13} /> Test Gemini Connection
                            </span>
                          )}
                        </button>
                        {testStatus && !testStatus.loading && (
                          <span style={{ fontSize: '0.78rem', color: testStatus.success ? '#34d399' : '#f87171', fontWeight: 600 }}>
                            {testStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Managed Cloud, Corporate One API, and Local LLM Configuration */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      {/* Presets (for Corporate and Local) */}
                      {aiProvider === 'corporate_gateway' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEndpoint('https://oneapi.corp.internal/v1');
                              setCustomModel('gpt-4o');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              background: 'rgba(139, 92, 246, 0.1)',
                              color: '#a78bfa',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Preset: One API Gateway
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEndpoint('https://litellm.corp.internal/v1');
                              setCustomModel('claude-3-5-sonnet');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              background: 'rgba(6, 182, 212, 0.1)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Preset: LiteLLM Proxy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEndpoint('https://ai-proxy.your-company.com/v1');
                              setCustomModel('gemini-1.5-flash');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: 'var(--accent-emerald)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Preset: Internal Corp Proxy
                          </button>
                        </div>
                      )}

                      {aiProvider === 'openai_compatible' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEndpoint('http://localhost:11434/v1');
                              setCustomModel('llama3.2');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              background: 'rgba(168, 85, 247, 0.1)',
                              color: 'var(--accent-purple)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Preset: Ollama (:11434)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomEndpoint('http://localhost:1234/v1');
                              setCustomModel('local-model');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              background: 'rgba(6, 182, 212, 0.1)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Preset: LM Studio (:1234)
                          </button>
                        </div>
                      )}

                      {/* API Key Input */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="form-label" htmlFor="custom-api-key-input">
                            {selectedProviderMeta.name} {aiProvider === 'openai_compatible' ? 'API Key (Optional)' : 'API Key'}
                          </label>
                          {selectedProviderMeta.keyUrl && (
                            <a
                              href={selectedProviderMeta.keyUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.75rem', color: selectedProviderMeta.badgeColor, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              Get {selectedProviderMeta.name} Key <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="custom-api-key-input"
                            type={showKey ? 'text' : 'password'}
                            className="form-input"
                            placeholder={isLocked && enterprisePolicy.hasCustomApiKey ? '•••••••••••••••• (Managed by Corporate IT Policy)' : (selectedProviderMeta.placeholderKey || 'sk-...')}
                            disabled={isLocked}
                            value={customApiKey}
                            onChange={(e) => {
                              setCustomApiKey(e.target.value);
                              storageService.setProviderApiKey(aiProvider, e.target.value);
                            }}
                            style={{ paddingRight: '70px', fontFamily: 'var(--font-mono)', opacity: isLocked ? 0.75 : 1, cursor: isLocked ? 'not-allowed' : 'text' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            {showKey ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      {/* Popular Models Chips */}
                      {selectedProviderMeta.popularModels && selectedProviderMeta.popularModels.length > 0 && (
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            Popular Models (Click to Select)
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {selectedProviderMeta.popularModels.map((m) => {
                              const isCurModel = (customModel === m.id);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setCustomModel(m.id)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    border: isCurModel ? `1.5px solid ${selectedProviderMeta.badgeColor}` : '1px solid var(--border-color)',
                                    background: isCurModel ? `${selectedProviderMeta.badgeColor}22` : 'var(--bg-input)',
                                    color: isCurModel ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: '0.74rem',
                                    fontWeight: isCurModel ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {isCurModel && <Check size={12} color={selectedProviderMeta.badgeColor} />}
                                  <span>{m.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Model Identifier input */}
                      <div className="form-group">
                        <label className="form-label">Model Identifier</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={selectedProviderMeta.defaultModel}
                          disabled={isLocked}
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', opacity: isLocked ? 0.75 : 1, cursor: isLocked ? 'not-allowed' : 'text' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Target model identifier (e.g. {selectedProviderMeta.defaultModel}). You can also type any custom model ID or fine-tuned checkpoint.
                        </span>
                      </div>

                      {/* Endpoint URL (Collapsible for managed cloud, always visible for Corporate & Local) */}
                      {(aiProvider === 'corporate_gateway' || aiProvider === 'openai_compatible') ? (
                        <div className="form-group">
                          <label className="form-label">API Endpoint URL</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={selectedProviderMeta.endpoint}
                            disabled={isLocked}
                            value={customEndpoint}
                            onChange={(e) => setCustomEndpoint(e.target.value)}
                            style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', opacity: isLocked ? 0.75 : 1, cursor: isLocked ? 'not-allowed' : 'text' }}
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Base URL of the OpenAI-compatible service (e.g. {selectedProviderMeta.endpoint}).
                          </span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '2px', marginBottom: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setShowAdvancedEndpoint(!showAdvancedEndpoint)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: 0
                            }}
                          >
                            {showAdvancedEndpoint ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            <span>Advanced: Custom Proxy / Relay Endpoint URL</span>
                          </button>

                          {showAdvancedEndpoint && (
                            <div className="form-group" style={{ marginTop: '8px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={selectedProviderMeta.endpoint}
                                disabled={isLocked}
                                value={customEndpoint}
                                onChange={(e) => setCustomEndpoint(e.target.value)}
                                style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', opacity: isLocked ? 0.75 : 1, cursor: isLocked ? 'not-allowed' : 'text' }}
                              />
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Default: {selectedProviderMeta.endpoint}. Only edit this if you route traffic through an enterprise reverse proxy.
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Connection Test Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={handleTestCustomEndpoint}
                          disabled={endpointTestStatus?.loading}
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          {endpointTestStatus?.loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Loader2 size={13} className="spinner" /> Testing {selectedProviderMeta.name}...
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {renderProviderIcon(selectedProviderMeta.iconName, 'currentColor', 13)}
                              Test {selectedProviderMeta.name} Connection
                            </span>
                          )}
                        </button>
                        {endpointTestStatus && (
                          <span style={{ fontSize: '0.78rem', color: endpointTestStatus.success ? '#34d399' : '#f87171', fontWeight: 600 }}>
                            {endpointTestStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LANGUAGES & QUALITY (WITH RESTORED PREFERRED PINNING & ALL LANGUAGES) */}
            {activeTab === 'languages' && (
              <div className="settings-tab-body">
                
                {/* Search & Overview Card */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title">
                      <Languages size={17} color="var(--primary)" />
                      <span>Default Target Language & Pinning</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                      Active: {primaryTargetLanguage.toUpperCase()}
                    </span>
                  </div>
                  <p className="settings-card-desc">
                    Select your primary translation target. Click the star icon (⭐) on any language to mark it as <strong>Preferred</strong> so it always stays pinned at the very top of language selectors across the app!
                  </p>

                  {/* Search Bar */}
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon-inside" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search 60+ languages (e.g. English, Ukrainian, Japanese, Polish, Español)..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                    {langSearch && (
                      <button
                        type="button"
                        onClick={() => setLangSearch('')}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 1: ⭐ Preferred Languages (Pinned at Top) */}
                <div className="settings-card" style={{ background: 'rgba(99, 102, 241, 0.07)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>
                      <Star size={15} fill="#f59e0b" />
                      <span>Preferred Languages (Pinned at Top)</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {preferredLanguageObjects.length} pinned
                    </span>
                  </div>

                  <div className="language-picker-grid">
                    {preferredLanguageObjects.map((lang) => {
                      const isSelected = primaryTargetLanguage === lang.code;
                      return (
                        <div
                          key={`pref-${lang.code}`}
                          className={`language-card-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setPrimaryTargetLanguage(lang.code)}
                          title="Click to set as Default Target Language"
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="language-name">{lang.name}</span>
                              {isSelected && <Check size={12} color="#818cf8" />}
                            </div>
                            <span className="language-native">{lang.nativeName}</span>
                          </div>

                          <button
                            type="button"
                            className="star-btn starred"
                            onClick={(e) => handleToggleStar(lang.code, e)}
                            title="Unpin from preferred languages"
                            aria-label={`Unpin ${lang.name}`}
                          >
                            <Star size={14} fill="#f59e0b" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: All Available Languages */}
                <div className="settings-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      All Available Languages ({filteredLanguages.length})
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Click star to pin to top
                    </span>
                  </div>

                  <div className="language-picker-grid" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredLanguages.map((lang) => {
                      const isSelected = primaryTargetLanguage === lang.code;
                      const isStarred = preferredLanguages.includes(lang.code);
                      return (
                        <div
                          key={`all-${lang.code}`}
                          className={`language-card-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setPrimaryTargetLanguage(lang.code)}
                          title="Click to set as Default Target Language"
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="language-name">{lang.name}</span>
                              {isSelected && <Check size={12} color="#818cf8" />}
                            </div>
                            <span className="language-native">{lang.nativeName}</span>
                          </div>

                          <button
                            type="button"
                            className={`star-btn ${isStarred ? 'starred' : ''}`}
                            onClick={(e) => handleToggleStar(lang.code, e)}
                            title={isStarred ? "Unpin from favorites" : "Pin to preferred languages (stays at top)"}
                            aria-label={`Pin ${lang.name}`}
                          >
                            <Star size={14} fill={isStarred ? "#f59e0b" : "none"} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Creativity & Temperature */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title">
                      <Sliders size={16} color="var(--accent-cyan)" />
                      <span>Creativity & Temperature</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>0.0 (Precise / Literal)</span>
                    <span>0.1 - 0.2 (Optimal Speed)</span>
                    <span>1.0 (Creative Nuance)</span>
                  </div>
                </div>

                {/* Natural Neural Voice & TTS Settings */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title">
                      <Volume2 size={16} color="var(--primary)" />
                      <span>Natural Neural Voice (Edge AI)</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, border: '1px solid rgba(16,185,129,0.25)' }}>
                      Studio HD
                    </span>
                  </div>
                  <p className="settings-card-desc">
                    NativeLingo synthesizes studio-grade neural speech across Ukrainian, English, and all supported languages. Select your preferred persona and pacing below.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                    {/* Voice Persona / Gender */}
                    <div>
                      <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.78rem' }}>Voice Gender</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setTtsVoiceGender('female')}
                          className={`btn-secondary ${ttsVoiceGender === 'female' ? 'active' : ''}`}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            justifyContent: 'center',
                            borderColor: ttsVoiceGender === 'female' ? 'var(--primary)' : 'var(--border-color)',
                            background: ttsVoiceGender === 'female' ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                            fontWeight: ttsVoiceGender === 'female' ? 600 : 400
                          }}
                        >
                          Female (Polina/Jenny)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTtsVoiceGender('male')}
                          className={`btn-secondary ${ttsVoiceGender === 'male' ? 'active' : ''}`}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            justifyContent: 'center',
                            borderColor: ttsVoiceGender === 'male' ? 'var(--primary)' : 'var(--border-color)',
                            background: ttsVoiceGender === 'male' ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                            fontWeight: ttsVoiceGender === 'male' ? 600 : 400
                          }}
                        >
                          Male (Ostap/Guy)
                        </button>
                      </div>
                    </div>

                    {/* Speech Speed */}
                    <div>
                      <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.78rem' }}>Speaking Speed</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                          { label: '0.85x', val: 0.85 },
                          { label: '1.0x (Normal)', val: 1.0 },
                          { label: '1.15x', val: 1.15 }
                        ].map((spd) => (
                          <button
                            key={spd.label}
                            type="button"
                            onClick={() => setTtsSpeed(spd.val)}
                            className={`btn-secondary ${ttsSpeed === spd.val ? 'active' : ''}`}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: '0.78rem',
                              justifyContent: 'center',
                              borderColor: ttsSpeed === spd.val ? 'var(--primary)' : 'var(--border-color)',
                              background: ttsSpeed === spd.val ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                              fontWeight: ttsSpeed === spd.val ? 600 : 400
                            }}
                          >
                            {spd.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview Button */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Preview audio in <strong>{primaryTargetLanguage.toUpperCase()}</strong> ({ttsVoiceGender}):
                    </span>
                    <button
                      type="button"
                      onClick={handleTestTts}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '5px 12px' }}
                    >
                      {isTestingTts ? <VolumeX size={14} color="var(--accent-cyan)" /> : <Volume2 size={14} />}
                      <span>{isTestingTts ? 'Stop Preview' : 'Test Speech'}</span>
                    </button>
                  </div>
                </div>

                {/* Save History Toggle */}
                <div className="settings-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} color="var(--accent-emerald)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Save Translation History</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Keep local record of translations in History Drawer</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saveHistory}
                    onChange={(e) => setSaveHistory(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: SHORTCUTS & PROMPT SLOTS */}
            {activeTab === 'shortcuts' && (
              <div className="settings-tab-body">
                <div className="settings-card">
                  <div className="settings-card-title">
                    <Keyboard size={16} color="var(--primary)" />
                    <span>Global Windows Hotkeys</span>
                  </div>

                  <HotkeyRecorder
                    label="1. Quick Translate Selected Text"
                    value={translateHotkey}
                    onChange={setTranslateHotkey}
                    otherHotkey={[explainHotkey, ...quickSlots.map((s) => s.hotkey)].filter(Boolean)}
                    defaultKey="CommandOrControl+Alt+T"
                    icon={Zap}
                    description="Highlight text in any app & press this combination to translate immediately."
                  />

                  <HotkeyRecorder
                    label="2. Translate & Explain Jargon / Slang"
                    value={explainHotkey}
                    onChange={setExplainHotkey}
                    otherHotkey={[translateHotkey, ...quickSlots.map((s) => s.hotkey)].filter(Boolean)}
                    defaultKey="CommandOrControl+Alt+J"
                    icon={BookOpen}
                    description="Highlight text & press to de-jargonize and explain idioms in plain words."
                  />
                </div>

                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title">
                      <Sparkles size={17} color="var(--accent-purple)" />
                      <span>3 In-Place Rewrite Slots</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', background: 'rgba(168, 85, 247, 0.12)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      ⚡ Auto Paste-Back
                    </span>
                  </div>
                  <p className="settings-card-desc">
                    Select text anywhere in Windows and press the slot's shortcut. The AI transforms text per prompt and pastes it back directly without opening windows!
                  </p>

                  {/* 1-Click Role Preset Packs */}
                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="var(--primary)" /> 1-Click Role Preset Packs
                      </span>
                      {packFeedback ? (
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                          ✓ {packFeedback}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Instantly configure slots for your workflow
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                      {Object.values(ROLE_PRESET_PACKS).map((pack) => (
                        <button
                          key={pack.id}
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleApplyRolePack(pack.id)}
                          style={{
                            padding: '8px 10px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '3px',
                            height: 'auto',
                            border: '1px solid var(--border-color)',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pack.badge}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>{pack.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Preview Mode */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Safe Preview First</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Show transformed text in HUD preview before replacing in-place</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={safePreviewMode}
                      onChange={(e) => setSafePreviewMode(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </div>

                  {quickSlots.map((slot, index) => {
                    const otherKeys = [
                      translateHotkey,
                      explainHotkey,
                      ...quickSlots.filter((s) => s.id !== slot.id).map((s) => s.hotkey)
                    ].filter(Boolean);

                    const defaultKeys = ['CommandOrControl+Alt+1', 'CommandOrControl+Alt+2', 'CommandOrControl+Alt+3'];
                    const defKey = defaultKeys[index] || '';

                    return (
                      <div
                        key={slot.id}
                        className="slot-config-card"
                        style={{
                          border: slot.enabled ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-color)',
                          opacity: slot.enabled ? 1 : 0.65
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <input
                              type="checkbox"
                              id={`slot-enable-${slot.id}`}
                              checked={slot.enabled !== false}
                              onChange={(e) => handleSlotChange(slot.id, { enabled: e.target.checked })}
                              style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '15px', height: '15px' }}
                            />
                            <label htmlFor={`slot-enable-${slot.id}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                              Slot {index + 1}:
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={slot.name || ''}
                              onChange={(e) => handleSlotChange(slot.id, { name: e.target.value })}
                              placeholder={`Action ${index + 1}`}
                              style={{ padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600, height: '28px', flex: 1 }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSlotChange(slot.id, { pasteBack: !slot.pasteBack })}
                            style={{
                              background: slot.pasteBack ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                              border: slot.pasteBack ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
                              color: slot.pasteBack ? '#10b981' : 'var(--primary)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {slot.pasteBack ? '⚡ In-Place Paste' : '🪟 Show in HUD'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              Prompt Directives:
                            </label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="slot-preset-tag"
                                onClick={() => handleSlotChange(slot.id, {
                                  name: 'Fix Grammar & Polish',
                                  prompt: 'Fix grammar, spelling, typos, and phrasing. Keep the exact same language and meaning intact. Output ONLY the polished text without any introduction, explanations, or quotes.'
                                })}
                              >
                                Grammar
                              </button>
                              <button
                                type="button"
                                className="slot-preset-tag"
                                onClick={() => handleSlotChange(slot.id, {
                                  name: 'American Business Casual',
                                  prompt: 'Rewrite the text into natural, polite, concise American business casual tone. Keep the original language intact. Output ONLY the rewritten text without commentary.'
                                })}
                              >
                                Business Casual
                              </button>
                              <button
                                type="button"
                                className="slot-preset-tag"
                                onClick={() => handleSlotChange(slot.id, {
                                  name: 'Translate to English',
                                  prompt: 'Translate the text into fluent, natural English. Output ONLY the translated text without extra explanations or quotes.'
                                })}
                              >
                                To English
                              </button>
                            </div>
                          </div>

                          <textarea
                            className="form-input"
                            rows={2}
                            value={slot.prompt || ''}
                            onChange={(e) => handleSlotChange(slot.id, { prompt: e.target.value })}
                            placeholder="Instructions for how the AI should rewrite the text..."
                            style={{ fontSize: '0.78rem', resize: 'vertical', minHeight: '44px', lineHeight: 1.3 }}
                          />
                        </div>

                        <HotkeyRecorder
                          label={`Slot ${index + 1} Hotkey`}
                          value={slot.hotkey || ''}
                          onChange={(newKey) => handleSlotChange(slot.id, { hotkey: newKey })}
                          otherHotkey={otherKeys}
                          defaultKey={defKey}
                          icon={Keyboard}
                          description={slot.pasteBack ? 'Transforms & replaces selected text in-place.' : 'Opens floating HUD with transformed text.'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: APPEARANCE & SYSTEM */}
            {activeTab === 'appearance' && (
              <div className="settings-tab-body">
                <div className="settings-card">
                  <div className="settings-card-header">
                    <div className="settings-card-title">
                      <Palette size={16} color="#6366f1" />
                      <span>Color Theme</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                      {themeMode === 'light' ? 'Light Theme' : 'Dark Theme'}
                    </span>
                  </div>
                  <p className="settings-card-desc">
                    Choose between Obsidian Dark glassmorphism or Clean Bright modern mode:
                  </p>

                  <div className="theme-switch-container">
                    <button
                      type="button"
                      className={`theme-switch-btn ${themeMode === 'dark' ? 'active' : ''}`}
                      onClick={() => handleSelectTheme('dark')}
                    >
                      <Moon size={18} color="#818cf8" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700 }}>Obsidian Dark</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>Sleek glassmorphism</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`theme-switch-btn ${themeMode === 'light' ? 'active' : ''}`}
                      onClick={() => handleSelectTheme('light')}
                    >
                      <Sun size={18} color="#f59e0b" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700 }}>Crisp Light</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>Bright & high-contrast</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="settings-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AppWindow size={15} color="#818cf8" />
                      <span>Instant Floating Mini Window (HUD)</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Show a compact cursor-positioned HUD on hotkey press (expandable to full window).
                    </span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={instantPopupMode}
                      onChange={(e) => setInstantPopupMode(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: instantPopupMode ? 'var(--primary)' : 'rgba(100, 116, 139, 0.25)',
                      borderRadius: '999px',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '14px',
                        width: '14px',
                        left: instantPopupMode ? '21px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease'
                      }} />
                    </span>
                  </label>
                </div>

                <div className="settings-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Power size={15} color="var(--accent-emerald)" />
                    <div>
                      <div>Launch on Windows Startup</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Silent background logon into system tray in &lt;100ms</div>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={autoStart}
                      onChange={handleToggleAutoStart}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: autoStart ? 'var(--primary)' : 'rgba(100, 116, 139, 0.25)',
                      borderRadius: '999px',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '14px',
                        width: '14px',
                        left: autoStart ? '21px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease'
                      }} />
                    </span>
                  </label>
                </div>

                <div className="settings-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Monitor size={15} color="var(--accent-cyan)" />
                      <span>Start Minimized (in System Tray)</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Start silently without popping up the main window until summoned via hotkey or tray.
                    </span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={startMinimized}
                      onChange={(e) => setStartMinimized(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: startMinimized ? 'var(--primary)' : 'rgba(100, 116, 139, 0.25)',
                      borderRadius: '999px',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '14px',
                        width: '14px',
                        left: startMinimized ? '21px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'license' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isEnterprise ? (
                  <div className="settings-card" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    borderColor: 'rgba(99, 102, 241, 0.35)',
                    padding: '20px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--primary)',
                        flexShrink: 0
                      }}>
                        <Building2 size={26} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Enterprise Team License
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: 'var(--accent-emerald)'
                            }}>
                              Corporate Active
                            </span>
                          </div>
                          {isLocked && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: 'var(--primary)',
                              backgroundColor: 'rgba(99, 102, 241, 0.12)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Lock size={11} /> Machine Policy Enforced
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                          This workstation is registered to <strong>{enterprisePolicy.organizationName}</strong> under a centralized multi-user commercial enterprise agreement (EULA Section 4). All Pro productivity features, unlimited rewrite slots, in-place paste-back, and privacy protections are fully unlocked across your organization.
                        </div>

                        <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned License Identifier:</span>
                          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {licenseState.licenseKey}
                          </span>
                        </div>

                        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> Centralized BYOM Inference Routing
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> Unlimited Workstation Activations
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> In-Place Instant Auto-Paste
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> Zero Data Telemetry / 100% Direct TLS
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. Usage Case Selector */}
                <div className="settings-card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Select Your Deployment Type
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      onClick={() => handleSwitchUseType('personal')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: `1.5px solid ${licenseState.useType === 'personal' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                        background: licenseState.useType === 'personal' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🏡</span>
                        <strong style={{ fontSize: '0.85rem', color: licenseState.useType === 'personal' ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                          Personal & Non-Commercial
                        </strong>
                      </div>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        100% Free Perpetual License for individuals, study, learning, research, and non-commercial productivity (EULA Sec. 3).
                      </p>
                    </div>

                    <div
                      onClick={() => handleSwitchUseType('commercial')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: `1.5px solid ${licenseState.useType === 'commercial' ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: licenseState.useType === 'commercial' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🏢</span>
                        <strong style={{ fontSize: '0.85rem', color: licenseState.useType === 'commercial' ? 'var(--primary)' : 'var(--text-primary)' }}>
                          Commercial & Corporate
                        </strong>
                      </div>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        40-day fully functional evaluation, followed by required commercial license for business use (EULA Sec. 2 & 4).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Personal Mode Card */}
                {licenseState.useType === 'personal' && (
                  <div className="settings-card" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    borderColor: 'rgba(16, 185, 129, 0.35)',
                    padding: '16px 20px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-emerald)',
                        flexShrink: 0
                      }}>
                        <BadgeCheck size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Personal License: 100% Free Forever
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: 'var(--accent-emerald)'
                          }}>
                            No Payment Required
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                          Under Section 3.1 of the NativeLingo EULA, you have a perpetual, royalty-free license to use all capabilities across unlimited devices for personal communication, private study, academic research, and learning.
                        </div>

                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> Instant In-Place Auto-Paste
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> All 3 Rewrite Hotkey Slots
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> Jargon & Tone Demystifier
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="#10b981" /> Free Cloud & Local AI (BYOK)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Commercial Mode Card & Activation */}
                {licenseState.useType === 'commercial' && (
                  <>
                    <div className="settings-card" style={{
                      background: licenseState.isLicensed
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)'
                        : (licenseState.isCommercialTrialActive
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'),
                      borderColor: licenseState.isLicensed
                        ? 'rgba(16, 185, 129, 0.35)'
                        : (licenseState.isCommercialTrialActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.35)'),
                      padding: '16px 20px',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: licenseState.isLicensed
                              ? 'rgba(16, 185, 129, 0.15)'
                              : (licenseState.isCommercialTrialActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                            color: licenseState.isLicensed
                              ? 'var(--accent-emerald)'
                              : (licenseState.isCommercialTrialActive ? 'var(--accent-amber)' : '#f87171'),
                            flexShrink: 0
                          }}>
                            {licenseState.isLicensed ? <BadgeCheck size={24} /> : <Clock size={24} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {licenseState.isLicensed && 'Commercial Registered License'}
                                {!licenseState.isLicensed && licenseState.isCommercialTrialActive && `Commercial Evaluation (${licenseState.commercialDaysRemaining} of 40 days remaining)`}
                                {!licenseState.isLicensed && !licenseState.isCommercialTrialActive && '40-Day Commercial Evaluation Expired'}
                              </span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: licenseState.isLicensed
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : (licenseState.isCommercialTrialActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                                color: licenseState.isLicensed
                                  ? 'var(--accent-emerald)'
                                  : (licenseState.isCommercialTrialActive ? 'var(--accent-amber)' : '#f87171')
                              }}>
                                {licenseState.isLicensed ? 'Licensed' : (licenseState.isCommercialTrialActive ? 'Evaluation' : 'Payment Required')}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                              {licenseState.isLicensed && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                    {licenseState.organizationName && (
                                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Building2 size={13} color="var(--primary)" />
                                        {licenseState.organizationName}
                                      </span>
                                    )}
                                    {licenseState.seats > 0 && (
                                      <span style={{ color: 'var(--text-muted)' }}>
                                        • {licenseState.seats} Seat{licenseState.seats > 1 ? 's' : ''} Licensed
                                      </span>
                                    )}
                                    <span style={{ color: 'var(--text-muted)' }}>
                                      • {licenseState.isPerpetual ? 'Perpetual Lifetime' : `Expires: ${licenseState.expiresAt || 'N/A'}`}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                                    <ShieldCheck size={13} />
                                    <span>Ed25519 Cryptographically Signed &amp; Verified (Offline Safe)</span>
                                  </div>
                                </div>
                              )}
                              {!licenseState.isLicensed && licenseState.isCommercialTrialActive && 'Commercial entities receive 40 calendar days of fully functional internal evaluation under Section 2.1 of the EULA.'}
                              {!licenseState.isLicensed && !licenseState.isCommercialTrialActive && 'Under Section 2.4 of the EULA, continued commercial use requires purchasing a commercial license.'}
                            </div>
                          </div>
                        </div>

                        {licenseState.licenseKey && (
                          <button
                            type="button"
                            onClick={handleDeactivate}
                            className="preset-chip"
                            style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#f87171' }}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>

                    {/* License Key Activation Section */}
                    <div className="settings-card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Key size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Activate Commercial License Key
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="settings-input"
                          placeholder="Paste cryptographic key (NL1-...) or standard license key"
                          value={inputLicenseKey}
                          onChange={(e) => setInputLicenseKey(e.target.value)}
                          style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={isActivating || !inputLicenseKey.trim()}
                          onClick={handleActivateLicense}
                          style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                        >
                          {isActivating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Activate
                        </button>
                      </div>

                      {activationMsg && (
                        <div style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: activationMsg.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: activationMsg.success ? 'var(--accent-emerald)' : '#f87171',
                          border: `1px solid ${activationMsg.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                        }}>
                          {activationMsg.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                          <span>{activationMsg.text}</span>
                        </div>
                      )}
                    </div>

                    {/* Commercial Pricing Cards */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Commercial License Tiers (EULA Sec. 4)
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          14-day money-back guarantee • VAT/Tax receipts
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {/* Plan A: Pro Annual */}
                        <div 
                          className="settings-card" 
                          onClick={() => handleSelectTier('annual')}
                          style={{
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: selectedTier === 'annual' ? '2px solid var(--primary)' : '1px solid var(--primary)',
                            position: 'relative',
                            background: selectedTier === 'annual' ? 'rgba(99, 102, 241, 0.1)' : 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '-9px',
                            right: '12px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase'
                          }}>
                            Most Popular
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Single-User Annual</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '6px 0 8px' }}>
                              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>$17</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ year</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '8px' }}>
                              $1.42/month • Exceptional value
                            </div>
                            <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', margin: 0, lineHeight: 1.6 }}>
                              <li>1 named commercial user</li>
                              <li>2 workstations included</li>
                              <li>All updates during term</li>
                              <li>Priority corporate support</li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectTier('annual'); }}
                            className="btn-primary"
                            style={{
                              marginTop: '12px',
                              textAlign: 'center',
                              padding: '7px 0',
                              fontSize: '0.78rem',
                              display: 'block',
                              width: '100%',
                              cursor: 'pointer'
                            }}
                          >
                            {selectedTier === 'annual' ? 'Options Open ▲' : 'Purchase / Test ($17)'}
                          </button>
                        </div>

                        {/* Plan B: Perpetual Lifetime */}
                        <div 
                          className="settings-card" 
                          onClick={() => handleSelectTier('perpetual')}
                          style={{
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: selectedTier === 'perpetual' ? '2px solid var(--accent-amber)' : '1px solid rgba(245, 158, 11, 0.4)',
                            background: selectedTier === 'perpetual' ? 'rgba(245, 158, 11, 0.1)' : 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '-9px',
                            right: '12px',
                            backgroundColor: 'var(--accent-amber)',
                            color: '#1e293b',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase'
                          }}>
                            Launch Deal
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Single-User Perpetual</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 8px' }}>
                              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>$29</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>$37</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600, marginBottom: '8px' }}>
                              One-time purchase • First 200 copies
                            </div>
                            <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', margin: 0, lineHeight: 1.6 }}>
                              <li>Own your version forever</li>
                              <li>12 months of version updates</li>
                              <li>2 workstations included</li>
                              <li>Optional renewal at $12/yr</li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectTier('perpetual'); }}
                            className="preset-chip"
                            style={{
                              marginTop: '12px',
                              textAlign: 'center',
                              padding: '7px 0',
                              fontSize: '0.78rem',
                              display: 'block',
                              width: '100%',
                              borderColor: 'var(--accent-amber)',
                              color: 'var(--accent-amber)',
                              cursor: 'pointer'
                            }}
                          >
                            {selectedTier === 'perpetual' ? 'Options Open ▲' : 'Purchase / Test ($29)'}
                          </button>
                        </div>

                        {/* Plan C: Team Annual */}
                        <div 
                          className="settings-card" 
                          onClick={() => handleSelectTier('team')}
                          style={{
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: selectedTier === 'team' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            background: selectedTier === 'team' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Multi-User Team</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '6px 0 8px' }}>
                              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>$24</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ seat / yr</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                              Minimum 3 seats • Commercial
                            </div>
                            <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', margin: 0, lineHeight: 1.6 }}>
                              <li>Central license management</li>
                              <li>Corporate tax/VAT invoices</li>
                              <li>Reassignable named seats</li>
                              <li>Priority bug fixes & SLA</li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectTier('team'); }}
                            className="preset-chip"
                            style={{
                              marginTop: '12px',
                              textAlign: 'center',
                              padding: '7px 0',
                              fontSize: '0.78rem',
                              display: 'block',
                              width: '100%',
                              cursor: 'pointer'
                            }}
                          >
                            {selectedTier === 'team' ? 'Options Open ▲' : 'Purchase / Test Team ($24)'}
                          </button>
                        </div>
                      </div>

                      {/* Selected Tier Interactive Action Drawer */}
                      {selectedTier && (
                        <div className="settings-card" style={{
                          marginTop: '12px',
                          padding: '16px',
                          border: '1.5px solid var(--primary)',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Sparkles size={16} color="var(--primary)" />
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {selectedTier === 'annual' && 'Commercial Single-User Annual ($17 / year)'}
                                {selectedTier === 'perpetual' && 'Commercial Single-User Perpetual ($29 one-time)'}
                                {selectedTier === 'team' && 'Commercial Multi-User Team ($24 / seat / year)'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedTier(null)}
                              className="btn-icon"
                              style={{ width: '24px', height: '24px', padding: 0, cursor: 'pointer' }}
                              title="Close Drawer"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                            Select an option below to test this tier immediately or request an official corporate order:
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {/* Option 0: Live Stripe Checkout */}
                            {selectedTier === 'annual' && (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => {
                                  const url = 'https://buy.stripe.com/test_14A8wO7o0cuL5sM7rDeUU00';
                                  if (window.electronAPI?.openExternal) {
                                    window.electronAPI.openExternal(url);
                                  } else {
                                    window.open(url, '_blank');
                                  }
                                }}
                                style={{
                                  padding: '10px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  gridColumn: '1 / -1',
                                  borderRadius: '6px',
                                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                                }}
                              >
                                <CreditCard size={15} />
                                <span>💳 Instant Purchase with Card / Apple Pay ($17)</span>
                              </button>
                            )}

                            {/* Option 1: Instant Demo Evaluation */}
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleInstantDemoActivate(selectedTier)}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <Zap size={14} />
                              <span>Instant 1-Click Test Activation</span>
                            </button>

                            {/* Option 2: Copy Order Details */}
                            <button
                              type="button"
                              className="preset-chip"
                              onClick={() => handleCopyOrderDetails(selectedTier)}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {copiedOrder ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              <span>{copiedOrder ? 'Copied to Clipboard!' : 'Copy Order / Invoice Request'}</span>
                            </button>

                            {/* Option 3: Send Order Email */}
                            <button
                              type="button"
                              className="preset-chip"
                              onClick={() => handleEmailOrder(selectedTier)}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Mail size={14} />
                              <span>Email Licensing Team</span>
                            </button>

                            {/* Option 4: Focus Key Input */}
                            <button
                              type="button"
                              className="preset-chip"
                              onClick={() => {
                                const input = document.querySelector('input[placeholder*="license key"]');
                                if (input) {
                                  input.focus();
                                  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              style={{
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Key size={14} />
                              <span>Enter Official Key (NL1-...)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                  </>
                )}

                {/* 4. BYOK Privacy & Zero-Markup Promise */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <ShieldAlert size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>100% BYOK & Zero Inference Markup:</strong> NativeLingo never bills per-token or acts as a middleman for your data. You use your own free Gemini API key (generous free tier) or run 100% offline with local Ollama models. Your text never touches third-party relay servers.
                    </div>
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(59, 130, 246, 0.15)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Open Source & EULA Compliance:</strong> The codebase is open on GitHub for transparency and security auditing. Individual personal and educational use is 100% free of charge forever (Section 3). Corporate entities are granted a 40-day evaluation, after which commercial licensing applies (Section 2 & 4).
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer Actions */}
          <div className="settings-main-footer">
            <div>
              {hasConflict && (
                <span style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> Duplicate shortcut: {duplicateKey.key}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="preset-chip"
                onClick={onClose}
                style={{ padding: '8px 18px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-translate"
                onClick={handleSave}
                disabled={hasConflict}
                style={{ padding: '8px 22px', opacity: hasConflict ? 0.5 : 1 }}
              >
                Save Preferences
              </button>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
