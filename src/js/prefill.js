// Host prefill link generator module
import { sanitizeInput, sanitizeDate } from './form.js';

// Host modal element
let hostModal = null;

// Field mapping for URL generation
const HOST_FIELDS = [
  { id: 'host-accName', param: 'acc_name' },
  { id: 'host-address', param: 'acc_address' },
  { id: 'host-postalCode', param: 'acc_postal' },
  { id: 'host-city', param: 'acc_city' },
  { id: 'host-checkin', param: 'checkin' },
  { id: 'host-checkout', param: 'checkout' }
];

// Generate prefill URL from host form
function generatePrefillUrl() {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  
  HOST_FIELDS.forEach(({ id, param }) => {
    const field = document.getElementById(id);
    if (field && field.value.trim()) {
      params.append(param, field.value.trim());
    }
  });
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Update URL display
function updateUrlDisplay() {
  const urlField = document.getElementById('host-url');
  if (urlField) {
    urlField.value = generatePrefillUrl();
  }
}

// Copy URL to clipboard
async function copyUrl() {
  const urlField = document.getElementById('host-url');
  const successEl = document.getElementById('copy-success');
  
  try {
    await navigator.clipboard.writeText(urlField.value);
    successEl.hidden = false;
    setTimeout(() => {
      successEl.hidden = true;
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    urlField.select();
    document.execCommand('copy');
    successEl.hidden = false;
    setTimeout(() => {
      successEl.hidden = true;
    }, 2000);
  }
}

// Open host modal
function openHostModal() {
  hostModal = document.getElementById('host-modal');
  updateUrlDisplay();
  hostModal.hidden = false;
}

// Close host modal
function closeHostModal() {
  if (hostModal) {
    hostModal.hidden = true;
  }
}

// Initialize host prefill module
export function initPrefill() {
  // Host link click
  const hostLink = document.getElementById('host-link');
  if (hostLink) {
    hostLink.addEventListener('click', (e) => {
      e.preventDefault();
      openHostModal();
    });
  }
  
  // Listen to host form inputs
  HOST_FIELDS.forEach(({ id }) => {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', updateUrlDisplay);
    }
  });
  
  // Copy button
  const copyBtn = document.getElementById('copy-url-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyUrl);
  }
  
  // Close modal buttons
  hostModal = document.getElementById('host-modal');
  document.querySelectorAll('#host-modal [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeHostModal);
  });
  
  // Close on backdrop click
  hostModal.addEventListener('click', (e) => {
    if (e.target === hostModal) {
      closeHostModal();
    }
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !hostModal.hidden) {
      closeHostModal();
    }
  });
  
  // Initialize URL display
  updateUrlDisplay();
}
