/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.string('idempotency_key', 255).nullable();
  });

  await knex.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders (idempotency_key) WHERE idempotency_key IS NOT NULL'
  );

  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)'
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders (restaurant_id)'
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id)'
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status) WHERE deleted_at IS NULL'
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_orders_idempotency_key');
  await knex.raw('DROP INDEX IF EXISTS idx_orders_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_orders_restaurant_id');
  await knex.raw('DROP INDEX IF EXISTS idx_orders_customer_id');
  await knex.raw('DROP INDEX IF EXISTS idx_orders_status');

  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('idempotency_key');
  });
};
