import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dns from 'dns/promises';
import { generateBlueprint, getFallbackBlueprint, GenerationError } from './src/blueprint/generate.js';
import { BlueprintSchema } from './src/blueprint/schema.js';
import { activeProviderName } from './src/ai/provider.js';
import { getUsage, secondsUntilMidnight, monthlyTokenBudget, getMonthlyTokens, getMonthlyTokenGrants, effectiveDeployLimit, customDomainLimit, domainBranded } from './src/limits.js';
import { monthlySeries, currentMRR, forecast as buildForecast, cashPosition, recommendations as buildRecommendations } from './src/admin/finance.js';
import { deliverCampaign, mailMode } from './src/admin/mailer.js';
import { seedDemoFinance } from './src/admin/seedDemo.js';

dotenv.config();

// Emails that should always be treated as platform admins (comma-separated).
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || 'admin@capable.test')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
);
const isAdminEmail = (email) => ADMIN_EMAILS.has(String(email || '').toLowerCase());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'capable_secret_change_in_production';

// ── Stripe (Workstream B) ─────────────────────────────────────────────────────
// Real payments. When STRIPE_SECRET_KEY is unset the routes fall back to the old
// simulated behavior so local dev still works without keys.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
// Where Stripe Checkout returns the user after pay/cancel.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Recurring plan → the lookup_key set on its Stripe Price. Create one Product +
// monthly Price per plan in Stripe and set these exact lookup_keys on the Prices.
const PLAN_PRICE_LOOKUP = {
  influence: process.env.STRIPE_PRICE_INFLUENCE || 'capable_influence_monthly',
  pro: process.env.STRIPE_PRICE_PRO || 'capable_pro_monthly',
};
// Extra deployable-project slot — a $5/mo recurring add-on (quantity = #slots).
const DEPLOY_SLOT_PRICE_LOOKUP = process.env.STRIPE_PRICE_DEPLOY_SLOT || 'capable_deploy_slot_monthly';
const PLAN_FALLBACK_AMOUNT = { influence: 19, pro: 49 }; // used only in simulated mode

// Resolve a Price lookup_key → price id (cached). Lets us reference stable names
// instead of generated price_… ids that change between Stripe environments.
const _priceCache = new Map();
async function resolvePriceId(lookupKey) {
  if (_priceCache.has(lookupKey)) return _priceCache.get(lookupKey);
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const id = prices.data[0]?.id || null;
  if (id) _priceCache.set(lookupKey, id);
  return id;
}

// Get (or lazily create) the Stripe customer for a user, persisting the id.
async function getOrCreateCustomer(userId) {
  const { rows } = await pool.query('SELECT email, name, stripe_customer_id FROM users WHERE id = $1', [userId]);
  const u = rows[0];
  if (!u) throw new Error('User not found');
  if (u.stripe_customer_id) return u.stripe_customer_id;
  const customer = await stripe.customers.create({
    email: u.email,
    name: u.name || undefined,
    metadata: { user_id: String(userId) },
  });
  await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
  return customer.id;
}

// ── Database ──────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        plan TEXT DEFAULT 'free',
        tokens_used INTEGER DEFAULT 0,
        tokens_limit INTEGER DEFAULT 2000000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        author TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT false,
        published_slug TEXT UNIQUE,
        custom_domain TEXT,
        description TEXT,
        thumbnail_url TEXT,
        price INTEGER DEFAULT 0,
        last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_files (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content TEXT DEFAULT '',
        file_type TEXT DEFAULT 'html',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, filename)
      );

      CREATE TABLE IF NOT EXISTS token_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        project_id INTEGER,
        tokens_in INTEGER DEFAULT 0,
        tokens_out INTEGER DEFAULT 0,
        model TEXT,
        action TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Dataset for a future in-house SLM: each row is a real generation plus the
      -- reviewer's corrections, so the model can learn what good output looks like
      -- and how mistakes get fixed.
      CREATE TABLE IF NOT EXISTS training_samples (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        project_id INTEGER,
        tier TEXT,
        prompt TEXT,
        output_code TEXT,
        review_issues TEXT,
        revised BOOLEAN DEFAULT false,
        user_edit TEXT,
        rating SMALLINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Raise the free token limit: update the column default and lift users still on the old 50k floor.
      ALTER TABLE users ALTER COLUMN tokens_limit SET DEFAULT 2000000;
      UPDATE users SET tokens_limit = 2000000 WHERE tokens_limit <= 50000;

      ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_verification_token TEXT;
      CREATE INDEX IF NOT EXISTS idx_projects_custom_domain ON projects(custom_domain) WHERE custom_domain IS NOT NULL;

      -- Capable Blueprint v2.0 columns (spec §2.1)
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS blueprint JSONB;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'none';
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS og_image_url TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      CREATE INDEX IF NOT EXISTS idx_projects_published_slug ON projects(published_slug) WHERE published_slug IS NOT NULL;

      -- Stripe billing (Workstream B)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS extra_deploy_slots INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deploy_slots_subscription_id TEXT;
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

      -- Admin & platform management
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

      -- Gallery classification + bilingual names for templates
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS name_ar TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS name_en TEXT;

      -- Financial ledger (admin finance panel)
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        type TEXT NOT NULL,                 -- subscription | template_sale | expense | refund | payout | manual_income
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'paid',         -- paid | pending | refunded
        description TEXT,
        plan TEXT,
        project_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
      -- Stripe idempotency: one ledger row per Stripe object (invoice/session/charge).
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_ref TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_ref ON transactions(stripe_ref) WHERE stripe_ref IS NOT NULL;

      -- Business model tables for Influence, commitments, and licensed assets.
      CREATE TABLE IF NOT EXISTS commitments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        stake_amount NUMERIC(12,2) DEFAULT 0,
        reward_amount NUMERIC(12,2) DEFAULT 0,
        target_date DATE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS licensed_assets (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_licensed_assets_slug ON licensed_assets(slug);

      -- Influence events (Workstream A): the conceptual core of the radical model —
      -- "track influence events, not just transactions". Every monetizable action
      -- and steering signal lands here; the resonance score is a weighted, decayed
      -- aggregate of these rows (see GET /api/biz/resonance).
      CREATE TABLE IF NOT EXISTS influence_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,           -- observer_fee | commitment_stake | commitment_payout | meme_license | feature_vote | engagement | referral
        weight NUMERIC(12,4) DEFAULT 1,
        target TEXT,                        -- what was influenced (plan, commitment id, asset slug, feature key)
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_influence_events_user ON influence_events(user_id, created_at);

      -- Challenges (admin-issued; replaces user-staked commitment vaults). Users
      -- join, progress is measured automatically from real activity, winners get a
      -- reward (tokens | subscription credit | cash payout).
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        goal_type TEXT NOT NULL DEFAULT 'generation_count',  -- publish_count | project_count | generation_count
        goal_target INTEGER NOT NULL DEFAULT 1,
        reward_type TEXT NOT NULL DEFAULT 'tokens',           -- tokens | credit | cash
        reward_value NUMERIC(12,2) NOT NULL DEFAULT 0,
        starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ends_at TIMESTAMP,
        status TEXT DEFAULT 'active',                          -- active | draft | ended
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS challenge_participants (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        baseline INTEGER DEFAULT 0,        -- metric value at join, so progress counts only after joining
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'joined',      -- joined | rewarded | expired
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        rewarded_at TIMESTAMP,
        UNIQUE (challenge_id, user_id)
      );
      -- Bonus generation tokens granted (e.g. challenge wins); added to the monthly budget.
      CREATE TABLE IF NOT EXISTS token_grants (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_token_grants_user ON token_grants(user_id, created_at);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_credit NUMERIC(12,2) DEFAULT 0;

      -- Meme-licensing (Workstream E): creator-listed modules backed by a real
      -- project, with propagation/fitness tracking.
      ALTER TABLE licensed_assets ADD COLUMN IF NOT EXISTS creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE licensed_assets ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
      ALTER TABLE licensed_assets ADD COLUMN IF NOT EXISTS adoption_count INTEGER DEFAULT 0;

      -- Ecosystem partners + adaptive fund (Workstream F).
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;
      CREATE TABLE IF NOT EXISTS adaptive_fund (
        id SERIAL PRIMARY KEY,
        direction TEXT NOT NULL,            -- in (contribution) | out (disbursement)
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- recipient for 'out'
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- In-app notifications (CRM → customers)
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT,
        type TEXT DEFAULT 'info',           -- info | success | warning | promo
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

      -- Email campaigns (CRM)
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        body TEXT,
        audience TEXT DEFAULT 'all',        -- all | free | pro | enterprise | paying
        status TEXT DEFAULT 'draft',        -- draft | sent
        mode TEXT,                          -- simulated | smtp
        recipient_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS campaign_recipients (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        email TEXT,
        status TEXT DEFAULT 'sent',         -- sent | opened | bounced
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Per-project SEO/social (owner control panel)
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_title TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_description TEXT;

      -- Visitor analytics for published sites
      CREATE TABLE IF NOT EXISTS page_events (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        type TEXT DEFAULT 'view',
        path TEXT,
        referrer TEXT,
        device TEXT DEFAULT 'desktop',      -- desktop | mobile | tablet
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_page_events_project ON page_events(project_id, created_at);

      -- Leads / form submissions captured from published sites
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        data JSONB,
        source_path TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id, created_at);

      -- Lock down the public PostgREST API. The backend connects as the table
      -- owner via DATABASE_URL and bypasses RLS, so it is unaffected. With RLS
      -- enabled and no policies, the anon/authenticated roles (reachable with the
      -- public anon key) can no longer read or write these tables directly.
      ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
      ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
      ALTER TABLE project_files       ENABLE ROW LEVEL SECURITY;
      ALTER TABLE token_usage         ENABLE ROW LEVEL SECURITY;
      ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
      ALTER TABLE campaigns           ENABLE ROW LEVEL SECURITY;
      ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE page_events         ENABLE ROW LEVEL SECURITY;
      ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
      ALTER TABLE influence_events    ENABLE ROW LEVEL SECURITY;
      ALTER TABLE challenges          ENABLE ROW LEVEL SECURITY;
      ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE token_grants        ENABLE ROW LEVEL SECURITY;
      ALTER TABLE adaptive_fund       ENABLE ROW LEVEL SECURITY;
      ALTER TABLE training_samples    ENABLE ROW LEVEL SECURITY;
    `);

    // Promote configured admin emails (no-op for emails not yet registered).
    if (ADMIN_EMAILS.size > 0) {
      await pool.query(
        `UPDATE users SET role = 'admin' WHERE LOWER(email) = ANY($1::text[])`,
        [Array.from(ADMIN_EMAILS)]
      );
    }

    await seedDemoFinance(pool);

    const { rows: existingAssets } = await pool.query('SELECT id FROM licensed_assets LIMIT 1');
    if (existingAssets.length === 0) {
      await pool.query(
        `INSERT INTO licensed_assets (slug, title, description, price, metadata) VALUES
          ('launch-ritual', 'Launch Ritual Bundle', 'A proven step-by-step launch flow designed to turn a template into a revenue-ready site.', 49, '{"type": "bundle", "theme": "growth"}'),
          ('partner-playbook', 'Partner Growth Playbook', 'A reusable partner onboarding workflow and promotion checklist to extend your network effect.', 79, '{"type": "playbook", "theme": "partners"}'),
          ('commitment-canvas', 'Commitment Canvas', 'A structural goal-setting template for converting behavior into predictable business results.', 29, '{"type": "template", "theme": "behavior"}')
        `
      );
    }

    // Backfill Arabic content on the seeded demo assets so the Arabic-first
    // marketplace shows translated titles/descriptions. Idempotent (merges into
    // metadata for known slugs), so it also updates rows seeded before this code.
    const arAssets = [
      ['launch-ritual', 'حزمة طقوس الإطلاق', 'تدفّق إطلاق مُجرّب خطوة بخطوة لتحويل القالب إلى موقع جاهز لتحقيق الإيرادات.'],
      ['partner-playbook', 'دليل نمو الشركاء', 'سير عمل قابل لإعادة الاستخدام لإعداد الشركاء وقائمة ترويج لتوسيع أثر شبكتك.'],
      ['commitment-canvas', 'لوحة الالتزام', 'قالب منظّم لوضع الأهداف يحوّل السلوك إلى نتائج عمل متوقّعة.'],
    ];
    for (const [slug, title_ar, description_ar] of arAssets) {
      await pool.query(
        `UPDATE licensed_assets SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb WHERE slug = $1`,
        [slug, JSON.stringify({ title_ar, description_ar })]
      );
    }

    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Database schema initialization failed', err);
  }
}

// ── Hosted projects directory ─────────────────────────────────────────────────
// Published sites + thumbnails. Set HOSTED_DIR to a mounted persistent volume in
// production (e.g. Railway/Render disk) so published sites survive redeploys.
const hostedDir = process.env.HOSTED_DIR || path.join(__dirname, 'hosted');
if (!fs.existsSync(hostedDir)) fs.mkdirSync(hostedDir, { recursive: true });

const thumbnailsDir = path.join(hostedDir, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────────
// CORS: open by default (auth is via Bearer token, not cookies). In production set
// CORS_ORIGINS to a comma-separated allowlist, e.g. "https://capable.live".
// Origins are matched after stripping any trailing slash and lowercasing, so a
// stray "https://capable.live/" in the env var still matches the browser's
// "https://capable.live" Origin header. Requests with no Origin (curl, health
// checks, server-to-server) are always allowed.
const normalizeOrigin = (o) => (o || '').trim().replace(/\/+$/, '').toLowerCase();
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

if (CORS_ORIGINS.length) {
  app.use(cors({
    origin(origin, callback) {
      if (!origin || CORS_ORIGINS.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      console.warn(`CORS: blocked origin "${origin}" (allowed: ${CORS_ORIGINS.join(', ')})`);
      return callback(null, false);
    },
  }));
} else {
  // No allowlist configured → reflect any origin (dev / open API).
  app.use(cors());
}

// Stripe webhook needs the raw body for signature verification, so it is mounted
// with express.raw BEFORE the global JSON parser. Fulfillment lives in
// handleStripeEvent (defined with the business-model routes).
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe not configured' });
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error(`Stripe event ${event.type} handling failed:`, err.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '10mb' }));

// "Powered by Capable" badge — the $19 viral hook injected into branded plans'
// custom-domain pages. Pro/enterprise serve unbranded.
function injectCapableBadge(html) {
  if (typeof html !== 'string') return html;
  const badge = `\n<a href="https://capable.app/?ref=badge" target="_blank" rel="noopener" style="position:fixed;bottom:12px;right:12px;z-index:2147483647;display:inline-flex;align-items:center;gap:6px;background:#0f172a;color:#fff;font:600 12px/1 system-ui,sans-serif;padding:8px 12px;border-radius:9999px;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.25)">⚡ Powered by Capable</a>\n`;
  return html.includes('</body>') ? html.replace('</body>', badge + '</body>') : html + badge;
}

// Host-based routing for verified custom domains. Skipped on localhost and for API/hosted/uploads paths.
// Plan-aware: a downgraded owner (plan no longer allows custom domains) stops being
// served, and branded plans (Influence) get the "Powered by Capable" badge.
const SYSTEM_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/hosted/')) return next();
  const host = (req.hostname || '').toLowerCase();
  if (!host || SYSTEM_HOSTS.has(host)) return next();
  try {
    const { rows } = await pool.query(
      `SELECT p.published_slug, u.plan
         FROM projects p JOIN users u ON u.id = p.user_id
        WHERE LOWER(p.custom_domain) = $1 AND p.domain_verified = true AND p.is_published = true
        LIMIT 1`,
      [host]
    );
    if (rows.length > 0) {
      const { published_slug, plan } = rows[0];
      if (customDomainLimit(plan) <= 0) return next(); // owner downgraded — domain no longer active
      const file = path.join(hostedDir, published_slug, 'index.html');
      if (fs.existsSync(file)) {
        if (domainBranded(plan)) {
          const html = injectCapableBadge(fs.readFileSync(file, 'utf-8'));
          res.set('Content-Type', 'text/html; charset=utf-8');
          return res.send(html);
        }
        return res.sendFile(file);
      }
    }
  } catch (err) {
    console.error('Custom domain lookup failed:', err.message);
  }
  next();
});

// Classify a visitor's device from the User-Agent.
function deviceFromUA(ua = '') {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Tracking + lead-capture snippet injected into published code pages.
function injectTracking(html, slug) {
  const base = process.env.BASE_URL || `http://localhost:${port}`;
  const snippet = `\n<script>(function(){var S=${JSON.stringify(slug)},B=${JSON.stringify(base)};
try{fetch(B+'/api/track/'+S,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({path:location.pathname,referrer:document.referrer})}).catch(function(){});}catch(e){}
document.addEventListener('submit',function(e){var f=e.target;if(!f||f.tagName!=='FORM')return;var d={};try{new FormData(f).forEach(function(v,k){d[k]=v});}catch(_){}
try{fetch(B+'/api/leads/'+S,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:location.pathname,fields:d})}).catch(function(){});}catch(e){}},true);})();</script>\n`;
  if (typeof html !== 'string') return html;
  return html.includes('</body>') ? html.replace('</body>', snippet + '</body>') : html + snippet;
}

// Server-side view tracking for hosted code pages (works without re-publishing).
// Logs one 'view' event when a slug's index document is requested.
app.use('/hosted', (req, res, next) => {
  try {
    const m = req.path.match(/^\/([^/]+)\/?$/) || req.path.match(/^\/([^/]+)\/index\.html$/);
    if (m && m[1] !== 'thumbnails') {
      const slug = m[1];
      pool.query('SELECT id FROM projects WHERE published_slug = $1 LIMIT 1', [slug])
        .then(({ rows }) => {
          if (rows[0]) pool.query(
            'INSERT INTO page_events (project_id, type, path, referrer, device) VALUES ($1, $2, $3, $4, $5)',
            [rows[0].id, 'view', req.path, req.get('referer') || null, deviceFromUA(req.get('user-agent'))]
          ).catch(() => {});
        }).catch(() => {});
    }
  } catch {}
  next();
});

app.use('/hosted', express.static(hostedDir));

// DB fallback for published code pages. express.static above handles the fast
// path; if the file is missing (e.g. the persistent volume was reset between
// deploys) we serve the project's HTML straight from the database by slug and
// re-materialize it to disk so later hits go static again. Without this, links
// 404 even though the code is safe in the projects table.
app.get(['/hosted/:slug', '/hosted/:slug/index.html'], async (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'thumbnails') return next();
  try {
    const { rows } = await pool.query(
      'SELECT code FROM projects WHERE published_slug = $1 AND is_published = true LIMIT 1',
      [slug]
    );
    if (!rows[0] || !rows[0].code) return next();
    const html = injectTracking(rows[0].code, slug);
    try {
      const dir = path.join(hostedDir, slug);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    } catch { /* read-only fs is fine — we still serve from memory */ }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    next();
  }
});

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
}

// Plan middleware factory
function requirePlan(...plans) {
  return async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
      const user = rows[0];
      if (!user || !plans.includes(user.plan)) {
        return res.status(403).json({ error: 'Upgrade required', requiredPlan: plans[0] });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  };
}

// Admin guard — verifies the role from the DB (not just the token).
async function adminMiddleware(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT role, email FROM users WHERE id = $1', [req.user.id]);
    const u = rows[0];
    if (!u || (u.role !== 'admin' && !isAdminEmail(u.email)))
      return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Anthropic client for the Builder (single-file site generation). Lazily
// constructed so a missing ANTHROPIC_API_KEY doesn't crash boot — the route
// returns a clear 503 until the key is configured. Model is overridable via env.
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const SONNET_MODEL = process.env.SONNET_MODEL || 'claude-sonnet-4-6';
const OPUS_MODEL   = process.env.OPUS_MODEL   || 'claude-opus-4-8';

// Open-weight generator via any OpenAI-compatible endpoint (DeepSeek direct, or
// OpenRouter/Together/Fireworks/self-hosted vLLM). DeepSeek V3.2 gives near-frontier
// code quality at an open-weight cost floor (~$0.28/$0.42 per 1M in/out) — far below
// Gemini's $2.50 output. When OSS_API_KEY is set, the generator uses it; otherwise we
// fall back to Gemini, so this is a safe, opt-in cost cut.
// Open-weight generator key. Prefer an explicit OSS/DeepSeek key; otherwise reuse
// the existing Groq key (gsk_…) so Capable 1 runs on an open-weight model (Llama
// 3.3 70B) via Groq's OpenAI-compatible endpoint instead of falling back to Gemini.
const OSS_API_KEY  = process.env.OSS_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || '';
const USING_GROQ   = !process.env.OSS_API_KEY && !process.env.DEEPSEEK_API_KEY && !!process.env.GROQ_API_KEY;
const OSS_BASE_URL = process.env.OSS_BASE_URL || (USING_GROQ ? 'https://api.groq.com/openai' : 'https://api.deepseek.com');
const OSS_MODEL    = process.env.OSS_MODEL || (USING_GROQ ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') : 'deepseek-chat');
let _anthropic = null;

// Capable Builder model tiers. The user picks one per generation. Higher tiers
// produce better output but burn more tokens, so callers should surface tighter
// limits + an upgrade/downgrade choice on the expensive ones.
//   capable1 — open-weight (Groq) generates, Sonnet reviews  (cheapest, default)
//   capable2 — open-weight (Groq) generates, Opus reviews     (stronger review)
//   capable3 — Sonnet generates, Opus reviews                 (best quality, costly)
// The cheap-tier generator is the open-weight model when keyed (big cost saving),
// else Gemini as a fallback. The reviewer stays a strong model so quality holds.
const GEMINI_GENERATOR = { provider: 'gemini', model: GEMINI_MODEL };
const OSS_GENERATOR = OSS_API_KEY
  ? { provider: 'openai', model: OSS_MODEL }
  : GEMINI_GENERATOR;
const BUILDER_TIERS = {
  capable1: { generator: OSS_GENERATOR, reviewer: { provider: 'anthropic', model: SONNET_MODEL } },
  capable2: { generator: OSS_GENERATOR, reviewer: { provider: 'anthropic', model: OPUS_MODEL } },
  capable3: { generator: { provider: 'anthropic', model: SONNET_MODEL }, reviewer: { provider: 'anthropic', model: OPUS_MODEL } },
};
const DEFAULT_TIER = 'capable1';

// INITIAL generation used to upgrade the open-weight generator to Gemini for a
// stronger one-shot build, but that made the default tiers depend on Gemini
// (Google) billing — a single point of failure when those credits run out. Policy
// now: the open-weight model generates in all cases (initial + edits) and the
// strong reviewer (Sonnet/Opus) guards quality. If no open-weight key is set,
// OSS_GENERATOR already falls back to Gemini. Kept as a one-line hook so the
// generation policy stays easy to change in a single place.
const initialGenerator = (gen) => gen;

// Per-tier token budgets: every tier is available to every user, but the pricier
// tiers get a tighter cap. When a user exhausts a tier they downgrade to a cheaper
// one or upgrade their plan. Overridable via env.
const TIER_LIMITS = {
  capable1: parseInt(process.env.TIER1_LIMIT || '2000000'),
  capable2: parseInt(process.env.TIER2_LIMIT || '500000'),
  capable3: parseInt(process.env.TIER3_LIMIT || '150000'),
};

// Model pricing in USD per 1,000,000 tokens, used to compute the exact cost of
// each logged operation. tokens_in already folds in cache tokens (see the chat
// route), so input cost is an upper bound — real cache reads are cheaper.
const MODEL_PRICING = {
  'claude-opus-4-8':     { in: 5.0,   out: 25.0 },
  'claude-sonnet-4-6':   { in: 3.0,   out: 15.0 },
  'gemini-flash-latest': { in: 0.30,  out: 2.50 },
  'deepseek-chat':       { in: 0.28,  out: 0.42 },
  'llama-3.3-70b-versatile': { in: 0.59, out: 0.79 },
};
const DEFAULT_PRICING = { in: 0, out: 0 };

// Cost in USD for one operation given its in/out token counts and model name.
function costUsd(model, tokensIn, tokensOut) {
  const p = MODEL_PRICING[model] || DEFAULT_PRICING;
  return ((tokensIn || 0) * p.in + (tokensOut || 0) * p.out) / 1_000_000;
}
function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password)
    return res.status(400).json({ error: 'Email, name, and password are required' });

  try {
    const { rows: existingRows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows.length > 0) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const role = isAdminEmail(email) ? 'admin' : 'user';
    const { rows } = await pool.query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [email.toLowerCase().trim(), name.trim(), hash, role]
    );

    const user = { id: rows[0].id, email, name, plan: 'free', role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });

    // Auto-promote configured admin emails on login.
    let role = user.role || 'user';
    if (isAdminEmail(user.email) && role !== 'admin') {
      await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [user.id]);
      role = 'admin';
    }

    const payload = { id: user.id, email: user.email, name: user.name, plan: user.plan, role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, plan, role, tokens_used, tokens_limit, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/projects
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, thumbnail_url, price, likes, views, is_public, is_published,
              published_slug, last_edited, created_at, (blueprint IS NOT NULL) AS has_blueprint
         FROM projects WHERE user_id = $1 ORDER BY last_edited DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects', details: err.message });
  }
});

// Floating "Edit with Capable" badge injected into public previews. It drives
// viewers back to Capable to remix the project. Rendered inside a shadow root so
// the host page's CSS can't restyle or hide it, with a max z-index so it stays
// on top. Self-contained: no external requests, safe to inline anywhere.
function capableEditBadge(projectId) {
  const href = `${FRONTEND_URL}/builder?ref=preview&from=${encodeURIComponent(projectId)}`;
  // Single-quoted strings inside so the whole thing embeds cleanly in innerHTML.
  return `
<script>(function(){
  if (window.__capableBadge) return; window.__capableBadge = 1;
  function mount(){
    if (!document.body) { return setTimeout(mount, 50); }
    var host = document.createElement('div');
    host.setAttribute('dir','ltr');
    host.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;';
    var root = host.attachShadow ? host.attachShadow({mode:'open'}) : host;
    root.innerHTML =
      '<style>'
      + 'a{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;'
      + 'cursor:pointer;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;'
      + 'font-size:14px;font-weight:700;line-height:1;color:#fff;background:#1F4788;'
      + 'padding:10px 16px;border-radius:9999px;box-shadow:0 6px 20px rgba(31,71,136,.35);'
      + 'transition:transform .15s ease,background .15s ease;text-decoration:none;}'
      + 'a:hover{background:#2E5FA3;transform:translateY(-2px);}'
      + 'svg{display:block;flex:0 0 auto;}'
      + 'span{white-space:nowrap;}'
      + '</style>'
      + '<a href="${href}" target="_blank" rel="noopener noreferrer">'
      + '<svg width="16" height="16" viewBox="0 0 48 48" fill="none" aria-hidden="true">'
      + '<path d="M34.71 12.11 A16 16 0 1 0 34.71 35.89" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>'
      + '</svg><span>Edit with Capable</span></a>';
    document.body.appendChild(host);
  }
  mount();
})();</script>`;
}

// GET /api/projects/preview/:id — serve any public project's HTML for inline preview
app.get('/api/projects/preview/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT code FROM projects WHERE id = $1 AND is_public = true', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = rows[0].code || '';
    const badge = capableEditBadge(req.params.id);
    // Inject before </body> when present, otherwise append so it still renders.
    const out = /<\/body>/i.test(html)
      ? html.replace(/<\/body>/i, `${badge}</body>`)
      : html + badge;
    res.send(out);
  } catch (err) {
    res.status(500).send('Error');
  }
});

// GET /api/projects/explore
app.get('/api/projects/explore', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.thumbnail_url, p.price, p.likes, p.views, p.published_slug, p.last_edited,
              p.category, p.featured,
              COALESCE(p.author, u.name) AS author,
              COALESCE(p.name_en, p.blueprint->>'project_name_en') AS name_en,
              COALESCE(p.name_ar, p.blueprint->>'project_name_ar') AS name_ar
       FROM projects p LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_public = true AND (length(COALESCE(p.code, '')) > 0 OR p.blueprint IS NOT NULL)
       ORDER BY p.featured DESC NULLS LAST, p.likes DESC, p.created_at DESC LIMIT 60`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/projects/:id
app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    await pool.query('UPDATE projects SET views = views + 1 WHERE id = $1', [req.params.id]);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects
app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const { name, description, thumbnail_url, price, code = '', is_public = false } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await pool.query(
      'INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, author, is_public, last_edited) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *',
      [req.user.id, name, description || null, thumbnail_url || null, price || 0, code, req.user.name, is_public]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// PUT /api/projects/:id
app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, thumbnail_url, price, code, is_public, custom_domain, seo_title, seo_description, og_image_url } = req.body;
    const { rows: projRows } = await pool.query('SELECT id, custom_domain FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (projRows.length === 0) return res.status(404).json({ error: 'Project not found' });

    // Custom-domain gating (Workstream C): plan must allow custom domains, within
    // the plan's count (free locked, Influence 1, Pro/enterprise unlimited).
    if (custom_domain && String(custom_domain).trim()) {
      const newDomain = String(custom_domain).trim().toLowerCase();
      const currentDomain = (projRows[0].custom_domain || '').toLowerCase();
      if (newDomain !== currentDomain) {
        const { rows: u } = await pool.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
        const limit = customDomainLimit(u[0]?.plan);
        if (limit <= 0) {
          return res.status(403).json({ error: 'upgrade_required', message: 'Custom domains are available on paid plans.' });
        }
        if (Number.isFinite(limit)) {
          const { rows: c } = await pool.query(
            'SELECT COUNT(*)::int AS n FROM projects WHERE user_id = $1 AND custom_domain IS NOT NULL AND id <> $2',
            [req.user.id, req.params.id]
          );
          if (c[0].n >= limit) {
            return res.status(402).json({ error: 'domain_limit_reached', domains_used: c[0].n, domains_limit: limit, plan: u[0]?.plan });
          }
        }
      }
    }

    await pool.query(`UPDATE projects SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      thumbnail_url = COALESCE($3, thumbnail_url),
      price = COALESCE($4, price),
      code = COALESCE($5, code),
      is_public = COALESCE($6, is_public),
      custom_domain = COALESCE($7, custom_domain),
      seo_title = COALESCE($8, seo_title),
      seo_description = COALESCE($9, seo_description),
      og_image_url = COALESCE($10, og_image_url),
      last_edited = NOW()
      WHERE id = $11`,
      [name ?? null, description ?? null, thumbnail_url ?? null, price ?? null, code ?? null, is_public ?? null, custom_domain ?? null, seo_title ?? null, seo_description ?? null, og_image_url ?? null, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update', details: err.message });
  }
});

// POST /api/projects/:id/thumbnail
app.post('/api/projects/:id/thumbnail', authMiddleware, async (req, res) => {
  try {
    const { image } = req.body; 
    const { rows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    if (!image || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `thumb_${req.params.id}_${Date.now()}.jpg`;
    const filepath = path.join(thumbnailsDir, filename);

    fs.writeFileSync(filepath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    const url = `${baseUrl}/hosted/thumbnails/${filename}`;

    await pool.query('UPDATE projects SET thumbnail_url = $1 WHERE id = $2', [url, req.params.id]);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save thumbnail', details: err.message });
  }
});

// POST /api/projects/:id/og-image — upload the social-share image from the user's
// computer (base64 data URL) so non-technical users don't need to host a URL.
app.post('/api/projects/:id/og-image', authMiddleware, async (req, res) => {
  try {
    const { image } = req.body;
    const { rows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    if (!image || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const ext = (image.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg').replace('jpeg', 'jpg');
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `og_${req.params.id}_${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(thumbnailsDir, filename), buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    const url = `${baseUrl}/hosted/thumbnails/${filename}`;

    await pool.query('UPDATE projects SET og_image_url = $1 WHERE id = $2', [url, req.params.id]);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save image', details: err.message });
  }
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
    
    const projectDir = path.join(hostedDir, req.params.id.toString());
    if (fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete', details: err.message });
  }
});

// POST /api/projects/:id/publish
app.post('/api/projects/:id/publish', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Deploy-slot guard: publishing a not-yet-published project consumes a slot.
    if (!project.is_published) {
      const { rows: u } = await pool.query('SELECT plan, extra_deploy_slots FROM users WHERE id = $1', [req.user.id]);
      const limit = effectiveDeployLimit(u[0].plan, u[0].extra_deploy_slots);
      if (Number.isFinite(limit)) {
        const { rows: c } = await pool.query('SELECT COUNT(*)::int AS n FROM projects WHERE user_id = $1 AND is_published = true', [req.user.id]);
        if (c[0].n >= limit) {
          return res.status(402).json({ error: 'deploy_limit_reached', deploys_count: c[0].n, deploys_limit: limit, plan: u[0].plan });
        }
      }
    }

    const slug = project.published_slug || `p-${req.params.id}-${Date.now().toString(36)}`;
    const projectDir = path.join(hostedDir, slug);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(path.join(projectDir, 'index.html'), injectTracking(project.code, slug), 'utf-8');

    await pool.query('UPDATE projects SET is_published = true, published_slug = $1, is_public = true WHERE id = $2', [slug, req.params.id]);

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    res.json({ success: true, url: `${baseUrl}/hosted/${slug}/index.html`, slug });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish', details: err.message });
  }
});

// POST /api/projects/:id/unpublish
app.post('/api/projects/:id/unpublish', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT published_slug FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: 'Not found' });

    if (project.published_slug) {
      const dir = path.join(hostedDir, project.published_slug);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    }
    await pool.query('UPDATE projects SET is_published = false, is_public = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unpublish', details: err.message });
  }
});

// POST /api/projects/:id/convert-to-code — PAID: snapshot a blueprint project's
// rendered HTML (sent by the client) as editable `code` so it opens in the code
// editor (المحرر). Only fills `code` when empty, so it never clobbers later edits.
app.post('/api/projects/:id/convert-to-code', authMiddleware, async (req, res) => {
  try {
    const { rows: u } = await pool.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
    if (!['influence', 'pro', 'enterprise'].includes(u[0]?.plan)) {
      return res.status(403).json({ error: 'upgrade_required', message: 'Opening a blueprint project in the code editor is a paid feature.' });
    }
    const { rows } = await pool.query('SELECT id, code FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.code && project.code.trim()) return res.json({ success: true, alreadyCode: true });

    const { code } = req.body || {};
    if (!code || typeof code !== 'string' || code.length < 50) {
      return res.status(400).json({ error: 'Rendered code is required' });
    }
    await pool.query('UPDATE projects SET code = $1, updated_at = NOW() WHERE id = $2', [code, project.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert', details: err.message });
  }
});

// ── Business model routes ───────────────────────────────────────────────────

// Influence-event weights (Workstream A). Tunable; higher = stronger pull on a
// user's resonance score, which downstream voting/experiments/adaptive pricing read.
const INFLUENCE_WEIGHTS = {
  observer_fee: 10,        // paying for the resonance pass
  commitment_payout: 8,    // converting staked behavior into achievement
  meme_license: 6,         // adopting / propagating a memetic module
  commitment_stake: 5,     // locking value into a behavioral vault
  challenge_win: 6,        // completing an admin-issued challenge
  referral: 4,             // propagating the brand
  feature_vote: 3,         // steering the roadmap
  engagement: 1,           // passive participation
};

// Event types a user may emit directly via POST /api/biz/influence. Money-bearing
// events (observer_fee, commitment_*, meme_license) are emitted server-side only.
const USER_INFLUENCE_TYPES = new Set(['feature_vote', 'engagement', 'referral']);

// Record one influence event. Never throws into callers — influence tracking must
// not break a paid action. Weight defaults to the type's tuned weight.
async function recordInfluence(userId, eventType, { target = null, weight, metadata = {} } = {}) {
  if (!userId) return;
  const w = weight ?? INFLUENCE_WEIGHTS[eventType] ?? 1;
  try {
    await pool.query(
      `INSERT INTO influence_events (user_id, event_type, weight, target, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventType, w, target, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('recordInfluence failed:', err.message);
  }
}

// Insert a ledger row keyed by a Stripe object id (idempotent — duplicate webhook
// deliveries won't double-count). Returns true only when a new row is written.
async function recordStripeTransaction({ userId, type, amount, status = 'paid', description, plan = null, stripeRef = null }) {
  if (stripeRef) {
    const { rows } = await pool.query('SELECT 1 FROM transactions WHERE stripe_ref = $1 LIMIT 1', [stripeRef]);
    if (rows.length) return false;
  }
  await pool.query(
    `INSERT INTO transactions (user_id, type, amount, status, description, plan, stripe_ref)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (stripe_ref) DO NOTHING`,
    [userId, type, amount, status, description, plan, stripeRef]
  );
  return true;
}

async function userIdForCustomer(customerId) {
  if (!customerId) return null;
  const { rows } = await pool.query('SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1', [customerId]);
  return rows[0]?.id || null;
}

// Deep-copy a project (code + blueprint + files) into another user's account.
// Shared by the clone route and meme-license adoption. Returns the new project.
async function cloneProjectForUser(sourceId, ownerId, ownerName) {
  const { rows: sr } = await pool.query('SELECT * FROM projects WHERE id = $1', [sourceId]);
  const source = sr[0];
  if (!source) return null;
  const hasBlueprint = !!source.blueprint;
  const cloneName = `${source.name} (Clone)`;
  let newSlug = null;
  if (hasBlueprint) {
    newSlug = await uniqueSlug(source.blueprint.project_name_en || source.blueprint.project_name || cloneName);
  }
  const { rows: np } = await pool.query(
    `INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, blueprint,
                           author, is_public, is_published, published_slug, last_edited, updated_at)
     VALUES ($1, $2, $3, $4, 0, $5, $6, $7, false, $8, $9, NOW(), NOW()) RETURNING id`,
    [ownerId, cloneName, source.description, source.thumbnail_url, source.code, source.blueprint || null, ownerName, hasBlueprint, newSlug]
  );
  const newId = np[0].id;
  const { rows: files } = await pool.query('SELECT * FROM project_files WHERE project_id = $1', [source.id]);
  for (const f of files) {
    await pool.query('INSERT INTO project_files (project_id, filename, content, file_type) VALUES ($1, $2, $3, $4)', [newId, f.filename, f.content, f.file_type]);
  }
  return { id: newId, has_blueprint: hasBlueprint, slug: newSlug };
}

// Platform keeps (1 − share); the creator earns this fraction of each paid license.
const LICENSE_CREATOR_SHARE = 0.7;

// Fulfill a meme-license purchase: adopt (clone the linked project to the buyer),
// bump the asset's adoption count (its "fitness"), pay the creator their share, and
// record influence for both sides. Idempotency is the caller's responsibility.
async function fulfillMemeLicense(buyerId, asset, amountPaid) {
  let clone = null;
  if (asset.project_id) {
    const { rows: u } = await pool.query('SELECT name FROM users WHERE id = $1', [buyerId]);
    clone = await cloneProjectForUser(asset.project_id, buyerId, u[0]?.name || 'user');
  }
  await pool.query('UPDATE licensed_assets SET adoption_count = COALESCE(adoption_count, 0) + 1 WHERE id = $1', [asset.id]);

  const price = Number(amountPaid ?? asset.price) || 0;
  if (asset.creator_id && asset.creator_id !== buyerId && price > 0) {
    const share = Math.round(price * LICENSE_CREATOR_SHARE * 100) / 100;
    await pool.query('UPDATE users SET account_credit = COALESCE(account_credit, 0) + $1 WHERE id = $2', [share, asset.creator_id]);
    await pool.query('INSERT INTO transactions (user_id, type, amount, status, description) VALUES ($1, $2, $3, $4, $5)',
      [asset.creator_id, 'payout', share, 'paid', `Creator share: ${asset.title}`]);
    await recordInfluence(asset.creator_id, 'meme_license', { target: asset.slug, metadata: { role: 'creator', earned: share } });
  }
  await recordInfluence(buyerId, 'meme_license', { target: asset.slug, metadata: { asset_id: asset.id, price, role: 'buyer' } });
  // A slice of platform revenue funds the adaptive fund (Workstream F).
  const platformRevenue = (asset.creator_id && asset.creator_id !== buyerId && price > 0)
    ? price * (1 - LICENSE_CREATOR_SHARE) : price;
  await contributeToFund(platformRevenue * ADAPTIVE_FUND_RATE, `license:${asset.slug}`);
  return clone;
}

// ── Adaptive fund (Workstream F) + adaptive pricing (Workstream G) ────────────

const ADAPTIVE_FUND_RATE = 0.10; // 10% of platform revenue feeds the fund

// A user's live resonance score (30-day half-life weighted influence) — the lever
// for adaptive pricing and fund reallocation.
async function resonanceScore(userId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(weight * power(0.5, EXTRACT(EPOCH FROM (now() - created_at)) / (86400 * 30))), 0) AS score
       FROM influence_events WHERE user_id = $1`,
    [userId]
  );
  return Number(rows[0].score) || 0;
}

// Resonance → personalized discount: engagement "collapses" pricing in your favor.
function adaptiveDiscount(score) {
  const s = Number(score) || 0;
  if (s >= 50) return 0.15;
  if (s >= 20) return 0.10;
  if (s >= 5) return 0.05;
  return 0;
}

async function contributeToFund(amount, reason) {
  const a = Math.round((Number(amount) || 0) * 100) / 100;
  if (a <= 0) return;
  try { await pool.query("INSERT INTO adaptive_fund (direction, amount, reason) VALUES ('in', $1, $2)", [a, reason]); }
  catch (e) { console.error('contributeToFund failed:', e.message); }
}

async function adaptiveFundBalance() {
  const { rows } = await pool.query("SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE -amount END), 0) AS bal FROM adaptive_fund");
  return Number(rows[0].bal) || 0;
}

// Central Stripe event fulfillment. Plans/grants are applied ONLY here, after
// Stripe confirms the money actually moved. Called from the webhook route.
async function handleStripeEvent(event) {
  const obj = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = parseInt(obj.metadata?.user_id || obj.client_reference_id || '', 10) || null;
      if (!userId) break;
      if (obj.mode === 'subscription' && obj.metadata?.kind === 'deploy_slots') {
        // Extra deployable slots — set the count from the subscription quantity.
        const sub = obj.subscription ? await stripe.subscriptions.retrieve(obj.subscription) : null;
        const qty = sub?.items?.data?.[0]?.quantity || 0;
        await pool.query('UPDATE users SET extra_deploy_slots = $1, deploy_slots_subscription_id = $2 WHERE id = $3',
          [qty, obj.subscription || null, userId]);
      } else if (obj.mode === 'subscription') {
        const plan = obj.metadata?.plan;
        if (plan) {
          await pool.query('UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE id = $3',
            [plan, obj.subscription || null, userId]);
        }
        // The first invoice is booked by invoice.paid; here we record the influence.
        await recordInfluence(userId, 'observer_fee', { target: plan, metadata: { amount: (obj.amount_total || 0) / 100, source: 'checkout' } });
      } else if (obj.mode === 'payment' && obj.metadata?.kind === 'meme_license') {
        const amount = (obj.amount_total || 0) / 100;
        const wrote = await recordStripeTransaction({
          userId, type: 'template_sale', amount,
          description: `Licensed asset: ${obj.metadata.asset_slug}`, stripeRef: obj.id,
        });
        if (wrote) {
          const { rows: ar } = await pool.query('SELECT * FROM licensed_assets WHERE id = $1', [obj.metadata.asset_id]);
          if (ar[0]) await fulfillMemeLicense(userId, ar[0], amount); // adopt + pay creator + influence
        }
      }
      break;
    }
    case 'invoice.paid': {
      const userId = await userIdForCustomer(obj.customer);
      if (!userId) break;
      const amount = (obj.amount_paid || 0) / 100;
      const { rows } = await pool.query('SELECT plan, deploy_slots_subscription_id FROM users WHERE id = $1', [userId]);
      const plan = rows[0]?.plan || null;
      const isSlots = obj.subscription && rows[0]?.deploy_slots_subscription_id === obj.subscription;
      const wrote = await recordStripeTransaction({
        userId, type: 'subscription', amount,
        description: isSlots ? 'Deploy slots payment' : `Subscription payment (${plan || 'plan'})`,
        plan: isSlots ? null : plan, stripeRef: obj.id,
      });
      // Each successful PLAN renewal is an ongoing observer-fee influence signal
      // (slot renewals are not an influence event).
      if (wrote && !isSlots && obj.billing_reason === 'subscription_cycle') {
        await recordInfluence(userId, 'observer_fee', { target: plan, metadata: { amount, source: 'renewal' } });
      }
      if (wrote && !isSlots) await contributeToFund(amount * ADAPTIVE_FUND_RATE, 'subscription'); // Workstream F
      break;
    }
    case 'invoice.payment_failed': {
      const userId = await userIdForCustomer(obj.customer);
      if (!userId) break;
      await recordStripeTransaction({
        userId, type: 'subscription', amount: (obj.amount_due || 0) / 100, status: 'pending',
        description: 'Subscription payment failed', stripeRef: `${obj.id}:failed`,
      });
      // Stripe retries per dunning settings; customer.subscription.deleted handles final loss.
      break;
    }
    case 'customer.subscription.updated': {
      // Keep extra deploy slots in sync when the user changes quantity in the portal.
      if (obj.metadata?.kind === 'deploy_slots') {
        const userId = await userIdForCustomer(obj.customer);
        if (!userId) break;
        const qty = obj.items?.data?.[0]?.quantity || 0;
        await pool.query('UPDATE users SET extra_deploy_slots = $1 WHERE id = $2', [qty, userId]);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const userId = await userIdForCustomer(obj.customer);
      if (!userId) break;
      if (obj.metadata?.kind === 'deploy_slots') {
        await pool.query('UPDATE users SET extra_deploy_slots = 0, deploy_slots_subscription_id = NULL WHERE id = $1', [userId]);
      } else {
        await pool.query("UPDATE users SET plan = 'free', stripe_subscription_id = NULL WHERE id = $1", [userId]);
      }
      break;
    }
    default:
      break;
  }
}

// GET /api/biz/assets
app.get('/api/biz/assets', authMiddleware, async (req, res) => {
  try {
    // Ordered by adoption_count ("fitness") — high-adoption modules surface first.
    const { rows } = await pool.query(
      `SELECT a.id, a.slug, a.title, a.description, a.price, a.metadata,
              COALESCE(a.adoption_count, 0) AS adoption_count, a.project_id, a.creator_id,
              u.name AS creator_name
         FROM licensed_assets a
         LEFT JOIN users u ON u.id = a.creator_id
        ORDER BY COALESCE(a.adoption_count, 0) DESC, a.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load marketplace assets', details: err.message });
  }
});

// POST /api/biz/assets — list one of YOUR projects as a licensable module.
app.post('/api/biz/assets', authMiddleware, async (req, res) => {
  try {
    const { project_id, title, description, price } = req.body || {};
    if (!project_id || !title) return res.status(400).json({ error: 'project_id and title are required' });
    const { rows: pr } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [project_id, req.user.id]);
    if (!pr[0]) return res.status(404).json({ error: 'Project not found' });
    const slug = (String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'module')
      + '-' + crypto.randomBytes(3).toString('hex');
    const { rows } = await pool.query(
      `INSERT INTO licensed_assets (slug, title, description, price, creator_id, project_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, '{}') RETURNING *`,
      [slug, title, description || '', Math.max(0, Math.round(Number(price) || 0)), req.user.id, project_id]
    );
    res.status(201).json({ asset: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list module', details: err.message });
  }
});

// POST /api/biz/assets/:id/buy
app.post('/api/biz/assets/:id/buy', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM licensed_assets WHERE id = $1', [req.params.id]);
    const asset = rows[0];
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Adaptive pricing (Workstream G): resonance discounts the adoption price.
    const pct = adaptiveDiscount(await resonanceScore(req.user.id));
    const effectivePrice = Math.round((asset.price || 0) * (1 - pct) * 100) / 100;

    // Free asset or simulated mode: grant + adopt immediately.
    if (!stripe || effectivePrice <= 0) {
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, status, description, project_id) VALUES ($1, $2, $3, $4, $5, NULL)',
        [req.user.id, 'template_sale', effectivePrice, 'paid', `Purchased licensed asset: ${asset.title}${stripe ? '' : ' (simulated)'}`]
      );
      const clone = await fulfillMemeLicense(req.user.id, asset, effectivePrice);
      return res.json({ success: true, asset, cloned_project_id: clone?.id || null, discount_pct: Math.round(pct * 100) });
    }

    const customer = await getOrCreateCustomer(req.user.id);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(effectivePrice * 100),
          product_data: { name: asset.title, metadata: { asset_slug: asset.slug } },
        },
      }],
      client_reference_id: String(req.user.id),
      metadata: { user_id: String(req.user.id), kind: 'meme_license', asset_id: String(asset.id), asset_slug: asset.slug },
      success_url: `${FRONTEND_URL}/marketplace?checkout=success`,
      cancel_url: `${FRONTEND_URL}/marketplace?checkout=cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to buy asset', details: err.message });
  }
});

// POST /api/biz/subscribe — start a recurring subscription. With Stripe configured
// this returns a Checkout URL; the plan is only applied once the webhook confirms
// payment. Without Stripe it falls back to the simulated instant upgrade.
app.post('/api/biz/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_PRICE_LOOKUP[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected', allowed: Object.keys(PLAN_PRICE_LOOKUP) });
    }

    // Adaptive pricing (Workstream G): resonance earns a personalized discount.
    const pct = adaptiveDiscount(await resonanceScore(req.user.id));

    // Simulated mode (no Stripe keys): keep dev working.
    if (!stripe) {
      const amount = Math.round((PLAN_FALLBACK_AMOUNT[plan] || 0) * (1 - pct) * 100) / 100;
      await pool.query('UPDATE users SET plan = $1 WHERE id = $2', [plan, req.user.id]);
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, status, description, plan) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, 'subscription', amount, 'paid', `Subscribed to ${plan} (simulated)`, plan]
      );
      await recordInfluence(req.user.id, 'observer_fee', { target: plan, metadata: { amount, simulated: true } });
      await contributeToFund(amount * ADAPTIVE_FUND_RATE, 'subscription');
      return res.json({ success: true, plan, simulated: true, discount_pct: Math.round(pct * 100), amount });
    }

    const priceId = await resolvePriceId(PLAN_PRICE_LOOKUP[plan]);
    if (!priceId) {
      return res.status(500).json({ error: `No active Stripe Price with lookup_key "${PLAN_PRICE_LOOKUP[plan]}"` });
    }
    const customer = await getOrCreateCustomer(req.user.id);
    const sessionParams = {
      mode: 'subscription',
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: String(req.user.id),
      metadata: { user_id: String(req.user.id), plan },
      subscription_data: { metadata: { user_id: String(req.user.id), plan } },
      success_url: `${FRONTEND_URL}/influence?checkout=success`,
      cancel_url: `${FRONTEND_URL}/influence?checkout=cancel`,
    };
    if (pct > 0) {
      const coupon = await stripe.coupons.create({ percent_off: Math.round(pct * 100), duration: 'once', name: `Resonance ${Math.round(pct * 100)}%` });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start subscription', details: err.message });
  }
});

// POST /api/biz/portal — open the Stripe billing portal (manage / cancel / invoices).
app.post('/api/biz/portal', authMiddleware, async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Billing portal unavailable (Stripe not configured)' });
    const customer = await getOrCreateCustomer(req.user.id);
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${FRONTEND_URL}/influence`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to open billing portal', details: err.message });
  }
});

// POST /api/biz/deploy-slots — buy N extra deployable-project slots ($5/mo each,
// adjustable later in the billing portal). Fulfilled by the webhook.
app.post('/api/biz/deploy-slots', authMiddleware, async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Deploy slots require Stripe to be configured' });
    const qty = Math.max(1, Math.min(parseInt(req.body?.quantity, 10) || 1, 100));
    const priceId = await resolvePriceId(DEPLOY_SLOT_PRICE_LOOKUP);
    if (!priceId) return res.status(500).json({ error: `No active Stripe Price with lookup_key "${DEPLOY_SLOT_PRICE_LOOKUP}"` });
    const customer = await getOrCreateCustomer(req.user.id);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: priceId, quantity: qty, adjustable_quantity: { enabled: true, minimum: 1, maximum: 100 } }],
      client_reference_id: String(req.user.id),
      metadata: { user_id: String(req.user.id), kind: 'deploy_slots' },
      subscription_data: { metadata: { user_id: String(req.user.id), kind: 'deploy_slots' } },
      success_url: `${FRONTEND_URL}/dashboard?checkout=slots_success`,
      cancel_url: `${FRONTEND_URL}/dashboard?checkout=cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start deploy-slot purchase', details: err.message });
  }
});

// GET /api/biz/commitments
// ── Challenges (admin-issued; replaces user commitment vaults) ───────────────

const CHALLENGE_GOALS = ['publish_count', 'project_count', 'generation_count'];
const CHALLENGE_REWARDS = ['tokens', 'credit', 'cash'];

// A user's current cumulative value for a goal metric (progress = current − baseline).
async function measureMetric(userId, goalType) {
  if (goalType === 'publish_count') {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM projects WHERE user_id = $1 AND is_published = true', [userId]);
    return rows[0].n;
  }
  if (goalType === 'project_count') {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM projects WHERE user_id = $1', [userId]);
    return rows[0].n;
  }
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM token_usage WHERE user_id = $1 AND action = 'blueprint_generate'", [userId]
  );
  return rows[0].n;
}

// Grant a winner's reward. tokens → monthly bonus grant; credit → account balance;
// cash → a pending payout for an admin to process. Best-effort influence event.
async function grantChallengeReward(userId, challenge) {
  const v = Number(challenge.reward_value) || 0;
  if (challenge.reward_type === 'tokens') {
    await pool.query('INSERT INTO token_grants (user_id, amount, reason) VALUES ($1, $2, $3)', [userId, Math.round(v), `Challenge: ${challenge.title}`]);
  } else if (challenge.reward_type === 'credit') {
    await pool.query('UPDATE users SET account_credit = COALESCE(account_credit, 0) + $1 WHERE id = $2', [v, userId]);
    await pool.query('INSERT INTO transactions (user_id, type, amount, status, description) VALUES ($1, $2, $3, $4, $5)', [userId, 'expense', v, 'paid', `Challenge credit: ${challenge.title}`]);
  } else if (challenge.reward_type === 'cash') {
    await pool.query('INSERT INTO transactions (user_id, type, amount, status, description) VALUES ($1, $2, $3, $4, $5)', [userId, 'payout', v, 'pending', `Challenge cash prize: ${challenge.title}`]);
  }
  await recordInfluence(userId, 'challenge_win', { target: String(challenge.id), metadata: { reward_type: challenge.reward_type, reward_value: v } });
}

// Recompute a participant's progress; transition to rewarded/expired and grant the
// reward when the goal is met within the window. Idempotent via the status guard.
async function evaluateParticipation(part, challenge) {
  if (part.status !== 'joined') return part;
  const ended = challenge.ends_at && new Date(challenge.ends_at).getTime() < Date.now();
  const current = await measureMetric(part.user_id, challenge.goal_type);
  const progress = Math.max(0, current - (part.baseline || 0));

  if (progress >= challenge.goal_target && !ended) {
    const upd = await pool.query(
      "UPDATE challenge_participants SET progress = $1, status = 'rewarded', completed_at = NOW(), rewarded_at = NOW() WHERE id = $2 AND status = 'joined'",
      [progress, part.id]
    );
    if (upd.rowCount === 1) await grantChallengeReward(part.user_id, challenge); // only the winning race grants
    return { ...part, progress, status: 'rewarded' };
  }
  if (ended) {
    await pool.query("UPDATE challenge_participants SET progress = $1, status = 'expired' WHERE id = $2 AND status = 'joined'", [progress, part.id]);
    return { ...part, progress, status: 'expired' };
  }
  await pool.query('UPDATE challenge_participants SET progress = $1 WHERE id = $2', [progress, part.id]);
  return { ...part, progress };
}

// GET /api/challenges — active challenges + the caller's live participation/progress.
app.get('/api/challenges', authMiddleware, async (req, res) => {
  try {
    const { rows: challenges } = await pool.query(
      `SELECT * FROM challenges
        WHERE status = 'active'
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at IS NULL OR ends_at >= now())
        ORDER BY created_at DESC`
    );
    const out = [];
    for (const ch of challenges) {
      const { rows: pr } = await pool.query('SELECT * FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2', [ch.id, req.user.id]);
      let participation = pr[0] || null;
      if (participation) participation = await evaluateParticipation(participation, ch);
      out.push({ ...ch, participation });
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load challenges', details: err.message });
  }
});

// POST /api/challenges/:id/join — opt in; snapshots the baseline metric.
app.post('/api/challenges/:id/join', authMiddleware, async (req, res) => {
  try {
    const { rows: chs } = await pool.query("SELECT * FROM challenges WHERE id = $1 AND status = 'active'", [req.params.id]);
    const ch = chs[0];
    if (!ch) return res.status(404).json({ error: 'Challenge not found or not active' });
    if (ch.ends_at && new Date(ch.ends_at).getTime() < Date.now()) return res.status(400).json({ error: 'Challenge has ended' });
    const baseline = await measureMetric(req.user.id, ch.goal_type);
    const { rows } = await pool.query(
      `INSERT INTO challenge_participants (challenge_id, user_id, baseline, progress)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (challenge_id, user_id) DO NOTHING
       RETURNING *`,
      [req.params.id, req.user.id, baseline]
    );
    res.status(201).json({ success: true, participation: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join challenge', details: err.message });
  }
});

// POST /api/admin/challenges — create a challenge (admin).
app.post('/api/admin/challenges', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, goal_type, goal_target, reward_type, reward_value, ends_at } = req.body || {};
    if (!title || !CHALLENGE_GOALS.includes(goal_type) || !CHALLENGE_REWARDS.includes(reward_type)) {
      return res.status(400).json({ error: 'title, a valid goal_type and reward_type are required', goals: CHALLENGE_GOALS, rewards: CHALLENGE_REWARDS });
    }
    const { rows } = await pool.query(
      `INSERT INTO challenges (title, description, goal_type, goal_target, reward_type, reward_value, ends_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description || null, goal_type, Math.max(1, parseInt(goal_target, 10) || 1), reward_type, Number(reward_value) || 0, ends_at || null, req.user.id]
    );
    res.status(201).json({ challenge: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create challenge', details: err.message });
  }
});

// GET /api/admin/challenges — all challenges with participant/winner counts.
app.get('/api/admin/challenges', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*)::int FROM challenge_participants p WHERE p.challenge_id = c.id) AS participants,
        (SELECT COUNT(*)::int FROM challenge_participants p WHERE p.challenge_id = c.id AND p.status = 'rewarded') AS winners
       FROM challenges c ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load challenges', details: err.message });
  }
});

// DELETE /api/admin/challenges/:id
app.delete('/api/admin/challenges/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM challenges WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete challenge', details: err.message });
  }
});

// POST /api/biz/influence — record a user-initiated influence event (feature vote,
// engagement, referral). Money-bearing events are emitted server-side by their own
// routes and cannot be set here.
app.post('/api/biz/influence', authMiddleware, async (req, res) => {
  try {
    const { event_type, target, metadata } = req.body || {};
    if (!USER_INFLUENCE_TYPES.has(event_type)) {
      return res.status(400).json({ error: 'Invalid influence event type' });
    }
    await recordInfluence(req.user.id, event_type, { target: target || null, metadata: metadata || {} });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record influence', details: err.message });
  }
});

// GET /api/biz/resonance — the user's live resonance score: a 30-day half-life
// weighted aggregate of their influence events. Higher resonance = stronger pull on
// feature voting, experiments, and adaptive pricing (downstream workstreams).
app.get('/api/biz/resonance', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(weight * power(0.5, EXTRACT(EPOCH FROM (now() - created_at)) / (86400 * 30))), 0)::numeric(12,2) AS score,
         COUNT(*)::int AS events,
         COALESCE(SUM(weight), 0)::numeric(12,2) AS lifetime_weight,
         MAX(created_at) AS last_event_at
       FROM influence_events WHERE user_id = $1`,
      [req.user.id]
    );
    const { rows: breakdown } = await pool.query(
      `SELECT event_type, COUNT(*)::int AS count, COALESCE(SUM(weight), 0)::numeric(12,2) AS weight
       FROM influence_events WHERE user_id = $1 GROUP BY event_type ORDER BY weight DESC`,
      [req.user.id]
    );
    res.json({ ...rows[0], breakdown });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load resonance', details: err.message });
  }
});

// GET /api/biz/adaptive-price — the caller's resonance-based discount + adjusted prices.
app.get('/api/biz/adaptive-price', authMiddleware, async (req, res) => {
  try {
    const score = await resonanceScore(req.user.id);
    const pct = adaptiveDiscount(score);
    const apply = (p) => Math.round(p * (1 - pct) * 100) / 100;
    res.json({
      resonance: Math.round(score * 100) / 100,
      discount_pct: Math.round(pct * 100),
      plans: { influence: { base: 19, price: apply(19) }, pro: { base: 49, price: apply(49) } },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/biz/insights — adaptive insights (the partner/data product). Partners + admins.
app.get('/api/biz/insights', authMiddleware, async (req, res) => {
  try {
    const { rows: u } = await pool.query('SELECT role, is_partner FROM users WHERE id = $1', [req.user.id]);
    if (!(u[0]?.role === 'admin' || u[0]?.is_partner)) return res.status(403).json({ error: 'partner_required' });
    const [evt, modules, fund] = await Promise.all([
      pool.query("SELECT event_type, COUNT(*)::int AS count, COALESCE(SUM(weight),0)::numeric(12,2) AS weight FROM influence_events GROUP BY event_type ORDER BY weight DESC"),
      pool.query("SELECT title, COALESCE(adoption_count,0) AS adoption_count FROM licensed_assets ORDER BY adoption_count DESC LIMIT 5"),
      adaptiveFundBalance(),
    ]);
    res.json({ events_by_type: evt.rows, top_modules: modules.rows, fund_balance: fund });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/admin/adaptive-fund — balance + recent ledger (admin).
app.get('/api/admin/adaptive-fund', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const balance = await adaptiveFundBalance();
    const { rows } = await pool.query('SELECT direction, amount, user_id, reason, created_at FROM adaptive_fund ORDER BY id DESC LIMIT 20');
    res.json({ balance, entries: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/admin/adaptive-fund/reallocate — reinvest the balance into the highest-
// resonance users (partners weighted 1.5×) as account credit. "Natural selection."
app.post('/api/admin/adaptive-fund/reallocate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const balance = await adaptiveFundBalance();
    if (balance <= 0) return res.json({ success: true, distributed: 0, recipients: [] });
    const N = Math.max(1, Math.min(parseInt(req.body?.top, 10) || 5, 50));
    const { rows: top } = await pool.query(
      `SELECT e.user_id, u.is_partner,
              SUM(e.weight * power(0.5, EXTRACT(EPOCH FROM (now() - e.created_at)) / (86400 * 30))) AS score
         FROM influence_events e JOIN users u ON u.id = e.user_id
        GROUP BY e.user_id, u.is_partner ORDER BY score DESC LIMIT $1`,
      [N]
    );
    const weighted = top.map(r => ({ user_id: r.user_id, w: Number(r.score) * (r.is_partner ? 1.5 : 1) }));
    const sum = weighted.reduce((s, r) => s + r.w, 0);
    if (sum <= 0) return res.json({ success: true, distributed: 0, recipients: [] });
    const recipients = [];
    for (const r of weighted) {
      const amt = Math.round(balance * (r.w / sum) * 100) / 100;
      if (amt <= 0) continue;
      await pool.query('UPDATE users SET account_credit = COALESCE(account_credit,0) + $1 WHERE id = $2', [amt, r.user_id]);
      await pool.query("INSERT INTO adaptive_fund (direction, amount, user_id, reason) VALUES ('out', $1, $2, 'reallocation')", [amt, r.user_id]);
      await pool.query("INSERT INTO transactions (user_id, type, amount, status, description) VALUES ($1, 'payout', $2, 'paid', 'Adaptive fund subsidy')", [r.user_id, amt]);
      await recordInfluence(r.user_id, 'engagement', { target: 'adaptive_fund', metadata: { subsidy: amt } });
      recipients.push({ user_id: r.user_id, amount: amt });
    }
    res.json({ success: true, distributed: recipients.reduce((s, x) => s + x.amount, 0), recipients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reallocate', details: err.message });
  }
});

// ── Custom domain verification ───────────────────────────────────────────────

const APEX_TARGET = process.env.CAPABLE_APEX || 'capable.app';

// POST /api/projects/:id/domain/instructions — return DNS instructions and issue token
app.post('/api/projects/:id/domain/instructions', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT custom_domain, domain_verification_token, domain_verified FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = rows[0];
    if (!project.custom_domain) return res.status(400).json({ error: 'No custom domain set on this project' });

    const { rows: u } = await pool.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
    if (customDomainLimit(u[0]?.plan) <= 0) {
      return res.status(403).json({ error: 'upgrade_required', message: 'Custom domains are available on paid plans.' });
    }

    let token = project.domain_verification_token;
    if (!token) {
      token = 'cpbl-' + crypto.randomBytes(16).toString('hex');
      await pool.query('UPDATE projects SET domain_verification_token = $1 WHERE id = $2', [token, req.params.id]);
    }

    res.json({
      domain: project.custom_domain,
      verified: !!project.domain_verified,
      verification: {
        type: 'TXT',
        host: `_capable.${project.custom_domain}`,
        value: `capable-verify=${token}`,
      },
      pointing: {
        type: 'CNAME',
        host: project.custom_domain,
        value: APEX_TARGET,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects/:id/domain/check — perform DNS TXT lookup to verify ownership
app.post('/api/projects/:id/domain/check', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT custom_domain, domain_verification_token FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const { custom_domain, domain_verification_token } = rows[0];
    if (!custom_domain || !domain_verification_token) {
      return res.status(400).json({ error: 'Run /domain/instructions first to issue a token' });
    }

    let verified = false;
    let error = null;
    try {
      const records = await dns.resolveTxt(`_capable.${custom_domain}`);
      const flat = records.flat();
      verified = flat.some(v => v.replace(/\s+/g, '').includes(`capable-verify=${domain_verification_token}`));
      if (!verified) error = 'TXT record found but token does not match. Double-check the value.';
    } catch (err) {
      error = err.code === 'ENODATA' || err.code === 'ENOTFOUND'
        ? 'TXT record not found. DNS may still be propagating (can take up to an hour).'
        : `DNS lookup failed: ${err.message}`;
    }

    await pool.query('UPDATE projects SET domain_verified = $1 WHERE id = $2', [verified, req.params.id]);
    res.json({ verified, domain: custom_domain, error });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// DELETE /api/projects/:id/domain — clear domain and verification
app.delete('/api/projects/:id/domain', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE projects SET custom_domain = NULL, domain_verification_token = NULL, domain_verified = false WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects/:id/clone — deep copy (spec §4.2). Copies the blueprint
// when present, with a fresh unique slug so the clone is its own live site.
app.post('/api/projects/:id/clone', authMiddleware, async (req, res) => {
  try {
    const { rows: sourceRows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND (user_id = $2 OR is_public = true)', [req.params.id, req.user.id]);
    if (!sourceRows[0]) return res.status(404).json({ error: 'Project not found' });

    const clone = await cloneProjectForUser(req.params.id, req.user.id, req.user.name);
    if (!clone) return res.status(404).json({ error: 'Project not found' });
    res.status(201).json(clone);
  } catch (err) {
    res.status(500).json({ error: 'Failed to clone', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// FILES ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/projects/:id/files
app.get('/api/projects/:id/files', authMiddleware, async (req, res) => {
  try {
    const { rows: pRows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (pRows.length === 0) return res.status(404).json({ error: 'Project not found' });
    
    const { rows: files } = await pool.query('SELECT * FROM project_files WHERE project_id = $1 ORDER BY filename', [req.params.id]);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects/:id/files
app.post('/api/projects/:id/files', authMiddleware, async (req, res) => {
  try {
    const { filename, content = '', file_type = 'html' } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename required' });
    
    const { rows: pRows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (pRows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const { rows } = await pool.query(
      `INSERT INTO project_files (project_id, filename, content, file_type) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (project_id, filename) 
       DO UPDATE SET content = EXCLUDED.content, file_type = EXCLUDED.file_type 
       RETURNING id`,
      [req.params.id, filename, content, file_type]
    );

    res.status(201).json({ id: rows[0].id, project_id: req.params.id, filename, content, file_type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create file', details: err.message });
  }
});

// PUT /api/projects/:projectId/files/:fileId
app.put('/api/projects/:projectId/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { content, filename } = req.body;
    const { rows: pRows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.projectId, req.user.id]);
    if (pRows.length === 0) return res.status(404).json({ error: 'Not found' });

    await pool.query(
      'UPDATE project_files SET content = COALESCE($1, content), filename = COALESCE($2, filename) WHERE id = $3 AND project_id = $4',
      [content ?? null, filename ?? null, req.params.fileId, req.params.projectId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// DELETE /api/projects/:projectId/files/:fileId
app.delete('/api/projects/:projectId/files/:fileId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM project_files WHERE id = $1 AND project_id = $2', [req.params.fileId, req.params.projectId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLUEPRINT ROUTES (Capable v2.0 — spec §4)
// ══════════════════════════════════════════════════════════════════════════════

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function uniqueSlug(base) {
  const root = slugify(base) || 'site';
  for (let i = 0; i < 6; i++) {
    const suffix = i === 0 ? '' : `-${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${root}${suffix}`;
    const { rows } = await pool.query('SELECT 1 FROM projects WHERE published_slug = $1 LIMIT 1', [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// POST /api/blueprint/generate — generate a Blueprint and persist as a project
app.post('/api/blueprint/generate', authMiddleware, async (req, res) => {
  const { prompt, language = 'ar', project_id } = req.body || {};
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt is required' });
  if (prompt.length > 500) return res.status(400).json({ error: 'prompt too long (max 500 chars)' });

  try {
    const { rows: userRows } = await pool.query('SELECT plan, tokens_used, tokens_limit FROM users WHERE id = $1', [req.user.id]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Tier rate limiting (spec §6)
    const quota = await getUsage(pool, req.user.id, user.plan);
    if (quota.generations_limit != null && quota.generations_today >= quota.generations_limit) {
      res.set('Retry-After', String(secondsUntilMidnight()));
      return res.status(429).json({
        error: 'Daily generation limit reached',
        reason: 'generations',
        ...quota,
        upgrade_required: user.plan === 'free',
      });
    }
    if (!project_id && quota.projects_limit != null && quota.projects_count >= quota.projects_limit) {
      return res.status(429).json({
        error: 'Project limit reached',
        reason: 'projects',
        ...quota,
        upgrade_required: user.plan === 'free',
      });
    }

    // Deploy-slot guard — this route also publishes, so a new deploy consumes a slot.
    {
      const { rows: u } = await pool.query('SELECT plan, extra_deploy_slots FROM users WHERE id = $1', [req.user.id]);
      const limit = effectiveDeployLimit(u[0].plan, u[0].extra_deploy_slots);
      if (Number.isFinite(limit)) {
        const alreadyPublished = project_id
          ? (await pool.query('SELECT is_published FROM projects WHERE id = $1 AND user_id = $2', [project_id, req.user.id])).rows[0]?.is_published
          : false;
        if (!alreadyPublished) {
          const { rows: c } = await pool.query('SELECT COUNT(*)::int AS n FROM projects WHERE user_id = $1 AND is_published = true', [req.user.id]);
          if (c[0].n >= limit) {
            return res.status(402).json({ error: 'deploy_limit_reached', deploys_count: c[0].n, deploys_limit: limit, plan: u[0].plan });
          }
        }
      }
    }

    let blueprint, usage;
    try {
      const out = await generateBlueprint({ prompt, language });
      blueprint = out.blueprint;
      usage = out.usage;
    } catch (err) {
      if (err instanceof GenerationError) {
        return res.status(422).json({ error: 'Blueprint validation failed after retries', details: err.details });
      }
      throw err;
    }

    const projectName = blueprint.project_name;
    // Prefer the English name for the slug so Arabic sites get clean Latin URLs.
    const slugSeed = blueprint.project_name_en || blueprint.project_name;
    let projectIdOut = project_id;
    let slug;

    if (project_id) {
      const { rows } = await pool.query('SELECT id, published_slug FROM projects WHERE id = $1 AND user_id = $2', [project_id, req.user.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
      slug = rows[0].published_slug || await uniqueSlug(slugSeed);
      await pool.query(
        `UPDATE projects SET name = $1, blueprint = $2, published_slug = $3,
         is_published = true, is_public = true, last_edited = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [projectName, blueprint, slug, project_id]
      );
    } else {
      slug = await uniqueSlug(slugSeed);
      const { rows } = await pool.query(
        `INSERT INTO projects (user_id, name, blueprint, published_slug, author, is_public, is_published, last_edited, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW()) RETURNING id`,
        [req.user.id, projectName, blueprint, slug, req.user.name]
      );
      projectIdOut = rows[0].id;
    }

    const total = (usage?.tokens_in || 0) + (usage?.tokens_out || 0);
    await pool.query('UPDATE users SET tokens_used = tokens_used + $1 WHERE id = $2', [total, req.user.id]);
    await pool.query(
      'INSERT INTO token_usage (user_id, project_id, tokens_in, tokens_out, model, action) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, projectIdOut, usage?.tokens_in || 0, usage?.tokens_out || 0, usage?.model || 'unknown', 'blueprint_generate']
    );

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'capable.app';
    res.json({
      project_id: projectIdOut,
      slug,
      url: `https://${slug}.${appDomain}`,
      blueprint,
      provider: usage?.model,
      attempts: usage?.attempts,
    });
  } catch (err) {
    console.error('Blueprint generation error:', err);
    res.status(500).json({ error: 'Generation failed', details: err.message });
  }
});

// PATCH /api/blueprint/:id — replace a project's blueprint (re-validated)
app.patch('/api/blueprint/:id', authMiddleware, async (req, res) => {
  try {
    const { blueprint } = req.body || {};
    if (!blueprint) return res.status(400).json({ error: 'blueprint is required' });

    const parsed = BlueprintSchema.safeParse(blueprint);
    if (!parsed.success) {
      return res.status(422).json({ error: 'Invalid blueprint', issues: parsed.error.issues });
    }

    const { rows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    await pool.query(
      'UPDATE projects SET blueprint = $1, name = $2, last_edited = NOW(), updated_at = NOW() WHERE id = $3',
      [parsed.data, parsed.data.project_name, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/render/:slug — public endpoint consumed by the Next.js renderer (SSR/ISR)
app.get('/api/render/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, blueprint, og_image_url, custom_domain, domain_status, updated_at
         FROM projects WHERE published_slug = $1 AND is_published = true AND blueprint IS NOT NULL LIMIT 1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/blueprint/quota — current tier usage for the dashboard
app.get('/api/blueprint/quota', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT plan, extra_deploy_slots FROM users WHERE id = $1', [req.user.id]);
    res.json(await getUsage(pool, req.user.id, rows[0]?.plan, rows[0]?.extra_deploy_slots));
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/blueprint/health — quick sanity check for the AI provider config
app.get('/api/blueprint/health', (req, res) => {
  res.json({
    provider: activeProviderName(),
    groq_keyed: !!process.env.GROQ_API_KEY,
    gemini_keyed: !!process.env.GEMINI_API_KEY,
    // Booleans only — never the secret values. Lets us confirm the backend
    // actually sees the Stripe env vars after a Railway redeploy.
    stripe_configured: !!stripe,
    stripe_webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY GENERATE ROUTE (HTML output — kept for existing editor)
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/generate', authMiddleware, async (req, res) => {
  const { prompt, history, project_id } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  // Tier selection (capable1/2/3) — same engine as the Builder, multi-file output.
  const tier = BUILDER_TIERS[req.body.tier] ? req.body.tier : DEFAULT_TIER;
  const tierCfg = BUILDER_TIERS[tier];
  const reviewEnabled = process.env.BUILDER_REVIEW !== 'off';
  const anthropic = getAnthropic();
  if (!anthropic && (reviewEnabled || tierCfg.generator.provider === 'anthropic')) {
    return res.status(503).json({ error: 'ai_unavailable', details: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  try {
    const { rows: userRows } = await pool.query('SELECT tokens_used, tokens_limit, plan FROM users WHERE id = $1', [req.user.id]);
    const user = userRows[0];

    let monthlyBudget = monthlyTokenBudget(user.plan);
    if (Number.isFinite(monthlyBudget)) monthlyBudget += await getMonthlyTokenGrants(pool, req.user.id); // challenge-win bonus
    const monthlyUsed = Number.isFinite(monthlyBudget) ? await getMonthlyTokens(pool, req.user.id) : 0;
    if (Number.isFinite(monthlyBudget) && monthlyUsed >= monthlyBudget) {
      return res.status(429).json({
        error: 'Token limit reached',
        reason: 'monthly_tokens',
        monthly_tokens_used: monthlyUsed,
        monthly_tokens_limit: monthlyBudget,
        plan: user.plan,
        upgrade_required: true,
      });
    }

    // Per-tier budget gate — pricier tiers run out sooner (downgrade or upgrade).
    const tierLimit = TIER_LIMITS[tier];
    if (tierLimit) {
      const { rows: tu } = await pool.query(
        `SELECT COALESCE(SUM(tokens_in + tokens_out), 0)::bigint AS used
           FROM token_usage WHERE user_id = $1 AND action LIKE $2`,
        [req.user.id, `%:${tier}`]
      );
      if (Number(tu[0].used) >= tierLimit) {
        return res.status(402).json({
          error: 'tier_limit_reached',
          tier, tier_used: Number(tu[0].used), tier_limit: tierLimit,
          can_downgrade: tier !== DEFAULT_TIER, upgrade_required: true,
        });
      }
    }

    const usageLog = [];
    const logStep = (model, action, usage) => usageLog.push({ model, action, ...usage });

    // Editing an existing project — load its current files so the generator
    // MODIFIES the site instead of inventing a new one. Without this, a request
    // like "pin the top nav" arrives with no context and the model builds a
    // brand-new site from scratch. Ownership-scoped to the requesting user.
    let existingFiles = [];
    let editContext = [];
    if (project_id) {
      const { rows } = await pool.query(
        `SELECT pf.filename, pf.content
           FROM project_files pf
           JOIN projects p ON p.id = pf.project_id
          WHERE pf.project_id = $1 AND p.user_id = $2
          ORDER BY pf.filename`,
        [project_id, req.user.id]
      );
      existingFiles = rows;
      if (existingFiles.length) {
        editContext = [{
          prompt: 'This is the current project I am editing. Apply the change in my next message to THIS project, then return ONLY the files you actually change or add (each with full content) as {"files":[...]}. Do NOT return files you did not touch. Preserve everything else exactly; do not create a new site or change the business/content unless explicitly asked.',
          code: JSON.stringify({ files: existingFiles }),
        }];
      }
    }
    // Current project state first, then this session's edit history.
    const effectiveHistory = [...editContext, ...(history || [])];

    // Merge surgical edits over the existing project so untouched files survive
    // byte-for-byte (no drift/regression) while only changed files are re-emitted.
    const mergeFiles = (base, changes) => {
      const map = new Map(base.map(f => [f.filename, { filename: f.filename, content: f.content }]));
      for (const cf of changes) {
        if (cf && cf.filename && typeof cf.content === 'string') map.set(cf.filename, { filename: cf.filename, content: cf.content });
      }
      return [...map.values()];
    };

    // Editor edits run on the open-weight generator (cheap, surgical). Building a
    // site from scratch (no existing files) upgrades to Gemini for quality.
    const generator = existingFiles.length ? tierCfg.generator : initialGenerator(tierCfg.generator);

    // Step 1 — the generator writes ONLY the changed/new files; we merge them over
    // the current project. For a brand-new project there is nothing to merge, so
    // the generator's output is the whole site.
    let { files: changedFiles, usage: genUsage } = await generateFiles(anthropic, generator, effectiveHistory, prompt);
    logStep(generator.model, `generate:${tier}`, genUsage);
    if (!changedFiles.length) {
      return res.status(502).json({ error: 'Failed to generate', details: 'The generator response could not be parsed. Please try again.' });
    }
    let files = existingFiles.length ? mergeFiles(existingFiles, changedFiles) : changedFiles;

    // Step 2 — review the combined files; Step 3 — revise once if rejected.
    let reviewIssues = null, wasRevised = false;
    if (reviewEnabled) {
      const combined = files.map(f => `=== ${f.filename} ===\n${f.content}`).join('\n\n');
      const { verdict, usage: reviewUsage } = await reviewSite(anthropic, tierCfg.reviewer.model, prompt, combined);
      logStep(tierCfg.reviewer.model, `review:${tier}`, reviewUsage);
      if (verdict && verdict.approved === false && verdict.issues) {
        reviewIssues = verdict.issues;
        const reviseExtra = `A senior reviewer found these issues with the current project. Return ONLY the files you need to change to fix them (each with full content) as {"files":[...]}, fixing ONLY these issues and leaving every other file untouched:\n${verdict.issues}`;
        const priorHistory = [...effectiveHistory, { prompt, code: JSON.stringify({ files }) }];
        const revised = await generateFiles(anthropic, generator, priorHistory, prompt, reviseExtra);
        logStep(generator.model, `revise:${tier}`, revised.usage);
        if (revised.files.length) { files = mergeFiles(files, revised.files); wasRevised = true; }
      }
    }

    // Preview fallback — the main HTML, wrapped if it's a bare fragment.
    const mainHtml = files.find(f => f.filename === 'index.html' || f.filename.endsWith('.html'));
    let fallbackCode = mainHtml ? mainHtml.content : '';
    if (!fallbackCode.toLowerCase().includes('<!doctype') && !fallbackCode.toLowerCase().includes('<html')) {
      fallbackCode = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white p-8">${fallbackCode}</body></html>`;
    }

    // Token accounting — one row per step so the cost summary stays per-model.
    const total = usageLog.reduce((s, e) => s + e.tokensIn + e.tokensOut, 0);
    await pool.query('UPDATE users SET tokens_used = tokens_used + $1 WHERE id = $2', [total, req.user.id]);
    for (const e of usageLog) {
      await pool.query(
        'INSERT INTO token_usage (user_id, project_id, tokens_in, tokens_out, model, action) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, project_id || null, e.tokensIn, e.tokensOut, e.model, e.action]
      );
    }

    // SLM dataset — best-effort, never blocks the response.
    pool.query(
      `INSERT INTO training_samples (user_id, project_id, tier, prompt, output_code, review_issues, revised)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, project_id || null, tier, prompt, files.map(f => `=== ${f.filename} ===\n${f.content}`).join('\n\n'), reviewIssues, wasRevised]
    ).catch((e) => console.error('training_samples insert failed:', e.message));

    const { rows: updatedUserRows } = await pool.query('SELECT tokens_used, tokens_limit FROM users WHERE id = $1', [req.user.id]);
    res.json({ code: fallbackCode, files, tier, tokens_used: updatedUserRows[0].tokens_used, tokens_limit: updatedUserRows[0].tokens_limit });
  } catch (err) {
    console.error('Generation error:', err);
    const status = err instanceof Anthropic.APIError && err.status ? 502 : 500;
    res.status(status).json({ error: 'Failed to generate', details: err.message });
  }
});

// ── Builder orchestration: a generator writes the code, a reviewer checks it. ────
// Generator + reviewer models are chosen by the request's tier (see BUILDER_TIERS).
// The reviewer's output is tiny (a verdict), so putting a strong model there is
// cheap relative to having it emit a full site.

// Parse the Builder's { message, code, title, type } JSON out of a raw model string.
function parseBuilderPayload(raw) {
  const text = (raw || '').trim();
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let parsed = tryParse(text.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim());
  if (!parsed) { const m = text.match(/\{[\s\S]*\}/); if (m) parsed = tryParse(m[0]); }
  return parsed && typeof parsed.code === 'string' ? parsed : null;
}

const asText = (content) => (typeof content === 'string' ? content : JSON.stringify(content));

// Gemini generates (or revises) the single-file site. `extra` appends a one-off
// instruction (e.g. reviewer fixes) to the latest user turn. Returns the parsed
// payload plus token usage.
async function geminiBuild(system, messages, extra) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: system });
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: asText(m.content) }],
  }));
  let prompt = asText(messages[messages.length - 1].content);
  if (extra) prompt += `\n\n${extra}`;
  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      responseMimeType: 'application/json',
    },
  });
  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  const u = response.usageMetadata || {};
  return {
    payload: parseBuilderPayload(response.text()),
    usage: { tokensIn: u.promptTokenCount || 0, tokensOut: u.candidatesTokenCount || 0 },
  };
}

// Claude (Sonnet/Opus) generates the site — used by tiers whose generator is
// anthropic. Same { message, code, title, type } contract as geminiBuild.
async function anthropicBuild(anthropic, system, messages, model, extra) {
  const msgs = messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: asText(m.content) }));
  if (extra && msgs.length) {
    const last = msgs[msgs.length - 1];
    msgs[msgs.length - 1] = { ...last, content: `${last.content}\n\n${extra}` };
  }
  const stream = anthropic.messages.stream({
    model,
    max_tokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
    output_config: { effort: 'medium' },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: msgs,
  });
  const response = await stream.finalMessage();
  const raw = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const u = response.usage || {};
  const tokensIn = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  return { payload: parseBuilderPayload(raw), usage: { tokensIn, tokensOut: u.output_tokens || 0 } };
}

// Call any OpenAI-compatible chat endpoint (DeepSeek, OpenRouter, Together, vLLM…).
// Returns the assistant text + token usage. Uses Node's global fetch.
async function openaiCompatChat({ model, system, messages, json }) {
  const res = await fetch(`${OSS_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OSS_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`OSS provider ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const u = data.usage || {};
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: { tokensIn: u.prompt_tokens || 0, tokensOut: u.completion_tokens || 0 },
  };
}

// Open-weight single-file generator (same { message, code, title, type } contract).
async function openaiBuild(model, system, messages, extra) {
  const msgs = messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: asText(m.content) }));
  if (extra && msgs.length) {
    const last = msgs[msgs.length - 1];
    msgs[msgs.length - 1] = { ...last, content: `${last.content}\n\n${extra}` };
  }
  const { text, usage } = await openaiCompatChat({ model, system, messages: msgs, json: true });
  return { payload: parseBuilderPayload(text), usage };
}

// Dispatch generation to the tier's generator provider.
function generateSite(anthropic, gen, system, messages, extra) {
  if (gen.provider === 'gemini') return geminiBuild(system, messages, extra);
  if (gen.provider === 'openai') return openaiBuild(gen.model, system, messages, extra);
  return anthropicBuild(anthropic, system, messages, gen.model, extra);
}

// The reviewer (Sonnet or Opus) checks the generated HTML against the user's
// request. Returns a verdict { approved, issues } plus token usage — output is
// tiny → cheap even on a strong model.
async function reviewSite(anthropic, model, userRequest, code) {
  const reviewSystem = `You are a senior front-end reviewer for single-file HTML sites. A junior dev (Gemini) wrote the code. Judge whether it correctly and completely fulfils the user's request.
Output ONLY a JSON object: {"approved": boolean, "issues": "string"}.
- approved=true and issues="" when the site is good enough to ship.
- approved=false with a SHORT, specific, actionable list of fixes otherwise.
Flag only real problems: broken/empty links and anchors, buttons or forms that do nothing, sections the user asked for that are missing, broken or non-responsive layout, Lorem Ipsum or placeholder content, missing RTL/Arabic when the content is Arabic, invalid HTML. Do NOT nitpick subjective styling. Keep "issues" under 120 words.`;
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 6000,
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: reviewSystem, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `USER REQUEST:\n${userRequest}\n\nGENERATED HTML:\n${code}` }],
  });
  const response = await stream.finalMessage();
  const raw = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const verdict = parseBuilderPayload(raw) ||
    (() => { try { return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || ''); } catch { return null; } })() ||
    { approved: true, issues: '' };
  const u = response.usage || {};
  const tokensIn = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  return { verdict, usage: { tokensIn, tokensOut: u.output_tokens || 0 } };
}

// Deterministic structural guard — catches obviously broken output instantly and
// for free, before spending a reviewer call. Deliberately conservative: only flags
// clear breakage so it never triggers needless (costly) escalation.
function validateSiteCode(code) {
  const c = (code || '').trim();
  const lc = c.toLowerCase();
  const issues = [];
  if (c.length < 400) issues.push('The page is too short to be a complete site.');
  if (!lc.includes('<!doctype') && !lc.includes('<html')) issues.push('Missing the HTML document structure.');
  if (!lc.includes('<body')) issues.push('Missing a <body> section.');
  if (lc.includes('lorem ipsum')) issues.push('Contains Lorem Ipsum placeholder text.');
  return { ok: issues.length === 0, issues: issues.join(' ') };
}

// A working, renderable fallback site seeded from the prompt — the last resort so a
// user (especially a first-time free user) is never left with a broken result.
function fallbackSite(userRequest) {
  const isArabic = /[؀-ۿ]/.test(userRequest || '');
  const safe = String(userRequest || 'Your idea')
    .replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch])).slice(0, 280);
  const dir = isArabic ? 'rtl' : 'ltr';
  const cta = isArabic ? 'ابدأ الآن' : 'Get started';
  const tag = isArabic ? 'مسودة بداية — حسّنها بنقرة واحدة' : 'Starter draft — refine it in one click';
  const body = isArabic
    ? 'هذه نقطة انطلاق جاهزة. اطلب التعديلات وسنبنيها معك خطوة بخطوة.'
    : 'This is a ready starting point. Ask for changes and we will build it out with you, step by step.';
  return `<!DOCTYPE html><html lang="${isArabic ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safe}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8"><main class="max-w-2xl text-center"><span class="inline-block rounded-full bg-indigo-500/15 text-indigo-300 text-sm px-4 py-1 mb-6">${tag}</span><h1 class="text-4xl font-bold mb-4">${safe}</h1><p class="text-slate-400 mb-8 leading-relaxed">${body}</p><a href="#" class="inline-block rounded-2xl bg-indigo-500 hover:bg-indigo-400 transition px-6 py-3 font-semibold text-white">${cta}</a></main></body></html>`;
}

// ── Multi-file generation (Editor /api/generate, tier-aware) ─────────────────────
const EDITOR_SYSTEM = `You are an expert web developer. Your ONLY job is to output a valid JSON object containing the files for a web project.
CRITICAL RULES:
- The output MUST be a valid JSON object with a "files" array.
- Each object in the "files" array MUST have "filename" (string) and "content" (string) properties.
- Example: { "files": [ { "filename": "index.html", "content": "<!DOCTYPE html>..." }, { "filename": "style.css", "content": "body { margin: 0; }" } ] }
- Generate multiple HTML files, CSS files, and JS files to fulfill the user's request, ensuring they are interconnected properly.
- All HTML files MUST be complete (include <!DOCTYPE html>, <html>, <head>, and <body>).
- Use Tailwind CSS via CDN in HTML files: <script src="https://cdn.tailwindcss.com"></script>
- Make the output visually stunning, modern, and professional.
- EDITING: When a prior message contains the current project's files, you are EDITING that existing project, NOT building a new one. Apply ONLY the requested change and return ONLY the files you actually modify or add — each with its FULL, complete content — as {"files":[...]}. Do NOT return files you did not touch. Never invent a new site or alter the content, structure, branding, or business domain that the user did not ask you to change. If the request only touches one file, return only that one file.
- DO NOT wrap the JSON in markdown fences, output ONLY raw JSON.`;

// Parse {files:[...]} from a raw model string, salvaging complete file objects
// from truncated output (brace-depth scan).
function parseFilesPayload(text) {
  const parsedFiles = [];
  try {
    const parsed = JSON.parse(text);
    if (parsed.files && Array.isArray(parsed.files)) return parsed.files;
  } catch {}
  const start = text.indexOf('"files"');
  if (start !== -1) {
    let i = text.indexOf('[', start);
    let depth = 0, inStr = false, esc = false, objStart = -1;
    while (i < text.length && i !== -1) {
      const c = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === '{') { if (depth === 0) objStart = i; depth++; }
        else if (c === '}') {
          depth--;
          if (depth === 0 && objStart !== -1) {
            try { const obj = JSON.parse(text.slice(objStart, i + 1)); if (obj.filename && typeof obj.content === 'string') parsedFiles.push(obj); } catch {}
            objStart = -1;
          }
        }
      }
      i++;
    }
  }
  return parsedFiles;
}

async function geminiBuildFiles(history, prompt, extra) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: EDITOR_SYSTEM });
  const chat = model.startChat({
    history: (history || []).flatMap((msg) => [
      { role: 'user', parts: [{ text: msg.prompt || '' }] },
      { role: 'model', parts: [{ text: msg.code || '' }] },
    ]),
    generationConfig: {
      maxOutputTokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      responseMimeType: 'application/json',
    },
  });
  const response = (await chat.sendMessage(extra ? `${prompt}\n\n${extra}` : prompt)).response;
  const u = response.usageMetadata || {};
  return { files: parseFilesPayload(response.text()), usage: { tokensIn: u.promptTokenCount || 0, tokensOut: u.candidatesTokenCount || 0 } };
}

async function anthropicBuildFiles(anthropic, model, history, prompt, extra) {
  const messages = [];
  (history || []).forEach((m) => {
    messages.push({ role: 'user', content: m.prompt || '(no prompt)' });
    messages.push({ role: 'assistant', content: m.code && m.code.trim() ? m.code : '(previous output)' });
  });
  messages.push({ role: 'user', content: extra ? `${prompt}\n\n${extra}` : prompt });
  const stream = anthropic.messages.stream({
    model,
    max_tokens: parseInt(process.env.BUILDER_MAX_OUTPUT_TOKENS || '32768'),
    output_config: { effort: 'medium' },
    system: [{ type: 'text', text: EDITOR_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages,
  });
  const response = await stream.finalMessage();
  const raw = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const u = response.usage || {};
  const tokensIn = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  return { files: parseFilesPayload(raw), usage: { tokensIn, tokensOut: u.output_tokens || 0 } };
}

// Open-weight multi-file generator ({files:[...]} contract).
async function openaiBuildFiles(model, history, prompt, extra) {
  const messages = [];
  (history || []).forEach((m) => {
    messages.push({ role: 'user', content: m.prompt || '(no prompt)' });
    messages.push({ role: 'assistant', content: m.code && m.code.trim() ? m.code : '(previous output)' });
  });
  messages.push({ role: 'user', content: extra ? `${prompt}\n\n${extra}` : prompt });
  const { text, usage } = await openaiCompatChat({ model, system: EDITOR_SYSTEM, messages, json: true });
  return { files: parseFilesPayload(text), usage };
}

// Dispatch multi-file generation to the tier's generator provider.
function generateFiles(anthropic, gen, history, prompt, extra) {
  if (gen.provider === 'gemini') return geminiBuildFiles(history, prompt, extra);
  if (gen.provider === 'openai') return openaiBuildFiles(gen.model, history, prompt, extra);
  return anthropicBuildFiles(anthropic, gen.model, history, prompt, extra);
}

// POST /api/ai/generate — Builder site generation. Gemini generates, Opus reviews,
// Gemini revises once if the review fails. Body: { system, messages, projectId? }.
// Returns the { message, code, title, type } payload plus token usage.
app.post('/api/ai/generate', authMiddleware, async (req, res) => {
  const { system, messages, projectId } = req.body;
  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'system and messages are required' });
  }

  // Resolve the requested tier (capable1/2/3). Unknown values fall back to default.
  // Mutable: a non-Pro user requesting a paid tier is auto-downgraded below.
  let tier = BUILDER_TIERS[req.body.tier] ? req.body.tier : DEFAULT_TIER;
  let tierCfg = BUILDER_TIERS[tier];
  const reviewEnabled = process.env.BUILDER_REVIEW !== 'off';
  const needsAnthropic = reviewEnabled || tierCfg.generator.provider === 'anthropic';

  const anthropic = getAnthropic();
  if (!anthropic && needsAnthropic) {
    return res.status(503).json({ error: 'ai_unavailable', details: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  try {
    // Credit gate — 402 lets the client prompt an upgrade (distinct from a 429 rate limit).
    const { rows: userRows } = await pool.query(
      'SELECT tokens_used, tokens_limit, plan FROM users WHERE id = $1', [req.user.id]
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Monthly compute ceiling (the real margin guardrail) — resets each calendar month.
    let monthlyBudget = monthlyTokenBudget(user.plan);
    if (Number.isFinite(monthlyBudget)) {
      monthlyBudget += await getMonthlyTokenGrants(pool, req.user.id); // challenge-win bonus tokens
      const monthlyUsed = await getMonthlyTokens(pool, req.user.id);
      if (monthlyUsed >= monthlyBudget) {
        return res.status(402).json({
          error: 'insufficient_credits',
          reason: 'monthly_tokens',
          monthly_tokens_used: monthlyUsed,
          monthly_tokens_limit: monthlyBudget,
          plan: user.plan,
          upgrade_required: true,
        });
      }
    }

    // Capable 2/3 are Pro-only. Non-Pro users are auto-downgraded (so a generation
    // never dead-ends) and nudged to upgrade via the upsell whisper below.
    let tierLocked = false;
    if ((tier === 'capable2' || tier === 'capable3') && !(user.plan === 'pro' || user.plan === 'enterprise')) {
      tier = DEFAULT_TIER;
      tierCfg = BUILDER_TIERS[tier];
      tierLocked = true;
    }

    // Per-tier budget gate — the pricier tiers run out sooner. 402 lets the client
    // offer "downgrade to a cheaper tier or upgrade your plan".
    const tierLimit = TIER_LIMITS[tier];
    if (tierLimit) {
      const { rows: tu } = await pool.query(
        `SELECT COALESCE(SUM(tokens_in + tokens_out), 0)::bigint AS used
           FROM token_usage WHERE user_id = $1 AND action LIKE $2`,
        [req.user.id, `%:${tier}`]
      );
      const tierUsed = Number(tu[0].used);
      if (tierUsed >= tierLimit) {
        return res.status(402).json({
          error: 'tier_limit_reached',
          tier, tier_used: tierUsed, tier_limit: tierLimit,
          can_downgrade: tier !== DEFAULT_TIER,
          upgrade_required: true,
        });
      }
    }

    // ── Reliability ladder (free-first) ──────────────────────────────────────
    // generate → deterministic guard → review → revise → re-check → escalate the
    // generator (Gemini → Sonnet → Opus) → and a working fallback as the last
    // resort, so a user is NEVER left with a broken result. Escalation only fires
    // on the failing minority; on the free funnel that spend is acquisition cost.
    const usageLog = []; // { tokensIn, tokensOut, model, action }
    const logStep = (model, action, usage) => usageLog.push({ model, action, ...usage });
    const userRequest = asText(messages[messages.length - 1].content);

    // Generator ladder: the tier's own generator first, then Sonnet, then Opus.
    // De-duped by model so we never retry the identical model; anthropic rungs are
    // skipped when no key is configured.
    const ladder = [];
    const seenModels = new Set();
    for (const gen of [initialGenerator(tierCfg.generator), { provider: 'anthropic', model: SONNET_MODEL }, { provider: 'anthropic', model: OPUS_MODEL }]) {
      if (gen.provider === 'anthropic' && !anthropic) continue;
      if (seenModels.has(gen.model)) continue;
      seenModels.add(gen.model);
      ladder.push(gen);
    }

    let parsed = null, reviewIssues = null, wasRevised = false;
    let escalated = false, finalModel = null, lastIssues = '';

    for (let rung = 0; rung < ladder.length; rung++) {
      const generator = ladder[rung];
      if (rung > 0) escalated = true;

      // Generate; carry the prior rung's problems forward as fix instructions.
      const extra = lastIssues
        ? `A previous attempt had these problems. Produce a COMPLETE single-file site in the exact JSON format that fixes them:\n${lastIssues}`
        : undefined;
      let attempt = await generateSite(anthropic, generator, system, messages, extra);
      logStep(generator.model, `generate:${tier}:rung${rung}`, attempt.usage);
      let code = attempt.payload?.code;

      // Deterministic guard (free, instant) — escalate on parse/structure failure.
      if (!attempt.payload || !code) { lastIssues = 'The output could not be parsed as a valid site.'; continue; }
      const struct = validateSiteCode(code);
      if (!struct.ok) { lastIssues = struct.issues; continue; }

      if (reviewEnabled) {
        const { verdict, usage: reviewUsage } = await reviewSite(anthropic, tierCfg.reviewer.model, userRequest, code);
        logStep(tierCfg.reviewer.model, `review:${tier}:rung${rung}`, reviewUsage);

        if (verdict && verdict.approved === false && verdict.issues) {
          reviewIssues = verdict.issues;
          // One in-place revise with the same generator, then re-check.
          const priorTurn = { role: 'assistant', content: JSON.stringify({ message: attempt.payload.message, code }) };
          const reviseExtra = `A senior reviewer found these issues. Return the COMPLETE corrected single-file site in the exact same JSON format, fixing ONLY these issues:\n${verdict.issues}`;
          const revised = await generateSite(anthropic, generator, system, [...messages, priorTurn], reviseExtra);
          logStep(generator.model, `revise:${tier}:rung${rung}`, revised.usage);

          if (revised.payload?.code && validateSiteCode(revised.payload.code).ok) {
            const recheck = await reviewSite(anthropic, tierCfg.reviewer.model, userRequest, revised.payload.code);
            logStep(tierCfg.reviewer.model, `recheck:${tier}:rung${rung}`, recheck.usage);
            wasRevised = true;
            if (!recheck.verdict || recheck.verdict.approved !== false) { parsed = revised.payload; finalModel = generator.model; break; }
            lastIssues = recheck.verdict.issues || verdict.issues;
            continue; // still failing → escalate to the next rung
          }
          lastIssues = verdict.issues;
          continue; // revise produced nothing usable → escalate
        }
      }

      // Approved (or review disabled) and structurally sound → success.
      parsed = attempt.payload; finalModel = generator.model; break;
    }

    // Last resort — never leave the user empty-handed.
    let fallbackUsed = false;
    if (!parsed) {
      fallbackUsed = true;
      finalModel = 'fallback';
      parsed = { message: 'We generated a starting draft you can refine.', code: fallbackSite(userRequest), title: 'Draft', type: 'site' };
    }

    // Soft upsell whisper: a reason code the client localizes (ar/en). Surfaces the
    // stronger engines only when relevant, without nagging.
    let upsell = null;
    if (tierLocked) upsell = 'tier_locked';
    else if (fallbackUsed) upsell = 'fallback';
    else if (escalated) upsell = 'escalated';
    else if (tier === DEFAULT_TIER) upsell = 'tip';

    // Token accounting — one row per step so the cost summary stays per-model.
    const total = usageLog.reduce((s, e) => s + e.tokensIn + e.tokensOut, 0);
    await pool.query('UPDATE users SET tokens_used = tokens_used + $1 WHERE id = $2', [total, req.user.id]);
    for (const e of usageLog) {
      await pool.query(
        'INSERT INTO token_usage (user_id, project_id, tokens_in, tokens_out, model, action) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, projectId || null, e.tokensIn, e.tokensOut, e.model, e.action]
      );
    }

    // SLM dataset — capture the prompt, the final code, and the reviewer's
    // corrections so a future in-house small model can learn from real
    // generations and their fixes. Best-effort; never blocks the response.
    pool.query(
      `INSERT INTO training_samples (user_id, project_id, tier, prompt, output_code, review_issues, revised)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, projectId || null, tier, userRequest, parsed.code, reviewIssues, wasRevised]
    ).catch((e) => console.error('training_samples insert failed:', e.message));

    // Persist generated code to the project, but only if the caller owns it.
    if (projectId && parsed.code) {
      await pool.query(
        `UPDATE projects SET code = $1, name = COALESCE($2, name), updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND user_id = $4`,
        [parsed.code, parsed.title || null, projectId, req.user.id]
      );
    }

    const { rows: updated } = await pool.query('SELECT tokens_used, tokens_limit FROM users WHERE id = $1', [req.user.id]);
    res.json({
      message: parsed.message,
      code: parsed.code,
      title: parsed.title,
      type: parsed.type,
      tier,
      escalated,
      fallback: fallbackUsed,
      final_model: finalModel,
      upsell,
      tokens_used: updated[0].tokens_used,
      tokens_limit: updated[0].tokens_limit,
    });
  } catch (err) {
    console.error('Claude generation error:', err);
    const status = err instanceof Anthropic.APIError && err.status ? 502 : 500;
    res.status(status).json({ error: 'generation_failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN USAGE ROUTE
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/usage', authMiddleware, async (req, res) => {
  try {
    const { rows: uRows } = await pool.query('SELECT tokens_used, tokens_limit, plan FROM users WHERE id = $1', [req.user.id]);
    const { rows: history } = await pool.query('SELECT * FROM token_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [req.user.id]);

    // Per-operation total tokens + exact USD cost from the model pricing table.
    const enriched = history.map((row) => {
      const total_tokens = (row.tokens_in || 0) + (row.tokens_out || 0);
      return { ...row, total_tokens, cost_usd: Number(costUsd(row.model, row.tokens_in, row.tokens_out).toFixed(6)) };
    });

    // Lifetime totals across every operation (not just the last 20 above).
    const { rows: agg } = await pool.query(
      `SELECT model,
              COUNT(*)::int            AS operations,
              COALESCE(SUM(tokens_in),0)::bigint  AS tokens_in,
              COALESCE(SUM(tokens_out),0)::bigint AS tokens_out
         FROM token_usage WHERE user_id = $1 GROUP BY model`,
      [req.user.id]
    );
    let total_cost_usd = 0;
    const by_model = agg.map((m) => {
      const cost = costUsd(m.model, Number(m.tokens_in), Number(m.tokens_out));
      total_cost_usd += cost;
      return {
        model: m.model,
        operations: m.operations,
        tokens_in: Number(m.tokens_in),
        tokens_out: Number(m.tokens_out),
        total_tokens: Number(m.tokens_in) + Number(m.tokens_out),
        cost_usd: Number(cost.toFixed(6)),
      };
    });

    res.json({ ...uRows[0], history: enriched, cost_summary: { by_model, total_cost_usd: Number(total_cost_usd.toFixed(6)) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC CAPTURE (called from published sites — no auth)
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/track/:slug — record a page view
app.post('/api/track/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM projects WHERE published_slug = $1 LIMIT 1', [req.params.slug]);
    if (rows[0]) {
      await pool.query(
        'INSERT INTO page_events (project_id, type, path, referrer, device) VALUES ($1, $2, $3, $4, $5)',
        [rows[0].id, 'view', req.body?.path || '/', req.body?.referrer || req.get('referer') || null, deviceFromUA(req.get('user-agent'))]
      );
    }
    res.status(204).end();
  } catch { res.status(204).end(); }
});

// POST /api/leads/:slug — capture a form submission
app.post('/api/leads/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM projects WHERE published_slug = $1 LIMIT 1', [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'Site not found' });

    const f = { ...(req.body?.fields || {}), ...req.body };
    delete f.fields; delete f.source;
    const find = (re) => Object.entries(f).find(([k, v]) => re.test(k) || (typeof v === 'string' && re.test(v)))?.[1];
    const email = find(/email|@/i);
    const name = f.name || f.full_name || f.fullname || f.fullName;
    const phone = f.phone || f.tel || f.mobile || f.whatsapp;
    const message = f.message || f.msg || f.comment || f.text || f.note;

    await pool.query(
      `INSERT INTO leads (project_id, name, email, phone, message, data, source_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rows[0].id, name || null, email || null, phone || null, message || null, JSON.stringify(f), req.body?.source || null]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT OWNER CONTROL PANEL
// ══════════════════════════════════════════════════════════════════════════════

// Resolve a project the caller owns (admins may access any). Returns row or null.
async function ownedProject(req) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  const p = rows[0];
  if (!p) return null;
  if (p.user_id === req.user.id) return p;
  const { rows: u } = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
  return u[0]?.role === 'admin' ? p : null;
}

// GET /api/projects/:id/analytics?days=14
app.get('/api/projects/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const p = await ownedProject(req);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));

    const [series, totals, refs, devices, leadsCount] = await Promise.all([
      pool.query(
        `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
           FROM page_events WHERE project_id = $1 AND type = 'view'
            AND created_at >= now() - ($2::int - 1) * interval '1 day'
          GROUP BY 1`, [p.id, days]),
      pool.query(`SELECT COUNT(*)::int AS c FROM page_events WHERE project_id = $1 AND type = 'view'`, [p.id]),
      pool.query(
        `SELECT COALESCE(NULLIF(referrer,''),'Direct') AS r, COUNT(*)::int AS c
           FROM page_events WHERE project_id = $1 AND type='view' GROUP BY 1 ORDER BY c DESC LIMIT 5`, [p.id]),
      pool.query(`SELECT device, COUNT(*)::int AS c FROM page_events WHERE project_id=$1 AND type='view' GROUP BY 1`, [p.id]),
      pool.query(`SELECT COUNT(*)::int AS c FROM leads WHERE project_id = $1`, [p.id]),
    ]);

    // Fill the day series with zeros so the chart is continuous.
    const byDay = Object.fromEntries(series.rows.map(r => [r.d, r.c]));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      out.push({ date: key, label: `${dt.getDate()}/${dt.getMonth() + 1}`, views: byDay[key] || 0 });
    }

    res.json({
      totalViews: totals.rows[0].c,
      viewsInRange: out.reduce((a, b) => a + b.views, 0),
      series: out,
      byReferrer: refs.rows,
      byDevice: devices.rows,
      leadsCount: leadsCount.rows[0].c,
      likes: p.likes || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/projects/:id/leads
app.get('/api/projects/:id/leads', authMiddleware, async (req, res) => {
  try {
    const p = await ownedProject(req);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, message, data, source_path, is_read, created_at
         FROM leads WHERE project_id = $1 ORDER BY created_at DESC LIMIT 200`, [p.id]
    );
    res.json({ leads: rows, unread: rows.filter(l => !l.is_read).length });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects/:id/leads/:leadId/read
app.post('/api/projects/:id/leads/:leadId/read', authMiddleware, async (req, res) => {
  try {
    const p = await ownedProject(req);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    await pool.query('UPDATE leads SET is_read = true WHERE id = $1 AND project_id = $2', [req.params.leadId, p.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// USER NOTIFICATIONS (customer-facing)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/notifications — current user's notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, body, type, is_read, created_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    res.json({ notifications: rows, unread });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/notifications/read — mark one or all as read
app.post('/api/notifications/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (id) await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    else await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════

// Audience → WHERE clause for users targeted by CRM actions.
function audienceFilter(audience) {
  switch (audience) {
    case 'free': return `plan = 'free'`;
    case 'pro': return `plan = 'pro'`;
    case 'enterprise': return `plan = 'enterprise'`;
    case 'paying': return `plan IN ('pro','enterprise')`;
    default: return 'TRUE';
  }
}

// GET /api/admin/overview — top-level KPIs
app.get('/api/admin/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users, projects, mrrInfo, revThisMonth, revLastMonth, newUsers] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM users'),
      pool.query(`SELECT COUNT(*)::int AS total,
                         COUNT(*) FILTER (WHERE is_public)::int AS public,
                         COUNT(*) FILTER (WHERE is_published)::int AS published
                    FROM projects`),
      currentMRR(pool),
      pool.query(`SELECT COALESCE(SUM(amount),0)::float AS s FROM transactions
                   WHERE type IN ('subscription','template_sale','manual_income')
                     AND created_at >= date_trunc('month', now())`),
      pool.query(`SELECT COALESCE(SUM(amount),0)::float AS s FROM transactions
                   WHERE type IN ('subscription','template_sale','manual_income')
                     AND created_at >= date_trunc('month', now()) - interval '1 month'
                     AND created_at <  date_trunc('month', now())`),
      pool.query(`SELECT COUNT(*)::int AS c FROM users WHERE created_at >= date_trunc('month', now())`),
    ]);

    const thisM = Math.round(revThisMonth.rows[0].s);
    const lastM = Math.round(revLastMonth.rows[0].s);
    const change = lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 1000) / 10 : null;

    res.json({
      users: users.rows[0].c,
      newUsersThisMonth: newUsers.rows[0].c,
      projects: projects.rows[0],
      mrr: mrrInfo.mrr,
      planCounts: mrrInfo.planCounts,
      payingUsers: mrrInfo.payingUsers,
      arpu: mrrInfo.arpu,
      revenueThisMonth: thisM,
      revenueLastMonth: lastM,
      revenueChangePct: change,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/admin/users — all users with project counts
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.plan, u.role, u.is_partner, u.created_at,
              COUNT(p.id)::int AS project_count,
              COALESCE(SUM(t.amount) FILTER (WHERE t.type IN ('subscription','template_sale','manual_income')),0)::float AS revenue
         FROM users u
         LEFT JOIN projects p ON p.user_id = u.id
         LEFT JOIN transactions t ON t.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// PATCH /api/admin/users/:id — change plan or role
app.patch('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { plan, role, is_partner } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET plan = COALESCE($1, plan), role = COALESCE($2, role), is_partner = COALESCE($3, is_partner)
        WHERE id = $4 RETURNING id, email, name, plan, role, is_partner`,
      [plan ?? null, role ?? null, typeof is_partner === 'boolean' ? is_partner : null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/admin/projects — all projects with owner
app.get('/api/admin/projects', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.thumbnail_url, p.price, p.likes, p.views,
              p.is_public, p.is_published, p.featured, p.published_slug, p.created_at,
              u.name AS author, u.email AS author_email
         FROM projects p LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// PATCH /api/admin/projects/:id — price / visibility / publish / feature
app.patch('/api/admin/projects/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { price, is_public, is_published, featured } = req.body;
    const { rows } = await pool.query(
      `UPDATE projects SET
         price = COALESCE($1, price),
         is_public = COALESCE($2, is_public),
         is_published = COALESCE($3, is_published),
         featured = COALESCE($4, featured)
       WHERE id = $5
       RETURNING id, name, price, is_public, is_published, featured`,
      [price ?? null, is_public ?? null, is_published ?? null, featured ?? null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// DELETE /api/admin/projects/:id
app.delete('/api/admin/projects/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ── CRM: in-app notifications ──────────────────────────────────────────────
// POST /api/admin/notifications — broadcast to an audience
app.post('/api/admin/notifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, body, type = 'info', audience = 'all' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const { rows: targets } = await pool.query(
      `SELECT id FROM users WHERE ${audienceFilter(audience)}`
    );
    if (targets.length === 0) return res.json({ ok: true, sent: 0 });
    const values = targets.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`);
    const params = targets.flatMap(u => [u.id, title, body || null, type]);
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type) VALUES ${values.join(', ')}`,
      params
    );
    res.json({ ok: true, sent: targets.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ── CRM: email campaigns ────────────────────────────────────────────────────
// GET /api/admin/campaigns
app.get('/api/admin/campaigns', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, subject, audience, status, mode, recipient_count, opened_count, sent_at, created_at
         FROM campaigns ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ campaigns: rows, mailMode: mailMode() });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/admin/campaigns — create + send to audience
app.post('/api/admin/campaigns', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subject, body, audience = 'all' } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject is required' });

    const { rows: targets } = await pool.query(
      `SELECT id, email FROM users WHERE ${audienceFilter(audience)} AND email IS NOT NULL`
    );

    const { results, mode } = await deliverCampaign({ subject, body }, targets);
    const opened = results.filter(r => r.status === 'opened').length;

    const { rows: c } = await pool.query(
      `INSERT INTO campaigns (subject, body, audience, status, mode, recipient_count, opened_count, created_by, sent_at)
       VALUES ($1, $2, $3, 'sent', $4, $5, $6, $7, now()) RETURNING id`,
      [subject, body || null, audience, mode, results.length, opened, req.user.id]
    );
    const campaignId = c[0].id;

    if (results.length > 0) {
      const values = results.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`);
      const params = results.flatMap(r => [campaignId, r.user_id, r.email, r.status]);
      await pool.query(
        `INSERT INTO campaign_recipients (campaign_id, user_id, email, status) VALUES ${values.join(', ')}`,
        params
      );
    }

    res.status(201).json({ id: campaignId, recipient_count: results.length, opened_count: opened, mode });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ── Finance ─────────────────────────────────────────────────────────────────
// GET /api/admin/finance — cashflow, forecast, recommendations
app.get('/api/admin/finance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [series, mrrInfo, totalUsersRow] = await Promise.all([
      monthlySeries(pool, 6),
      currentMRR(pool),
      pool.query('SELECT COUNT(*)::int AS c FROM users'),
    ]);
    const totalUsers = totalUsersRow.rows[0].c;
    const fc = buildForecast(series, 3);
    const cash = cashPosition(series, fc.projection);
    const recs = buildRecommendations({ series, forecast: fc, mrrInfo, cash, totalUsers });

    const sourceRow = await pool.query(
      `SELECT type, COALESCE(SUM(amount),0)::float AS s FROM transactions
        WHERE type IN ('subscription','template_sale')
          AND created_at >= date_trunc('month', now())
        GROUP BY type`
    );
    const bySource = { subscription: 0, template_sale: 0 };
    for (const r of sourceRow.rows) bySource[r.type] = Math.round(r.s);

    res.json({
      series,
      forecast: fc,
      cash,
      mrr: mrrInfo.mrr,
      arpu: mrrInfo.arpu,
      payingUsers: mrrInfo.payingUsers,
      bySource,
      recommendations: recs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/admin/transactions — recent ledger
app.get('/api/admin/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.type, t.amount, t.status, t.description, t.created_at, u.email AS user_email
         FROM transactions t LEFT JOIN users u ON u.id = t.user_id
        ORDER BY t.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/admin/transactions — manual entry
app.post('/api/admin/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    if (!type || amount == null) return res.status(400).json({ error: 'type and amount are required' });
    const { rows } = await pool.query(
      `INSERT INTO transactions (type, amount, description, status) VALUES ($1, $2, $3, 'paid') RETURNING *`,
      [type, amount, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════

app.listen(port, async () => {
  if (process.env.DATABASE_URL) {
    await initDB();
  } else {
    console.warn('⚠️ No DATABASE_URL provided. Please configure Supabase.');
  }
  console.log(`✅ Server running on port ${port}`);
});