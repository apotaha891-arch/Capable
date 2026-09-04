// TikTok Business/Marketing API client — lets Capable's admin connect a
// TikTok ad account and pull campaign metrics for the "Social Ads" admin tab.
//
// Docs: https://business-api.tiktok.com/portal/docs
// IMPORTANT: built from documented endpoint shapes, but no TikTok Business
// Center app or real ad account existed at the time this was written, so it
// has never been run against the real API. Before trusting numbers from this
// client:
//   1. Register an app at business-api.tiktok.com/portal — the Marketing API
//      app, NOT the consumer "TikTok Login Kit" app (different OAuth system
//      entirely). Set TIKTOK_ADS_APP_ID / TIKTOK_ADS_SECRET /
//      TIKTOK_ADS_REDIRECT_URI.
//   2. Confirm API_VERSION below (v1.3 at the time of writing) is still
//      current — TikTok has bumped this path before.
//   3. Note: ads scopes require TikTok app review before advertisers outside
//      your own account can authorize this.
//   4. Confirm whether Business API access tokens actually expire for your
//      app (some TikTok docs suggest they're long-lived, unlike the 24h
//      Login Kit tokens) — if they don't, refreshToken below is correctly a
//      no-op passthrough; if they do, this needs a real refresh call added.
//   5. Run one full connect -> callback -> getInsights cycle against a real
//      ad account with known, non-zero spend and cross-check against TikTok
//      Ads Manager for the same range. The `conversions` metric only returns
//      non-zero if the advertiser has TikTok Pixel/Events API events
//      configured — treat as best-effort.

const API_VERSION = 'v1.3';
const API_BASE = `https://business-api.tiktok.com/open_api/${API_VERSION}`;

function config() {
  const appId = process.env.TIKTOK_ADS_APP_ID;
  const secret = process.env.TIKTOK_ADS_SECRET;
  const redirectUri = process.env.TIKTOK_ADS_REDIRECT_URI;
  if (!appId || !secret || !redirectUri) return null;
  return { appId, secret, redirectUri };
}

export function isConfigured() {
  return !!config();
}

export function getAuthUrl(state) {
  const cfg = config();
  if (!cfg) throw new Error('TikTok ads not configured');
  const qs = new URLSearchParams({ app_id: cfg.appId, state, redirect_uri: cfg.redirectUri });
  return `https://business-api.tiktok.com/portal/auth?${qs}`;
}

export async function exchangeCode(code) {
  const cfg = config();
  if (!cfg) throw new Error('TikTok ads not configured');
  const res = await fetch(`${API_BASE}/oauth2/access_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: cfg.appId, secret: cfg.secret, auth_code: code }),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) throw new Error(`TikTok token exchange failed: ${JSON.stringify(data).slice(0, 300)}`);
  const d = data.data || {};
  // TikTok's advertiser-scoped Business API tokens are reported as
  // long-lived / non-expiring in current docs — no refresh_token issued.
  // See caveat #4 above; verify against the live app before shipping.
  return { access_token: d.access_token, refresh_token: null, expires_in: null };
}

export async function refreshToken() {
  return null;
}

export async function listAccounts(accessToken) {
  const res = await fetch(`${API_BASE}/oauth2/advertiser/get/?${new URLSearchParams({ app_id: config().appId, secret: config().secret })}`, {
    headers: { 'Access-Token': accessToken },
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) throw new Error(`TikTok list accounts failed: ${JSON.stringify(data).slice(0, 300)}`);
  return (data.data?.list || []).map((a) => ({ id: a.advertiser_id, name: a.advertiser_name || a.advertiser_id }));
}

export async function getInsights({ accessToken, accountId, since, until }) {
  const qs = new URLSearchParams({
    advertiser_id: accountId,
    report_type: 'BASIC',
    dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
    // campaign_name is requested as a "metric" per TikTok's report API quirk
    // (non-numeric display fields are returned alongside numeric metrics).
    metrics: JSON.stringify(['spend', 'impressions', 'clicks', 'conversion', 'campaign_name']),
    start_date: since,
    end_date: until,
    page_size: '1000',
  });
  const res = await fetch(`${API_BASE}/report/integrated/get/?${qs}`, { headers: { 'Access-Token': accessToken } });
  const data = await res.json();
  if (!res.ok || data.code !== 0) throw new Error(`TikTok insights failed: ${JSON.stringify(data).slice(0, 300)}`);

  const rows = data.data?.list || [];
  const campaignsById = new Map();
  const byDate = new Map();
  let spend = 0, impressions = 0, clicks = 0, conversions = 0;

  for (const row of rows) {
    const dims = row.dimensions || {};
    const m = row.metrics || {};
    const rowSpend = Number(m.spend) || 0;
    const rowImpressions = Number(m.impressions) || 0;
    const rowClicks = Number(m.clicks) || 0;
    // conversion is only meaningful if the advertiser has pixel/events
    // configured — default to 0 rather than error if TikTok omits it.
    const rowConversions = Number(m.conversion) || 0;

    spend += rowSpend; impressions += rowImpressions; clicks += rowClicks; conversions += rowConversions;

    const id = dims.campaign_id;
    const c = campaignsById.get(id) || { id, name: m.campaign_name || id, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    c.spend += rowSpend; c.impressions += rowImpressions; c.clicks += rowClicks; c.conversions += rowConversions;
    campaignsById.set(id, c);

    const date = dims.stat_time_day ? String(dims.stat_time_day).slice(0, 10) : since;
    byDate.set(date, (byDate.get(date) || 0) + rowSpend);
  }

  return {
    spend, impressions, clicks, conversions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    campaigns: [...campaignsById.values()],
    series: [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, s]) => ({ date, spend: s })),
  };
}
