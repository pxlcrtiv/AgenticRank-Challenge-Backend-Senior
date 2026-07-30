const RESTAURANTS = [
  { name: 'Taquería El Patrón', cuisine: 'Mexican', address: '123 Main St', phone: '555-0101', rating: 4.5, avg_prep_time_minutes: 20 },
  { name: 'Pizza Nova', cuisine: 'Italian', address: '456 Oak Ave', phone: '555-0102', rating: 4.2, avg_prep_time_minutes: 25 },
  { name: 'Sushi Master', cuisine: 'Japanese', address: '789 Pine Rd', phone: '555-0103', rating: 4.8, avg_prep_time_minutes: 35 },
  { name: 'Burger Joint', cuisine: 'American', address: '321 Elm St', phone: '555-0104', rating: 3.9, avg_prep_time_minutes: 15 },
  { name: 'Pad Thai House', cuisine: 'Thai', address: '654 Maple Dr', phone: '555-0105', rating: 4.6, avg_prep_time_minutes: 30 },
  { name: 'Mediterranean Grill', cuisine: 'Mediterranean', address: '987 Cedar Ln', phone: '555-0106', rating: 4.3, avg_prep_time_minutes: 25 },
  { name: 'Dragon Wok', cuisine: 'Chinese', address: '147 Birch St', phone: '555-0107', rating: 4.1, avg_prep_time_minutes: 20 },
  { name: 'Curry Palace', cuisine: 'Indian', address: '258 Spruce Ave', phone: '555-0108', rating: 4.7, avg_prep_time_minutes: 35 },
  { name: 'BBQ Smokehouse', cuisine: 'BBQ', address: '369 Walnut Rd', phone: '555-0109', rating: 4.4, avg_prep_time_minutes: 40 },
  { name: 'Green Bowl', cuisine: 'Healthy', address: '741 Cherry Dr', phone: '555-0110', rating: 4.0, avg_prep_time_minutes: 15 },
];

const RIDERS = [
  { name: 'Carlos M.', phone: '555-1001', vehicle_type: 'motorcycle', status: 'available', rating: 4.8 },
  { name: 'Ana R.', phone: '555-1002', vehicle_type: 'bicycle', status: 'available', rating: 4.9 },
  { name: 'Luis G.', phone: '555-1003', vehicle_type: 'motorcycle', status: 'on_delivery', rating: 4.5 },
  { name: 'María F.', phone: '555-1004', vehicle_type: 'car', status: 'available', rating: 4.7 },
  { name: 'Jorge P.', phone: '555-1005', vehicle_type: 'bicycle', status: 'offline', rating: 4.3 },
  { name: 'Sofía L.', phone: '555-1006', vehicle_type: 'motorcycle', status: 'available', rating: 4.6 },
  { name: 'Diego H.', phone: '555-1007', vehicle_type: 'car', status: 'on_delivery', rating: 4.4 },
  { name: 'Valentina C.', phone: '555-1008', vehicle_type: 'bicycle', status: 'available', rating: 4.8 },
];

const CUSTOMER_NAMES = [
  'Emma Wilson', 'James Brown', 'Olivia Davis', 'Liam Martinez', 'Sophia Anderson',
  'Noah Taylor', 'Isabella Thomas', 'Ethan Jackson', 'Mia White', 'Aiden Harris',
  'Charlotte Clark', 'Lucas Lewis', 'Amelia Robinson', 'Mason Walker', 'Harper Young',
  'Logan Allen', 'Evelyn King', 'Alexander Wright', 'Abigail Scott', 'Daniel Green',
  'Emily Baker', 'Michael Adams', 'Elizabeth Nelson', 'Benjamin Hill', 'Sofia Campbell',
  'Jack Mitchell', 'Aria Roberts', 'Henry Carter', 'Chloe Phillips', 'Sebastian Evans',
  'Luna Turner', 'Owen Parker', 'Penelope Edwards', 'Samuel Collins', 'Layla Stewart',
  'Ryan Sanchez', 'Riley Morris', 'Nathan Rogers', 'Zoey Reed', 'Caleb Cook',
  'Nora Morgan', 'Christian Bell', 'Lily Murphy', 'Dylan Bailey', 'Eleanor Rivera',
  'Gabriel Cooper', 'Hazel Richardson', 'Matthew Cox', 'Violet Howard', 'David Ward',
];

const MENU_ITEMS = {
  Mexican: [
    { name: 'Tacos al Pastor (3)', price: 8.99 }, { name: 'Burrito Supreme', price: 11.99 },
    { name: 'Quesadilla', price: 7.99 }, { name: 'Nachos Grande', price: 9.99 },
    { name: 'Enchiladas Verdes', price: 12.99 }, { name: 'Guacamole & Chips', price: 6.99 },
  ],
  Italian: [
    { name: 'Margherita Pizza', price: 13.99 }, { name: 'Pepperoni Pizza', price: 15.99 },
    { name: 'Pasta Carbonara', price: 14.99 }, { name: 'Garlic Bread', price: 4.99 },
    { name: 'Caesar Salad', price: 8.99 }, { name: 'Tiramisu', price: 7.99 },
  ],
  Japanese: [
    { name: 'Salmon Roll (8pc)', price: 12.99 }, { name: 'Spicy Tuna Roll', price: 11.99 },
    { name: 'Ramen Tonkotsu', price: 15.99 }, { name: 'Edamame', price: 4.99 },
    { name: 'Gyoza (6pc)', price: 7.99 }, { name: 'Tempura Combo', price: 16.99 },
  ],
  American: [
    { name: 'Classic Burger', price: 10.99 }, { name: 'Cheeseburger Deluxe', price: 12.99 },
    { name: 'Chicken Wings (12pc)', price: 13.99 }, { name: 'Fries', price: 4.99 },
    { name: 'Milkshake', price: 5.99 }, { name: 'Onion Rings', price: 5.99 },
  ],
  Thai: [
    { name: 'Pad Thai', price: 13.99 }, { name: 'Green Curry', price: 14.99 },
    { name: 'Tom Yum Soup', price: 9.99 }, { name: 'Spring Rolls (4pc)', price: 6.99 },
    { name: 'Mango Sticky Rice', price: 7.99 }, { name: 'Thai Iced Tea', price: 3.99 },
  ],
  Mediterranean: [
    { name: 'Falafel Plate', price: 11.99 }, { name: 'Lamb Shawarma', price: 14.99 },
    { name: 'Hummus & Pita', price: 7.99 }, { name: 'Greek Salad', price: 9.99 },
    { name: 'Kebab Platter', price: 16.99 }, { name: 'Baklava', price: 5.99 },
  ],
  Chinese: [
    { name: 'Kung Pao Chicken', price: 13.99 }, { name: 'Fried Rice', price: 10.99 },
    { name: 'Lo Mein', price: 11.99 }, { name: 'Dumplings (8pc)', price: 8.99 },
    { name: 'Sweet & Sour Pork', price: 13.99 }, { name: 'Egg Drop Soup', price: 4.99 },
  ],
  Indian: [
    { name: 'Butter Chicken', price: 15.99 }, { name: 'Palak Paneer', price: 13.99 },
    { name: 'Naan Bread (2pc)', price: 3.99 }, { name: 'Biryani', price: 14.99 },
    { name: 'Samosa (3pc)', price: 6.99 }, { name: 'Mango Lassi', price: 4.99 },
  ],
  BBQ: [
    { name: 'Brisket Plate', price: 18.99 }, { name: 'Pulled Pork Sandwich', price: 12.99 },
    { name: 'Ribs Half Rack', price: 19.99 }, { name: 'Coleslaw', price: 3.99 },
    { name: 'Mac & Cheese', price: 5.99 }, { name: 'Cornbread', price: 3.99 },
  ],
  Healthy: [
    { name: 'Açaí Bowl', price: 11.99 }, { name: 'Quinoa Salad', price: 12.99 },
    { name: 'Green Smoothie', price: 7.99 }, { name: 'Avocado Toast', price: 9.99 },
    { name: 'Protein Bowl', price: 13.99 }, { name: 'Fresh Juice', price: 5.99 },
  ],
};

const STATUSES = ['pending', 'confirmed', 'preparing', 'picked_up', 'delivered', 'cancelled'];
const SPECIAL_INSTRUCTIONS = [
  null, null, null, null, null, // most orders have no special instructions
  'No onions please',
  'Extra spicy',
  'Leave at door',
  'Ring doorbell',
  'Allergic to peanuts',
  'Extra napkins please',
  'No contact delivery',
];

function randomEl(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function generateOrderItems(cuisine) {
  const menu = MENU_ITEMS[cuisine];
  const numItems = Math.floor(Math.random() * 3) + 1;
  const items = [];
  const used = new Set();

  for (let i = 0; i < numItems; i++) {
    let item;
    do {
      item = randomEl(menu);
    } while (used.has(item.name));
    used.add(item.name);
    items.push({ name: item.name, price: item.price, quantity: Math.floor(Math.random() * 2) + 1 });
  }

  return items;
}

exports.seed = async function (knex) {
  // Clean tables
  await knex('orders').del();
  await knex('customers').del();
  await knex('riders').del();
  await knex('restaurants').del();

  // Insert restaurants
  const restaurantIds = await knex('restaurants').insert(RESTAURANTS).returning('id');

  // Insert menu items for each restaurant
  const menuItemsToInsert = [];
  for (let i = 0; i < restaurantIds.length; i++) {
    const restaurant = RESTAURANTS[i];
    const menu = MENU_ITEMS[restaurant.cuisine] || [];
    for (const item of menu) {
      menuItemsToInsert.push({
        restaurant_id: restaurantIds[i].id,
        name: item.name,
        price: item.price,
        is_available: true,
      });
    }
  }
  await knex('menu_items').insert(menuItemsToInsert);

  // Insert riders
  const riderIds = await knex('riders').insert(RIDERS).returning('id');

  // Insert customers
  const customers = CUSTOMER_NAMES.map((name, i) => ({
    name,
    email: name.toLowerCase().replace(' ', '.') + '@email.com',
    phone: `555-${String(2000 + i).padStart(4, '0')}`,
    address: `${100 + i * 7} ${randomEl(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr'])}`,
  }));
  const customerIds = await knex('customers').insert(customers).returning('id');

  // Generate ~10k orders over the past 90 days
  const orders = [];
  for (let i = 0; i < 10000; i++) {
    const restaurantIdx = Math.floor(Math.random() * RESTAURANTS.length);
    const restaurant = RESTAURANTS[restaurantIdx];
    const orderDate = randomDate(90);
    const status = randomEl(STATUSES);

    const items = generateOrderItems(restaurant.cuisine);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 2.99;
    const total = subtotal + deliveryFee;

    const order = {
      restaurant_id: restaurantIds[restaurantIdx].id,
      customer_id: randomEl(customerIds).id,
      rider_id: status !== 'pending' && status !== 'cancelled' ? randomEl(riderIds).id : null,
      status,
      items: JSON.stringify(items),
      subtotal: subtotal.toFixed(2),
      delivery_fee: deliveryFee,
      total: total.toFixed(2),
      special_instructions: randomEl(SPECIAL_INSTRUCTIONS),
      created_at: orderDate,
      updated_at: orderDate,
    };

    // Add timestamps based on status
    if (['confirmed', 'preparing', 'picked_up', 'delivered'].includes(status)) {
      order.confirmed_at = new Date(orderDate.getTime() + 2 * 60 * 1000);
    }
    if (['preparing', 'picked_up', 'delivered'].includes(status)) {
      order.prepared_at = new Date(orderDate.getTime() + (restaurant.avg_prep_time_minutes + 2) * 60 * 1000);
    }
    if (['picked_up', 'delivered'].includes(status)) {
      order.picked_up_at = new Date(orderDate.getTime() + (restaurant.avg_prep_time_minutes + 5) * 60 * 1000);
    }
    if (status === 'delivered') {
      order.delivered_at = new Date(orderDate.getTime() + (restaurant.avg_prep_time_minutes + 25) * 60 * 1000);
    }

    orders.push(order);
  }

  // Insert in batches of 500
  for (let i = 0; i < orders.length; i += 500) {
    await knex('orders').insert(orders.slice(i, i + 500));
  }

  console.log(`Seeded: ${RESTAURANTS.length} restaurants, ${RIDERS.length} riders, ${customers.length} customers, ${orders.length} orders`);
};
