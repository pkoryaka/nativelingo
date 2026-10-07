/**
 * NativeLingo Website Interactive Simulator & Order Modal
 * Target: businessintelsystem.com
 */

const SCENARIOS = {
  reply: {
    app: 'Slack — #team-project-launch',
    model: 'Gemini 2.5 Flash',
    latency: '260ms',
    hotkeyText: 'Pressing Ctrl + Alt + R (Context-Aware Thread Reply)',
    input: '"Alex: We need to push the deployment back by 2 days because the staging tests failed on payment webhooks.\nElena: Client wants an update in 30 mins, who is telling them?"',
    toneDetected: '⚠️ Blocker Panic & Escalation Anxiety',
    toneTarget: '🎯 Diplomatic Ownership & Clear Client Reassurance',
    output: '"I will update the client right now. I will explain that our staging quality checks caught an edge case in payment webhook validation, and we are proactively rescheduling deployment by 48 hours to ensure zero transaction failures in production."'
  },
  crossdept: {
    app: 'Slack — #lab-operations ➔ #sales-leads',
    model: 'Claude 3.5 Sonnet (Direct BYOM)',
    latency: '310ms',
    hotkeyText: 'Pressing Ctrl + Alt + 1 (Translate Lab / IT Specs to Executive Action)',
    input: '"Batch #309 assay titration failed at 91.4% purity threshold due to thermal excursion in reactor 2. Cannot release Certificate of Analysis without 72h re-crystallisation re-run."',
    toneDetected: '🔬 Dense Technical Specs & Non-Compliance Blocker',
    toneTarget: '🎯 Decisive Commercial Go/No-Go & Rescheduled Delivery Plan',
    output: '"Dispatch for Batch #309 is rescheduled by 72 hours for an additional purity run to ensure full compliance with regulatory release standards. The final delivery ETA is Thursday morning at 09:00; customer formulation adjustments are not required."'
  },
  jargon: {
    app: 'Microsoft Teams — Strategy & Operations',
    model: 'Gemini 2.5 Flash',
    latency: '340ms',
    hotkeyText: 'Pressing Ctrl + Alt + J (Tone Radar & Corporate Doublespeak Demystifier)',
    input: '"Per my last email, while I appreciate the bandwidth constraints, let\'s circle back and table this initiative for Q3 to ensure we don\'t boil the ocean."',
    toneDetected: '🧊 Passive-Aggressive Pushback & Hidden Frustration',
    toneTarget: '💡 Decoded True Corporate Meaning & Nuance',
    output: '🔍 JARGON & TONE BREAKDOWN:\n• Subtext: Frustration marker — you missed information already sent in a previous message.\n• "Bandwidth constraints": Polite corporate acknowledgment that your team is overloaded.\n• "Table this / don\'t boil the ocean": Deprioritized or soft-rejected because the project scope is too large right now.'
  },
  finance: {
    app: 'Outlook — Corporate Accounting & Audit',
    model: 'Llama-3.3-70B (Groq)',
    latency: '220ms',
    hotkeyText: 'Pressing Ctrl + Alt + 2 (De-escalate Audit Demands into Collaborative Next Steps)',
    input: '"Please provide itemized OPEX allocation variances and CAPEX depreciation schedules before EoD or all pending project procurement approvals will freeze."',
    toneDetected: '⚠️ Rigid Compliance Ultimatum & Audit Pressure',
    toneTarget: '🤝 Collaborative Solution & Simplified Line-Item Deliverable',
    output: '"To keep our project procurement on schedule today, our team has pre-filled the variance report with the two required OPEX categories. We have highlighted the necessary fields so this takes under 5 minutes to confirm and keep our release approvals moving."'
  },
  translate: {
    app: 'Outlook — German Partner Inbound',
    model: '100% Offline Ollama (Local Llama 3.2)',
    latency: '180ms',
    hotkeyText: 'Pressing Ctrl + Alt + T (Instant Streaming Translation)',
    input: '"Sehr geehrte Damen und Herren, anbei finden Sie die überarbeiteten Laborprotokolle und Validierungsberichte für das regulatorische Audit. Bitte um zeitnahe Gegenzeichnung."',
    toneDetected: '📜 Formal Regulatory Inbound (German)',
    toneTarget: '🌐 Natural Professional Business English',
    output: '"Dear Sir or Madam, please find attached the revised laboratory protocols and validation reports for the regulatory audit. We kindly request prompt countersigning."'
  }
};

let activeScenario = 'reply';

// DOM Elements
const tabReply = document.getElementById('tab-reply');
const tabCrossdept = document.getElementById('tab-crossdept');
const tabJargon = document.getElementById('tab-jargon');
const tabFinance = document.getElementById('tab-finance');
const tabTranslate = document.getElementById('tab-translate');

const simAppTitle = document.getElementById('sim-app-title');
const simLatency = document.getElementById('sim-latency');
const simModel = document.getElementById('sim-model');
const simInputText = document.getElementById('sim-input-text');
const simToneDetected = document.getElementById('sim-tone-detected');
const simToneTarget = document.getElementById('sim-tone-target');
const simActionBadge = document.getElementById('sim-action-badge');
const simOutputText = document.getElementById('sim-output-text');
const btnSimCopy = document.getElementById('btn-sim-copy');

// Preset Tab Handlers
function setupSimulator() {
  const tabs = [
    { el: tabReply, key: 'reply' },
    { el: tabCrossdept, key: 'crossdept' },
    { el: tabJargon, key: 'jargon' },
    { el: tabFinance, key: 'finance' },
    { el: tabTranslate, key: 'translate' }
  ];

  tabs.forEach(({ el, key }) => {
    if (!el) return;
    el.addEventListener('click', () => {
      tabs.forEach(t => {
        if (t.el) {
          t.el.classList.remove('bg-indigo-600', 'text-white', 'font-semibold');
          t.el.classList.add('bg-slate-800/80', 'text-slate-300');
        }
      });
      el.classList.remove('bg-slate-800/80', 'text-slate-300');
      el.classList.add('bg-indigo-600', 'text-white', 'font-semibold');
      switchScenario(key);
    });
  });

  if (btnSimCopy) {
    btnSimCopy.addEventListener('click', () => {
      const textToCopy = simOutputText.innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btnSimCopy.innerText;
        btnSimCopy.innerText = 'Copied!';
        btnSimCopy.classList.add('bg-emerald-600');
        setTimeout(() => {
          btnSimCopy.innerText = originalText;
          btnSimCopy.classList.remove('bg-emerald-600');
        }, 2000);
      });
    });
  }
}

function switchScenario(key) {
  const data = SCENARIOS[key];
  if (!data) return;

  activeScenario = key;
  if (simAppTitle) simAppTitle.innerText = data.app;
  if (simLatency) simLatency.innerText = data.latency;
  if (simModel) simModel.innerText = data.model;
  if (simActionBadge) simActionBadge.innerText = data.hotkeyText;
  if (simInputText) simInputText.innerText = data.input;

  if (simToneDetected && data.toneDetected) {
    simToneDetected.innerText = data.toneDetected;
  }
  if (simToneTarget && data.toneTarget) {
    simToneTarget.innerText = data.toneTarget;
  }

  // Fade animation for output
  if (simOutputText) {
    simOutputText.style.opacity = '0.3';
    setTimeout(() => {
      simOutputText.innerText = data.output;
      simOutputText.style.opacity = '1';
    }, 150);
  }
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
    title = 'Commercial Pro ($19 / year)';
    desc = 'Includes 2 workstations, commercial rights, all version updates, and priority support.';
    orderTemplate = `To: licensing@businessintelsystem.com
Subject: Order Request: NativeLingo Commercial Pro ($19/yr)

Company / Organization: [Your Company Name]
Contact Name: [Your Full Name]
Contact Email: [Your Email]
Workstations Required: 2 PCs (Included)
Payment Preference: Credit Card / Corporate Invoice / Wire

Please send commercial invoice & license activation token (NL1-...).`;
    emailSubject = encodeURIComponent('NativeLingo Order: Commercial Pro ($19/yr)');
  } else {
    title = 'Enterprise BYOM ($39 / seat / year)';
    desc = 'Centralized Group Policy deployment, minimum 3 seats ($117/yr), corporate VAT receipts & offline key.';
    orderTemplate = `To: licensing@businessintelsystem.com
Subject: Order Request: NativeLingo Enterprise BYOM Deployment ($39/seat/yr)

Company / Organization: [Your Corporate Name]
Department / Team: [e.g. Consulting, Engineering, Support]
Number of Seats Required: [Min 3 seats]
Billing Contact Email: [Procurement or AP Email]
Billing Address & VAT / Tax ID: [If applicable]
Payment Preference: Corporate Invoice / ACH / Wire Transfer

Please send formal corporate proforma invoice and central policy deployment guide.`;
    emailSubject = encodeURIComponent('NativeLingo Enterprise BYOM Licensing Request ($39/seat)');
  }

  if (modalTierTitle) modalTierTitle.innerText = title;
  if (modalTierDesc) modalTierDesc.innerText = desc;
  if (modalOrderText) modalOrderText.innerText = orderTemplate;

  const mailtoUrl = `mailto:licensing@businessintelsystem.com?subject=${emailSubject}&body=${encodeURIComponent(orderTemplate)}`;
  if (btnModalEmail) {
    btnModalEmail.href = mailtoUrl;
  }

  const modalStripeContainer = document.getElementById('modal-stripe-container');
  const btnModalStripe = document.getElementById('btn-modal-stripe');
  if (modalStripeContainer && btnModalStripe) {
    if (tierKey === 'annual') {
      modalStripeContainer.style.display = 'block';
      btnModalStripe.href = 'https://buy.stripe.com/test_14A8wO7o0cuL5sM7rDeUU00';
      btnModalStripe.innerText = '💳 Pay Instantly with Card / Apple Pay ($19)';
    } else {
      modalStripeContainer.style.display = 'none';
    }
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
