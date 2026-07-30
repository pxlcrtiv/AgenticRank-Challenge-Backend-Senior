const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { createCacheMiddleware, invalidateCache } = require('../middleware/cache');

const cacheMiddleware = createCacheMiddleware(60000);

router.get('/', cacheMiddleware, async (req, res) => {
  try {
    const { cuisine, active_only } = req.query;

    let query = db('restaurants').orderBy('name');

    if (cuisine) {
      query = query.where('cuisine', cuisine);
    }
    if (active_only === 'true') {
      query = query.where('is_active', true);
    }

    const restaurants = await query;
    res.json({ data: restaurants });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', cacheMiddleware, async (req, res) => {
  try {
    const restaurant = await db('restaurants').where('id', req.params.id).first();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, cuisine, address, phone, avg_prep_time_minutes } = req.body;

    if (!name || !cuisine) {
      return res.status(400).json({ error: 'Missing required fields: name, cuisine' });
    }

    const [restaurant] = await db('restaurants')
      .insert({
        name,
        cuisine,
        address,
        phone,
        avg_prep_time_minutes: avg_prep_time_minutes || 30,
      })
      .returning('*');

    invalidateCache('/restaurants');
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/menu', cacheMiddleware, async (req, res) => {
  try {
    const restaurant = await db('restaurants').where('id', req.params.id).first();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const menuItems = await db('menu_items')
      .where('restaurant_id', req.params.id)
      .orderBy('name');

    res.json({ data: menuItems });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/menu', authenticate, async (req, res) => {
  try {
    const restaurant = await db('restaurants').where('id', req.params.id).first();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const { name, price, is_available } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, price' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    const [menuItem] = await db('menu_items')
      .insert({
        restaurant_id: req.params.id,
        name,
        price,
        is_available: is_available !== undefined ? is_available : true,
      })
      .returning('*');

    invalidateCache(`/restaurants/${req.params.id}/menu`);
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
