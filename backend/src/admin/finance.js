// Financial analytics for the admin panel: cashflow history, current MRR,
// forecast, and rule-based recommendations. All amounts are plain dollars
// (NUMERIC) stored in the `transactions` table.

// Monthly recurring revenue per paid plan (USD). Mirrors the public pricing.
export const PLAN_MRR = { free: 0, pro: 49, enterprise: 199 };

// Assumed cash on hand at the very first recorded month. Cumulative net is
// added on top of this to derive the current bank balance / runway.
const STARTING_CASH = 25000;

const INCOME_TYPES = ['subscription', 'template_sale', 'manual_income'];
const EXPENSE_TYPES = ['expense', 'refund', 'payout'];

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Build the last `count` month keys ending at the current month (oldest first).
function lastMonths(count) {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({ key: monthKey(d), label: d.toLocaleString('en-US', { month: 'short' }), date: d });
  }
  return out;
}

// Aggregate income/expense per month for the last `months` months.
export async function monthlySeries(pool, months = 6) {
  const { rows } = await pool.query(
    `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS m,
            type,
            COALESCE(SUM(amount), 0)::float AS total
       FROM transactions
      WHERE created_at >= date_trunc('month', now()) - ($1::int - 1) * interval '1 month'
      GROUP BY 1, 2`,
    [months]
  );

  const byMonth = {};
  for (const r of rows) {
    const slot = (byMonth[r.m] ||= { income: 0, expense: 0 });
    if (INCOME_TYPES.includes(r.type)) slot.income += r.total;
    else if (EXPENSE_TYPES.includes(r.type)) slot.expense += Math.abs(r.total);
  }

  return lastMonths(months).map(({ key, label }) => {
    const s = byMonth[key] || { income: 0, expense: 0 };
    return {
      month: key,
      label,
      income: Math.round(s.income),
      expense: Math.round(s.expense),
      net: Math.round(s.income - s.expense),
    };
  });
}

// Current MRR derived from live plan distribution (not historical billing).
export async function currentMRR(pool) {
  const { rows } = await pool.query(
    `SELECT plan, COUNT(*)::int AS c FROM users GROUP BY plan`
  );
  let mrr = 0;
  const planCounts = { free: 0, pro: 0, enterprise: 0 };
  for (const r of rows) {
    planCounts[r.plan] = (planCounts[r.plan] || 0) + r.c;
    mrr += (PLAN_MRR[r.plan] || 0) * r.c;
  }
  const payingUsers = planCounts.pro + planCounts.enterprise;
  return { mrr, planCounts, payingUsers, arpu: payingUsers ? Math.round(mrr / payingUsers) : 0 };
}

// Simple forecast: project the next `ahead` months from the average
// month-over-month net growth rate of the recent series.
export function forecast(series, ahead = 3) {
  const nets = series.map(s => s.net);
  // average MoM growth on income (more stable than net which can flip sign)
  const incomes = series.map(s => s.income).filter(v => v > 0);
  let growth = 0;
  if (incomes.length >= 2) {
    const rates = [];
    for (let i = 1; i < incomes.length; i++) {
      if (incomes[i - 1] > 0) rates.push((incomes[i] - incomes[i - 1]) / incomes[i - 1]);
    }
    growth = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  }
  // clamp to a sane band so a single spike doesn't explode the projection
  growth = Math.max(-0.5, Math.min(0.6, growth));

  const lastIncome = series.length ? series[series.length - 1].income : 0;
  const avgExpense = series.length
    ? Math.round(series.reduce((a, s) => a + s.expense, 0) / series.length)
    : 0;

  const now = new Date();
  const out = [];
  let projIncome = lastIncome;
  for (let i = 1; i <= ahead; i++) {
    projIncome = Math.round(projIncome * (1 + growth));
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    out.push({
      month: monthKey(d),
      label: d.toLocaleString('en-US', { month: 'short' }),
      income: projIncome,
      expense: avgExpense,
      net: projIncome - avgExpense,
      projected: true,
    });
  }
  return { growthRate: Math.round(growth * 1000) / 10, projection: out };
}

// Cumulative cash position + runway.
export function cashPosition(series, projection) {
  const cumulativeNet = series.reduce((a, s) => a + s.net, 0);
  const cash = STARTING_CASH + cumulativeNet;
  const recentBurn = series.slice(-3).filter(s => s.net < 0);
  const avgBurn = recentBurn.length
    ? Math.abs(recentBurn.reduce((a, s) => a + s.net, 0) / recentBurn.length)
    : 0;
  const runwayMonths = avgBurn > 0 ? Math.floor(cash / avgBurn) : null; // null = profitable / infinite
  return { cash: Math.round(cash), startingCash: STARTING_CASH, runwayMonths, avgBurn: Math.round(avgBurn) };
}

// Rule-based, bilingual recommendations from the computed numbers.
export function recommendations({ series, forecast, mrrInfo, cash, totalUsers }) {
  const recs = [];
  const last = series[series.length - 1] || { net: 0, income: 0, expense: 0 };
  const freeRatio = totalUsers ? (totalUsers - mrrInfo.payingUsers) / totalUsers : 0;
  const push = (severity, en, ar) => recs.push({ severity, en, ar });

  if (forecast.growthRate < 0) {
    push('warning',
      `Revenue is trending down (${forecast.growthRate}% MoM). Review churn and re-engage inactive paid users.`,
      `الإيرادات تتجه للانخفاض (${forecast.growthRate}% شهرياً). راجع معدّل التسرّب وأعد تفعيل العملاء المدفوعين غير النشطين.`);
  } else if (forecast.growthRate > 15) {
    push('positive',
      `Strong momentum (+${forecast.growthRate}% MoM). Consider increasing acquisition spend while CAC is efficient.`,
      `زخم قوي (+${forecast.growthRate}% شهرياً). فكّر في زيادة ميزانية الاستحواذ ما دامت تكلفة العميل منخفضة.`);
  }

  if (freeRatio > 0.8 && totalUsers >= 5) {
    push('warning',
      `${Math.round(freeRatio * 100)}% of users are on the free plan. Launch an upgrade campaign targeting active free users.`,
      `${Math.round(freeRatio * 100)}% من المستخدمين على الخطة المجانية. أطلق حملة ترقية تستهدف المستخدمين المجانيين النشطين.`);
  }

  if (cash.runwayMonths != null && cash.runwayMonths < 6) {
    push('critical',
      `Runway is ~${cash.runwayMonths} months at the current burn ($${cash.avgBurn}/mo). Cut non-essential costs or raise revenue.`,
      `المدّة المالية المتبقية ~${cash.runwayMonths} أشهر بمعدّل الحرق الحالي ($${cash.avgBurn}/شهر). قلّص التكاليف غير الأساسية أو ارفع الإيراد.`);
  } else if (cash.runwayMonths == null && last.net > 0) {
    push('positive',
      `Operations are cash-flow positive ($${last.net} last month). Reinvest surplus into growth or reserves.`,
      `العمليات تحقق تدفقاً نقدياً موجباً ($${last.net} الشهر الماضي). أعد استثمار الفائض في النمو أو الاحتياطي.`);
  }

  if (mrrInfo.arpu > 0 && mrrInfo.arpu < 40) {
    push('info',
      `ARPU is $${mrrInfo.arpu}. Promote the Enterprise tier or paid templates to lift average revenue per user.`,
      `متوسط الإيراد لكل مستخدم $${mrrInfo.arpu}. روّج لخطة Enterprise أو القوالب المدفوعة لرفع المتوسط.`);
  }

  if (recs.length === 0) {
    push('info',
      'Financials look stable. Keep monitoring conversion and monthly net.',
      'الوضع المالي مستقر. واصل متابعة معدّل التحويل وصافي الشهر.');
  }
  return recs;
}
