// Tier rate limiting (spec §6). DB-backed so it works on Supabase today;
// swap getUsage's counting queries for Upstash later without touching callers.

export const PLAN_LIMITS = {
  free: { generationsPerDay: 3, maxProjects: 5 },
  pro: { generationsPerDay: 50, maxProjects: Infinity },
};

export function planLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

// Current usage vs. the plan's limits. generations_today counts successful
// blueprint generations logged today; projects_count is total owned projects.
export async function getUsage(pool, userId, plan) {
  const limits = planLimits(plan);
  const [{ rows: g }, { rows: p }] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS c FROM token_usage
        WHERE user_id = $1 AND action = 'blueprint_generate'
          AND created_at >= date_trunc('day', now())`,
      [userId]
    ),
    pool.query('SELECT COUNT(*)::int AS c FROM projects WHERE user_id = $1', [userId]),
  ]);
  return {
    plan: plan || 'free',
    generations_today: g[0].c,
    generations_limit: limits.generationsPerDay,
    projects_count: p[0].c,
    projects_limit: limits.maxProjects === Infinity ? null : limits.maxProjects,
  };
}

export function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight - now) / 1000);
}
