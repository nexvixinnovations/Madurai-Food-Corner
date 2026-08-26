const prisma = require('../config/prisma');

async function clearAllOrders() {
  console.log('--- Clearing All Orders from Database ---');
  try {
    const deletedItems = await prisma.order_items.deleteMany({});
    console.log(`Deleted ${deletedItems.count} order item records.`);

    const deletedPayments = await prisma.payments.deleteMany({});
    console.log(`Deleted ${deletedPayments.count} payment records.`);

    const deletedOrders = await prisma.orders.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} order records.`);

    const deletedCustomers = await prisma.customers.deleteMany({});
    console.log(`Deleted ${deletedCustomers.count} customer records.`);

    console.log('SUCCESS: All customer order data, items, payments, and customer records have been completely cleared!');
  } catch (error) {
    console.error('ERROR clearing orders:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllOrders();
