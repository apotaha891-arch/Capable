// ResellerClub (LogicBoxes) domain reseller API client — lets Capable buy a
// domain wholesale and register it directly for a customer, without the
// customer ever leaving our (Arabic) UI or seeing ResellerClub's own site.
//
// Docs: https://manage.resellerclub.com/kb (HTTP API / Reseller API Guide).
// IMPORTANT: this client is built from documented parameter shapes, but no
// ResellerClub account existed at the time it was written, so it has never
// been run against the real API. Before flipping RESELLERCLUB_LIVE=true:
//   1. Set RESELLERCLUB_RESELLER_ID / RESELLERCLUB_API_KEY from a real account.
//   2. Leave RESELLERCLUB_LIVE unset (defaults to the test.httpapi.com sandbox)
//      and run one full search -> purchase -> register cycle for a throwaway
//      domain, checking each response shape against what this file assumes.
//   3. Only then set RESELLERCLUB_LIVE=true for production.

const LIVE_BASE = 'https://httpapi.com/api';
const TEST_BASE = 'https://test.httpapi.com/api';

function config() {
  const authUserId = process.env.RESELLERCLUB_RESELLER_ID;
  const apiKey = process.env.RESELLERCLUB_API_KEY;
  if (!authUserId || !apiKey) return null;
  const base = process.env.RESELLERCLUB_LIVE === 'true' ? LIVE_BASE : TEST_BASE;
  return { authUserId, apiKey, base };
}

export function isConfigured() {
  return !!config();
}

async function call(path, params, method = 'GET') {
  const cfg = config();
  if (!cfg) throw new Error('ResellerClub not configured');
  const qs = new URLSearchParams({ 'auth-userid': cfg.authUserId, 'api-key': cfg.apiKey, ...params });
  const url = method === 'GET' ? `${cfg.base}${path}?${qs}` : `${cfg.base}${path}`;
  const res = await fetch(url, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body: method === 'POST' ? qs : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`ResellerClub API error ${res.status}: ${String(text).slice(0, 300)}`);
  return data;
}

// Availability across a fixed TLD set for one base name.
// Response shape (per docs): { "name.tld": { status: 'available'|'regthroughus'|'regthroughothers'|... } }
export async function checkAvailability(name, tlds) {
  return call('/domains/available.json', { 'domain-name': name, tlds: tlds.join(',') });
}

// A ResellerClub "customer" represents one of OUR end users in their system.
// Created once per Capable user (id cached on users.resellerclub_customer_id),
// then reused for every domain they buy.
export async function ensureCustomer({ email, name, company, address, city, country, zipcode, phoneCc, phone, password }) {
  const data = await call('/customers/signup.json', {
    username: email,
    passwd: password, // a random password we generate and discard — the customer never logs into ResellerClub directly
    name,
    company: company || name,
    'address-line-1': address,
    city,
    country, // ISO 2-letter code
    zipcode,
    'phone-cc': phoneCc, // country calling code, e.g. "966"
    phone,
    lang_pref: 'en',
  }, 'POST');
  // Docs suggest this returns the new customer-id directly (a number) — verify.
  return data;
}

// A "contact" is the actual WHOIS registrant record, linked to a customer.
// The registrant is the CAPABLE END CUSTOMER (not Capable itself) — they legally
// own the domain; we're only the technical registrar-of-record via our reseller
// account.
export async function ensureContact({ customerId, name, company, email, address, city, country, zipcode, phoneCc, phone }) {
  const data = await call('/contacts/add.json', {
    'customer-id': customerId,
    name,
    company: company || name,
    email,
    'address-line-1': address,
    city,
    country,
    zipcode,
    'phone-cc': phoneCc,
    phone,
    type: 'Contact',
  }, 'POST');
  return data; // expected: a contact-id
}

// Registers the domain and points it at Capable's hosting via ResellerClub's
// own DNS hosting (so the customer's site works immediately — no manual
// TXT/CNAME step, unlike the bring-your-own-domain flow).
export async function registerDomain({ domainName, years, customerId, contactId, nameservers }) {
  return call('/domains/register.json', {
    'domain-name': domainName,
    years: String(years || 1),
    'customer-id': customerId,
    'reg-contact-id': contactId,
    'admin-contact-id': contactId,
    'tech-contact-id': contactId,
    'billing-contact-id': contactId,
    'invoice-option': 'NoInvoice',
    ns: (nameservers || []).join(','),
  }, 'POST');
}

// Points a purchased domain's DNS at Capable's hosting, using ResellerClub's
// included DNS hosting service (separate call from registration per their API).
export async function pointDnsAtCapable({ domainName, cnameTarget }) {
  return call('/dns/manage/add-cname-record.json', {
    'domain-name': domainName,
    host: '@',
    value: cnameTarget,
  }, 'POST');
}
