const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { invalidateCache } = require('../middleware/cache');
const { recomputeRestaurantRating } = require('../services/restaurantRating');

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await db('reviews as rv')
      .leftJoin('customers as c', 'rv.customer_id', 'c.id')
      .leftJoin('restaurants as r', 'rv.restaurant_id', 'r.id')
      .select(
        'rv.*',
        'c.name as customer_name',
        'r.name as restaurant_name'
      )
      .orderBy('rv.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('reviews').count('* as count');

    res.json({
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { restaurant_id, customer_id, rating, comment } = req.body;

    if (!restaurant_id || !customer_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields: restaurant_id, customer_id, rating' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const restaurant = await db('restaurants').where('id', restaurant_id).first();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const customer = await db('customers').where('id', customer_id).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const deliveredOrder = await db('orders')
      .where('customer_id', customer_id)
      .where('restaurant_id', restaurant_id)
      .where('status', 'delivered')
      .whereNull('deleted_at')
      .first();

    if (!deliveredOrder) {
      return res.status(400).json({ error: 'You can only review restaurants from delivered orders' });
    }

    const [review] = await db('reviews')
      .insert({ restaurant_id, customer_id, rating, comment: comment || null })
      .returning('*');

    await recomputeRestaurantRating(restaurant_id);

    invalidateCache('/analytics');
    invalidateCache('/restaurants');
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
