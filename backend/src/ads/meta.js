// Meta Marketing API client (Facebook + Instagram ads run through the same
// Graph API) — lets Capable's admin connect an ad account and pull campaign
// metrics for the "Social Ads" admin tab.
//
// Docs: https://developers.facebook.com/docs/marketing-api
// IMPORTANT: built from documented endpoint shapes, but no Meta developer app
// or real ad account existed at the time this was written, so it has never
// been run against the real API. Before trusting numbers from this client:
//   1. Create a Meta app at developers.facebook.com/apps, add the Marketing
//      API product, and set META_ADS_CLIENT_ID / META_ADS_CLIENT_SECRET /
//      META_ADS_REDIRECT_URI (must exactly match the app's OAuth redirect
//      allowlist).
//   2. Confirm GRAPH_VERSION below is still current (Meta deprecates old
//      Graph API versions on a schedule) — bump it if not.
//   3. Note: ads_read/ads_management scopes require Meta App Review before
//      any advertiser outside your own developer account can authorize this.
//   4. Run one full connect -> callback -> getInsights cycle against a real
//      ad account with known, non-zero spend and cross-check the numbers
//      against Meta Ads Manager for the same date range — pay special
//      attention to the `conversions` field below, which is a best-effort
//      sum over the `actions` array (Meta has no single "conversions"
//      field) and likely needs per-client tuning to match what that client
//      actually considers a conversion.

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

// Action types counted toward `conversions` — a reasonable default, not
// authoritative. A client with a differently configured pixel/CAPI may care
// about other action_types entirely.
const CONVERSION_ACTION_TYPES = new Set(['purchase', 'lead', 'complete_registration']);

function config() {
  const clientId = process.env.META_ADS_CLIENT_ID;
  const clientSecret = process.env.META_ADS_CLIENT_SECRET;
  const redirectUri = process.env.META_ADS_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isConfigured() {
  return !!config();
}

export function getAuthUrl(state) {
  const cfg = config();
  if (!cfg) throw new Error('Meta ads not configured');
  const qs = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    state,
    scope: 'ads_read,ads_management',
    response_type: 'code',
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${qs}`;
}

export async function exchangeCode(code) {
  const cfg = config();
  if (!cfg) throw new Error('Meta ads not configured');
  const qs = new URLSearchParams({
    client_id: cfg.clientId, client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri, code,
  });
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`Meta token exchange failed: ${JSON.stringify(data).slice(0, 300)}`);

  // Exchange the short-lived user token for a 60-day long-lived one.
  const longQs = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: cfg.clientId, client_secret: cfg.clientSecret,
    fb_exchange_token: data.access_token,
  });
  const longRes = await fetch(`${GRAPH_BASE}/oauth/access_token?${longQs}`);
  const longData = await longRes.json();
  if (!longRes.ok) throw new Error(`Meta long-lived token exchange failed: ${JSON.stringify(longData).slice(0, 300)}`);
  return { access_token: longData.access_token, refresh_token: null, expires_in: longData.expires_in || 60 * 24 * 3600 };
}

// Meta has no refresh_token concept for this flow — the 60-day long-lived
// token must be re-exchanged before it expires. There's no way to do that
// without the user re-authorizing, so this is a no-op; when the token nears
// expiry, fetchAccountMetrics in ads/index.js will just surface an error on
// that account until the admin reconnects it.
export async function refreshToken() {
  return null;
}

export async function listAccounts(accessToken) {
  const qs = new URLSearchParams({ access_token: accessToken, fields: 'id,name' });
  const res = await fetch(`${GRAPH_BASE}/me/adaccounts?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`Meta list accounts failed: ${JSON.stringify(data).slice(0, 300)}`);
  return (data.data || []).map((a) => ({ id: a.id, name: a.name || a.id }));
}

export async function getInsights({ accessToken, accountId, since, until }) {
  const qs = new URLSearchParams({
    access_token: accessToken,
    level: 'campaign',
    time_increment: '1',
    time_range: JSON.stringify({ since, until }),
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions,date_start',
  });
  const res = await fetch(`${GRAPH_BASE}/${accountId}/insights?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`Meta insights failed: ${JSON.stringify(data).slice(0, 300)}`);

  const rows = data.data || [];
  const campaignsById = new Map();
  const byDate = new Map();
  let spend = 0, impressions = 0, clicks = 0, conversions = 0;

  for (const row of rows) {
    const rowSpend = Number(row.spend) || 0;
    const rowImpressions = Number(row.impressions) || 0;
    const rowClicks = Number(row.clicks) || 0;
    const rowConversions = (row.actions || [])
      .filter((a) => CONVERSION_ACTION_TYPES.has(a.action_type))
      .reduce((sum, a) => sum + (Number(a.value) || 0), 0);

    spend += rowSpend; impressions += rowImpressions; clicks += rowClicks; conversions += rowConversions;

    const c = campaignsById.get(row.campaign_id) || { id: row.campaign_id, name: row.campaign_name, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    c.spend += rowSpend; c.impressions += rowImpressions; c.clicks += rowClicks; c.conversions += rowConversions;
    campaignsById.set(row.campaign_id, c);

    byDate.set(row.date_start, (byDate.get(row.date_start) || 0) + rowSpend);
  }

  return {
    spend, impressions, clicks, conversions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    campaigns: [...campaignsById.values()],
    series: [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, s]) => ({ date, spend: s })),
  };
}
