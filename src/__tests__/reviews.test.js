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

describe('Reviews', () => {
  describe('POST /reviews', () => {
    it('creates a review for a delivered order', async () => {
      const request = require('supertest');
      const order = await db('orders')
        .where('status', 'delivered')
        .first();

      if (!order) return;

      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: order.restaurant_id,
          customer_id: order.customer_id,
          rating: 5,
          comment: 'Great food!',
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
    });

    it('rejects reviews without a delivered order', async () => {
      const request = require('supertest');
      // Create a fresh customer and restaurant with no order history
      const [newCustomer] = await db('customers').insert({ name: 'NoOrders', email: 'noorders@test.com' }).returning('*');
      const [newRestaurant] = await db('restaurants').insert({ name: 'NewResto', cuisine: 'Test' }).returning('*');
      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: newRestaurant.id,
          customer_id: newCustomer.id,
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/delivered orders/);
    });

    it('rejects invalid rating', async () => {
      const request = require('supertest');
      const order = await db('orders')
        .where('status', 'delivered')
        .first();

      if (!order) return;

      const res = await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: order.restaurant_id,
          customer_id: order.customer_id,
          rating: 6,
        });

      expect(res.status).toBe(400);
    });

    it('updates restaurant rating after review', async () => {
      const request = require('supertest');
      const order = await db('orders')
        .where('status', 'delivered')
        .first();

      if (!order) return;

      await request(app)
        .post('/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restaurant_id: order.restaurant_id,
          customer_id: order.customer_id,
          rating: 3,
        });

      const restaurant = await db('restaurants').where('id', order.restaurant_id).first();
      expect(parseFloat(restaurant.rating)).toBeGreaterThan(0);
    });
  });

  describe('GET /reviews', () => {
    it('lists reviews', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/reviews')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
