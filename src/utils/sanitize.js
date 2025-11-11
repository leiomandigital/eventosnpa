export function sanitizeInput(value) {
  if (value === undefined || value === null) {
    return '';
  }

  let sanitized = String(value);

  sanitized = sanitized.normalize('NFKC');
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, '');
  sanitized = sanitized.replace(/['";`]/g, '');
  sanitized = sanitized.replace(/(--|\/\*|\*\/)/g, '');

  return sanitized.trim();
}

export function sanitizePreserveFormatting(value) {
  if (value === undefined || value === null) {
    return '';
  }

  let sanitized = String(value);
  
  sanitized = sanitized.normalize('NFC'); 
  
  // Remove control characters except for tab, newline, and carriage return.
  sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  
  // Remove SQL comment-like syntax.
  sanitized = sanitized.replace(/(--|\/\*|\*\/)/g, '');

  return sanitized;
}

export function sanitizeStringArray(list = []) {
  return Array.isArray(list) ? list.map(item => sanitizeInput(item)).filter(Boolean) : [];
}

export default sanitizeInput;
