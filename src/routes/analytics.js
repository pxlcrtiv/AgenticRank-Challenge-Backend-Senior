const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { createCacheMiddleware } = require('../middleware/cache');

const cacheMiddleware = createCacheMiddleware(60000);

router.get('/restaurants/:id', authenticate, cacheMiddleware, async (req, res) => {
  try {
    const restaurant = await db('restaurants').where('id', req.params.id).first();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const [{ total_orders, total_revenue, avg_delivery_time }] = await db('orders')
      .where('restaurant_id', req.params.id)
      .where('status', 'delivered')
      .whereNull('deleted_at')
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('SUM(total)::numeric(10,2) as total_revenue'),
        db.raw('AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 60)::numeric(10,1) as avg_delivery_time')
      );

    const [{ review_count }] = await db('reviews')
      .where('restaurant_id', req.params.id)
      .count('* as review_count');

    res.json({
      restaurant_id: restaurant.id,
      name: restaurant.name,
      rating: restaurant.rating,
      total_orders: parseInt(total_orders) || 0,
      total_revenue: parseFloat(total_revenue) || 0,
      avg_delivery_time_minutes: parseFloat(avg_delivery_time) || 0,
      review_count: parseInt(review_count) || 0,
    });
  } catch (error) {
    console.error('Error fetching restaurant analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/overview', authenticate, cacheMiddleware, async (req, res) => {
  try {
    const [{ total_orders, total_revenue }] = await db('orders')
      .where('status', 'delivered')
      .whereNull('deleted_at')
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('SUM(total)::numeric(10,2) as total_revenue')
      );

    const [{ active_riders }] = await db('riders')
      .where('status', '!=', 'offline')
      .count('* as active_riders');

    const [{ active_restaurants }] = await db('restaurants')
      .where('is_active', true)
      .count('* as active_restaurants');

    const [{ total_customers }] = await db('customers')
      .count('* as total_customers');

    res.json({
      total_orders: parseInt(total_orders) || 0,
      total_revenue: parseFloat(total_revenue) || 0,
      active_riders: parseInt(active_riders) || 0,
      active_restaurants: parseInt(active_restaurants) || 0,
      total_customers: parseInt(total_customers) || 0,
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
