const pool = require('../../config/db');
const { getClientForUser } = require('../../config/db');

async function listRecords(req, res) {
  const { type, category, date_from, date_to, page = 1, limit = 20 } = req.query;
  const client = await getClientForUser(req.user);
  try {
    const conditions = ['deleted_at IS NULL'];
    const params = [];

    if (type) { params.push(type); conditions.push(`type = $${params.length}`); }
    if (category) { params.push(`%${category}%`); conditions.push(`category ILIKE $${params.length}`); }
    if (date_from) { params.push(date_from); conditions.push(`date >= $${params.length}`); }
    if (date_to) { params.push(date_to); conditions.push(`date <= $${params.length}`); }

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const where = conditions.join(' AND ');
    const { rows } = await client.query(
      `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON u.id = r.created_by
       WHERE ${where}
       ORDER BY r.date DESC, r.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) FROM financial_records WHERE ${where}`,
      countParams
    );

    res.json({
      data: rows,
      pagination: { total: parseInt(countRows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } finally {
    client.release();
  }
}

async function getRecord(req, res) {
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(
      `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON u.id = r.created_by
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Record not found.' });
    res.json(rows[0]);
  } finally {
    client.release();
  }
}

async function createRecord(req, res) {
  const { amount, type, category, date, notes } = req.body;
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(
      `INSERT INTO financial_records (amount, type, category, date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [amount, type, category, date, notes || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } finally {
    client.release();
  }
}

async function updateRecord(req, res) {
  const { id } = req.params;
  const { amount, type, category, date, notes } = req.body;
  const client = await getClientForUser(req.user);
  try {
    const { rows: existing } = await client.query(
      'SELECT id FROM financial_records WHERE id = $1 AND deleted_at IS NULL', [id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Record not found.' });

    const { rows } = await client.query(
      `UPDATE financial_records
       SET amount   = COALESCE($1, amount),
           type     = COALESCE($2, type),
           category = COALESCE($3, category),
           date     = COALESCE($4, date),
           notes    = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [amount ?? null, type ?? null, category ?? null, date ?? null, notes ?? null, id]
    );
    res.json(rows[0]);
  } finally {
    client.release();
  }
}

async function deleteRecord(req, res) {
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(
      `UPDATE financial_records SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Record not found.' });
    res.status(204).send();
  } finally {
    client.release();
  }
}

module.exports = { listRecords, getRecord, createRecord, updateRecord, deleteRecord };
