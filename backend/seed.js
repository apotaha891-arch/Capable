import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'projects.db'));

console.log('Seeding database with starter projects...');

// Ensure a system user exists
const userResult = db.prepare('INSERT OR IGNORE INTO users (id, email, name, password_hash, plan) VALUES (?, ?, ?, ?, ?)')
  .run(999, 'admin@capable.test', 'Capable Team', 'noop', 'enterprise');

const authorId = 999;
const authorName = 'Capable Team';

const projects = [
  {
    name: 'SaaS Landing Page',
    description: 'A modern landing page for a SaaS product with Hero section, Features, and Pricing.',
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>SaaS Landing Page</title>
</head>
<body class="bg-slate-50 text-slate-900 font-sans">
  <nav class="flex items-center justify-between p-6 max-w-6xl mx-auto">
    <div class="text-2xl font-bold text-indigo-600">SaaSy.</div>
    <div class="hidden md:flex gap-6 font-medium text-slate-600">
      <a href="#" class="hover:text-indigo-600">Features</a>
      <a href="#" class="hover:text-indigo-600">Pricing</a>
      <a href="#" class="hover:text-indigo-600">Contact</a>
    </div>
    <button class="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700">Get Started</button>
  </nav>

  <header class="text-center py-20 px-4 max-w-4xl mx-auto">
    <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">Build faster with our tools</h1>
    <p class="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">SaaSy provides everything you need to scale your startup without the headache of managing infrastructure.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200">Start Free Trial</button>
      <button class="bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-xl font-bold text-lg hover:bg-slate-50 shadow-sm">View Demo</button>
    </div>
  </header>
  
  <section class="bg-white py-20 border-t border-slate-100">
    <div class="max-w-6xl mx-auto px-6">
      <h2 class="text-3xl font-bold text-center mb-12">Why choose us?</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl font-bold mb-4">⚡</div>
          <h3 class="text-xl font-bold mb-2">Lightning Fast</h3>
          <p class="text-slate-500">Our globally distributed edge network ensures your app loads instantly anywhere.</p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl font-bold mb-4">🔒</div>
          <h3 class="text-xl font-bold mb-2">Secure by Default</h3>
          <p class="text-slate-500">Enterprise-grade security built into every layer of our platform.</p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl font-bold mb-4">📈</div>
          <h3 class="text-xl font-bold mb-2">Scale Infinitely</h3>
          <p class="text-slate-500">From 10 to 10M users, our platform scales automatically with your needs.</p>
        </div>
      </div>
    </div>
  </section>
</body>
</html>`
  },
  {
    name: 'Modern Login UI',
    description: 'A clean, split-screen authentication page featuring a beautiful glassmorphism effect.',
    thumbnail_url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Login UI</title>
</head>
<body class="bg-slate-900 text-white font-sans h-screen flex">
  <!-- Left Side: Image -->
  <div class="hidden lg:block w-1/2 relative overflow-hidden">
    <div class="absolute inset-0 bg-indigo-600/20 mix-blend-multiply z-10"></div>
    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" class="w-full h-full object-cover" />
    <div class="absolute bottom-12 left-12 z-20 max-w-md">
      <h2 class="text-4xl font-bold mb-4">Welcome back to the future.</h2>
      <p class="text-indigo-100/80">Log in to your account to continue building incredible things with our AI-powered platform.</p>
    </div>
  </div>
  
  <!-- Right Side: Form -->
  <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
    <div class="w-full max-w-md bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
      <h1 class="text-3xl font-bold mb-2">Sign in</h1>
      <p class="text-slate-400 mb-8">Don't have an account? <a href="#" class="text-indigo-400 hover:text-indigo-300">Create one</a></p>
      
      <form class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input type="email" placeholder="you@example.com" class="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <input type="password" placeholder="••••••••" class="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
        </div>
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-800" />
            <span class="text-sm text-slate-400">Remember me</span>
          </label>
          <a href="#" class="text-sm text-indigo-400 hover:text-indigo-300">Forgot password?</a>
        </div>
        <button class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">Sign In</button>
      </form>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: 'Admin Dashboard Widget',
    description: 'A beautiful analytics widget with charts, stats, and a dark mode aesthetic.',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
    price: 5,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Dashboard</title>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-8 flex items-center justify-center min-h-screen">
  
  <div class="w-full max-w-4xl grid md:grid-cols-3 gap-6">
    <!-- Stat 1 -->
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div class="text-slate-400 text-sm font-medium mb-1">Total Revenue</div>
      <div class="text-3xl font-bold text-white mb-2">$45,231.89</div>
      <div class="flex items-center gap-1 text-sm text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
        <span>+20.1% from last month</span>
      </div>
    </div>
    
    <!-- Stat 2 -->
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div class="text-slate-400 text-sm font-medium mb-1">Active Users</div>
      <div class="text-3xl font-bold text-white mb-2">+2350</div>
      <div class="flex items-center gap-1 text-sm text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
        <span>+180 today</span>
      </div>
    </div>
    
    <!-- Stat 3 -->
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div class="text-slate-400 text-sm font-medium mb-1">Sales</div>
      <div class="text-3xl font-bold text-white mb-2">+12,234</div>
      <div class="flex items-center gap-1 text-sm text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
        <span>-4% from last week</span>
      </div>
    </div>
    
    <!-- Main Chart Area -->
    <div class="md:col-span-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-64 flex flex-col items-center justify-center text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-slate-600"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
      <p>Chart Component Goes Here</p>
    </div>
  </div>
</body>
</html>`
  }
];

const insertProj = db.prepare('INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, author, is_public, likes, views) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)');

for (const p of projects) {
  const existing = db.prepare('SELECT id FROM projects WHERE name = ? AND user_id = ?').get(p.name, authorId);
  if (!existing) {
    const likes = Math.floor(Math.random() * 500) + 50;
    const views = likes * (Math.floor(Math.random() * 10) + 2);
    insertProj.run(authorId, p.name, p.description, p.thumbnail_url, p.price, p.code, authorName, likes, views);
    console.log(`Inserted: ${p.name}`);
  } else {
    console.log(`Skipped existing: ${p.name}`);
  }
}

console.log('Seeding complete.');