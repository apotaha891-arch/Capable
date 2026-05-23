import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const db = new Database('projects.db', { verbose: console.log });

// Create projects table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    author TEXT,
    likes INTEGER DEFAULT 0,
    views TEXT,
    isPublic BOOLEAN DEFAULT true,
    lastEdited TEXT
  )
`);

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Project API Endpoints ---

// GET all projects
app.get('/api/projects', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM projects');
    const projects = stmt.all();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve projects', details: error.message });
  }
});

// GET a single project by ID
app.get('/api/projects/:id', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
      const project = stmt.get(req.params.id);
      if (project) {
        res.json(project);
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve project', details: error.message });
    }
});


// POST a new project
app.post('/api/projects', (req, res) => {
    try {
      const { name, code, author, isPublic } = req.body;
      const stmt = db.prepare('INSERT INTO projects (name, code, author, isPublic, lastEdited) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(name, code, author, isPublic ? 1 : 0, new Date().toISOString());
      res.status(201).json({ id: info.lastInsertRowid, name, code, author, isPublic });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project', details: error.message });
    }
});

// PUT (update) a project by ID
app.put('/api/projects/:id', (req, res) => {
    try {
        const { code } = req.body;
        const stmt = db.prepare('UPDATE projects SET code = ?, lastEdited = ? WHERE id = ?');
        const info = stmt.run(code, new Date().toISOString(), req.params.id);
        if (info.changes > 0) {
            res.json({ message: 'Project updated successfully' });
        } else {
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project', details: error.message });
    }
});

// DELETE a project by ID
app.delete('/api/projects/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
        const info = stmt.run(req.params.id);
        if (info.changes > 0) {
            res.json({ message: 'Project deleted successfully' });
        } else {
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project', details: error.message });
    }
});



app.post('/api/generate', async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(`Please generate HTML/CSS/JS code for the following request. Return ONLY the raw HTML code without markdown formatting or codeblocks: ${prompt}`);
    const response = await result.response;
    let text = response.text();
    
    // Strip markdown formatting if the model still returns it
    text = text.replace(/^```(html)?\n/g, '').replace(/\n```$/g, '');

    res.json({ code: text });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});