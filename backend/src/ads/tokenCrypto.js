// Encrypts/decrypts stored OAuth tokens for connected ad accounts (see
// backend/src/ads/index.js) using Node's built-in crypto (AES-256-GCM) — no
// new dependency. Ad-account tokens are live bearer credentials over real
// client ad spend, a materially higher-risk secret than the plaintext IDs
// (Stripe customer ids, ResellerClub api keys via env) this codebase already
// stores elsewhere, so they get this extra step.
//
// Key: derived from ADS_TOKEN_ENCRYPTION_KEY if set. If unset, derived from
// JWT_SECRET instead so the feature still works with zero new required
// config in dev/staging — but note this couples the two secrets: rotating
// JWT_SECRET would then also break every stored ad token. Set a dedicated
// ADS_TOKEN_ENCRYPTION_KEY in production to avoid that coupling.

import crypto from 'crypto';

function getKey() {
  const secret = process.env.ADS_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || 'capable_secret_change_in_production';
  return crypto.scryptSync(secret, 'capable-ads', 32);
}

export function encryptToken(plain) {
  if (plain == null) return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptToken(payload) {
  if (payload == null) return null;
  const [ivB64, tagB64, dataB64] = String(payload).split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted token');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return plain.toString('utf8');
}
