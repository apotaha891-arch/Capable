// Orchestrates the three ad-platform clients (meta/tiktok/snapchat) behind a
// single interface for the admin "Social Ads" tab. Stays DB-free, same as
// backend/src/domains/resellerclub.js — server.js owns persistence (loading/
// decrypting rows, calling in here, then saving refreshed tokens back).

import * as meta from './meta.js';
import * as tiktok from './tiktok.js';
import * as snapchat from './snapchat.js';

export const CLIENTS = { meta, tiktok, snapchat };

export function isConfigured(platform) {
  return !!CLIENTS[platform]?.isConfigured();
}

// account: { id, platform, account_id, account_name, accessToken, refreshToken, tokenExpiresAt }
// (tokens already decrypted by the caller). onTokenRefreshed(accountId, {access_token,
// refresh_token, expires_in}), if given, is called so the caller can persist a
// refreshed token — never breaks the whole response if it throws internally,
// since it's awaited inside the same try/catch as everything else here.
export async function fetchAccountMetrics(account, { since, until, onTokenRefreshed } = {}) {
  const empty = {
    accountId: account.id, platform: account.platform, accountName: account.account_name,
    spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, campaigns: [], series: [], error: null,
  };
  const client = CLIENTS[account.platform];
  if (!client) return { ...empty, error: `Unknown platform: ${account.platform}` };

  try {
    let accessToken = account.accessToken;
    const nearExpiry = account.tokenExpiresAt && new Date(account.tokenExpiresAt).getTime() - Date.now() < 5 * 60 * 1000;
    if (nearExpiry && account.refreshToken && client.refreshToken) {
      const refreshed = await client.refreshToken(account.refreshToken);
      if (refreshed?.access_token) {
        accessToken = refreshed.access_token;
        if (onTokenRefreshed) await onTokenRefreshed(account.id, refreshed);
      }
    }
    const insights = await client.getInsights({ accessToken, accountId: account.account_id, since, until });
    return { ...empty, ...insights };
  } catch (err) {
    return { ...empty, error: err.message };
  }
}
