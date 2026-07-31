require('dotenv').config();

const baseConfig = {
  client: 'pg',
  migrations: {
    directory: './src/migrations',
  },
  seeds: {
    directory: './src/seeds',
  },
  pool: {
    min: 2,
    max: 20,
  },
};

module.exports = {
  development: {
    ...baseConfig,
    connection: process.env.DATABASE_URL,
  },
  test: {
    ...baseConfig,
    connection: process.env.TEST_DATABASE_URL,
    pool: {
      min: 1,
      max: 5,
    },
  },
};
