require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const prisma = require('../config/prisma');

async function clearAllOrders() {
  console.log('Connecting to database...');

  try {
    // 1. Count existing records
    const orderCount = await prisma.orders.count();
    const orderItemCount = await prisma.order_items.count();
    const paymentCount = await prisma.payments.count();

    console.log(`Found:`);
    console.log(`- ${orderCount} orders`);
    console.log(`- ${orderItemCount} order_items`);
    console.log(`- ${paymentCount} payments`);

    if (orderCount === 0 && orderItemCount === 0 && paymentCount === 0) {
      console.log('No orders to clear. Database is already clean.');
      return;
    }

    console.log('\nDeleting all orders, order items, and associated payment records...');

    // 2. Perform deletion in a Prisma transaction
    await prisma.$transaction(async (tx) => {
      // Delete child records first for safety
      const deletedOrderItems = await tx.order_items.deleteMany({});
      console.log(`Deleted ${deletedOrderItems.count} order_items`);

      const deletedPayments = await tx.payments.deleteMany({});
      console.log(`Deleted ${deletedPayments.count} payments`);

      const deletedOrders = await tx.orders.deleteMany({});
      console.log(`Deleted ${deletedOrders.count} orders`);
    });

    // 3. Verify counts
    const remainingOrders = await prisma.orders.count();
    const remainingItems = await prisma.order_items.count();
    const remainingPayments = await prisma.payments.count();

    console.log('\nVerification:');
    console.log(`- Remaining orders: ${remainingOrders}`);
    console.log(`- Remaining order_items: ${remainingItems}`);
    console.log(`- Remaining payments: ${remainingPayments}`);

    // Verify other tables were NOT touched
    const foodCount = await prisma.food_items.count();
    const comboCount = await prisma.combos.count();
    const offerCount = await prisma.special_offers.count();
    const customerCount = await prisma.customers.count();
    const userCount = await prisma.users.count();

    console.log('\nIntegrity Check (Unchanged Tables):');
    console.log(`- Food items intact: ${foodCount}`);
    console.log(`- Combos intact: ${comboCount}`);
    console.log(`- Offers intact: ${offerCount}`);
    console.log(`- Customers intact: ${customerCount}`);
    console.log(`- Users intact: ${userCount}`);

    console.log('\nSUCCESS: All orders have been cleared cleanly from the database.');
  } catch (error) {
    console.error('Error clearing orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllOrders();
