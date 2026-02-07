// Form handling and validation module
import { t } from './i18n.js';

// Track prefilled fields
const prefilledFields = new Set();

// Field to URL parameter mapping
const PREFILL_MAP = {
  'acc_name': 'accommodationName',
  'acc_address': 'address',
  'acc_postal': 'postalCode',
  'acc_city': 'city',
  'checkin': 'checkinDate',
  'checkout': 'checkoutDate'
};

// Sanitize input to prevent XSS
export function sanitizeInput(value, maxLength = 200) {
  if (typeof value !== 'string') return '';
  
  try {
    // Decode URL encoding
    let decoded = decodeURIComponent(value);
    
    // Remove HTML tags
    decoded = decoded.replace(/<[^>]*>/g, '');
    
    // Remove script-related patterns
    decoded = decoded.replace(/javascript:/gi, '');
    decoded = decoded.replace(/on\w+=/gi, '');
    
    // Truncate to max length
    decoded = decoded.substring(0, maxLength);
    
    // Trim whitespace
    decoded = decoded.trim();
    
    return decoded;
  } catch (e) {
    // If decoding fails, return empty string
    return '';
  }
}

// Sanitize date input
export function sanitizeDate(value) {
  if (typeof value !== 'string') return '';
  
  try {
    const decoded = decodeURIComponent(value);
    // Only accept YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(decoded)) {
      return decoded;
    }
  } catch (e) {
    // Ignore decode errors
  }
  return '';
}

// Parse URL parameters and prefill form
export function parsePrefillParams() {
  const params = new URLSearchParams(window.location.search);
  let hasPrefill = false;
  
  for (const [param, fieldId] of Object.entries(PREFILL_MAP)) {
    const value = params.get(param);
    if (value) {
      const field = document.getElementById(fieldId);
      if (field) {
        let sanitized;
        if (field.type === 'date') {
          sanitized = sanitizeDate(value);
        } else {
          sanitized = sanitizeInput(value);
        }
        
        if (sanitized) {
          // Use .value for safe DOM insertion
          field.value = sanitized;
          field.classList.add('prefilled');
          prefilledFields.add(fieldId);
          hasPrefill = true;
          
          // Remove prefilled styling when user edits
          field.addEventListener('input', function handler() {
            field.classList.remove('prefilled');
            prefilledFields.delete(fieldId);
            field.removeEventListener('input', handler);
          }, { once: true });
        }
      }
    }
  }
  
  // Show prefill notice if any fields were prefilled
  if (hasPrefill) {
    const notice = document.getElementById('prefill-notice');
    if (notice) {
      notice.hidden = false;
    }
  }
}

// Validate form and return errors
export function validateForm(form) {
  const errors = [];
  const requiredFields = form.querySelectorAll('[required]');
  
  // Clear previous errors
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  
  requiredFields.forEach(field => {
    const value = field.value.trim();
    if (!value) {
      field.classList.add('error');
      const label = form.querySelector(`label[for="${field.id}"]`);
      const fieldName = label ? label.textContent : field.name;
      errors.push({ field: field.id, message: `${fieldName} - ${t('required')}` });
    }
  });
  
  return errors;
}

// Display errors in summary
export function displayErrors(errors) {
  const summary = document.getElementById('error-summary');
  const list = document.getElementById('error-list');
  
  if (errors.length === 0) {
    summary.hidden = true;
    return;
  }
  
  list.innerHTML = '';
  errors.forEach(error => {
    const li = document.createElement('li');
    li.textContent = error.message;
    li.addEventListener('click', () => {
      const field = document.getElementById(error.field);
      if (field) {
        field.focus();
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    li.style.cursor = 'pointer';
    list.appendChild(li);
  });
  
  summary.hidden = false;
  summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Get all form data as object
export function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
}

// Check if field was prefilled
export function isPrefilled(fieldId) {
  return prefilledFields.has(fieldId);
}

// Mark required fields with asterisks
function markRequiredFields(form) {
  const requiredFields = form.querySelectorAll('[required]');
  
  requiredFields.forEach(field => {
    const label = form.querySelector(`label[for="${field.id}"]`);
    if (label && !label.querySelector('.required-indicator')) {
      const asterisk = document.createElement('span');
      asterisk.className = 'required-indicator';
      asterisk.textContent = ' *';
      asterisk.setAttribute('aria-hidden', 'true');
      label.appendChild(asterisk);
    }
  });
}

// Country auto-fill state
let autoCountryActive = false;
const countryOfBirthId = 'countryOfBirth';
const autoFillTargets = ['nationality', 'issuingCountry', 'countryOfOrigin'];

// Setup country auto-fill behavior
function setupCountryAutoFill(form) {
  const cobField = form.querySelector(`#${countryOfBirthId}`);
  if (!cobField) return;
  
  // On Country of Birth change
  cobField.addEventListener('change', (e) => {
    const cobValue = e.target.value;
    if (!cobValue) return;
    
    // Check if any target fields are empty, or if we're in "correction mode"
    const targetFields = autoFillTargets.map(id => form.querySelector(`#${id}`));
    const anyEmpty = targetFields.some(f => f && !f.value);
    
    if (anyEmpty || autoCountryActive) {
      // Fill empty fields and activate correction mode
      targetFields.forEach(field => {
        if (field && (!field.value || autoCountryActive)) {
          field.value = cobValue;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      autoCountryActive = true;
    }
  });
  
  // On any other field change, disable auto-fill mode
  form.addEventListener('change', (e) => {
    if (e.target.id !== countryOfBirthId) {
      autoCountryActive = false;
    }
  });
}

// Initialize form handling
export function initForm() {
  const form = document.getElementById('sef-form');
  
  // Mark required fields with asterisks
  markRequiredFields(form);
  
  // Setup country auto-fill
  setupCountryAutoFill(form);
  
  // Parse prefill parameters on load
  parsePrefillParams();
  
  return form;
}
