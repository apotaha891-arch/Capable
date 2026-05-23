import Database from 'better-sqlite3';
const db = new Database('projects.db', { verbose: console.log });

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

const projects = [
    {
      id: 1,
      name: "E-commerce Storefront",
      author: "Sarah Designs",
      likes: 124,
      views: "1.2k",
      isPublic: true,
      code: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ShopHub - Premium Store</title>
      <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50">
      <nav class="bg-white shadow">
          <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 class="text-2xl font-bold text-indigo-600">ShopHub</h1>
              <div class="flex gap-4">
                  <button class="text-gray-600 hover:text-gray-900">Shop</button>
                  <button class="text-gray-600 hover:text-gray-900">Cart (3)</button>
                  <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg">Login</button>
              </div>
          </div>
      </nav>
      
      <div class="max-w-6xl mx-auto px-4 py-12">
          <h2 class="text-4xl font-bold mb-8">Featured Products</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-white rounded-lg shadow overflow-hidden">
                  <div class="bg-gradient-to-br from-blue-400 to-blue-600 h-48"></div>
                  <div class="p-4">
                      <h3 class="font-bold text-lg">Premium Headphones</h3>
                      <p class="text-gray-600 text-sm mb-4">High-quality sound with noise cancellation</p>
                      <div class="flex justify-between items-center">
                          <span class="text-2xl font-bold text-indigo-600">$199</span>
                          <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg">Add</button>
                      </div>
                  </div>
              </div>
              <div class="bg-white rounded-lg shadow overflow-hidden">
                  <div class="bg-gradient-to-br from-purple-400 to-purple-600 h-48"></div>
                  <div class="p-4">
                      <h3 class="font-bold text-lg">Wireless Mouse</h3>
                      <p class="text-gray-600 text-sm mb-4">Ergonomic design for all-day comfort</p>
                      <div class="flex justify-between items-center">
                          <span class="text-2xl font-bold text-indigo-600">$49</span>
                          <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg">Add</button>
                      </div>
                  </div>
              </div>
              <div class="bg-white rounded-lg shadow overflow-hidden">
                  <div class="bg-gradient-to-br from-pink-400 to-pink-600 h-48"></div>
                  <div class="p-4">
                      <h3 class="font-bold text-lg">USB-C Hub</h3>
                      <p class="text-gray-600 text-sm mb-4">7-in-1 connectivity solution</p>
                      <div class="flex justify-between items-center">
                          <span class="text-2xl font-bold text-indigo-600">$79</span>
                          <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg">Add</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </body>
  </html>`,
    },
    {
      id: 2,
      name: "Crypto Dashboard",
      author: "Web3Dev",
      likes: 89,
      views: "856",
      isPublic: true,
      code: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CryptoTracker - Live Market</title>
      <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-900 text-white">
      <div class="max-w-6xl mx-auto px-4 py-8">
          <h1 class="text-4xl font-bold mb-8">Crypto Market Tracker</h1>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <p class="text-slate-400 mb-2">Bitcoin (BTC)</p>
                  <p class="text-3xl font-bold mb-2">$67,342</p>
                  <p class="text-green-500">↑ 3.2% (24h)</p>
              </div>
              <div class="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <p class="text-slate-400 mb-2">Ethereum (ETH)</p>
                  <p class="text-3xl font-bold mb-2">$3,521</p>
                  <p class="text-green-500">↑ 2.8% (24h)</p>
              </div>
              <div class="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <p class="text-slate-400 mb-2">Solana (SOL)</p>
                  <p class="text-3xl font-bold mb-2">$142.65</p>
                  <p class="text-red-500">↓ 1.5% (24h)</p>
              </div>
          </div>
  
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 class="text-xl font-bold mb-4">Portfolio Value</h2>
              <div class="bg-slate-900 rounded p-4 h-64 flex items-center justify-center">
                  <p class="text-slate-500">Chart visualization placeholder</p>
              </div>
          </div>
      </div>
  </body>
  </html>`,
    },
    {
      id: 3,
      name: "Travel Blog Template",
      author: "Wanderlust",
      likes: 230,
      views: "3.4k",
      isPublic: true,
      code: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wanderlust - Travel Blog</title>
      <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white">
      <header class="bg-gradient-to-r from-blue-500 to-teal-500 text-white py-12">
          <div class="max-w-4xl mx-auto px-4 text-center">
              <h1 class="text-5xl font-bold mb-2">Wanderlust</h1>
              <p class="text-xl">Stories from around the world</p>
          </div>
      </header>
  
      <main class="max-w-4xl mx-auto px-4 py-12">
          <article class="mb-12">
              <div class="bg-gradient-to-b from-orange-300 to-red-300 h-96 rounded-lg mb-6"></div>
              <h2 class="text-3xl font-bold mb-2">Exploring the Streets of Tokyo</h2>
              <p class="text-gray-600 mb-4">Posted on May 20, 2026 by Sarah Chen</p>
              <p class="text-gray-800 leading-relaxed mb-4">
                  Tokyo is a city that never sleeps, where ancient temples stand beside modern skyscrapers. 
                  From the vibrant energy of Shibuya to the tranquil gardens of the Imperial Palace, 
                  every corner offers something new to discover.
              </p>
              <button class="text-blue-600 font-semibold hover:underline">Read More →</button>
          </article>
  
          <article class="mb-12">
              <div class="bg-gradient-to-b from-green-300 to-emerald-300 h-96 rounded-lg mb-6"></div>
              <h2 class="text-3xl font-bold mb-2">Hidden Gems of Barcelona</h2>
              <p class="text-gray-600 mb-4">Posted on May 18, 2026 by Marco Rossi</p>
              <p class="text-gray-800 leading-relaxed mb-4">
                  Beyond the famous Sagrada Família and Park Güell, Barcelona has countless hidden treasures.
                  Discover charming neighborhoods, local markets, and authentic Catalan cuisine.
              </p>
              <button class="text-blue-600 font-semibold hover:underline">Read More →</button>
          </article>
      </main>
  </body>
  </html>`,
    },
    {
      id: 4,
      name: "Fitness Tracker UI",
      author: "FitLife",
      likes: 56,
      views: "412",
      isPublic: true,
      code: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FitTrack - Your Fitness Companion</title>
      <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100">
      <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-b-3xl">
          <h1 class="text-3xl font-bold mb-2">Welcome back, Alex!</h1>
          <p class="text-green-100">You're 342 steps away from your daily goal</p>
      </div>
  
      <div class="max-w-2xl mx-auto px-4 py-8">
          <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 class="text-xl font-bold mb-4">Today's Activity</h2>
              <div class="space-y-4">
                  <div>
                      <div class="flex justify-between mb-2">
                          <span class="font-semibold">Steps</span>
                          <span class="text-green-600">8,658 / 10,000</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-green-500 h-2 rounded-full" style="width: 86.58%"></div>
                      </div>
                  </div>
                  <div>
                      <div class="flex justify-between mb-2">
                          <span class="font-semibold">Calories</span>
                          <span class="text-blue-600">450 / 600</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-blue-500 h-2 rounded-full" style="width: 75%"></div>
                      </div>
                  </div>
                  <div>
                      <div class="flex justify-between mb-2">
                          <span class="font-semibold">Water</span>
                          <span class="text-cyan-600">6 / 8</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-cyan-500 h-2 rounded-full" style="width: 75%"></div>
                      </div>
                  </div>
              </div>
          </div>
  
          <div class="grid grid-cols-2 gap-4">
              <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg">Log Workout</button>
              <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg">View Stats</button>
          </div>
      </div>
  </body>
  </html>`,
    },
  ];

const stmt = db.prepare('INSERT INTO projects (name, code, author, likes, views, isPublic, lastEdited) VALUES (?, ?, ?, ?, ?, ?, ?)');

for (const project of projects) {
    stmt.run(project.name, project.code, project.author, project.likes, project.views, project.isPublic ? 1 : 0, new Date().toISOString());
}

console.log('Database seeded successfully!');