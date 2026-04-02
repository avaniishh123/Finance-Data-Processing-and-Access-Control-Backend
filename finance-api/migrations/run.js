require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const files = ['001_schema.sql', '002_rls.sql'];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`${file} — completed.`);
    } catch (err) {
      console.error(`${file} — failed:`, err.message);
      process.exit(1);
    }
  }
  await pool.end();
}

migrate();
