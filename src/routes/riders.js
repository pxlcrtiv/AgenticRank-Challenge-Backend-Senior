const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;

    let query = db('riders').orderBy('name');

    if (status) {
      query = query.where('status', status);
    }

    const riders = await query;
    res.json({ data: riders });
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const rider = await db('riders').where('id', req.params.id).first();

    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const activeDelivery = await db('orders')
      .where('rider_id', rider.id)
      .whereIn('status', ['confirmed', 'preparing', 'picked_up'])
      .whereNull('deleted_at')
      .first();

    res.json({ ...rider, active_delivery: activeDelivery || null });
  } catch (error) {
    console.error('Error fetching rider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
