const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { getClientForUser } = require('../../config/db');

async function listUsers(req, res) {
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id'
    );
    res.json(rows);
  } finally {
    client.release();
  }
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  const client = await getClientForUser(req.user);
  try {
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, password_hash, role]
    );
    res.status(201).json(rows[0]);
  } finally {
    client.release();
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, role, is_active } = req.body;
  const client = await getClientForUser(req.user);
  try {
    const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });

    const updated = await client.query(
      `UPDATE users
       SET name      = COALESCE($1, name),
           role      = COALESCE($2, role),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, role, is_active, updated_at`,
      [name ?? null, role ?? null, is_active ?? null, id]
    );
    res.json(updated.rows[0]);
  } finally {
    client.release();
  }
}

async function deleteUser(req, res) {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  const client = await getClientForUser(req.user);
  try {
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.status(204).send();
  } finally {
    client.release();
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
