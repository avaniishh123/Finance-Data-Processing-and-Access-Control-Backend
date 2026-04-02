require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
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
