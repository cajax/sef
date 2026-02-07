// Main application entry point
import { initI18n } from './i18n.js';
import { populateCountrySelects } from './countries.js';
import { initForm, validateForm, displayErrors } from './form.js';
import { initAttachments } from './attachments.js';
import { initPrefill } from './prefill.js';
import { generatePdf, showLoading } from './pdf.js';

// Initialize application
function init() {
  // Initialize internationalization
  initI18n();
  
  // Populate country dropdowns
  populateCountrySelects();
  
  // Initialize form (includes prefill parsing)
  const form = initForm();
  
  // Initialize attachments
  initAttachments();
  
  // Initialize host prefill modal
  initPrefill();
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(form);
    if (errors.length > 0) {
      displayErrors(errors);
      return;
    }
    
    // Hide any previous errors
    displayErrors([]);
    
    // Show loading
    showLoading(true);
    
    try {
      // Generate PDF immediately to preserve user gesture context
      // (setTimeout would break the gesture and cause filename issues)
      await generatePdf(form);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      showLoading(false);
    }
  });
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
