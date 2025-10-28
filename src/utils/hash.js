export async function hashSHA256(value) {
  const text = value ?? '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  const { createHash } = await import('crypto');
  return createHash('sha256').update(Buffer.from(data)).digest('hex');
}

export default hashSHA256;
