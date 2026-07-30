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

describe('Restaurants', () => {
  describe('GET /restaurants', () => {
    it('lists all restaurants', async () => {
      const request = require('supertest');
      const res = await request(app).get('/restaurants');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('filters by cuisine', async () => {
      const request = require('supertest');
      const res = await request(app).get('/restaurants?cuisine=Mexican');

      expect(res.status).toBe(200);
      expect(res.body.data.every((r) => r.cuisine === 'Mexican')).toBe(true);
    });

    it('filters by active_only', async () => {
      const request = require('supertest');
      const res = await request(app).get('/restaurants?active_only=true');

      expect(res.status).toBe(200);
      expect(res.body.data.every((r) => r.is_active === true)).toBe(true);
    });
  });

  describe('POST /restaurants', () => {
    it('creates a new restaurant', async () => {
      const request = require('supertest');
      const res = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Place', cuisine: 'Thai', address: '123 Test St' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Place');
    });

    it('rejects missing required fields', async () => {
      const request = require('supertest');
      const res = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'No Cuisine' });

      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated requests', async () => {
      const request = require('supertest');
      const res = await request(app)
        .post('/restaurants')
        .send({ name: 'Unauth', cuisine: 'Italian' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /restaurants/:id/menu', () => {
    it('returns menu items for a restaurant', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app).get(`/restaurants/${restaurant.id}/menu`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 404 for non-existent restaurant', async () => {
      const request = require('supertest');
      const res = await request(app).get('/restaurants/99999/menu');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /restaurants/:id/menu', () => {
    it('adds a menu item', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app)
        .post(`/restaurants/${restaurant.id}/menu`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Dish', price: 9.99 });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Dish');
    });

    it('rejects invalid price', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app)
        .post(`/restaurants/${restaurant.id}/menu`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bad Price', price: -5 });

      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated requests', async () => {
      const request = require('supertest');
      const restaurant = await db('restaurants').first();
      const res = await request(app)
        .post(`/restaurants/${restaurant.id}/menu`)
        .send({ name: 'Unauth', price: 10 });

      expect(res.status).toBe(401);
    });
  });
});
