const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err.message);
});

/**
 * Returns a pg client with RLS session variables set for the given user.
 * Always call client.release() when done.
 */
async function getClientForUser(user) {
  const client = await pool.connect();
  await client.query(`
    SELECT
      set_config('app.current_user_role', $1, true),
      set_config('app.current_user_id',   $2, true)
  `, [user.role, String(user.id)]);
  return client;
}

module.exports = pool;
module.exports.getClientForUser = getClientForUser;
