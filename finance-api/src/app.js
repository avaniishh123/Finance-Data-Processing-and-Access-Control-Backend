require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://finance-data-processing-and-access-amber.vercel.app',
  'https://finance-data-processing-and-access-control-backend-r1qr98khv.vercel.app',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',      require('./modules/auth/auth.routes'));
app.use('/api/users',     require('./modules/users/users.routes'));
app.use('/api/records',   require('./modules/records/records.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
