exports.up = function (knex) {
  return knex.schema
    .createTable('restaurants', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('cuisine');
      table.string('address');
      table.string('phone');
      table.float('rating').defaultTo(0);
      table.integer('avg_prep_time_minutes').defaultTo(30);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('riders', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('phone');
      table.string('vehicle_type').defaultTo('bicycle');
      table.string('status').defaultTo('available'); // available, on_delivery, offline
      table.float('rating').defaultTo(5.0);
      table.timestamps(true, true);
    })
    .createTable('customers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable();
      table.string('phone');
      table.string('address');
      table.timestamps(true, true);
    })
    .createTable('orders', (table) => {
      table.increments('id').primary();
      table.integer('restaurant_id').unsigned().references('id').inTable('restaurants');
      table.integer('customer_id').unsigned().references('id').inTable('customers');
      table.integer('rider_id').unsigned().references('id').inTable('riders');
      table.string('status').defaultTo('pending'); // pending, confirmed, preparing, picked_up, delivered, cancelled
      table.jsonb('items').notNullable();
      table.decimal('subtotal', 10, 2).notNullable();
      table.decimal('delivery_fee', 10, 2).defaultTo(2.99);
      table.decimal('total', 10, 2).notNullable();
      table.text('special_instructions');
      table.timestamp('confirmed_at');
      table.timestamp('prepared_at');
      table.timestamp('picked_up_at');
      table.timestamp('delivered_at');
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('orders')
    .dropTableIfExists('customers')
    .dropTableIfExists('riders')
    .dropTableIfExists('restaurants');
};
