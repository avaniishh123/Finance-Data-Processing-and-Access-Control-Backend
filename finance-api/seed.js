require('dotenv').config({ override: true });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  // Each user gets an independent bcrypt.hash call so bcrypt generates
  // a unique random salt per user — even for identical plaintext passwords.
  const users = [
    { name: 'Admin User',   email: 'admin@example.com',   role: 'admin',    password: 'Admin@123' },
    { name: 'Analyst User', email: 'analyst@example.com', role: 'analyst',  password: 'Analyst@123' },
    { name: 'Viewer User',  email: 'viewer@example.com',  role: 'viewer',   password: 'Viewer@123' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10); // unique password + fresh salt per user
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [u.name, u.email, hash, u.role]
    );
    console.log(`Seeded ${u.role}: ${u.email}`);
  }

  await pool.end();
}

seed().catch(e => { console.error(e.message); pool.end(); });
