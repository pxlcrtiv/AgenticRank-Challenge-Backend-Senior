const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const customers = await db('customers')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('customers').count('* as count');

    res.json({
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await db('customers').where('id', req.params.id).first();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const orders = await db('orders')
      .where('customer_id', customer.id)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json({ ...customer, recent_orders: orders });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, email' });
    }

    const existing = await db('customers').where('email', email).first();
    if (existing) {
      return res.status(409).json({ error: 'A customer with this email already exists' });
    }

    const [customer] = await db('customers')
      .insert({ name, email, phone, address })
      .returning('*');

    res.status(201).json(customer);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A customer with this email already exists' });
    }
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
