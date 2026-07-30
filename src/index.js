require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const ordersRouter = require('./routes/orders');
const restaurantsRouter = require('./routes/restaurants');
const ridersRouter = require('./routes/riders');
const customersRouter = require('./routes/customers');
const reviewsRouter = require('./routes/reviews');
const analyticsRouter = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/orders', ordersRouter);
app.use('/restaurants', restaurantsRouter);
app.use('/riders', ridersRouter);
app.use('/customers', customersRouter);
app.use('/reviews', reviewsRouter);
app.use('/analytics', analyticsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`QuickBite API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
