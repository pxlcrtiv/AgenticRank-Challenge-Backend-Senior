const db = require('../models/db');

async function recomputeRestaurantRating(restaurantId) {
  const [{ avg }] = await db('reviews')
    .where('restaurant_id', restaurantId)
    .avg('rating as avg');

  await db('restaurants')
    .where('id', restaurantId)
    .update({ rating: avg !== null ? parseFloat(avg).toFixed(1) : 0 });
}

module.exports = { recomputeRestaurantRating };
