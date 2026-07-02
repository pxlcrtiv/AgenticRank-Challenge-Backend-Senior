# QuickBite API

Backend API for QuickBite, a food delivery platform.

## Tech Stack

- Node.js + Express
- PostgreSQL
- Knex.js (query builder & migrations)

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env`
3. Start PostgreSQL: `docker-compose up -d`
4. Install dependencies: `npm install`
5. Run migrations: `npx knex migrate:latest`
6. Seed the database: `npx knex seed:run`
7. Start the server: `npm start`

## API Endpoints

### Orders
- `GET /orders` - List all orders (supports `?status=` filter)
- `GET /orders/:id` - Get order details
- `POST /orders` - Create new order
- `PATCH /orders/:id/status` - Update order status
- `DELETE /orders/:id` - Delete an order

### Restaurants
- `GET /restaurants` - List restaurants
- `GET /restaurants/:id` - Get restaurant details
- `POST /restaurants` - Add new restaurant
- `GET /restaurants/:id/menu` - Get restaurant menu

### Riders
- `GET /riders` - List riders
- `GET /riders/:id` - Get rider details with active delivery

### Analytics
- `GET /analytics/restaurants/:id` - Restaurant performance metrics
- `GET /analytics/overview` - Platform-wide stats

### Customers
- `GET /customers` - List customers
- `GET /customers/:id` - Customer details with order history
- `POST /customers` - Register new customer

## Database Schema

The API uses these main tables:
- `restaurants` - Restaurant profiles and settings
- `riders` - Delivery rider profiles
- `customers` - Customer profiles
- `orders` - Order records with status tracking
- `menu_items` - Restaurant menu items with prices
- `reviews` - Customer reviews for restaurants

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| PORT | Server port | 3000 |
| REDIS_URL | Redis for caching | localhost:6379 |
| JWT_SECRET | Auth token secret | - |

## Running Tests

```bash
npm test
```

## Notes

- Orders go through this flow: pending → confirmed → preparing → picked_up → delivered
- Cancelled orders can only be cancelled from pending or confirmed status
- Redis caching is enabled for the restaurant list and analytics endpoints
