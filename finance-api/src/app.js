require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const app = express();
const allowedOrigins = [
  'https://finance-data-processing-and-access-one.vercel.app',
  'https://finance-data-processing-and-access-amber.vercel.app',
  'https://finance-data-processing-and-access-control-backend-r1qr98khv.vercel.app',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Preflight must be registered BEFORE other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use((req, _res, next) => { console.log('Incoming origin:', req.headers.origin); next(); });
app.use(express.json());

// Temporary test route to verify routing works
app.get('/api/auth/test', (req, res) => res.json({ ok: true, message: 'Auth routes are reachable.' }));

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
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

module.exports = app;
