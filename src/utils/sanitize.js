export function sanitizeInput(value) {
  if (value === undefined || value === null) {
    return '';
  }

  let sanitized = String(value);

  sanitized = sanitized.normalize('NFKC');
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, '');
  sanitized = sanitized.replace(/['";`]/g, '');
  sanitized = sanitized.replace(/(--|\/*|\*\/)/g, '');

  return sanitized.trim();
}

export function sanitizeStringArray(list = []) {
  return Array.isArray(list) ? list.map(item => sanitizeInput(item)).filter(Boolean) : [];
}

export default sanitizeInput;
