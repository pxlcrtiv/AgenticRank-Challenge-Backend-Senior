exports.up = function (knex) {
  return knex.schema
    .createTable('menu_items', (table) => {
      table.increments('id').primary();
      table.integer('restaurant_id').unsigned().references('id').inTable('restaurants').onDelete('CASCADE');
      table.string('name').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.boolean('is_available').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('reviews', (table) => {
      table.increments('id').primary();
      table.integer('restaurant_id').unsigned().references('id').inTable('restaurants').onDelete('CASCADE');
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE');
      table.integer('rating').notNullable();
      table.text('comment');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .alterTable('orders', (table) => {
      table.timestamp('deleted_at').nullable();
      table.timestamp('cancelled_at').nullable();
    })
    .raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_unique ON customers (email)');
};

exports.down = function (knex) {
  return knex.schema
    .raw('DROP INDEX IF EXISTS idx_customers_email_unique')
    .alterTable('orders', (table) => {
      table.dropColumn('deleted_at');
      table.dropColumn('cancelled_at');
    })
    .dropTableIfExists('reviews')
    .dropTableIfExists('menu_items');
};
