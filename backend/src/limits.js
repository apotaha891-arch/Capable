// Tier rate limiting (spec §6). DB-backed so it works on Supabase today;
// swap the counting queries for Upstash later without touching callers.

// Plan capabilities. Pro runs the SAME radical-model code as Influence — the only
// difference is application-layer throttling/elevation driven by these constants:
//   • generationsPerDay — daily blueprint generations
//   • maxProjects       — projects a user may CREATE (build/edit)
//   • deploysIncluded   — projects a user may DEPLOY (publish) for free; extra
//                          deployable slots are a paid add-on ($5/mo each)
//   • monthlyTokens     — hard monthly compute ceiling (the real margin guardrail)
//   • maxOutputTokens   — extended context/output budget per generation
//   • priority          — elevated/instant processing (forward hook; no queue yet)
export const PLAN_LIMITS = {
  free:       { generationsPerDay: 2,        maxProjects: 1,        deploysIncluded: 1,        monthlyTokens: 150000,   maxOutputTokens: 16384, priority: false },
  influence:  { generationsPerDay: 8,        maxProjects: 5,        deploysIncluded: 2,        monthlyTokens: 1200000,  maxOutputTokens: 32768, priority: false },
  pro:        { generationsPerDay: 32,       maxProjects: 25,       deploysIncluded: 10,       monthlyTokens: 5000000,  maxOutputTokens: 65536, priority: true  }, // 4× Influence compute
  enterprise: { generationsPerDay: Infinity, maxProjects: Infinity, deploysIncluded: Infinity, monthlyTokens: Infinity, maxOutputTokens: 65536, priority: true  },
};

export function planLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

// The output/context token budget for a plan — the lever for "extended context".
export function planMaxOutputTokens(plan) {
  return planLimits(plan).maxOutputTokens;
}

// The monthly compute ceiling for a plan (number, or Infinity for unlimited).
export function monthlyTokenBudget(plan) {
  return planLimits(plan).monthlyTokens;
}

// Tokens consumed by the user in the current calendar month, across all actions.
export async function getMonthlyTokens(pool, userId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(tokens_in + tokens_out), 0)::bigint AS used
       FROM token_usage
      WHERE user_id = $1 AND created_at >= date_trunc('month', now())`,
    [userId]
  );
  return Number(rows[0].used);
}

// Deployable-project cap = plan's included slots + any purchased extra slots.
export function effectiveDeployLimit(plan, extraSlots = 0) {
  const inc = planLimits(plan).deploysIncluded;
  return inc === Infinity ? Infinity : inc + (extraSlots || 0);
}

// Current usage vs. the plan's limits. generations_today counts successful blueprint
// generations today; projects_count is created projects; deploys_count is published.
export async function getUsage(pool, userId, plan, extraSlots = 0) {
  const limits = planLimits(plan);
  const [{ rows: g }, { rows: p }, { rows: pub }, monthlyUsed] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS c FROM token_usage
        WHERE user_id = $1 AND action = 'blueprint_generate'
          AND created_at >= date_trunc('day', now())`,
      [userId]
    ),
    pool.query('SELECT COUNT(*)::int AS c FROM projects WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM projects WHERE user_id = $1 AND is_published = true', [userId]),
    getMonthlyTokens(pool, userId),
  ]);
  const deployLimit = effectiveDeployLimit(plan, extraSlots);
  return {
    plan: plan || 'free',
    generations_today: g[0].c,
    generations_limit: limits.generationsPerDay === Infinity ? null : limits.generationsPerDay,
    projects_count: p[0].c,
    projects_limit: limits.maxProjects === Infinity ? null : limits.maxProjects,
    deploys_count: pub[0].c,
    deploys_limit: deployLimit === Infinity ? null : deployLimit,
    monthly_tokens_used: monthlyUsed,
    monthly_tokens_limit: limits.monthlyTokens === Infinity ? null : limits.monthlyTokens,
    priority: limits.priority,
  };
}

export function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight - now) / 1000);
}
