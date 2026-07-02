require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const ordersRouter = require('./routes/orders');
const restaurantsRouter = require('./routes/restaurants');
const ridersRouter = require('./routes/riders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/orders', ordersRouter);
app.use('/restaurants', restaurantsRouter);
app.use('/riders', ridersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`QuickBite API running on http://localhost:${PORT}`);
});

module.exports = app;
