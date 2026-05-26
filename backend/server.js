import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'capable_secret_change_in_production';

// ── Database ──────────────────────────────────────────────────────────────────
const db = new Database('projects.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    tokens_used INTEGER DEFAULT 0,
    tokens_limit INTEGER DEFAULT 50000,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    author TEXT,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT 0,
    is_published BOOLEAN DEFAULT 0,
    published_slug TEXT UNIQUE,
    custom_domain TEXT,
    description TEXT,
    thumbnail_url TEXT,
    price INTEGER DEFAULT 0,
    last_edited TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content TEXT DEFAULT '',
    file_type TEXT DEFAULT 'html',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, filename)
  );

  CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    model TEXT,
    action TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── Hosted projects directory ─────────────────────────────────────────────────
const hostedDir = path.join(__dirname, 'hosted');
if (!fs.existsSync(hostedDir)) fs.mkdirSync(hostedDir, { recursive: true });

const thumbnailsDir = path.join(hostedDir, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
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

// Optional auth (doesn't block, just enriches req.user if token present)
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
}

// Plan middleware factory
function requirePlan(...plans) {
  return (req, res, next) => {
    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.user.id);
    if (!plans.includes(user?.plan)) {
      return res.status(403).json({ error: 'Upgrade required', requiredPlan: plans[0] });
    }
    next();
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
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), name.trim(), hash);

    const user = { id: result.lastInsertRowid, email, name, plan: 'free' };
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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
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
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, name, plan, tokens_used, tokens_limit, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/projects — user's own projects
app.get('/api/projects', authMiddleware, (req, res) => {
  try {
    const projects = db.prepare(
      'SELECT id, name, description, thumbnail_url, price, likes, views, is_public, is_published, published_slug, last_edited, created_at FROM projects WHERE user_id = ? ORDER BY last_edited DESC'
    ).all(req.user.id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects', details: err.message });
  }
});

// GET /api/projects/explore — public projects
app.get('/api/projects/explore', optionalAuth, (req, res) => {
  try {
    const projects = db.prepare(
      `SELECT p.id, p.name, p.description, p.thumbnail_url, p.price, p.likes, p.views, p.published_slug, p.last_edited, u.name AS author
       FROM projects p LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_public = 1 ORDER BY p.likes DESC, p.created_at DESC LIMIT 50`
    ).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// GET /api/projects/:id
app.get('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Increment views
    db.prepare('UPDATE projects SET views = views + 1 WHERE id = ?').run(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects
app.post('/api/projects', authMiddleware, (req, res) => {
  try {
    const { name, description, thumbnail_url, price, code = '', is_public = false } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const info = db.prepare(
      'INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, author, is_public, last_edited) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, name, description || null, thumbnail_url || null, price || 0, code, req.user.name, is_public ? 1 : 0, new Date().toISOString());

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// PUT /api/projects/:id
app.put('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const { name, description, thumbnail_url, price, code, is_public } = req.body;
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    db.prepare(`UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      thumbnail_url = COALESCE(?, thumbnail_url),
      price = COALESCE(?, price),
      code = COALESCE(?, code),
      is_public = COALESCE(?, is_public),
      last_edited = ?
      WHERE id = ?`
    ).run(name ?? null, description ?? null, thumbnail_url ?? null, price ?? null, code ?? null, is_public !== undefined ? (is_public ? 1 : 0) : null, new Date().toISOString(), req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update', details: err.message });
  }
});

// POST /api/projects/:id/thumbnail
app.post('/api/projects/:id/thumbnail', authMiddleware, (req, res) => {
  try {
    const { image } = req.body; // base64 string
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

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

    db.prepare('UPDATE projects SET thumbnail_url = ? WHERE id = ?').run(url, req.params.id);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save thumbnail', details: err.message });
  }
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Project not found' });
    // Clean up hosted files if any
    const projectDir = path.join(hostedDir, req.params.id.toString());
    if (fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete', details: err.message });
  }
});

// POST /api/projects/:id/publish — publish project
app.post('/api/projects/:id/publish', authMiddleware, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Generate slug if none
    const slug = project.published_slug || `p-${req.params.id}-${Date.now().toString(36)}`;
    const projectDir = path.join(hostedDir, slug);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    // Write index.html
    fs.writeFileSync(path.join(projectDir, 'index.html'), project.code, 'utf-8');

    db.prepare('UPDATE projects SET is_published = 1, published_slug = ?, is_public = 1 WHERE id = ?').run(slug, req.params.id);

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    res.json({ success: true, url: `${baseUrl}/hosted/${slug}/index.html`, slug });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish', details: err.message });
  }
});

// POST /api/projects/:id/unpublish
app.post('/api/projects/:id/unpublish', authMiddleware, (req, res) => {
  try {
    const project = db.prepare('SELECT published_slug FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Not found' });

    if (project.published_slug) {
      const dir = path.join(hostedDir, project.published_slug);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    }
    db.prepare('UPDATE projects SET is_published = 0, is_public = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unpublish', details: err.message });
  }
});

// POST /api/projects/:id/clone
app.post('/api/projects/:id/clone', authMiddleware, (req, res) => {
  try {
    const source = db.prepare('SELECT * FROM projects WHERE id = ? AND (user_id = ? OR is_public = 1)').get(req.params.id, req.user.id);
    if (!source) return res.status(404).json({ error: 'Project not found' });

    // 1. Clone Project Record
    const info = db.prepare(
      'INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, author, is_public, last_edited) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
    ).run(req.user.id, `${source.name} (Clone)`, source.description, source.thumbnail_url, 0, source.code, req.user.name, new Date().toISOString());
    
    const newProjectId = info.lastInsertRowid;

    // 2. Clone Project Files
    const sourceFiles = db.prepare('SELECT * FROM project_files WHERE project_id = ?').all(source.id);
    if (sourceFiles.length > 0) {
      const insertFile = db.prepare('INSERT INTO project_files (project_id, filename, content, file_type) VALUES (?, ?, ?, ?)');
      const cloneFilesTx = db.transaction((files) => {
        for (const file of files) {
          insertFile.run(newProjectId, file.filename, file.content, file.file_type);
        }
      });
      cloneFilesTx(sourceFiles);
    }

    res.status(201).json({ id: newProjectId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clone', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// FILES ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/projects/:id/files
app.get('/api/projects/:id/files', authMiddleware, (req, res) => {
  try {
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const files = db.prepare('SELECT * FROM project_files WHERE project_id = ? ORDER BY filename').all(req.params.id);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// POST /api/projects/:id/files
app.post('/api/projects/:id/files', authMiddleware, (req, res) => {
  try {
    const { filename, content = '', file_type = 'html' } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename required' });
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const info = db.prepare(
      'INSERT OR REPLACE INTO project_files (project_id, filename, content, file_type) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, filename, content, file_type);
    res.status(201).json({ id: info.lastInsertRowid, project_id: req.params.id, filename, content, file_type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create file', details: err.message });
  }
});

// PUT /api/projects/:projectId/files/:fileId
app.put('/api/projects/:projectId/files/:fileId', authMiddleware, (req, res) => {
  try {
    const { content, filename } = req.body;
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
    if (!project) return res.status(404).json({ error: 'Not found' });

    db.prepare('UPDATE project_files SET content = COALESCE(?, content), filename = COALESCE(?, filename) WHERE id = ? AND project_id = ?')
      .run(content ?? null, filename ?? null, req.params.fileId, req.params.projectId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// DELETE /api/projects/:projectId/files/:fileId
app.delete('/api/projects/:projectId/files/:fileId', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM project_files WHERE id = ? AND project_id = ?').run(req.params.fileId, req.params.projectId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GENERATE ROUTE
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/generate', authMiddleware, async (req, res) => {
  const { prompt, history, project_id } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  // Check token limit
  const user = db.prepare('SELECT tokens_used, tokens_limit, plan FROM users WHERE id = ?').get(req.user.id);
  if (user.tokens_used >= user.tokens_limit) {
    return res.status(429).json({
      error: 'Token limit reached',
      tokens_used: user.tokens_used,
      tokens_limit: user.tokens_limit,
      plan: user.plan,
      upgrade_required: true,
    });
  }

  try {
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

    // Parse JSON
    let parsedFiles = [];
    let fallbackCode = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.files && Array.isArray(parsed.files)) {
        parsedFiles = parsed.files;
        // set fallbackCode to the main html file if possible
        const mainHtml = parsedFiles.find(f => f.filename === 'index.html' || f.filename.endsWith('.html'));
        if (mainHtml) fallbackCode = mainHtml.content;
      }
    } catch (e) {
      console.error('Failed to parse AI JSON response', e);
      // Fallback to text if AI failed to return JSON
    }

    // Ensure valid HTML in fallback code
    if (!fallbackCode.toLowerCase().includes('<!doctype') && !fallbackCode.toLowerCase().includes('<html')) {
      fallbackCode = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white p-8">${fallbackCode}</body></html>`;
    }

    // Log token usage
    const usage = response.usageMetadata;
    const tokensIn = usage?.promptTokenCount || 0;
    const tokensOut = usage?.candidatesTokenCount || 0;
    const totalTokens = tokensIn + tokensOut;

    db.prepare('UPDATE users SET tokens_used = tokens_used + ? WHERE id = ?').run(totalTokens, req.user.id);
    db.prepare('INSERT INTO token_usage (user_id, project_id, tokens_in, tokens_out, model, action) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, project_id || null, tokensIn, tokensOut, 'gemini-flash-latest', 'generate');

    const updatedUser = db.prepare('SELECT tokens_used, tokens_limit FROM users WHERE id = ?').get(req.user.id);
    res.json({ code: fallbackCode, files: parsedFiles, tokens_used: updatedUser.tokens_used, tokens_limit: updatedUser.tokens_limit });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Failed to generate', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN USAGE ROUTE
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/usage', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT tokens_used, tokens_limit, plan FROM users WHERE id = ?').get(req.user.id);
    const history = db.prepare(
      'SELECT * FROM token_usage WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.user.id);
    res.json({ ...user, history });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════

app.listen(port, () => console.log(`✅ Server running on port ${port}`));