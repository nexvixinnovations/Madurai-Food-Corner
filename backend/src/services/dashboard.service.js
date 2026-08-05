const prisma = require('../config/prisma');

class DashboardService {
  /**
   * Parse date helpers
   */
  getStartOfDay(d = new Date()) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }

  getEndOfDay(d = new Date()) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  }

  getStartOfMonth(d = new Date()) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  /**
   * Main Dashboard Data Aggregator
   */
  async getDashboardData({ period, start_date, end_date }) {
    const now = new Date();
    const todayStart = this.getStartOfDay(now);
    const todayEnd = this.getEndOfDay(now);

    const yesterdayObj = new Date(now);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStart = this.getStartOfDay(yesterdayObj);
    const yesterdayEnd = this.getEndOfDay(yesterdayObj);

    const monthStart = this.getStartOfMonth(now);

    // Determine custom or preset date boundaries for filtered analytics
    let filterStart = todayStart;
    let filterEnd = todayEnd;

    if (period === 'yesterday') {
      filterStart = yesterdayStart;
      filterEnd = yesterdayEnd;
    } else if (period === 'last_7_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      filterStart = this.getStartOfDay(d);
    } else if (period === 'last_30_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      filterStart = this.getStartOfDay(d);
    } else if (start_date && end_date) {
      filterStart = this.getStartOfDay(new Date(start_date));
      filterEnd = this.getEndOfDay(new Date(end_date));
    }

    const dateRangeWhere = {
      created_at: {
        gte: filterStart,
        lte: filterEnd,
      },
    };

    // Parallel database query execution for optimal response speed
    const [
      todaySalesAgg,
      yesterdaySalesAgg,
      todayOrdersCount,
      todayStatusGroup,
      todayCustomersCount,
      monthSalesAgg,
      monthCustomersCount,
      ordersByStatusGroup,
      ordersByTypeGroup,
      paymentsByMethodGroup,
      paymentsByStatusGroup,
      topFoodsGroup,
      topCombosGroup,
      leastFoodsGroup,
      categoriesGroup,
      recentOrdersList,
      unavailableFoods,
      unavailableCombos,
    ] = await Promise.all([
      // 1. Today's Revenue (Calculated ONLY for Accepted orders)
      prisma.orders.aggregate({
        _sum: { total_amount: true },
        where: {
          created_at: { gte: todayStart, lte: todayEnd },
          status: { in: ['Accepted', 'accepted'] },
        },
      }),

      // 2. Yesterday's Revenue
      prisma.orders.aggregate({
        _sum: { total_amount: true },
        where: {
          created_at: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { in: ['Accepted', 'accepted'] },
        },
      }),

      // 3. Today's Orders Count
      prisma.orders.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      }),

      // 4. Today's Orders by Status
      prisma.orders.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      }),

      // 5. Today's Customers Count
      prisma.customers.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      }),

      // 6. Monthly Summary (Revenue, Orders, AOV calculated for Accepted orders)
      prisma.orders.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        _avg: { total_amount: true },
        where: {
          created_at: { gte: monthStart, lte: todayEnd },
          status: { in: ['Accepted', 'accepted'] },
        },
      }),

      // 7. Monthly Customers Count
      prisma.customers.count({
        where: { created_at: { gte: monthStart, lte: todayEnd } },
      }),

      // 8. Filtered Orders by Status
      prisma.orders.groupBy({
        by: ['status'],
        _count: { id: true },
        where: dateRangeWhere,
      }),

      // 9. Filtered Orders by Type (Parcel, Take Away, Dine-In, Delivery)
      prisma.orders.groupBy({
        by: ['order_type'],
        _count: { id: true },
        where: dateRangeWhere,
      }),

      // 10. Payments by Method / Gateway
      prisma.payments.groupBy({
        by: ['payment_gateway'],
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 11. Payments by Status
      prisma.payments.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 12. Top 10 Selling Food Items
      prisma.order_items.groupBy({
        by: ['food_item_id'],
        _sum: { quantity: true, line_total: true },
        where: { food_item_id: { not: null } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),

      // 13. Top 10 Selling Combos
      prisma.order_items.groupBy({
        by: ['combo_id'],
        _sum: { quantity: true, line_total: true },
        where: { combo_id: { not: null } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),

      // 14. Least Ordered Foods
      prisma.order_items.groupBy({
        by: ['food_item_id'],
        _sum: { quantity: true },
        where: { food_item_id: { not: null } },
        orderBy: { _sum: { quantity: 'asc' } },
        take: 5,
      }),

      // 15. Popular Food Categories
      prisma.food_items.groupBy({
        by: ['category'],
        _count: { id: true },
      }),

      // 16. Recent 10 Orders
      prisma.orders.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          customers: true,
        },
      }),

      // 17. Unavailable Foods Alert
      prisma.food_items.findMany({
        where: { available: false },
        select: { id: true, name: true, category: true, price: true },
      }),

      // 18. Unavailable Combos Alert
      prisma.combos.findMany({
        where: { available: false },
        select: { id: true, name: true, price: true },
      }),
    ]);

    // Calculate Growth Metrics
    const todayRevenue = parseFloat(todaySalesAgg._sum.total_amount || 0);
    const yesterdayRevenue = parseFloat(yesterdaySalesAgg._sum.total_amount || 0);
    const revenueDiff = todayRevenue - yesterdayRevenue;
    const percentageGrowth = yesterdayRevenue > 0
      ? parseFloat(((revenueDiff / yesterdayRevenue) * 100).toFixed(2))
      : (todayRevenue > 0 ? 100 : 0);

    // Format Status Counts for Today
    const todayStatusMap = {};
    todayStatusGroup.forEach((item) => {
      if (item.status) {
        todayStatusMap[item.status] = item._count.id;
      }
    });

    const todaySummary = {
      todaySales: todayRevenue,
      yesterdayRevenue,
      revenueDifference: revenueDiff,
      percentageGrowth,
      todayOrders: todayOrdersCount,
      pendingOrders: todayStatusMap['Pending'] || 0,
      acceptedOrders: todayStatusMap['Accepted'] || 0,
      preparingOrders: todayStatusMap['Preparing'] || 0,
      readyOrders: todayStatusMap['Ready'] || 0,
      completedOrders: todayStatusMap['Completed'] || 0,
      cancelledOrders: todayStatusMap['Cancelled'] || 0,
      todayCustomers: todayCustomersCount,
      todayRevenue,
    };

    // Format Monthly Summary
    const monthlyRevenue = parseFloat(monthSalesAgg._sum.total_amount || 0);
    const monthlyOrders = monthSalesAgg._count.id || 0;
    const avgOrderValue = monthlyOrders > 0
      ? parseFloat((monthlyRevenue / monthlyOrders).toFixed(2))
      : 0;

    const monthSummary = {
      monthlyRevenue,
      monthlyOrders,
      monthlyCustomers: monthCustomersCount,
      averageOrderValue: avgOrderValue,
    };

    // Format Payments Analytics
    const paymentMethodsMap = {
      Cash: 0,
      UPI: 0,
      Card: 0,
      Online: 0,
    };

    paymentsByMethodGroup.forEach((item) => {
      const method = item.payment_gateway || 'Cash';
      const totalAmount = parseFloat(item._sum.amount || 0);
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + totalAmount;
    });

    const paymentStatusMap = {
      Pending: 0,
      Paid: 0,
      Failed: 0,
      Refunded: 0,
      Cancelled: 0,
    };

    paymentsByStatusGroup.forEach((item) => {
      const statusKey = item.status || 'Pending';
      paymentStatusMap[statusKey] = item._count.id;
    });

    const paymentsAnalytics = {
      cashPayments: paymentMethodsMap['Cash'] || 0,
      upiPayments: paymentMethodsMap['UPI'] || 0,
      cardPayments: paymentMethodsMap['Card'] || 0,
      onlinePayments: paymentMethodsMap['Online'] || 0,
      pendingPayments: paymentStatusMap['Pending'] || 0,
      paidPayments: paymentStatusMap['Paid'] || 0,
      failedPayments: paymentStatusMap['Failed'] || 0,
      refundedPayments: paymentStatusMap['Refunded'] || 0,
      cancelledPayments: paymentStatusMap['Cancelled'] || 0,
    };

    // Format Orders Analytics
    const ordersByStatusMap = {};
    ordersByStatusGroup.forEach((item) => {
      if (item.status) {
        ordersByStatusMap[item.status] = item._count.id;
      }
    });

    const ordersByTypeMap = {
      Parcel: 0,
      'Take Away': 0,
      'Dine-In': 0,
      Delivery: 0,
    };

    ordersByTypeGroup.forEach((item) => {
      if (item.order_type) {
        ordersByTypeMap[item.order_type] = item._count.id;
      }
    });

    const orderAnalytics = {
      byStatus: ordersByStatusMap,
      byType: ordersByTypeMap,
    };

    // Populate Top 10 Selling Foods with food_items details
    const foodItemIds = topFoodsGroup.map((item) => item.food_item_id);
    const foodsCatalog = await prisma.food_items.findMany({
      where: { id: { in: foodItemIds } },
    });

    const topFoods = topFoodsGroup.map((groupItem) => {
      const detail = foodsCatalog.find((f) => f.id === groupItem.food_item_id);
      return {
        id: groupItem.food_item_id,
        name: detail ? detail.name : 'Unknown Food',
        category: detail ? detail.category : 'General',
        price: detail ? parseFloat(detail.price) : 0,
        totalQuantitySold: groupItem._sum.quantity || 0,
        totalRevenue: parseFloat(groupItem._sum.line_total || 0),
      };
    });

    // Populate Top 10 Selling Combos with combos details
    const comboIds = topCombosGroup.map((item) => item.combo_id);
    const combosCatalog = await prisma.combos.findMany({
      where: { id: { in: comboIds } },
    });

    const topCombos = topCombosGroup.map((groupItem) => {
      const detail = combosCatalog.find((c) => c.id === groupItem.combo_id);
      return {
        id: groupItem.combo_id,
        name: detail ? detail.name : 'Unknown Combo',
        price: detail ? parseFloat(detail.price) : 0,
        totalQuantitySold: groupItem._sum.quantity || 0,
        totalRevenue: parseFloat(groupItem._sum.line_total || 0),
      };
    });

    // Populate Least Ordered Foods
    const leastFoodIds = leastFoodsGroup.map((item) => item.food_item_id);
    const leastFoodsCatalog = await prisma.food_items.findMany({
      where: { id: { in: leastFoodIds } },
    });

    const leastOrderedFoods = leastFoodsGroup.map((groupItem) => {
      const detail = leastFoodsCatalog.find((f) => f.id === groupItem.food_item_id);
      return {
        id: groupItem.food_item_id,
        name: detail ? detail.name : 'Unknown Food',
        totalQuantitySold: groupItem._sum.quantity || 0,
      };
    });

    // Format Recent 10 Orders
    const recentOrders = recentOrdersList.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customers ? order.customers.name : 'Guest Customer',
      amount: parseFloat(order.total_amount),
      status: order.status,
      paymentStatus: order.payment_status,
      createdTime: order.created_at,
    }));

    // Format Low Menu Alerts
    const alerts = {
      unavailableFoodsCount: unavailableFoods.length,
      unavailableCombosCount: unavailableCombos.length,
      unavailableFoods,
      unavailableCombos,
    };

    return {
      today: todaySummary,
      month: monthSummary,
      payments: paymentsAnalytics,
      orders: orderAnalytics,
      topFoods,
      topCombos,
      leastOrderedFoods,
      categories: categoriesGroup.map((c) => ({ category: c.category, count: c._count.id })),
      recentOrders,
      alerts,
    };
  }
}

module.exports = new DashboardService();
