// PDF generation module
import { t, getBilingualLabel, getCurrentLanguage, portugueseLabels } from './i18n.js';
import { getFormData } from './form.js';
import { getAttachments } from './attachments.js';
import { getCountryName } from './countries.js';

// Website URL for footer
const WEBSITE_URL = window.location.origin + window.location.pathname;

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Get purpose of stay label
function getPurposeLabel(value) {
  const map = {
    'tourism': 'tourism',
    'business': 'business',
    'transit': 'transit',
    'other': 'otherPurpose'
  };
  return map[value] || value;
}

// Get document type label
function getDocTypeLabel(value) {
  const map = {
    'passport': 'passport',
    'idCard': 'idCard',
    'other': 'otherDoc'
  };
  return map[value] || value;
}

// Get sex label
function getSexLabel(value) {
  const map = {
    'male': 'male',
    'female': 'female',
    'other': 'other'
  };
  return map[value] || value;
}

// Generate PDF
export async function generatePdf(form) {
  const data = getFormData(form);
  const attachments = getAttachments();
  const lang = getCurrentLanguage();
  
  // Use jsPDF from global scope (loaded via CDN)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  
  // Helper to add footer
  function addFooter(pageNum, totalPages) {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const footerText = `${t('generatedBy')} ${WEBSITE_URL} | ${t('pdfPage')} ${pageNum}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // Helper to check page break
  function checkPageBreak(neededHeight) {
    if (yPos + neededHeight > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  }
  
  // Title - split into two lines
  doc.setFontSize(16);
  doc.setTextColor(21, 101, 192);
  doc.text(portugueseLabels['pdfTitle'], pageWidth / 2, yPos, { align: 'center' });
  if (lang !== 'pt') {
    yPos += 6;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(t('pdfTitle'), pageWidth / 2, yPos, { align: 'center' });
  }
  yPos += 10;
  
  // Section helper - two column layout (labels left, values right)
  const labelColWidth = 55; // Width for label column
  const valueColX = margin + labelColWidth + 5; // Value column starts after label
  const valueColWidth = contentWidth - labelColWidth - 5;
  
  function addSection(titleKey, fields) {
    checkPageBreak(30);
    
    // Section title - stacked format
    doc.setFontSize(12);
    doc.setTextColor(21, 101, 192);
    const ptTitle = portugueseLabels[titleKey] || titleKey;
    doc.text(ptTitle, margin, yPos);
    if (lang !== 'pt') {
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(t(titleKey), margin, yPos);
    }
    yPos += 2;
    doc.setDrawColor(21, 101, 192);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    // Fields - two column layout
    doc.setFontSize(9);
    
    fields.forEach(({ labelKey, value }) => {
      if (!value) return;
      
      // Calculate row height based on labels and value
      const rowHeight = lang === 'pt' ? 8 : 12;
      checkPageBreak(rowHeight);
      
      const startY = yPos;
      
      // Portuguese label (bold, blue)
      const ptLabel = portugueseLabels[labelKey] || labelKey;
      doc.setTextColor(21, 101, 192);
      doc.setFont(undefined, 'bold');
      doc.text(ptLabel, margin, yPos);
      
      // User language label (if not Portuguese)
      if (lang !== 'pt') {
        yPos += 4;
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.text(t(labelKey), margin, yPos);
      }
      
      // Value - on the right side, aligned with first label line
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(value, valueColWidth);
      let valueY = startY;
      lines.forEach((line, i) => {
        doc.text(line, valueColX, valueY);
        valueY += 4;
      });
      
      // Move to next row (take max of label height and value height)
      yPos = Math.max(yPos, valueY - 4) + 5;
    });
    
    yPos += 3;
  }
  
  // Personal Information
  addSection('personalInfo', [
    { labelKey: 'firstName', value: data.firstName },
    { labelKey: 'lastName', value: data.lastName },
    { labelKey: 'sex', value: data.sex ? portugueseLabels[getSexLabel(data.sex)] + ' / ' + t(getSexLabel(data.sex)) : '' },
    { labelKey: 'dateOfBirth', value: formatDate(data.dateOfBirth) },
    { labelKey: 'placeOfBirth', value: data.placeOfBirth },
    { labelKey: 'countryOfBirth', value: getCountryName(data.countryOfBirth) },
    { labelKey: 'nationality', value: getCountryName(data.nationality) }
  ]);
  
  // Travel Document
  addSection('travelDocument', [
    { labelKey: 'documentType', value: data.documentType ? portugueseLabels[getDocTypeLabel(data.documentType)] + ' / ' + t(getDocTypeLabel(data.documentType)) : '' },
    { labelKey: 'documentNumber', value: data.documentNumber },
    { labelKey: 'issuingCountry', value: getCountryName(data.issuingCountry) },
    { labelKey: 'issueDate', value: formatDate(data.issueDate) },
    { labelKey: 'expiryDate', value: formatDate(data.expiryDate) }
  ]);
  
  // Travel Details
  addSection('travelDetails', [
    { labelKey: 'dateOfEntry', value: formatDate(data.dateOfEntry) },
    { labelKey: 'countryOfOrigin', value: getCountryName(data.countryOfOrigin) },
    { labelKey: 'purposeOfStay', value: data.purposeOfStay ? portugueseLabels[getPurposeLabel(data.purposeOfStay)] + ' / ' + t(getPurposeLabel(data.purposeOfStay)) : '' },
    { labelKey: 'intendedDestination', value: data.intendedDestination }
  ]);
  
  // Accommodation
  addSection('accommodation', [
    { labelKey: 'accommodationName', value: data.accommodationName },
    { labelKey: 'address', value: data.address },
    { labelKey: 'postalCode', value: data.postalCode },
    { labelKey: 'city', value: data.city },
    { labelKey: 'checkinDate', value: formatDate(data.checkinDate) },
    { labelKey: 'checkoutDate', value: formatDate(data.checkoutDate) }
  ]);
  
  // Contact (if provided)
  if (data.phone || data.email) {
    addSection('contactInfo', [
      { labelKey: 'phone', value: data.phone },
      { labelKey: 'email', value: data.email }
    ]);
  }
  
  // Add footer to first page(s)
  const formPages = doc.internal.getNumberOfPages();
  
  // Add attachments inline (after form content with gap)
  if (attachments.length > 0) {
    yPos += 10; // Gap before attachments
    checkPageBreak(40);
    
    // Attachments title
    doc.setFontSize(12);
    doc.setTextColor(21, 101, 192);
    const ptAttachTitle = portugueseLabels['attachments'] || 'Anexos';
    doc.text(ptAttachTitle, margin, yPos);
    if (lang !== 'pt') {
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(t('attachments'), margin, yPos);
    }
    yPos += 2;
    doc.setDrawColor(21, 101, 192);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    for (const attachment of attachments) {
      checkPageBreak(120);
      
      // Document label
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${attachment.label}:`, margin, yPos);
      yPos += 5;
      
      // Add image with proper aspect ratio
      try {
        // Create an image element to get natural dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = attachment.dataUrl;
        });
        
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const aspectRatio = naturalWidth / naturalHeight;
        
        // Calculate dimensions to fit within content width and max height
        const maxWidth = contentWidth;
        const maxHeight = 100;
        
        let imgWidth, imgHeight;
        if (naturalWidth / maxWidth > naturalHeight / maxHeight) {
          // Width is the limiting factor
          imgWidth = maxWidth;
          imgHeight = maxWidth / aspectRatio;
        } else {
          // Height is the limiting factor
          imgHeight = maxHeight;
          imgWidth = maxHeight * aspectRatio;
        }
        
        doc.addImage(attachment.dataUrl, 'JPEG', margin, yPos, imgWidth, imgHeight, undefined, 'FAST');
        yPos += imgHeight + 10;
      } catch (err) {
        console.error('Error adding image:', err);
        doc.setTextColor(200, 0, 0);
        doc.text('Error loading image', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }
    }
  }
  
  // Add footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  const now = new Date().toLocaleString('pt-PT');
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }
  
  // Add "Generated on" to the last page bottom
  doc.setPage(totalPages);
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const generatedText = `${portugueseLabels['pdfGenerated']} / ${t('pdfGenerated')}: ${now}`;
  doc.text(generatedText, pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Generate filename: checkin-date-place-name.pdf
  // Canonicalize: lowercase, only alphanumeric, max 50 chars
  function canonicalize(str, maxLen = 20) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '') // Remove non-alphanumeric
      .substring(0, maxLen);
  }
  
  const checkinPart = data.checkinDate || new Date().toISOString().split('T')[0];
  const placePart = canonicalize(data.city || data.accommodationName || 'place');
  const namePart = canonicalize(`${data.firstName || ''}${data.lastName || ''}` || 'guest');
  
  const filename = `${checkinPart}-${placePart}-${namePart}.pdf`;
  
  // Download PDF
  doc.save(filename);
}

// Show/hide loading overlay
export function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  overlay.hidden = !show;
}
