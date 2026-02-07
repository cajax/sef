// Document attachments module
import { t } from './i18n.js';

// Store attachments
const attachments = [];

// Document type options
const DOCUMENT_TYPES = ['idFront', 'idBack', 'passportPage', 'visa', 'otherDocument'];

// Add attachment
function addAttachment(file, dataUrl) {
  const id = Date.now() + Math.random().toString(36).substr(2, 9);
  attachments.push({
    id,
    file,
    dataUrl,
    type: 'otherDocument'
  });
  renderAttachments();
  return id;
}

// Remove attachment
function removeAttachment(id) {
  const index = attachments.findIndex(a => a.id === id);
  if (index > -1) {
    attachments.splice(index, 1);
    renderAttachments();
  }
}

// Update attachment type
function updateAttachmentType(id, type) {
  const attachment = attachments.find(a => a.id === id);
  if (attachment) {
    attachment.type = type;
  }
}

// Render attachments list
function renderAttachments() {
  const container = document.getElementById('attachments-list');
  container.innerHTML = '';
  
  attachments.forEach(attachment => {
    const item = document.createElement('div');
    item.className = 'attachment-item';
    
    const img = document.createElement('img');
    img.className = 'attachment-item__img';
    img.src = attachment.dataUrl;
    img.alt = t('documentLabel');
    
    const info = document.createElement('div');
    info.className = 'attachment-item__info';
    
    const select = document.createElement('select');
    select.className = 'attachment-item__label';
    DOCUMENT_TYPES.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = t(type);
      if (type === attachment.type) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      updateAttachmentType(attachment.id, e.target.value);
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'attachment-item__remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = t('removeAttachment');
    removeBtn.addEventListener('click', () => removeAttachment(attachment.id));
    
    info.appendChild(select);
    item.appendChild(img);
    item.appendChild(info);
    item.appendChild(removeBtn);
    container.appendChild(item);
  });
}

// Handle file upload
function handleFileUpload(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      addAttachment(file, e.target.result);
    };
    reader.readAsDataURL(file);
  });
}

// Check if camera is available
function isCameraAvailable() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Camera state
let stream = null;
let cameraModal = null;
let videoEl = null;
let canvasEl = null;

// Open camera modal
async function openCamera() {
  if (!isCameraAvailable()) {
    alert('Camera not available. Please upload a file instead.');
    return;
  }
  
  cameraModal = document.getElementById('camera-modal');
  videoEl = document.getElementById('camera-preview');
  canvasEl = document.getElementById('camera-canvas');
  
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    videoEl.srcObject = stream;
    cameraModal.hidden = false;
  } catch (err) {
    console.error('Camera error:', err);
    alert('Camera not available. Please upload a file instead.');
  }
}

// Close camera modal
function closeCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
  }
  if (cameraModal) {
    cameraModal.hidden = true;
  }
}

// Capture photo from camera
function capturePhoto() {
  if (!videoEl || !canvasEl) return;
  
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  
  const ctx = canvasEl.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  
  const dataUrl = canvasEl.toDataURL('image/jpeg', 0.8);
  addAttachment(null, dataUrl);
  closeCamera();
}

// Get all attachments
export function getAttachments() {
  return attachments.map(a => ({
    dataUrl: a.dataUrl,
    type: a.type,
    label: t(a.type)
  }));
}

// Initialize attachments module
export function initAttachments() {
  // File upload
  const fileInput = document.getElementById('file-upload');
  fileInput.addEventListener('change', (e) => {
    handleFileUpload(e.target.files);
    e.target.value = ''; // Reset for same file selection
  });
  
  // Camera button
  const cameraBtn = document.getElementById('camera-btn');
  if (isCameraAvailable()) {
    cameraBtn.addEventListener('click', openCamera);
  } else {
    cameraBtn.style.display = 'none';
  }
  
  // Capture button
  const captureBtn = document.getElementById('capture-btn');
  captureBtn.addEventListener('click', capturePhoto);
  
  // Close modal buttons
  document.querySelectorAll('#camera-modal [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeCamera);
  });
  
  // Close modal on backdrop click
  const cameraModal = document.getElementById('camera-modal');
  cameraModal.addEventListener('click', (e) => {
    if (e.target === cameraModal) {
      closeCamera();
    }
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !cameraModal.hidden) {
      closeCamera();
    }
  });
}
