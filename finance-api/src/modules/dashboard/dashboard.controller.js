const pool = require('../../config/db');
const { getClientForUser } = require('../../config/db');

async function getSummary(req, res) {
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) AS total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expenses
      FROM financial_records WHERE deleted_at IS NULL
    `);
    const { total_income, total_expenses } = rows[0];
    res.json({
      total_income: parseFloat(total_income),
      total_expenses: parseFloat(total_expenses),
      net_balance: parseFloat(total_income) - parseFloat(total_expenses),
    });
  } finally {
    client.release();
  }
}

async function getByCategory(req, res) {
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(`
      SELECT category, type, SUM(amount) AS total, COUNT(*) AS count
      FROM financial_records WHERE deleted_at IS NULL
      GROUP BY category, type ORDER BY total DESC
    `);
    res.json(rows.map(r => ({ ...r, total: parseFloat(r.total) })));
  } finally {
    client.release();
  }
}

async function getTrends(req, res) {
  const period = req.query.period === 'weekly' ? 'week' : 'month';
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(`
      SELECT
        DATE_TRUNC($1, date) AS period,
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses
      FROM financial_records WHERE deleted_at IS NULL
      GROUP BY DATE_TRUNC($1, date)
      ORDER BY period DESC LIMIT 12
    `, [period]);
    res.json(rows.map(r => ({
      period: r.period,
      income: parseFloat(r.income),
      expenses: parseFloat(r.expenses),
      net: parseFloat(r.income) - parseFloat(r.expenses),
    })));
  } finally {
    client.release();
  }
}

async function getRecentActivity(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(`
      SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, u.name AS created_by
      FROM financial_records r
      JOIN users u ON u.id = r.created_by
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC LIMIT $1
    `, [limit]);
    res.json(rows);
  } finally {
    client.release();
  }
}

module.exports = { getSummary, getByCategory, getTrends, getRecentActivity };
