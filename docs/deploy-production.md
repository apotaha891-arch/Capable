# Production deployment — Vercel (frontend) + Railway (backend) + Supabase (DB)

Architecture: **browser → Vercel (SPA) → Railway (Express API) → Supabase (Postgres)**.
Stripe webhook → the **Railway** URL.

---

## 0. Push the code first (required)
Railway and Vercel deploy from GitHub. All recent work is local until pushed:
```
git add -A && git commit -m "..." && git push
```
Without this, production keeps running the old code.

## 1. Backend → Railway
1. Railway → **New Project → Deploy from GitHub repo** → pick this repo.
2. Service **Settings → Root Directory = `backend`** (it's a monorepo). `railway.json`
   already sets the start command + healthcheck.
3. **Add a Volume** → mount path **`/data`** (any path; we point `HOSTED_DIR` at it).
4. **Variables** (Settings → Variables) — set:
   - `DATABASE_URL` = the Supabase connection string
   - `HOSTED_DIR` = `/data/hosted`
   - `BASE_URL` = the Railway public URL (e.g. `https://capable-api.up.railway.app`)
   - `CORS_ORIGINS` = `https://capable.live`
   - `FRONTEND_URL` = `https://capable.live`
   - `JWT_SECRET`, `ADMIN_EMAILS`
   - `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY` (+ any model overrides)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (webhook secret added in step 3 below)
   - `STRIPE_PRICE_INFLUENCE` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_DEPLOY_SLOT`
5. Deploy → grab the public URL → confirm `https://<railway>/api/blueprint/health` returns JSON.

## 2. Frontend → Vercel
1. Vercel project → **Settings → Environment Variables** → add
   `VITE_API_URL = https://<railway-url>`.
2. **Redeploy** (env vars are baked at build time — a redeploy is required).
3. Confirm the app at `capable.live` now calls the Railway API (not localhost).

## 3. Stripe webhook
1. Stripe Dashboard → Developers → **Webhooks → Add endpoint**.
2. URL = `https://<railway-url>/api/stripe/webhook`.
3. Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the signing secret → set `STRIPE_WEBHOOK_SECRET` in Railway → redeploy.

## 4. Stripe prices
Create 3 recurring Prices with these lookup keys: `capable_influence_monthly` ($19),
`capable_pro_monthly` ($49), `capable_deploy_slot_monthly` ($5, quantity-adjustable).

## Verify
- `GET https://<railway>/api/blueprint/health` → JSON
- App at capable.live: sign up, generate, subscribe → real Stripe Checkout opens.
- `stripe trigger checkout.session.completed` → 200 in Railway logs.
