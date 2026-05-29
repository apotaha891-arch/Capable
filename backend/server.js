import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
import { getUsage, secondsUntilMidnight } from './src/limits.js';
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
        tokens_limit INTEGER DEFAULT 50000,
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

      ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_verification_token TEXT;
      CREATE INDEX IF NOT EXISTS idx_projects_custom_domain ON projects(custom_domain) WHERE custom_domain IS NOT NULL;

      -- Capable Blueprint v2.0 columns (spec §2.1)
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS blueprint JSONB;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'none';
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS og_image_url TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      CREATE INDEX IF NOT EXISTS idx_projects_published_slug ON projects(published_slug) WHERE published_slug IS NOT NULL;

      -- Admin & platform management
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

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
    `);

    // Promote configured admin emails (no-op for emails not yet registered).
    if (ADMIN_EMAILS.size > 0) {
      await pool.query(
        `UPDATE users SET role = 'admin' WHERE LOWER(email) = ANY($1::text[])`,
        [Array.from(ADMIN_EMAILS)]
      );
    }

    await seedDemoFinance(pool);
    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Database schema initialization failed', err);
  }
}

// ── Hosted projects directory ─────────────────────────────────────────────────
const hostedDir = path.join(__dirname, 'hosted');
if (!fs.existsSync(hostedDir)) fs.mkdirSync(hostedDir, { recursive: true });

const thumbnailsDir = path.join(hostedDir, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Host-based routing for verified custom domains. Skipped on localhost and for API/hosted/uploads paths.
const SYSTEM_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/hosted/')) return next();
  const host = (req.hostname || '').toLowerCase();
  if (!host || SYSTEM_HOSTS.has(host)) return next();
  try {
    const { rows } = await pool.query(
      `SELECT published_slug FROM projects
       WHERE LOWER(custom_domain) = $1 AND domain_verified = true AND is_published = true
       LIMIT 1`,
      [host]
    );
    if (rows.length > 0) {
      const file = path.join(hostedDir, rows[0].published_slug, 'index.html');
      if (fs.existsSync(file)) return res.sendFile(file);
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

// GET /api/projects/preview/:id — serve any public project's HTML for inline preview
app.get('/api/projects/preview/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT code FROM projects WHERE id = $1 AND is_public = true', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rows[0].code);
  } catch (err) {
    res.status(500).send('Error');
  }
});

// GET /api/projects/explore
app.get('/api/projects/explore', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.thumbnail_url, p.price, p.likes, p.views, p.published_slug, p.last_edited,
              u.name AS author,
              p.blueprint->>'project_name_en' AS name_en,
              p.blueprint->>'project_name_ar' AS name_ar
       FROM projects p LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_public = true AND (length(COALESCE(p.code, '')) > 0 OR p.blueprint IS NOT NULL)
       ORDER BY p.likes DESC, p.created_at DESC LIMIT 50`
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
    const { name, description, thumbnail_url, price, code, is_public, custom_domain } = req.body;
    const { rows: projRows } = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (projRows.length === 0) return res.status(404).json({ error: 'Project not found' });

    await pool.query(`UPDATE projects SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      thumbnail_url = COALESCE($3, thumbnail_url),
      price = COALESCE($4, price),
      code = COALESCE($5, code),
      is_public = COALESCE($6, is_public),
      custom_domain = COALESCE($7, custom_domain),
      last_edited = NOW()
      WHERE id = $8`,
      [name ?? null, description ?? null, thumbnail_url ?? null, price ?? null, code ?? null, is_public ?? null, custom_domain ?? null, req.params.id]
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

    const slug = project.published_slug || `p-${req.params.id}-${Date.now().toString(36)}`;
    const projectDir = path.join(hostedDir, slug);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(path.join(projectDir, 'index.html'), project.code, 'utf-8');

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
    const { rows: sourceRows } = await pool.query('SELECT * FROM projects WHERE id = $1 AND (user_id = $2 OR is_public = true)', [req.params.id, req.user.id]);
    const source = sourceRows[0];
    if (!source) return res.status(404).json({ error: 'Project not found' });

    const hasBlueprint = !!source.blueprint;
    const cloneName = `${source.name} (Clone)`;
    let newSlug = null;
    if (hasBlueprint) {
      const seed = source.blueprint.project_name_en || source.blueprint.project_name || cloneName;
      newSlug = await uniqueSlug(seed);
    }

    const { rows: newProjRows } = await pool.query(
      `INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, blueprint,
                             author, is_public, is_published, published_slug, last_edited, updated_at)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, false, $8, $9, NOW(), NOW()) RETURNING id`,
      [
        req.user.id, cloneName, source.description, source.thumbnail_url,
        source.code, source.blueprint || null, req.user.name,
        hasBlueprint, newSlug,
      ]
    );
    const newProjectId = newProjRows[0].id;

    const { rows: sourceFiles } = await pool.query('SELECT * FROM project_files WHERE project_id = $1', [source.id]);
    for (const file of sourceFiles) {
      await pool.query(
        'INSERT INTO project_files (project_id, filename, content, file_type) VALUES ($1, $2, $3, $4)',
        [newProjectId, file.filename, file.content, file.file_type]
      );
    }

    res.status(201).json({ id: newProjectId, has_blueprint: hasBlueprint, slug: newSlug });
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
    if (quota.generations_today >= quota.generations_limit) {
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
    const { rows } = await pool.query('SELECT plan FROM users WHERE id = $1', [req.user.id]);
    res.json(await getUsage(pool, req.user.id, rows[0]?.plan));
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
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY GENERATE ROUTE (HTML output — kept for existing editor)
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/generate', authMiddleware, async (req, res) => {
  const { prompt, history, project_id } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const { rows: userRows } = await pool.query('SELECT tokens_used, tokens_limit, plan FROM users WHERE id = $1', [req.user.id]);
    const user = userRows[0];
    
    if (user.tokens_used >= user.tokens_limit) {
      return res.status(429).json({
        error: 'Token limit reached',
        tokens_used: user.tokens_used,
        tokens_limit: user.tokens_limit,
        plan: user.plan,
        upgrade_required: true,
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: `You are an expert web developer. Your ONLY job is to output a valid JSON object containing the files for a web project.
CRITICAL RULES:
- The output MUST be a valid JSON object with a "files" array.
- Each object in the "files" array MUST have "filename" (string) and "content" (string) properties.
- Example: { "files": [ { "filename": "index.html", "content": "<!DOCTYPE html>..." }, { "filename": "style.css", "content": "body { margin: 0; }" } ] }
- Generate multiple HTML files, CSS files, and JS files to fulfill the user's request, ensuring they are interconnected properly.
- All HTML files MUST be complete (include <!DOCTYPE html>, <html>, <head>, and <body>).
- Use Tailwind CSS via CDN in HTML files: <script src="https://cdn.tailwindcss.com"></script>
- Make the output visually stunning, modern, and professional.
- DO NOT wrap the JSON in markdown fences, output ONLY raw JSON.`,
    });

    const chat = model.startChat({
      history: (history || []).flatMap(msg => [
        { role: 'user', parts: [{ text: msg.prompt }] },
        { role: 'model', parts: [{ text: msg.code }] },
      ]),
      generationConfig: {
        maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '8192'),
        temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
        responseMimeType: 'application/json',
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    let text = response.text();

    // Parse JSON — full parse first, then salvage parser for truncated responses
    let parsedFiles = [];
    let fallbackCode = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.files && Array.isArray(parsed.files)) {
        parsedFiles = parsed.files;
      }
    } catch {
      // Salvage: scan for complete {"filename": "...", "content": "..."} objects.
      // We accumulate brace depth and string state to find balanced object boundaries.
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
                try {
                  const obj = JSON.parse(text.slice(objStart, i + 1));
                  if (obj.filename && typeof obj.content === 'string') parsedFiles.push(obj);
                } catch {}
                objStart = -1;
              }
            }
          }
          i++;
        }
      }
      if (parsedFiles.length === 0) console.error('Failed to parse AI JSON response (no salvageable files)');
      else console.warn(`Salvaged ${parsedFiles.length} file(s) from truncated AI response`);
    }

    const mainHtml = parsedFiles.find(f => f.filename === 'index.html' || f.filename.endsWith('.html'));
    if (mainHtml) fallbackCode = mainHtml.content;

    if (!fallbackCode.toLowerCase().includes('<!doctype') && !fallbackCode.toLowerCase().includes('<html')) {
      fallbackCode = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white p-8">${fallbackCode}</body></html>`;
    }

    const usage = response.usageMetadata;
    const tokensIn = usage?.promptTokenCount || 0;
    const tokensOut = usage?.candidatesTokenCount || 0;
    const totalTokens = tokensIn + tokensOut;

    await pool.query('UPDATE users SET tokens_used = tokens_used + $1 WHERE id = $2', [totalTokens, req.user.id]);
    await pool.query(
      'INSERT INTO token_usage (user_id, project_id, tokens_in, tokens_out, model, action) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, project_id || null, tokensIn, tokensOut, 'gemini-flash-latest', 'generate']
    );

    const { rows: updatedUserRows } = await pool.query('SELECT tokens_used, tokens_limit FROM users WHERE id = $1', [req.user.id]);
    res.json({ code: fallbackCode, files: parsedFiles, tokens_used: updatedUserRows[0].tokens_used, tokens_limit: updatedUserRows[0].tokens_limit });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Failed to generate', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN USAGE ROUTE
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/usage', authMiddleware, async (req, res) => {
  try {
    const { rows: uRows } = await pool.query('SELECT tokens_used, tokens_limit, plan FROM users WHERE id = $1', [req.user.id]);
    const { rows: history } = await pool.query('SELECT * FROM token_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json({ ...uRows[0], history });
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
      `SELECT u.id, u.email, u.name, u.plan, u.role, u.created_at,
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
    const { plan, role } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET plan = COALESCE($1, plan), role = COALESCE($2, role)
        WHERE id = $3 RETURNING id, email, name, plan, role`,
      [plan ?? null, role ?? null, req.params.id]
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