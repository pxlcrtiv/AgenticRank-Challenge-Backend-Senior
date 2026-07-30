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

describe('Analytics', () => {
  describe('GET /analytics/restaurants/:id', () => {
    it('returns restaurant performance metrics', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app)
        .get(`/analytics/restaurants/${restaurant.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_orders');
      expect(res.body).toHaveProperty('total_revenue');
      expect(res.body).toHaveProperty('avg_delivery_time_minutes');
      expect(res.body).toHaveProperty('review_count');
      expect(res.body.restaurant_id).toBe(restaurant.id);
    });

    it('returns 404 for non-existent restaurant', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/analytics/restaurants/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('rejects unauthenticated requests', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app).get(`/analytics/restaurants/${restaurant.id}`);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /analytics/overview', () => {
    it('returns platform-wide stats', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/analytics/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_orders');
      expect(res.body).toHaveProperty('total_revenue');
      expect(res.body).toHaveProperty('active_riders');
      expect(res.body).toHaveProperty('active_restaurants');
      expect(res.body).toHaveProperty('total_customers');
    });

    it('rejects unauthenticated requests', async () => {
      const request = require('supertest');
      const res = await request(app).get('/analytics/overview');
      expect(res.status).toBe(401);
    });
  });
});
