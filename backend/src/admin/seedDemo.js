// One-time demo financials so the admin dashboard shows cashflow, forecast,
// and recommendations immediately. Only runs when `transactions` is empty, so
// real recorded transactions are never overwritten.

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function dayInMonth(monthsAgo) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, randInt(1, 27), randInt(8, 20)));
  return d.toISOString();
}

export async function seedDemoFinance(pool) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM transactions');
  if (rows[0].c > 0) return; // already has data

  // Attribute demo rows to the system user if present.
  const { rows: u } = await pool.query(
    `SELECT id FROM users ORDER BY (email = 'admin@capable.test') DESC, id ASC LIMIT 1`
  );
  const uid = u[0]?.id || null;

  // 6-month ramp: subscriptions and template sales grow, expenses stay flatter.
  const subsPerMonth   = [8, 11, 13, 18, 22, 27];   // # of $49 Pro subscriptions
  const entPerMonth    = [1, 1, 2, 2, 3, 4];         // # of $199 Enterprise
  const salesPerMonth  = [6, 9, 8, 12, 15, 19];      // # of paid template sales
  const baseExpense    = 1800;                        // infra + AI api baseline

  const values = [];
  const params = [];
  let p = 1;
  const add = (userId, type, amount, status, desc, when) => {
    values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
    params.push(userId, type, amount, status, desc, when);
  };

  for (let i = 0; i < 6; i++) {
    const monthsAgo = 5 - i;
    for (let s = 0; s < subsPerMonth[i]; s++)
      add(uid, 'subscription', 49, 'paid', 'Pro plan — monthly', dayInMonth(monthsAgo));
    for (let e = 0; e < entPerMonth[i]; e++)
      add(uid, 'subscription', 199, 'paid', 'Enterprise plan — monthly', dayInMonth(monthsAgo));
    for (let t = 0; t < salesPerMonth[i]; t++)
      add(uid, 'template_sale', [5, 15, 19, 29, 35][randInt(0, 4)], 'paid', 'Template purchase', dayInMonth(monthsAgo));

    // Monthly expenses (a few line items)
    add(uid, 'expense', baseExpense + randInt(0, 400), 'paid', 'Infrastructure & hosting', dayInMonth(monthsAgo));
    add(uid, 'expense', randInt(600, 1100), 'paid', 'AI provider usage', dayInMonth(monthsAgo));
    add(uid, 'expense', randInt(300, 700), 'paid', 'Marketing & ads', dayInMonth(monthsAgo));
  }

  await pool.query(
    `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
     VALUES ${values.join(', ')}`,
    params
  );
  console.log(`✅ Seeded ${values.length} demo transactions for admin financials`);
}
