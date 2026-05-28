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

dotenv.config();

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
    `);
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
    const { rows } = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [email.toLowerCase().trim(), name.trim(), hash]
    );

    const user = { id: rows[0].id, email, name, plan: 'free' };
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

    const payload = { id: user.id, email: user.email, name: user.name, plan: user.plan };
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
      'SELECT id, email, name, plan, tokens_used, tokens_limit, created_at FROM users WHERE id = $1',
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