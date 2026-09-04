// Snapchat Marketing API client — lets Capable's admin connect a Snapchat ad
// account and pull campaign metrics for the "Social Ads" admin tab.
//
// Docs: https://marketingapi.snapchat.com/docs/
// IMPORTANT: built from documented endpoint shapes, but no Snapchat Business
// app or real ad account existed at the time this was written, so it has
// never been run against the real API. Before trusting numbers from this
// client:
//   1. Apply for Marketing API access at businesshelp.snapchat.com and
//      register an OAuth app. Set SNAPCHAT_ADS_CLIENT_ID /
//      SNAPCHAT_ADS_CLIENT_SECRET / SNAPCHAT_ADS_REDIRECT_URI.
//   2. Confirm the adsapi.snapchat.com/v1 base path is still current.
//   3. Run one full connect -> callback -> getInsights cycle against a real
//      ad account with known, non-zero spend and cross-check the numbers
//      against Snapchat Ads Manager for the same range — the exact stats
//      field names for clicks ("swipes") and conversions
//      ("conversion_purchases" vs other conversion_* fields) are
//      pixel/config-dependent per ad account; verify against that account's
//      actual configured conversion events before trusting the numbers.
//
// Snapchat has the cleanest refresh story of the three platforms: access
// tokens are short-lived (~1hr) but refresh tokens are long-lived, so
// refreshToken() below is a real, working call (not a no-op).

const AUTH_BASE = 'https://accounts.snapchat.com/login/oauth2';
const API_BASE = 'https://adsapi.snapchat.com/v1';

function config() {
  const clientId = process.env.SNAPCHAT_ADS_CLIENT_ID;
  const clientSecret = process.env.SNAPCHAT_ADS_CLIENT_SECRET;
  const redirectUri = process.env.SNAPCHAT_ADS_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isConfigured() {
  return !!config();
}

export function getAuthUrl(state) {
  const cfg = config();
  if (!cfg) throw new Error('Snapchat ads not configured');
  const qs = new URLSearchParams({
    client_id: cfg.clientId, redirect_uri: cfg.redirectUri,
    response_type: 'code', scope: 'snapchat-marketing-api', state,
  });
  return `${AUTH_BASE}/authorize?${qs}`;
}

async function tokenRequest(params) {
  const cfg = config();
  if (!cfg) throw new Error('Snapchat ads not configured');
  const body = new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...params });
  const res = await fetch(`${AUTH_BASE}/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Snapchat token request failed: ${JSON.stringify(data).slice(0, 300)}`);
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

export async function exchangeCode(code) {
  const cfg = config();
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: cfg.redirectUri });
}

export async function refreshToken(refreshTokenValue) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshTokenValue });
}

export async function listAccounts(accessToken) {
  const meRes = await fetch(`${API_BASE}/me/organizations`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const meData = await meRes.json();
  if (!meRes.ok) throw new Error(`Snapchat list organizations failed: ${JSON.stringify(meData).slice(0, 300)}`);
  const orgs = (meData.organizations || []).map((o) => o.organization?.id).filter(Boolean);

  const accounts = [];
  for (const orgId of orgs) {
    const res = await fetch(`${API_BASE}/organizations/${orgId}/adaccounts`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await res.json();
    if (!res.ok) continue;
    for (const a of data.adaccounts || []) {
      const acc = a.adaccount;
      if (acc?.id) accounts.push({ id: acc.id, name: acc.name || acc.id });
    }
  }
  return accounts;
}

export async function getInsights({ accessToken, accountId, since, until }) {
  const qs = new URLSearchParams({
    granularity: 'DAY',
    start_time: `${since}T00:00:00.000-00:00`,
    end_time: `${until}T23:59:59.999-00:00`,
    fields: 'spend,impressions,swipes,conversion_purchases',
    breakdown: 'campaign',
  });
  const res = await fetch(`${API_BASE}/adaccounts/${accountId}/stats?${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(`Snapchat stats failed: ${JSON.stringify(data).slice(0, 300)}`);

  const campaignBlocks = data.total_stats?.[0]?.total_stat?.breakdown_stats?.campaign || [];
  const campaignsById = new Map();
  const byDate = new Map();
  let spend = 0, impressions = 0, clicks = 0, conversions = 0;

  for (const block of campaignBlocks) {
    const id = block.id;
    for (const dayStat of block.timeseries_stat?.timeseries || []) {
      const s = dayStat.stats || {};
      // Snapchat reports spend in micro-currency units (1/1,000,000 of the
      // currency unit) — convert to whole units to match the other platforms.
      const rowSpend = (Number(s.spend) || 0) / 1_000_000;
      const rowImpressions = Number(s.impressions) || 0;
      const rowClicks = Number(s.swipes) || 0;
      const rowConversions = Number(s.conversion_purchases) || 0;

      spend += rowSpend; impressions += rowImpressions; clicks += rowClicks; conversions += rowConversions;

      const c = campaignsById.get(id) || { id, name: id, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      c.spend += rowSpend; c.impressions += rowImpressions; c.clicks += rowClicks; c.conversions += rowConversions;
      campaignsById.set(id, c);

      const date = String(dayStat.start_time || '').slice(0, 10) || since;
      byDate.set(date, (byDate.get(date) || 0) + rowSpend);
    }
  }

  return {
    spend, impressions, clicks, conversions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    campaigns: [...campaignsById.values()],
    series: [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, s]) => ({ date, spend: s })),
  };
}
