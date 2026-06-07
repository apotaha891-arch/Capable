# Capable "Radical" Business Model — Implementation Plan

Source of truth: **`plan-businessModel.prompt.md`**
(VS Code prompts dir: `AppData/Roaming/Code/User/prompts/plan-businessModel.prompt.md`).

> The "quantum resonance marketplace": charge for **influence, commitment, and
> propagation** — not just for product. Value emerges when the system is *observed*;
> revenue comes from the act of engagement itself.

This plan converts that model into concrete engineering work and maps each income
stream onto code that **already exists** from the prior session.

---

## 0. Current state — what's already built

The prior session already scaffolded streams 1–3. This is the correct direction
(not cleanup). What exists today:

| Model stream | Status | Where it lives |
|---|---|---|
| **1. Observer-fee subscriptions** ("resonance pass") | 🟡 Scaffolded | `InfluencePage.jsx`, `POST /api/biz/subscribe` (`plan='influence'`, $49), `users.plan` |
| **2. Behavioral commitment vaults** | 🟡 Scaffolded | `CommitmentPage.jsx`, `commitments` table (stake/reward/target_date/status), `GET/POST /api/biz/commitments`, `.../complete` |
| **3. Meme-based licensing** | 🟡 Scaffolded | `MarketplacePage.jsx`, `licensed_assets` table (slug/price/metadata), `GET /api/biz/assets`, `.../buy` |
| **4. Ecosystem fitness subsidies** (partner layer) | 🔴 Missing | — |
| **Influence-event tracking** (the conceptual core) | ✅ Done (Workstream A) | `influence_events` table, `recordInfluence()`, emitted from subscribe/commitment/license, `GET /api/biz/resonance`, resonance panel on `InfluencePage` |
| **Adaptive / probabilistic pricing** ("collapse the outcome") | 🔴 Missing | prices are fixed constants |
| **Real payments** | ✅ Done (Workstream B) | Stripe Checkout for subscriptions + one-time licenses, webhook-driven fulfillment (`/api/stripe/webhook`), idempotent `transactions.stripe_ref`, billing portal. Falls back to simulated mode when keys absent |

**Honest gap:** the scaffolds are UI + CRUD with fake money. The *defining* ideas of
this model — tracking influence events, probabilistic/adaptive pricing, and the
partner ecosystem with an "adaptive fund" — are not built yet. That's the real work.

---

## Workstream A — Influence-event tracking ✅ DONE

The model says: *"Build a core platform that tracks influence events, not just
transactions."* Everything else (adaptive pricing, the adaptive fund, partner
subsidies) reads from this.

1. **New table `influence_events`**: `id, user_id, event_type, weight NUMERIC,
   target (what was influenced), metadata JSONB, created_at`. Event types: feature
   vote, experiment opt-in, engagement streak, commitment progress, meme adoption,
   referral/propagation.
2. **Emit events** from existing flows: subscribe → `observer_fee`; commitment
   create/complete → `commitment_stake`/`commitment_payout`; asset buy → `meme_license`;
   plus passive engagement from `page_events`.
3. **User "resonance" score**: a derived rolling aggregate of weighted influence
   events per user. This is the number that "raises the probability their behavior
   converts" (model stream 1).

**Deliverable:** every monetizable action also records an influence event; each user
has a live resonance score.

---

## Pricing & guardrails ✅ DONE

- Plans: free $0 / Influence $19 / Pro $49 (4× Influence compute) / enterprise.
- **Monthly per-plan token budget** (`monthlyTokens`, calendar-month window via
  `getMonthlyTokens`) — the hard margin ceiling, enforced in both generation routes
  (402/429 `reason: monthly_tokens`). free 150k · Influence 1.2M · Pro 5M.
- **Capable 2/3 gated to Pro+** — non-Pro requests auto-downgrade to capable1 (never
  dead-end) and surface a `tier_locked` upsell; tiers locked in the Builder selector.
- **Deployable-slots layer** — create ≠ deploy. `deploysIncluded`: free 1 · Influence
  2 · Pro 10. Extra slots are a $5/mo recurring add-on (Stripe price lookup_key
  `capable_deploy_slot_monthly`, quantity-adjustable). Enforced in both publish paths
  (402 `deploy_limit_reached`); purchase flow in `ProjectPanel`.

## Custom-domain monetization ✅ DONE (Workstream C)

Custom-domain infra already existed (DNS TXT verify + host routing). Added the
**billing/gating layer**, no separate charge — bundled into plans:
- **free**: locked (set-domain → 403 `upgrade_required`; UI shows upgrade card).
- **Influence ($19)**: **1** custom domain, served with a **"Powered by Capable"**
  badge (viral hook) injected at serve time.
- **Pro/enterprise ($49+)**: unlimited custom domains, **unbranded**.
- Plan caps in `PLAN_LIMITS` (`customDomains`, `domainBranded`); gated at set-domain
  (PUT), DNS-instructions, and **serve time** (host routing checks the owner's plan,
  so a downgrade stops serving the domain and re-adds the badge). 402
  `domain_limit_reached` when over the plan's count.

## Workstream B — Real payments ✅ DONE

Same as any monetization: there is no processor today.

1. Add a payment processor (Stripe recommended) to `backend/package.json`.
2. Replace simulated instant-`paid` inserts in `/api/biz/subscribe`, `commitments`,
   and `assets/:id/buy` with real Checkout/Subscriptions + webhook-driven
   `transactions`.
3. Handle recurring billing for the observer-fee pass and one-off charges for
   commitment stakes and meme licenses. Failed-payment → revert plan/access.

**Deliverable:** real money behind streams 1–3 instead of fake `paid` rows.

---

## Workstream C — Observer-fee subscriptions (stream 1)

Scaffold exists (`InfluencePage` + `/api/biz/subscribe`). Make it real:

1. Wire subscribe to Workstream B billing (recurring monthly "resonance pass").
2. **Buy influence, not just access:** the pass should measurably increase the user's
   resonance weight (Workstream A) — paid users' influence events carry higher weight
   in feature voting / experiments / adaptive pricing.
3. Surface what the pass actually collapses: a dashboard panel of "experiments you can
   steer" and "features you can vote on," gated by an active pass.

**Deliverable:** the pass demonstrably gives weighted influence over real product
decisions, billed monthly.

---

## Workstream D — Challenges (replaces commitment vaults) ✅ DONE

Pivoted away from user-staked commitments (weak incentive, reversed economics, escrow
legal risk). Replaced with **admin-issued challenges**:
- Admin creates a challenge: title, measurable goal (`publish_count` / `project_count`
  / `generation_count`) + target, reward (**tokens** / **subscription credit** /
  **cash** — chosen per challenge), optional end date.
- Users join (`/challenges`); progress is measured automatically from real activity
  (current metric − baseline-at-join); on hitting the goal in-window the reward is
  granted automatically (idempotent).
- Rewards: tokens → `token_grants` added to the monthly budget; credit →
  `users.account_credit`; cash → a `pending` payout transaction for an admin.
- Tables: `challenges`, `challenge_participants`, `token_grants`. Admin UI:
  `ChallengesTab`. User UI: `ChallengesPage` (`/challenges`; `/commitment` redirects).
- Old `/api/biz/commitments*` routes removed; `challenge_win` influence event added.

### Superseded — Workstream D (old): Behavioral commitment vaults (stream 2)

`commitments` table + endpoints exist (stake_amount, reward_amount, target_date).
Gaps that make it a real "vault":

1. **Stake = real escrow** (Workstream B): charge/hold the stake on creation; pay
   reward or forfeit on outcome. Today `/complete` just credits a reward with no
   staked money at risk.
2. **Verification of outcome:** completion is currently self-serve. Tie it to a
   measurable signal (e.g. project published, generation count, streak) so payout is
   earned, not claimed.
3. **Loss-aversion mechanics:** forfeit path on `target_date` miss (a scheduled job
   flips `active`→`failed` and captures the stake as platform revenue / adaptive fund).
4. Emit `commitment_*` influence events (Workstream A).

**Deliverable:** staked vaults with real escrow, outcome verification, and a
forfeit-on-miss job.

---

## Workstream E — Meme-based licensing ✅ DONE

Turned the marketplace into real creator-listed modules with clone-based adoption:
- **List a project**: `POST /api/biz/assets` lets a user publish one of their own
  projects as a licensable module (`creator_id`, `project_id`, price). UI: "List a
  project" form on `MarketplacePage`.
- **Adoption = clone**: buying/adopting a module deep-copies the linked project into
  the buyer's account (shared `cloneProjectForUser`, reused by the clone route).
- **Fitness ranking**: `adoption_count` bumped per adoption; `GET /api/biz/assets`
  orders by it; cards show a 🔥 count + creator name.
- **Creator payout**: `LICENSE_CREATOR_SHARE = 0.7` → creator gets 70% as
  `account_credit` + a `payout` transaction; platform keeps 30%. Buyer + creator both
  get `meme_license` influence. Works on free/simulated and Stripe-webhook paths.
- Schema: `licensed_assets` + `creator_id`, `project_id`, `adoption_count`.

### Original notes — Workstream E (meme-based licensing, stream 3)

`licensed_assets` + `MarketplacePage` exist. Turn it into propagation revenue:

1. **Licensable modules** should be real, reusable artifacts (templates / blueprint
   recipes / "rituals"), linkable to a `project` or blueprint — not just seeded rows.
2. **Propagation tracking:** count adoptions/clones per asset; emit `meme_license`
   influence events; surface a "fitness" rank (high-adoption = high-fitness).
3. Pay original creators a cut on each license (needs Workstream B + payout path).
4. Reuse the existing Explore/clone machinery (`/api/projects/:id/clone`) as the
   adoption mechanism rather than a parallel system.

**Deliverable:** real licensable modules with adoption tracking and creator payouts.

---

## Workstream F — Ecosystem partners + adaptive fund ✅ DONE

- **Partners**: `users.is_partner` (admin-granted via UsersTab toggle). Partners unlock
  the **adaptive insights** product (`GET /api/biz/insights`: influence-by-type, top
  modules by fitness, fund balance) and are weighted **1.5×** in fund reallocation.
- **Adaptive fund**: `adaptive_fund` ledger. **10%** of platform revenue (subscriptions
  + the platform's license cut) auto-contributes (`contributeToFund`). Admin
  `POST /api/admin/adaptive-fund/reallocate` reinvests the whole balance into the
  highest-resonance users (partners weighted) as account credit — "natural selection."
- Admin UI: **Ecosystem tab** (balance, reallocate, insights).

## Workstream G — Adaptive (resonance) pricing ✅ DONE

- `adaptiveDiscount(resonance)`: ≥5 → 5%, ≥20 → 10%, ≥50 → 15%. Engagement "collapses"
  pricing in the user's favor.
- Applied to **subscriptions** (simulated amount; real Stripe via a dynamically-created
  `percent_off` coupon) and **marketplace adoption** (discounted `unit_amount`).
- `GET /api/biz/adaptive-price` surfaces the user's discount + adjusted plan prices;
  shown on `InfluencePage` ("Your resonance earns N% off").

### Original notes — Workstream F (stream 4) / Workstream G

This is the entirely-missing partner layer — the model's stream 4.

1. **Partner role** (`plan='partner'` or a `partners` table): partners improve the
   "fitness landscape" and earn from transaction fees + "adaptive insights."
2. **Transaction fees** on marketplace licensing / clones routed to partners.
3. **Adaptive insights product:** sell aggregated, anonymized influence/fitness
   analytics back to participants (reads Workstream A data).
4. **Adaptive fund:** a small pool that reinvests into the highest-performing
   behavioral loops (top resonance/fitness cohorts) — automated reallocation job.

**Deliverable:** a partner tier with fee-sharing, an insights product, and an
automated adaptive-fund reallocation.

---

## Workstream G — Adaptive / probabilistic pricing ("collapse the outcome")

The model's headline idea: offerings are *"a probability distribution over outcomes,"*
and engagement shifts the collapse in the user's favor.

1. Replace fixed prices (the $49 constant, asset `price`) with a pricing function of
   the user's **resonance score** (Workstream A): higher engagement → better adaptive
   price / higher conversion probability.
2. Run it as experiments first (A/B), logging outcomes as influence events to close
   the loop.

**Deliverable:** prices/offers that adapt to per-user resonance instead of constants.

---

## Sequencing

1. **A — Influence-event tracking** (foundation everything else reads).
2. **B — Real payments** (unblocks money in C/D/E/F).
3. **C — Observer-fee pass** + **D — Commitment vaults** + **E — Meme licensing**
   (harden the three existing scaffolds into real, paid, tracked flows).
4. **F — Ecosystem/partner layer + adaptive fund** (new, largest).
5. **G — Adaptive pricing** (depends on A's resonance score; ship as experiments).

---

## Open questions

1. **Pricing of the resonance pass** and whether influence weight scales with tier or
   with engagement (or both).
2. **Commitment escrow legality/risk** — real staked money has compliance implications;
   confirm scope (real cash vs. in-app credits).
3. **Outcome-verification signals** for commitments (what counts as "achieved").
4. **Payment processor** + payout mechanism for creator/partner cuts.
5. **What "adaptive insights" we can sell** without violating user privacy/GDPR.
6. **Adaptive-fund mechanics** — how reallocation decisions are made and bounded.
