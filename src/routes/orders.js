const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { invalidateCache } = require('../middleware/cache');
const { recomputeRestaurantRating } = require('../services/restaurantRating');

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['picked_up'],
  picked_up: ['delivered'],
  delivered: [],
  cancelled: [],
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = db('orders as o')
      .leftJoin('restaurants as r', 'o.restaurant_id', 'r.id')
      .leftJoin('riders as ri', 'o.rider_id', 'ri.id')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select(
        'o.*',
        'r.name as restaurant_name',
        'r.cuisine as restaurant_cuisine',
        'ri.name as rider_name',
        'ri.vehicle_type as rider_vehicle_type',
        'c.name as customer_name',
        'c.email as customer_email'
      )
      .whereNull('o.deleted_at')
      .orderBy('o.created_at', 'desc')
      .limit(limitNum)
      .offset(offset);

    if (status) {
      query = query.where('o.status', status);
    }

    const orders = await query;

    const enrichedOrders = orders.map((order) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      restaurant: order.restaurant_name
        ? { id: order.restaurant_id, name: order.restaurant_name, cuisine: order.restaurant_cuisine }
        : null,
      rider: order.rider_name
        ? { id: order.rider_id, name: order.rider_name, vehicle_type: order.rider_vehicle_type }
        : null,
      customer: order.customer_name
        ? { id: order.customer_id, name: order.customer_name, email: order.customer_email }
        : null,
    }));

    const [{ count }] = await db('orders')
      .whereNull('deleted_at')
      .modify((qb) => {
        if (status) qb.where('status', status);
      })
      .count('* as count');

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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders as o')
      .leftJoin('restaurants as r', 'o.restaurant_id', 'r.id')
      .leftJoin('riders as ri', 'o.rider_id', 'ri.id')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select(
        'o.*',
        'r.name as restaurant_name',
        'r.cuisine as restaurant_cuisine',
        'r.phone as restaurant_phone',
        'ri.name as rider_name',
        'ri.phone as rider_phone',
        'ri.vehicle_type as rider_vehicle_type',
        'c.name as customer_name',
        'c.email as customer_email',
        'c.phone as customer_phone'
      )
      .where('o.id', req.params.id)
      .whereNull('o.deleted_at')
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      restaurant: order.restaurant_name ? { id: order.restaurant_id, name: order.restaurant_name, cuisine: order.restaurant_cuisine, phone: order.restaurant_phone } : null,
      rider: order.rider_name ? { id: order.rider_id, name: order.rider_name, phone: order.rider_phone, vehicle_type: order.rider_vehicle_type } : null,
      customer: order.customer_name ? { id: order.customer_id, name: order.customer_name, email: order.customer_email, phone: order.customer_phone } : null,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { restaurant_id, customer_id, items, special_instructions } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || null;

    if (idempotencyKey) {
      const existing = await db('orders').where('idempotency_key', idempotencyKey).first();
      if (existing) {
        return res.status(200).json(existing);
      }
    }

    if (!restaurant_id || !customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: restaurant_id, customer_id, items' });
    }

    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must have menu_item_id and a positive integer quantity' });
      }
    }

    const restaurant = await db('restaurants').where('id', restaurant_id).first();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (!restaurant.is_active) {
      return res.status(400).json({ error: 'Restaurant is currently not accepting orders' });
    }

    const customer = await db('customers').where('id', customer_id).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const menuItemIds = items.map((i) => i.menu_item_id);
    const menuItems = await db('menu_items')
      .whereIn('id', menuItemIds)
      .where('restaurant_id', restaurant_id)
      .where('is_available', true);

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more menu items are invalid or unavailable' });
    }

    const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    const resolvedItems = items.map((item) => {
      const mi = menuItemMap.get(item.menu_item_id);
      return {
        menu_item_id: mi.id,
        name: mi.name,
        price: parseFloat(mi.price),
        quantity: item.quantity,
      };
    });

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery_fee = 2.99;
    const total = subtotal + delivery_fee;

    const [newOrder] = await db('orders')
      .insert({
        restaurant_id,
        customer_id,
        items: JSON.stringify(resolvedItems),
        subtotal: subtotal.toFixed(2),
        delivery_fee,
        total: total.toFixed(2),
        special_instructions: special_instructions || null,
        status: 'pending',
        idempotency_key: idempotencyKey,
      })
      .returning('*');

    invalidateCache('/analytics');
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'picked_up', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await db('orders').where('id', req.params.id).whereNull('deleted_at').first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${order.status}' to '${status}'`,
      });
    }

    const updates = { status, updated_at: new Date() };

    if (status === 'confirmed') updates.confirmed_at = new Date();
    if (status === 'preparing') updates.prepared_at = new Date();
    if (status === 'picked_up') updates.picked_up_at = new Date();
    if (status === 'delivered') updates.delivered_at = new Date();
    if (status === 'cancelled') updates.cancelled_at = new Date();

    if (status === 'confirmed' && !order.rider_id) {
      const riderResult = await db.transaction(async (trx) => {
        const result = await trx.raw(`
          UPDATE riders
          SET status = 'on_delivery', updated_at = NOW()
          WHERE id = (
            SELECT id FROM riders WHERE status = 'available' LIMIT 1 FOR UPDATE
          )
          RETURNING *
        `);

        return result.rows[0] || null;
      });

      if (!riderResult) {
        return res.status(503).json({ error: 'No riders available at this time' });
      }

      updates.rider_id = riderResult.id;
    }

    if ((status === 'delivered' || status === 'cancelled') && order.rider_id) {
      await db('riders').where('id', order.rider_id).update({ status: 'available', updated_at: new Date() });
    }

    const [updated] = await db('orders').where('id', req.params.id).update(updates).returning('*');

    invalidateCache('/analytics');
    res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const order = await db('orders').where('id', req.params.id).whereNull('deleted_at').first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Only pending or confirmed orders can be cancelled' });
    }

    const [updated] = await db('orders')
      .where('id', req.params.id)
      .update({
        status: 'cancelled',
        deleted_at: new Date(),
        cancelled_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    if (order.rider_id) {
      await db('riders').where('id', order.rider_id).update({ status: 'available', updated_at: new Date() });
    }

    invalidateCache('/analytics');
    res.json({ message: 'Order cancelled', order: updated });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
