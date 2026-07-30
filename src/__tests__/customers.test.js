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

describe('Customers', () => {
  describe('POST /customers', () => {
    it('creates a new customer', async () => {
      const request = require('supertest');
      const res = await request(app)
        .post('/customers')
        .send({ name: 'New Customer', email: 'new@example.com', phone: '555-9999' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('New Customer');
      expect(res.body.email).toBe('new@example.com');
    });

    it('rejects duplicate email', async () => {
      const request = require('supertest');
      const res = await request(app)
        .post('/customers')
        .send({ name: 'Duplicate', email: 'new@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/);
    });

    it('rejects missing required fields', async () => {
      const request = require('supertest');
      const res = await request(app)
        .post('/customers')
        .send({ name: 'No Email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Missing required fields/);
    });
  });

  describe('GET /customers', () => {
    it('lists customers with pagination', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects unauthenticated requests', async () => {
      const request = require('supertest');
      const res = await request(app).get('/customers');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /customers/:id', () => {
    it('returns customer with order history', async () => {
      const request = require('supertest');
      const customer = await db('customers').first();
      const res = await request(app)
        .get(`/customers/${customer.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('recent_orders');
      expect(Array.isArray(res.body.recent_orders)).toBe(true);
    });

    it('returns 404 for non-existent customer', async () => {
      const request = require('supertest');
      const res = await request(app)
        .get('/customers/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
