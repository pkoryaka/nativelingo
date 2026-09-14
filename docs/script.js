/**
 * NativeLingo Website Interactive Simulator & Order Modal
 * Target: businessintel.co.site
 */

const SCENARIOS = {
  support: {
    app: 'Slack — #customer-support-urgent',
    model: 'Llama-3.3-70B (Groq)',
    latency: '210ms',
    hotkeyText: 'Pressing Ctrl + Alt + 1 (Empathetic De-escalation & Polish)',
    input: '"we cant deliver this on monday because your api keeps returning 500 errors and our devs are blocked please fix ASAP or we cancel subscription"',
    output: '"Thank you for bringing this to our urgent attention. We have identified intermittent 500 error responses on the endpoint and our engineering team is actively prioritizing a fix. We will update you within the next 2 hours with an ETA to ensure your Monday release timeline remains protected."'
  },
  jargon: {
    app: 'Microsoft Teams — Strategy & Operations',
    model: 'Gemini 2.5 Flash',
    latency: '340ms',
    hotkeyText: 'Pressing Ctrl + Alt + J (Demystify Corporate Slang & Nuance)',
    input: '"Per my last email, while I appreciate the bandwidth constraints, let\'s circle back and table this initiative for Q3 to ensure we don\'t boil the ocean."',
    output: '🔍 JARGON & NUANCE BREAKDOWN:\n• "Per my last email": Frustration marker — you missed information already sent.\n• "Bandwidth constraints": Polite acknowledgment that you are overworked.\n• "Table this / don\'t boil the ocean": Project is deprioritized or cancelled for now because it is too complex.'
  },
  code: {
    app: 'GitHub Pull Request #142 Review',
    model: 'Claude 3.5 Sonnet (Direct BYOM)',
    latency: '410ms',
    hotkeyText: 'Pressing Ctrl + Alt + 2 (Concise Technical Comment)',
    input: '"hey this code works but you forgot to release the mutex lock on line 88 so if an error throws it will deadlock the whole server process please wrap in try/finally"',
    output: '"Good catch on the concurrency handling! On line 88, the mutex lock remains acquired if an exception is thrown before release. Could we wrap this block in a `try...finally` to ensure the lock is always safely released and avoid potential server deadlocks?"'
  },
  translate: {
    app: 'Outlook — German Partner Inbound',
    model: '100% Offline Ollama (Local Llama 3.2)',
    latency: '180ms',
    hotkeyText: 'Pressing Ctrl + Alt + T (Instant Streaming Translation)',
    input: '"Sehr geehrte Damen und Herren, anbei finden Sie die überarbeiteten Verträge für das Audit. Bitte um zeitnahe Gegenzeichnung."',
    output: '"Dear Sir or Madam, please find attached the revised contracts for the audit. We kindly request prompt countersigning."'
  }
};

let activeScenario = 'support';

// DOM Elements
const tabSupport = document.getElementById('tab-support');
const tabJargon = document.getElementById('tab-jargon');
const tabCode = document.getElementById('tab-code');
const tabTranslate = document.getElementById('tab-translate');

const simAppTitle = document.getElementById('sim-app-title');
const simLatency = document.getElementById('sim-latency');
const simModel = document.getElementById('sim-model');
const simInputText = document.getElementById('sim-input-text');
const simActionBadge = document.getElementById('sim-action-badge');
const simOutputText = document.getElementById('sim-output-text');
const btnSimCopy = document.getElementById('btn-sim-copy');

// Preset Tab Handlers
function setupSimulator() {
  const tabs = [
    { el: tabSupport, key: 'support' },
    { el: tabJargon, key: 'jargon' },
    { el: tabCode, key: 'code' },
    { el: tabTranslate, key: 'translate' }
  ];

  tabs.forEach(({ el, key }) => {
    if (!el) return;
    el.addEventListener('click', () => {
      tabs.forEach(t => t.el?.classList.remove('active'));
      el.classList.add('active');
      switchScenario(key);
    });
  });

  if (btnSimCopy) {
    btnSimCopy.addEventListener('click', () => {
      const textToCopy = simOutputText.innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btnSimCopy.innerText;
        btnSimCopy.innerText = 'Copied!';
        btnSimCopy.style.borderColor = '#10b981';
        setTimeout(() => {
          btnSimCopy.innerText = originalText;
          btnSimCopy.style.borderColor = '';
        }, 2000);
      });
    });
  }
}

function switchScenario(key) {
  const data = SCENARIOS[key];
  if (!data) return;

  activeScenario = key;
  simAppTitle.innerText = data.app;
  simLatency.innerText = data.latency;
  simModel.innerText = data.model;
  simActionBadge.innerText = data.hotkeyText;
  simInputText.innerText = data.input;

  // Typing animation for output
  simOutputText.style.opacity = '0.3';
  setTimeout(() => {
    simOutputText.innerText = data.output;
    simOutputText.style.opacity = '1';
  }, 150);
}

// Order Modal Logic
const orderModal = document.getElementById('order-modal');
const modalTierTitle = document.getElementById('modal-tier-title');
const modalTierDesc = document.getElementById('modal-tier-desc');
const modalOrderText = document.getElementById('modal-order-text');
const btnModalCopy = document.getElementById('btn-modal-copy');
const btnModalEmail = document.getElementById('btn-modal-email');

function openOrderModal(tierKey) {
  let title = '';
  let desc = '';
  let orderTemplate = '';
  let emailSubject = '';

  if (tierKey === 'annual') {
    title = 'Single-User Annual ($17 / year)';
    desc = 'Includes 2 workstations, 1 named user, all version updates, and priority corporate support.';
    orderTemplate = `To: licensing@businessintel.co.site
Subject: Order Request: NativeLingo Commercial Single-User Annual ($17/yr)

Company / Organization: [Your Company Name]
Contact Name: [Your Full Name]
Contact Email: [Your Email]
Workstations Required: 2 PCs (Included)
Payment Preference: Credit Card / Corporate Invoice / Wire

Please send commercial invoice & license activation token (NL1-...).`;
    emailSubject = encodeURIComponent('NativeLingo Order: Single-User Annual ($17/yr)');
  } else if (tierKey === 'perpetual') {
    title = 'Single-User Perpetual ($29 one-time)';
    desc = 'Own your version license forever. Includes 12 months of version updates and 2 workstations.';
    orderTemplate = `To: licensing@businessintel.co.site
Subject: Order Request: NativeLingo Single-User Perpetual ($29 Launch Deal)

Company / Organization: [Your Company Name]
Contact Name: [Your Full Name]
Contact Email: [Your Email]
Workstations Required: 2 PCs (Included)
Payment Preference: Credit Card / Corporate Invoice / Wire

Please send commercial invoice & lifetime offline license token (NL1-...).`;
    emailSubject = encodeURIComponent('NativeLingo Order: Single-User Perpetual ($29)');
  } else {
    title = 'Multi-User Team ($24 / seat / year)';
    desc = 'Centralized Group Policy deployment, minimum 3 seats ($72/yr), corporate VAT receipts & SLA.';
    orderTemplate = `To: licensing@businessintel.co.site
Subject: Order Request: NativeLingo Multi-User Team Deployment ($24/seat/yr)

Company / Organization: [Your Corporate Name]
Department / Team: [e.g. Consulting, Engineering, Support]
Number of Seats Required: [Min 3 seats]
Billing Contact Email: [Procurement or AP Email]
Billing Address & VAT / Tax ID: [If applicable]
Payment Preference: Corporate Invoice / ACH / Wire Transfer

Please send formal corporate proforma invoice and central policy deployment guide.`;
    emailSubject = encodeURIComponent('NativeLingo Corporate Team Licensing Request ($24/seat)');
  }

  if (modalTierTitle) modalTierTitle.innerText = title;
  if (modalTierDesc) modalTierDesc.innerText = desc;
  if (modalOrderText) modalOrderText.innerText = orderTemplate;

  const mailtoUrl = `mailto:licensing@businessintel.co.site?subject=${emailSubject}&body=${encodeURIComponent(orderTemplate)}`;
  if (btnModalEmail) {
    btnModalEmail.href = mailtoUrl;
  }

  if (orderModal) {
    orderModal.style.display = 'flex';
  }
}

function closeOrderModal() {
  if (orderModal) {
    orderModal.style.display = 'none';
  }
}

function copyModalOrderText() {
  if (!modalOrderText) return;
  navigator.clipboard.writeText(modalOrderText.innerText).then(() => {
    if (btnModalCopy) {
      const orig = btnModalCopy.innerText;
      btnModalCopy.innerText = '✓ Copied to Clipboard!';
      setTimeout(() => {
        btnModalCopy.innerText = orig;
      }, 2500);
    }
  });
}

// Close on background click
window.addEventListener('click', (e) => {
  if (e.target === orderModal) {
    closeOrderModal();
  }
});

// Close on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeOrderModal();
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupSimulator();
});
