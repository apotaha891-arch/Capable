import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    {
      name: 'copilot-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/copilot' && req.method === 'POST') {
            try {
              const body = await new Promise((resolve, reject) => {
                let data = '';
                req.on('data', chunk => { data += chunk; });
                req.on('end', () => {
                  try { resolve(JSON.parse(data)); }
                  catch (e) { reject(e); }
                });
                req.on('error', err => reject(err));
              });

              const { provider, host, model, token, messages, hfPrompt } = body;

              if (provider === 'ollama') {
                const ollamaUrl = `${host || 'http://localhost:11434'}/api/chat`;
                const response = await fetch(ollamaUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: model || 'llama3',
                    messages: messages,
                    stream: false
                  })
                });

                if (!response.ok) {
                  throw new Error(`Ollama returned status ${response.status}`);
                }

                const responseText = await response.text();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(responseText);
                return;
              }

              if (provider === 'huggingface') {
                const hfUrl = `https://api-inference.huggingface.co/models/${model || 'meta-llama/Meta-Llama-3-8B-Instruct'}`;
                const headers = { 'Content-Type': 'application/json' };
                if (token) {
                  headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(hfUrl, {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify({
                    inputs: hfPrompt,
                    parameters: { max_new_tokens: 1500, return_full_text: false }
                  })
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Hugging Face returned status ${response.status}`);
                }

                const responseText = await response.text();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(responseText);
                return;
              }

              throw new Error('Invalid provider specified');
            } catch (error) {
              console.error('[Copilot Proxy Error]:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ]
});
