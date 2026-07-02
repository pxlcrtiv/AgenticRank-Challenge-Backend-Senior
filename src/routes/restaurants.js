const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /restaurants - List all restaurants
router.get('/', async (req, res) => {
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

// GET /restaurants/:id - Get single restaurant
router.get('/:id', async (req, res) => {
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

module.exports = router;
