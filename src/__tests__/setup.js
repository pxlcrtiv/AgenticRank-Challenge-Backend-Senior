process.env.NODE_ENV = 'test';

const knex = require('knex');
const config = require('../../knexfile');

let db;

async function setupTestDb() {
  db = knex(config.test);

  await db.migrate.latest();
  await db('reviews').del();
  await db('orders').del();
  await db('menu_items').del();
  await db('customers').del();
  await db('riders').del();
  await db('restaurants').del();
  await db.seed.run();

  // Ensure some riders are available for order confirmation tests
  await db('riders').where('status', '!=', 'available').update({ status: 'available' });

  // Clear only app-related module caches (not node_modules or Jest internals)
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('/src/')) {
      delete require.cache[key];
    }
  });

  const app = require('../index');

  return { db, app };
}

async function teardownTestDb() {
  if (db) {
    await db.destroy();
  }
}

function getDb() {
  return db;
}

module.exports = { setupTestDb, teardownTestDb, getDb };
