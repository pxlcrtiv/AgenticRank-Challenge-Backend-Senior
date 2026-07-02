const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /orders - List orders with restaurant and rider info
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('orders').orderBy('created_at', 'desc').limit(limit).offset(offset);

    if (status) {
      query = query.where('status', status);
    }

    const orders = await query;

    const enrichedOrders = [];
    for (const order of orders) {
      const restaurant = await db('restaurants').where('id', order.restaurant_id).first();
      const rider = order.rider_id
        ? await db('riders').where('id', order.rider_id).first()
        : null;
      const customer = await db('customers').where('id', order.customer_id).first();

      enrichedOrders.push({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine } : null,
        rider: rider ? { id: rider.id, name: rider.name, vehicle_type: rider.vehicle_type } : null,
        customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null,
      });
    }

    const [{ count }] = await db('orders').count('* as count');

    res.json({
      data: enrichedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const order = await db('orders').where('id', req.params.id).first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const restaurant = await db('restaurants').where('id', order.restaurant_id).first();
    const rider = order.rider_id ? await db('riders').where('id', order.rider_id).first() : null;
    const customer = await db('customers').where('id', order.customer_id).first();

    res.json({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine, phone: restaurant.phone } : null,
      rider: rider ? { id: rider.id, name: rider.name, phone: rider.phone, vehicle_type: rider.vehicle_type } : null,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } : null,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/', async (req, res) => {
  try {
    const { restaurant_id, customer_id, items, special_instructions } = req.body;

    // Basic validation
    if (!restaurant_id || !customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: restaurant_id, customer_id, items' });
    }

    // Verify restaurant exists
    const restaurant = await db('restaurants').where('id', restaurant_id).first();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (!restaurant.is_active) {
      return res.status(400).json({ error: 'Restaurant is currently not accepting orders' });
    }

    // Verify customer exists
    const customer = await db('customers').where('id', customer_id).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const delivery_fee = 2.99;
    const total = subtotal + delivery_fee;

    const [newOrder] = await db('orders').insert({
      restaurant_id,
      customer_id,
      items: JSON.stringify(items),
      subtotal: subtotal.toFixed(2),
      delivery_fee,
      total: total.toFixed(2),
      special_instructions: special_instructions || null,
      status: 'pending',
    }).returning('*');

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /orders/:id/status - Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'picked_up', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await db('orders').where('id', req.params.id).first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updates = { status, updated_at: new Date() };

    // Set timestamps based on status
    if (status === 'confirmed') updates.confirmed_at = new Date();
    if (status === 'preparing') updates.prepared_at = new Date();
    if (status === 'picked_up') updates.picked_up_at = new Date();
    if (status === 'delivered') updates.delivered_at = new Date();

    // Assign rider when confirmed
    if (status === 'confirmed' && !order.rider_id) {
      const availableRider = await db('riders').where('status', 'available').first();
      if (availableRider) {
        updates.rider_id = availableRider.id;
        await db('riders').where('id', availableRider.id).update({ status: 'on_delivery' });
      }
    }

    // Free up rider when delivered or cancelled
    if ((status === 'delivered' || status === 'cancelled') && order.rider_id) {
      await db('riders').where('id', order.rider_id).update({ status: 'available' });
    }

    const [updated] = await db('orders').where('id', req.params.id).update(updates).returning('*');

    res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
