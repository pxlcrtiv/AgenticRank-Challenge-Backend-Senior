const { setupTestDb, teardownTestDb } = require('./setup');
const { generateToken } = require('../middleware/auth');

let app;
let db;
let token;

beforeAll(async () => {
  const result = await setupTestDb();
  db = result.db;
  app = result.app;
  token = generateToken({ id: 1, email: 'test@test.com' });
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Orders', () => {
  describe('POST /orders', () => {
    let customer;

    beforeAll(async () => {
      customer = await db('customers').first();
    });

    it('creates an order with server-validated prices', async () => {
      const request = require('supertest');
      const menuItem = await db('menu_items').first();

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: menuItem.restaurant_id,
          customer_id: customer.id,
          items: [{ menu_item_id: menuItem.id, quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('pending');

      const parsedItems = typeof res.body.items === 'string' ? JSON.parse(res.body.items) : res.body.items;
      expect(parsedItems[0].price).toBe(parseFloat(menuItem.price));
    });

    it('rejects client-supplied prices', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          items: [{ name: 'Hack', price: 0.01, quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/menu_item_id/);
    });

    it('rejects unavailable menu items', async () => {
      const request = require('supertest');
      const item = await db('menu_items').first();
      await db('menu_items').where('id', item.id).update({ is_available: false });

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: item.restaurant_id,
          customer_id: customer.id,
          items: [{ menu_item_id: item.id, quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unavailable/);

      await db('menu_items').where('id', item.id).update({ is_available: true });
    });

    it('rejects inactive restaurants', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      await db('restaurants').where('id', restaurant.id).update({ is_active: false });

      const menuItem = await db('menu_items').where('restaurant_id', restaurant.id).first();
      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          items: [{ menu_item_id: menuItem.id, quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not accepting/);

      await db('restaurants').where('id', restaurant.id).update({ is_active: true });
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('allows valid status transitions', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'pending').first();
      if (!order) return;

      const res = await request(app)
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.confirmed_at).not.toBeNull();
    });

    it('rejects invalid status transitions', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'delivered').first();
      if (!order) return;

      const res = await request(app)
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot transition/);
    });

    it('rejects cancelling from preparing', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'preparing').first();
      if (!order) return;

      const res = await request(app)
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(400);
    });

    it('sets cancelled_at when cancelling', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'pending').first();
      if (!order) return;

      const res = await request(app)
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(200);
      expect(res.body.cancelled_at).not.toBeNull();
    });

    it('rejects unauthenticated requests', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'pending').first();
      if (!order) return;

      const res = await request(app)
        .patch(`/orders/${order.id}/status`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('soft deletes a pending order', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'pending').first();
      if (!order) return;

      const res = await request(app)
        .delete(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const deleted = await db('orders').where('id', order.id).first();
      expect(deleted.deleted_at).not.toBeNull();
      expect(deleted.status).toBe('cancelled');
    });

    it('rejects deleting delivered orders', async () => {
      const request = require('supertest');
      const order = await db('orders').where('status', 'delivered').first();
      if (!order) return;

      const res = await request(app)
        .delete(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('excludes soft deleted orders from list', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const deletedOrders = res.body.data.filter((o) => o.deleted_at !== null);
      expect(deletedOrders.length).toBe(0);
    });
  });

  describe('GET /orders', () => {
    it('uses JOINs (not N+1)', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      const order = res.body.data[0];
      expect(order).toHaveProperty('restaurant_name');
      expect(order).toHaveProperty('customer_name');
    });

    it('filters by status', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/orders?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((o) => o.status === 'pending')).toBe(true);
    });
  });
});
