import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

console.log('Seeding database with starter projects...');

const SYSTEM_EMAIL = 'admin@capable.test';
const SYSTEM_NAME = 'Capable Team';

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
  <div class="hidden lg:block w-1/2 relative overflow-hidden">
    <div class="absolute inset-0 bg-indigo-600/20 mix-blend-multiply z-10"></div>
    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" class="w-full h-full object-cover" />
    <div class="absolute bottom-12 left-12 z-20 max-w-md">
      <h2 class="text-4xl font-bold mb-4">Welcome back to the future.</h2>
      <p class="text-indigo-100/80">Log in to your account to continue building incredible things with our AI-powered platform.</p>
    </div>
  </div>

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
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div class="text-slate-400 text-sm font-medium mb-1">Total Revenue</div>
      <div class="text-3xl font-bold text-white mb-2">$45,231.89</div>
      <div class="flex items-center gap-1 text-sm text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
        <span>+20.1% from last month</span>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div class="text-slate-400 text-sm font-medium mb-1">Active Users</div>
      <div class="text-3xl font-bold text-white mb-2">+2350</div>
      <div class="flex items-center gap-1 text-sm text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
        <span>+180 today</span>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div class="text-slate-400 text-sm font-medium mb-1">Sales</div>
      <div class="text-3xl font-bold text-white mb-2">+12,234</div>
      <div class="flex items-center gap-1 text-sm text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
        <span>-4% from last week</span>
      </div>
    </div>

    <div class="md:col-span-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-64 flex flex-col items-center justify-center text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-slate-600"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
      <p>Chart Component Goes Here</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: 'Pricing Page',
    description: 'Three-tier pricing layout with a highlighted recommended plan.',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Pricing</title>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen py-16 px-4">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-extrabold mb-3">Simple, honest pricing</h1>
      <p class="text-slate-400 text-lg">Pick the plan that fits your stage. Upgrade anytime.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-7 flex flex-col">
        <h3 class="text-lg font-bold mb-1">Starter</h3>
        <p class="text-slate-400 text-sm mb-5">For exploring ideas</p>
        <div class="text-4xl font-extrabold mb-1">$0<span class="text-base text-slate-500 font-medium">/mo</span></div>
        <ul class="space-y-2 text-sm text-slate-300 mt-6 mb-8 flex-1">
          <li>✓ 1 project</li>
          <li>✓ Community templates</li>
          <li>✓ Basic AI generations</li>
        </ul>
        <button class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold transition-colors">Get started</button>
      </div>

      <div class="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-7 flex flex-col relative shadow-2xl shadow-indigo-500/30 scale-105">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
        <h3 class="text-lg font-bold mb-1">Pro</h3>
        <p class="text-indigo-100 text-sm mb-5">For growing makers</p>
        <div class="text-4xl font-extrabold mb-1">$19<span class="text-base text-indigo-200 font-medium">/mo</span></div>
        <ul class="space-y-2 text-sm text-white mt-6 mb-8 flex-1">
          <li>✓ Unlimited projects</li>
          <li>✓ Premium templates</li>
          <li>✓ Advanced AI + priority</li>
          <li>✓ Custom domain</li>
        </ul>
        <button class="w-full py-3 rounded-xl bg-white text-indigo-600 hover:bg-slate-100 font-bold transition-colors">Upgrade to Pro</button>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-7 flex flex-col">
        <h3 class="text-lg font-bold mb-1">Team</h3>
        <p class="text-slate-400 text-sm mb-5">For studios &amp; agencies</p>
        <div class="text-4xl font-extrabold mb-1">$49<span class="text-base text-slate-500 font-medium">/mo</span></div>
        <ul class="space-y-2 text-sm text-slate-300 mt-6 mb-8 flex-1">
          <li>✓ Everything in Pro</li>
          <li>✓ 5 team seats</li>
          <li>✓ Shared workspaces</li>
          <li>✓ SSO &amp; audit logs</li>
        </ul>
        <button class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold transition-colors">Contact sales</button>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: 'Coming Soon',
    description: 'Minimal launch page with email waitlist signup and animated background.',
    thumbnail_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Coming Soon</title>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex items-center justify-center relative overflow-hidden p-6">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_50%)]"></div>
  <div class="relative z-10 max-w-xl w-full text-center">
    <div class="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-indigo-300 mb-8">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      Launching this fall
    </div>
    <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
      Something <span class="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">wonderful</span> is coming.
    </h1>
    <p class="text-slate-400 text-lg mb-10">
      Be the first to know when we go live. No spam, just one quiet email.
    </p>
    <form class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input type="email" required placeholder="you@example.com" class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/30">Notify me</button>
    </form>
    <div class="flex justify-center gap-6 mt-12 text-sm text-slate-500">
      <a href="#" class="hover:text-white transition-colors">Twitter</a>
      <a href="#" class="hover:text-white transition-colors">Instagram</a>
      <a href="#" class="hover:text-white transition-colors">Contact</a>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: 'Personal Portfolio',
    description: 'Single-page portfolio with intro, project grid, and a small contact section.',
    thumbnail_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Sara Kim — Designer &amp; Developer</title>
</head>
<body class="bg-slate-950 text-slate-100 font-sans">
  <nav class="max-w-5xl mx-auto flex items-center justify-between px-6 py-6">
    <div class="font-bold text-lg">SK<span class="text-indigo-400">.</span></div>
    <div class="hidden md:flex gap-6 text-sm text-slate-400">
      <a href="#work" class="hover:text-white">Work</a>
      <a href="#about" class="hover:text-white">About</a>
      <a href="#contact" class="hover:text-white">Contact</a>
    </div>
  </nav>

  <header class="max-w-5xl mx-auto px-6 pt-16 pb-24">
    <p class="text-indigo-400 font-medium mb-4">Hi, I'm Sara 👋</p>
    <h1 class="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
      Designer &amp; developer crafting <span class="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">delightful interfaces</span>.
    </h1>
    <p class="text-slate-400 text-lg max-w-2xl mb-8">
      I help startups ship beautiful, accessible web products. Currently based in Berlin, available for select freelance work in 2025.
    </p>
    <div class="flex gap-3">
      <a href="#work" class="bg-white text-slate-900 px-6 py-3 rounded-full font-semibold hover:bg-slate-200 transition-colors">View my work</a>
      <a href="#contact" class="border border-slate-700 hover:border-white text-white px-6 py-3 rounded-full font-semibold transition-colors">Get in touch</a>
    </div>
  </header>

  <section id="work" class="max-w-5xl mx-auto px-6 py-16">
    <h2 class="text-2xl font-bold mb-10">Selected work</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="group cursor-pointer">
        <div class="aspect-video rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 mb-4 overflow-hidden group-hover:scale-[1.02] transition-transform"></div>
        <h3 class="font-semibold">Plume — Email client</h3>
        <p class="text-sm text-slate-500">Product design, 2024</p>
      </div>
      <div class="group cursor-pointer">
        <div class="aspect-video rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 overflow-hidden group-hover:scale-[1.02] transition-transform"></div>
        <h3 class="font-semibold">Lumen — Habit tracker</h3>
        <p class="text-sm text-slate-500">iOS app, 2023</p>
      </div>
      <div class="group cursor-pointer">
        <div class="aspect-video rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 mb-4 overflow-hidden group-hover:scale-[1.02] transition-transform"></div>
        <h3 class="font-semibold">North — Brand system</h3>
        <p class="text-sm text-slate-500">Identity, 2023</p>
      </div>
      <div class="group cursor-pointer">
        <div class="aspect-video rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 mb-4 overflow-hidden group-hover:scale-[1.02] transition-transform"></div>
        <h3 class="font-semibold">Folio — Photo journal</h3>
        <p class="text-sm text-slate-500">Web app, 2022</p>
      </div>
    </div>
  </section>

  <section id="contact" class="max-w-3xl mx-auto px-6 py-20 text-center border-t border-slate-800">
    <h2 class="text-3xl font-bold mb-4">Let's build something together.</h2>
    <p class="text-slate-400 mb-8">Have a project in mind? I'd love to hear about it.</p>
    <a href="mailto:hello@sarakim.design" class="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-full font-semibold transition-colors">hello@sarakim.design</a>
    <div class="mt-10 text-xs text-slate-600">© 2025 Sara Kim. All rights reserved.</div>
  </section>
</body>
</html>`
  },
  {
    name: 'Restaurant Menu',
    description: 'Warm-toned café menu page with sections for breakfast, mains, and drinks.',
    thumbnail_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Olive &amp; Oak — Menu</title>
</head>
<body class="bg-stone-50 text-stone-800 font-serif">
  <header class="max-w-3xl mx-auto px-6 py-16 text-center">
    <p class="text-amber-700 tracking-[0.3em] text-xs font-semibold mb-3">OLIVE &amp; OAK</p>
    <h1 class="text-5xl md:text-6xl font-bold mb-4">Our Menu</h1>
    <p class="text-stone-500 italic">Slow food, seasonal ingredients, kind hospitality.</p>
  </header>

  <main class="max-w-3xl mx-auto px-6 pb-20 space-y-14">
    <section>
      <h2 class="text-2xl font-bold mb-6 pb-2 border-b border-stone-300">Breakfast</h2>
      <div class="space-y-5">
        <div class="flex justify-between gap-4">
          <div>
            <h3 class="font-semibold">Sourdough toast</h3>
            <p class="text-sm text-stone-500">house sourdough, cultured butter, sea salt</p>
          </div>
          <span class="font-semibold whitespace-nowrap">$6</span>
        </div>
        <div class="flex justify-between gap-4">
          <div>
            <h3 class="font-semibold">Avocado &amp; egg</h3>
            <p class="text-sm text-stone-500">smashed avocado, soft-boiled egg, chili crisp</p>
          </div>
          <span class="font-semibold whitespace-nowrap">$12</span>
        </div>
        <div class="flex justify-between gap-4">
          <div>
            <h3 class="font-semibold">Buttermilk pancakes</h3>
            <p class="text-sm text-stone-500">maple, whipped ricotta, seasonal fruit</p>
          </div>
          <span class="font-semibold whitespace-nowrap">$11</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-6 pb-2 border-b border-stone-300">Lunch</h2>
      <div class="space-y-5">
        <div class="flex justify-between gap-4">
          <div>
            <h3 class="font-semibold">Roast chicken sandwich</h3>
            <p class="text-sm text-stone-500">aioli, pickles, little gem, focaccia</p>
          </div>
          <span class="font-semibold whitespace-nowrap">$14</span>
        </div>
        <div class="flex justify-between gap-4">
          <div>
            <h3 class="font-semibold">Heirloom tomato salad</h3>
            <p class="text-sm text-stone-500">burrata, basil oil, balsamic, toasted sourdough</p>
          </div>
          <span class="font-semibold whitespace-nowrap">$13</span>
        </div>
        <div class="flex justify-between gap-4">
          <div>
            <h3 class="font-semibold">Wild mushroom pasta</h3>
            <p class="text-sm text-stone-500">tagliatelle, brown butter, thyme, parmesan</p>
          </div>
          <span class="font-semibold whitespace-nowrap">$17</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-6 pb-2 border-b border-stone-300">Drinks</h2>
      <div class="space-y-5">
        <div class="flex justify-between gap-4">
          <div><h3 class="font-semibold">Drip coffee</h3><p class="text-sm text-stone-500">single origin, rotating</p></div>
          <span class="font-semibold whitespace-nowrap">$4</span>
        </div>
        <div class="flex justify-between gap-4">
          <div><h3 class="font-semibold">Iced matcha</h3><p class="text-sm text-stone-500">ceremonial grade, oat milk</p></div>
          <span class="font-semibold whitespace-nowrap">$5.5</span>
        </div>
        <div class="flex justify-between gap-4">
          <div><h3 class="font-semibold">Natural wine</h3><p class="text-sm text-stone-500">ask your server, by the glass</p></div>
          <span class="font-semibold whitespace-nowrap">$9</span>
        </div>
      </div>
    </section>

    <footer class="text-center pt-10 border-t border-stone-200 text-sm text-stone-500">
      <p>Open daily 8am – 4pm · 142 Olive Lane · (555) 014-2873</p>
    </footer>
  </main>
</body>
</html>`
  },
  {
    name: 'Todo App',
    description: 'A working task manager with add, complete, delete, filter, and automatic save.',
    thumbnail_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Tasks</title>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen py-12 px-4">
  <div class="max-w-lg mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold mb-1">My Tasks</h1>
      <p class="text-slate-400 text-sm"><span id="count">0</span> active</p>
    </header>

    <form id="form" class="flex gap-2 mb-6">
      <input id="input" type="text" placeholder="What needs to be done?" required class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none" />
      <button class="bg-indigo-600 hover:bg-indigo-500 px-5 rounded-xl font-semibold">Add</button>
    </form>

    <div class="flex gap-2 mb-4 text-sm">
      <button data-filter="all" class="filter-btn bg-slate-800 px-3 py-1.5 rounded-lg font-medium">All</button>
      <button data-filter="active" class="filter-btn px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800">Active</button>
      <button data-filter="done" class="filter-btn px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800">Done</button>
      <button id="clear" class="ms-auto text-xs text-slate-500 hover:text-red-400">Clear done</button>
    </div>

    <ul id="list" class="space-y-2"></ul>
    <p id="empty" class="text-center text-slate-600 py-10 text-sm hidden">No tasks yet. Add one above.</p>
  </div>

  <script>
    const KEY = 'todo_app_v1';
    let tasks = JSON.parse(localStorage.getItem(KEY) || '[]');
    let filter = 'all';

    const $ = (s) => document.querySelector(s);
    const list = $('#list'), empty = $('#empty'), count = $('#count');

    function save() { localStorage.setItem(KEY, JSON.stringify(tasks)); }

    function render() {
      const filtered = tasks.filter(t => filter === 'all' || (filter === 'active' && !t.done) || (filter === 'done' && t.done));
      list.innerHTML = filtered.map(t => \`
        <li class="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 group">
          <input type="checkbox" \${t.done ? 'checked' : ''} data-id="\${t.id}" class="toggle w-5 h-5 rounded accent-indigo-500" />
          <span class="flex-1 \${t.done ? 'line-through text-slate-500' : ''}">\${t.text.replace(/</g,'&lt;')}</span>
          <button data-id="\${t.id}" class="del text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
        </li>\`).join('');
      empty.classList.toggle('hidden', tasks.length > 0);
      count.textContent = tasks.filter(t => !t.done).length;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('bg-slate-800', b.dataset.filter === filter);
        b.classList.toggle('text-white', b.dataset.filter === filter);
      });
    }

    $('#form').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = $('#input').value.trim();
      if (!text) return;
      tasks.unshift({ id: Date.now(), text, done: false });
      $('#input').value = '';
      save(); render();
    });

    list.addEventListener('click', (e) => {
      const id = Number(e.target.dataset.id);
      if (e.target.classList.contains('toggle')) {
        const t = tasks.find(x => x.id === id); if (t) t.done = e.target.checked;
      } else if (e.target.classList.contains('del')) {
        tasks = tasks.filter(x => x.id !== id);
      } else return;
      save(); render();
    });

    document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));
    $('#clear').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); save(); render(); });

    render();
  </script>
</body>
</html>`
  },
  {
    name: 'Pomodoro Timer',
    description: 'Focus timer with 25/5/15 minute cycles, completed sessions counter, and audio cue.',
    thumbnail_url: 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Focus Timer</title>
</head>
<body class="bg-rose-900 text-white font-sans min-h-screen flex items-center justify-center p-4 transition-colors duration-500" id="body">
  <div class="w-full max-w-md text-center">
    <h1 class="text-2xl font-bold mb-2">Focus Timer</h1>
    <p class="text-white/70 mb-8 text-sm">Pomodoro · 25 / 5 / 15</p>

    <div class="flex justify-center gap-1 mb-8 bg-black/20 rounded-full p-1">
      <button data-mode="focus" class="mode flex-1 py-2 rounded-full font-medium text-sm bg-white text-rose-900">Focus</button>
      <button data-mode="short" class="mode flex-1 py-2 rounded-full font-medium text-sm text-white/70 hover:text-white">Short break</button>
      <button data-mode="long" class="mode flex-1 py-2 rounded-full font-medium text-sm text-white/70 hover:text-white">Long break</button>
    </div>

    <div class="mb-10">
      <div id="time" class="text-8xl md:text-9xl font-extrabold tracking-tight font-mono">25:00</div>
    </div>

    <div class="flex justify-center gap-3 mb-12">
      <button id="toggle" class="bg-white text-rose-900 px-10 py-3 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition">START</button>
      <button id="reset" class="bg-white/15 hover:bg-white/25 px-5 rounded-full font-medium">Reset</button>
    </div>

    <div class="bg-black/20 rounded-2xl p-4 inline-block">
      <div class="text-3xl font-bold" id="completed">0</div>
      <div class="text-xs text-white/70 uppercase tracking-wider">Completed today</div>
    </div>
  </div>

  <audio id="ding" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="></audio>

  <script>
    const DURATIONS = { focus: 25*60, short: 5*60, long: 15*60 };
    const COLORS = { focus: 'bg-rose-900', short: 'bg-emerald-800', long: 'bg-indigo-900' };
    const TODAY = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem('pomo_v1') || '{}');
    let completed = (stored.date === TODAY) ? (stored.count || 0) : 0;
    let mode = 'focus', remaining = DURATIONS.focus, running = false, intervalId = null;

    const $ = (s) => document.querySelector(s);
    function fmt(s) { const m = Math.floor(s/60), r = s%60; return \`\${String(m).padStart(2,'0')}:\${String(r).padStart(2,'0')}\`; }
    function paint() {
      $('#time').textContent = fmt(remaining);
      $('#completed').textContent = completed;
      $('#body').className = $('#body').className.replace(/bg-(rose|emerald|indigo)-\\d+/g, '') + ' ' + COLORS[mode];
      $('#toggle').textContent = running ? 'PAUSE' : 'START';
      document.title = (running ? '⏱ ' : '') + fmt(remaining) + ' — Focus Timer';
      document.querySelectorAll('.mode').forEach(b => {
        const active = b.dataset.mode === mode;
        b.className = 'mode flex-1 py-2 rounded-full font-medium text-sm ' + (active ? 'bg-white text-rose-900' : 'text-white/70 hover:text-white');
      });
    }
    function setMode(m) { mode = m; remaining = DURATIONS[m]; stop(); paint(); }
    function tick() {
      remaining--;
      if (remaining <= 0) {
        clearInterval(intervalId); intervalId = null; running = false;
        try { $('#ding').play(); } catch {}
        if (mode === 'focus') {
          completed++;
          localStorage.setItem('pomo_v1', JSON.stringify({ date: TODAY, count: completed }));
        }
        setMode(mode === 'focus' ? 'short' : 'focus');
        return;
      }
      paint();
    }
    function start() { if (running) return; running = true; intervalId = setInterval(tick, 1000); paint(); }
    function stop() { running = false; if (intervalId) { clearInterval(intervalId); intervalId = null; } paint(); }

    $('#toggle').addEventListener('click', () => running ? stop() : start());
    $('#reset').addEventListener('click', () => { remaining = DURATIONS[mode]; stop(); paint(); });
    document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

    paint();
  </script>
</body>
</html>`
  },
  {
    name: 'Expense Tracker',
    description: 'Personal budget tracker with income, expenses, running balance, and category tagging.',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Budget</title>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen py-10 px-4">
  <div class="max-w-xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold">My Budget</h1>
      <p class="text-slate-400 text-sm">Track money in and out</p>
    </header>

    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 mb-6 shadow-xl">
      <div class="text-xs uppercase tracking-wider text-indigo-100 mb-1">Current balance</div>
      <div id="balance" class="text-4xl font-extrabold mb-4">$0.00</div>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-black/20 rounded-xl p-3">
          <div class="text-xs text-indigo-100">Income</div>
          <div id="income" class="text-xl font-bold text-emerald-300">+$0</div>
        </div>
        <div class="bg-black/20 rounded-xl p-3">
          <div class="text-xs text-indigo-100">Expense</div>
          <div id="expense" class="text-xl font-bold text-rose-300">-$0</div>
        </div>
      </div>
    </div>

    <form id="form" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 space-y-3">
      <input id="desc" type="text" placeholder="What was it for?" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none" />
      <div class="grid grid-cols-2 gap-3">
        <input id="amount" type="number" step="0.01" min="0.01" placeholder="Amount" required class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none" />
        <select id="cat" class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none">
          <option value="food">🍔 Food</option>
          <option value="transport">🚌 Transport</option>
          <option value="shopping">🛍 Shopping</option>
          <option value="bills">💡 Bills</option>
          <option value="income">💰 Income</option>
          <option value="other">📦 Other</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button type="submit" data-type="income" class="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl py-2.5 font-semibold">+ Income</button>
        <button type="submit" data-type="expense" class="flex-1 bg-rose-600 hover:bg-rose-500 rounded-xl py-2.5 font-semibold">- Expense</button>
      </div>
    </form>

    <h2 class="text-sm uppercase tracking-wider text-slate-500 mb-3">Recent</h2>
    <ul id="list" class="space-y-2"></ul>
    <p id="empty" class="text-center text-slate-600 py-8 text-sm">No transactions yet.</p>
  </div>

  <script>
    const KEY = 'budget_v1';
    let txns = JSON.parse(localStorage.getItem(KEY) || '[]');
    let pendingType = 'income';
    const $ = (s) => document.querySelector(s);

    function save() { localStorage.setItem(KEY, JSON.stringify(txns)); }
    function money(n) { return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    function render() {
      const income = txns.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
      const expense = txns.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
      $('#balance').textContent = (income - expense >= 0 ? '' : '-') + money(income - expense);
      $('#income').textContent = '+' + money(income);
      $('#expense').textContent = '-' + money(expense);
      $('#list').innerHTML = txns.slice(0,30).map(t => \`
        <li class="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg \${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}">\${{food:'🍔',transport:'🚌',shopping:'🛍',bills:'💡',income:'💰',other:'📦'}[t.cat] || '📦'}</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">\${t.desc.replace(/</g,'&lt;')}</div>
            <div class="text-xs text-slate-500">\${new Date(t.at).toLocaleDateString()}</div>
          </div>
          <div class="\${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'} font-bold">\${t.type === 'income' ? '+' : '-'}\${money(t.amount)}</div>
          <button data-id="\${t.id}" class="del text-slate-600 hover:text-red-400 ms-1">✕</button>
        </li>\`).join('');
      $('#empty').classList.toggle('hidden', txns.length > 0);
    }

    document.querySelectorAll('button[data-type]').forEach(b => b.addEventListener('click', () => pendingType = b.dataset.type));
    $('#form').addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = $('#desc').value.trim();
      const amount = parseFloat($('#amount').value);
      const cat = $('#cat').value;
      if (!desc || !amount) return;
      txns.unshift({ id: Date.now(), desc, amount, cat, type: pendingType, at: Date.now() });
      $('#desc').value = ''; $('#amount').value = '';
      save(); render();
    });
    $('#list').addEventListener('click', (e) => {
      if (!e.target.classList.contains('del')) return;
      const id = Number(e.target.dataset.id);
      txns = txns.filter(t => t.id !== id);
      save(); render();
    });

    render();
  </script>
</body>
</html>`
  },
  {
    name: 'Notes',
    description: 'Distraction-free notebook with autosave, search, and a clean two-pane layout.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Notes</title>
</head>
<body class="bg-amber-50 text-stone-800 font-sans h-screen overflow-hidden flex">
  <aside class="w-72 bg-white border-r border-stone-200 flex flex-col">
    <header class="p-4 border-b border-stone-200">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-lg font-bold">Notes</h1>
        <button id="newBtn" class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">+ New</button>
      </div>
      <input id="search" type="text" placeholder="Search…" class="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
    </header>
    <ul id="list" class="flex-1 overflow-y-auto"></ul>
  </aside>

  <main class="flex-1 flex flex-col">
    <input id="title" type="text" placeholder="Untitled" class="w-full bg-transparent px-10 pt-8 pb-2 text-3xl font-bold focus:outline-none" />
    <div class="px-10 text-xs text-stone-400 pb-4" id="meta">—</div>
    <textarea id="body" placeholder="Start writing…" class="flex-1 w-full bg-transparent px-10 pb-10 resize-none focus:outline-none leading-relaxed text-stone-700"></textarea>
  </main>

  <script>
    const KEY = 'notes_v1';
    let notes = JSON.parse(localStorage.getItem(KEY) || '[]');
    let activeId = notes[0]?.id;
    let query = '';
    const $ = (s) => document.querySelector(s);

    function save() { localStorage.setItem(KEY, JSON.stringify(notes)); }

    function render() {
      const filtered = notes.filter(n => !query || (n.title + n.body).toLowerCase().includes(query.toLowerCase()));
      $('#list').innerHTML = filtered.map(n => \`
        <li class="border-b border-stone-100">
          <button data-id="\${n.id}" class="w-full text-left p-4 hover:bg-amber-50 transition \${n.id === activeId ? 'bg-amber-100' : ''}">
            <div class="font-semibold text-sm truncate">\${(n.title || 'Untitled').replace(/</g,'&lt;')}</div>
            <div class="text-xs text-stone-500 truncate mt-0.5">\${(n.body || 'Empty note').slice(0,60).replace(/</g,'&lt;')}</div>
            <div class="text-[10px] text-stone-400 mt-1">\${new Date(n.at).toLocaleDateString()}</div>
          </button>
        </li>\`).join('') || '<li class="p-6 text-center text-stone-400 text-sm">No notes match.</li>';
      const active = notes.find(n => n.id === activeId);
      $('#title').value = active?.title || '';
      $('#body').value = active?.body || '';
      $('#meta').textContent = active ? 'Last edited ' + new Date(active.at).toLocaleString() : '—';
      $('#title').disabled = $('#body').disabled = !active;
    }

    function newNote() {
      const n = { id: Date.now(), title: '', body: '', at: Date.now() };
      notes.unshift(n); activeId = n.id; save(); render(); $('#title').focus();
    }

    $('#newBtn').addEventListener('click', newNote);
    $('#search').addEventListener('input', (e) => { query = e.target.value; render(); });
    $('#list').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-id]'); if (!btn) return;
      activeId = Number(btn.dataset.id); render();
    });
    const onEdit = () => {
      const n = notes.find(x => x.id === activeId); if (!n) return;
      n.title = $('#title').value; n.body = $('#body').value; n.at = Date.now();
      notes = [n, ...notes.filter(x => x.id !== n.id)]; // bubble to top on edit
      save();
      $('#meta').textContent = 'Last edited just now';
      // re-render list silently without overwriting current focus
      const filtered = notes.filter(x => !query || (x.title + x.body).toLowerCase().includes(query.toLowerCase()));
      $('#list').innerHTML = filtered.map(x => \`
        <li class="border-b border-stone-100">
          <button data-id="\${x.id}" class="w-full text-left p-4 hover:bg-amber-50 transition \${x.id === activeId ? 'bg-amber-100' : ''}">
            <div class="font-semibold text-sm truncate">\${(x.title || 'Untitled').replace(/</g,'&lt;')}</div>
            <div class="text-xs text-stone-500 truncate mt-0.5">\${(x.body || 'Empty note').slice(0,60).replace(/</g,'&lt;')}</div>
            <div class="text-[10px] text-stone-400 mt-1">\${new Date(x.at).toLocaleDateString()}</div>
          </button>
        </li>\`).join('');
    };
    $('#title').addEventListener('input', onEdit);
    $('#body').addEventListener('input', onEdit);

    if (notes.length === 0) newNote(); else render();
  </script>
</body>
</html>`
  },
  {
    name: 'Photo Gallery',
    description: 'Categorized photo grid with filter tabs and a click-to-open lightbox viewer.',
    thumbnail_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Gallery</title>
</head>
<body class="bg-stone-950 text-stone-100 font-sans min-h-screen">
  <header class="max-w-6xl mx-auto px-6 py-12">
    <h1 class="text-4xl font-extrabold mb-2">My Gallery</h1>
    <p class="text-stone-400">A small collection of recent work.</p>
  </header>

  <nav class="max-w-6xl mx-auto px-6 mb-6 flex gap-2 flex-wrap" id="tabs"></nav>

  <main class="max-w-6xl mx-auto px-6 pb-20">
    <div id="grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
  </main>

  <div id="lightbox" class="fixed inset-0 bg-black/95 hidden items-center justify-center z-50 p-4">
    <button id="prev" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl">‹</button>
    <button id="next" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl">›</button>
    <button id="close" class="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">✕</button>
    <img id="lbImg" class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
    <div id="lbCap" class="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm"></div>
  </div>

  <script>
    const photos = [
      { id: 1, cat: 'nature', caption: 'Misty mountain', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=900' },
      { id: 2, cat: 'city', caption: 'Tokyo at night', src: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=900' },
      { id: 3, cat: 'people', caption: 'Quiet portrait', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900' },
      { id: 4, cat: 'nature', caption: 'Forest light', src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=900' },
      { id: 5, cat: 'city', caption: 'Brooklyn bridge', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900' },
      { id: 6, cat: 'nature', caption: 'Desert dunes', src: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=900' },
      { id: 7, cat: 'people', caption: 'Street smile', src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=900' },
      { id: 8, cat: 'city', caption: 'Rainy reflections', src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=900' },
    ];
    const cats = ['all', ...new Set(photos.map(p => p.cat))];
    let active = 'all', current = 0;
    const $ = (s) => document.querySelector(s);

    function visible() { return active === 'all' ? photos : photos.filter(p => p.cat === active); }

    function paintTabs() {
      $('#tabs').innerHTML = cats.map(c => \`
        <button data-cat="\${c}" class="tab px-4 py-1.5 rounded-full text-sm font-medium capitalize transition \${c === active ? 'bg-white text-stone-900' : 'bg-stone-800 hover:bg-stone-700 text-stone-300'}">\${c}</button>
      \`).join('');
    }
    function paintGrid() {
      $('#grid').innerHTML = visible().map((p, i) => \`
        <button data-i="\${i}" class="aspect-square group overflow-hidden rounded-xl bg-stone-900">
          <img src="\${p.src}" alt="\${p.caption}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </button>\`).join('');
    }
    function openLB(i) {
      current = i;
      const p = visible()[i]; if (!p) return;
      $('#lbImg').src = p.src; $('#lbCap').textContent = p.caption;
      $('#lightbox').classList.replace('hidden','flex');
    }
    function closeLB() { $('#lightbox').classList.replace('flex','hidden'); }
    function move(d) { const v = visible(); openLB((current + d + v.length) % v.length); }

    $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (!b) return; active = b.dataset.cat; paintTabs(); paintGrid(); });
    $('#grid').addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) openLB(Number(b.dataset.i)); });
    $('#close').addEventListener('click', closeLB);
    $('#prev').addEventListener('click', () => move(-1));
    $('#next').addEventListener('click', () => move(1));
    document.addEventListener('keydown', (e) => {
      if ($('#lightbox').classList.contains('hidden')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    });

    paintTabs(); paintGrid();
  </script>
</body>
</html>`
  },
  {
    name: 'Link in Bio',
    description: 'Minimal personal links page in the style of Linktree, ready for social profiles.',
    thumbnail_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=600&auto=format&fit=crop',
    price: 0,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>@miloreed</title>
</head>
<body class="bg-gradient-to-b from-violet-600 via-fuchsia-600 to-rose-500 min-h-screen font-sans text-white py-12 px-4">
  <div class="max-w-md mx-auto text-center">
    <div class="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-3xl font-bold mb-4">
      MR
    </div>
    <h1 class="text-2xl font-bold mb-1">@miloreed</h1>
    <p class="text-white/80 mb-8 text-sm">Photographer · Brooklyn 🗽<br />Currently shooting analog portraits.</p>

    <div class="space-y-3">
      <a href="#" class="block w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl py-4 font-semibold transition-all hover:scale-[1.02]">📸 Portfolio</a>
      <a href="#" class="block w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl py-4 font-semibold transition-all hover:scale-[1.02]">🎞 Latest shoot — Brooklyn at dawn</a>
      <a href="#" class="block w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl py-4 font-semibold transition-all hover:scale-[1.02]">📬 Book a session</a>
      <a href="#" class="block w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl py-4 font-semibold transition-all hover:scale-[1.02]">📝 Read the journal</a>
      <a href="#" class="block w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 rounded-2xl py-4 font-semibold transition-all hover:scale-[1.02]">☕ Buy me a coffee</a>
    </div>

    <div class="flex justify-center gap-5 mt-10 text-sm">
      <a href="#" class="opacity-80 hover:opacity-100">Instagram</a>
      <a href="#" class="opacity-80 hover:opacity-100">Twitter</a>
      <a href="#" class="opacity-80 hover:opacity-100">Email</a>
    </div>
  </div>
</body>
</html>`
  }
];

async function main() {
  try {
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, name, password_hash, plan)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [SYSTEM_EMAIL, SYSTEM_NAME, 'noop', 'enterprise']
    );
    const authorId = userRows[0].id;
    const authorName = userRows[0].name;

    for (const p of projects) {
      const { rows: existing } = await pool.query(
        'SELECT id FROM projects WHERE name = $1 AND user_id = $2',
        [p.name, authorId]
      );
      if (existing.length > 0) {
        console.log(`Skipped existing: ${p.name}`);
        continue;
      }

      const likes = Math.floor(Math.random() * 500) + 50;
      const views = likes * (Math.floor(Math.random() * 10) + 2);
      await pool.query(
        `INSERT INTO projects (user_id, name, description, thumbnail_url, price, code, author, is_public, likes, views)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)`,
        [authorId, p.name, p.description, p.thumbnail_url, p.price, p.code, authorName, likes, views]
      );
      console.log(`Inserted: ${p.name}`);
    }

    console.log('Seeding complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
