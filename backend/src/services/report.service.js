const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { validateDateRange, validateExportParams } = require('../validators/report.validator');
const { generateCSV, generateExcelBuffer, generatePDFBuffer } = require('../utils/export.util');

class ReportService {
  /**
   * Helper to parse date preset and return start & end UTC Date objects
   */
  getDateRange(preset = 'this_month', start_date, end_date) {
    const now = new Date();
    let start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    if (preset === 'today') {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), y.getUTCDate(), 0, 0, 0, 0));
      end = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), y.getUTCDate(), 23, 59, 59, 999));
    } else if (preset === 'this_week') {
      const day = now.getUTCDay(); // 0 = Sun
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now);
      monday.setUTCDate(diff);
      start = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0, 0));
    } else if (preset === 'last_month') {
      const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
      const lastDayPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
      start = prevMonth;
      end = lastDayPrevMonth;
    } else if (preset === 'this_year') {
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    } else if (preset === 'custom' || (start_date && end_date)) {
      validateDateRange(start_date, end_date);
      if (start_date) {
        const sd = new Date(start_date);
        start = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), 0, 0, 0, 0));
      }
      if (end_date) {
        const ed = new Date(end_date);
        end = new Date(Date.UTC(ed.getUTCFullYear(), ed.getUTCMonth(), ed.getUTCDate(), 23, 59, 59, 999));
      }
    }

    return { start, end };
  }

  /**
   * 1. Sales Report
   */
  async getSalesReport({ preset, start_date, end_date, payment_method, order_type, status }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);

    const where = {
      created_at: { gte: start, lte: end },
    };

    if (payment_method) where.payment_method = { equals: payment_method.trim(), mode: 'insensitive' };
    if (order_type) where.order_type = { equals: order_type.trim(), mode: 'insensitive' };
    if (status) where.status = { equals: status.trim(), mode: 'insensitive' };

    const [salesAgg, totalOrdersCount, totalCustomersCount, cancelledOrdersCount, refundsAgg] = await Promise.all([
      // Total Revenue from confirmed paid orders (pending excluded)
      prisma.orders.aggregate({
        _sum: { total_amount: true },
        where: {
          ...where,
          payment_status: { in: ['Paid', 'paid', 'Completed', 'completed', 'Success', 'success'] },
          status: { notIn: ['Cancelled', 'cancelled'] },
        },
      }),
      // Total Orders
      prisma.orders.count({ where }),
      // Total Unique Customers
      prisma.customers.count({
        where: { orders: { some: { created_at: { gte: start, lte: end } } } },
      }),
      // Cancelled Orders
      prisma.orders.count({
        where: { ...where, status: { in: ['Cancelled', 'cancelled'] } },
      }),
      // Total Refunds from payments table
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: {
          paid_at: { gte: start, lte: end },
          status: { in: ['Refunded', 'refunded'] },
        },
      }),
    ]);

    const totalRevenue = parseFloat(salesAgg._sum.total_amount || 0);
    const totalRefunds = parseFloat(refundsAgg._sum.amount || 0);
    const netRevenue = totalRevenue - totalRefunds;
    const avgOrderValue = totalOrdersCount > 0 ? parseFloat((totalRevenue / totalOrdersCount).toFixed(2)) : 0;

    return {
      period: { start, end },
      summary: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        averageOrderValue: avgOrderValue,
        totalCustomers: totalCustomersCount,
        totalRefunds,
        cancelledOrders: cancelledOrdersCount,
        netRevenue,
      },
    };
  }

  /**
   * Business Overview Reports (Today, Weekly, Monthly Orders & Revenue, Avg Order Value, Top Selling Food, Most Ordered Category)
   */
  async getBusinessOverviewReports() {
    const today = this.getDateRange('today');
    const week = this.getDateRange('this_week');
    const month = this.getDateRange('this_month');

    const paidCondition = {
      payment_status: { in: ['Paid', 'paid', 'Completed', 'completed', 'Success', 'success'] },
      status: { notIn: ['Cancelled', 'cancelled'] },
    };

    const [
      todayOrdersAgg,
      weekOrdersAgg,
      monthOrdersAgg,
    ] = await Promise.all([
      prisma.orders.aggregate({
        _count: { id: true },
        _sum: { total_amount: true },
        where: { created_at: { gte: today.start, lte: today.end }, ...paidCondition },
      }),
      prisma.orders.aggregate({
        _count: { id: true },
        _sum: { total_amount: true },
        where: { created_at: { gte: week.start, lte: week.end }, ...paidCondition },
      }),
      prisma.orders.aggregate({
        _count: { id: true },
        _sum: { total_amount: true },
        where: { created_at: { gte: month.start, lte: month.end }, ...paidCondition },
      }),
    ]);

    const todayOrders = todayOrdersAgg._count.id || 0;
    const todayRevenue = parseFloat(todayOrdersAgg._sum.total_amount || 0);

    const weeklyOrders = weekOrdersAgg._count.id || 0;
    const weeklyRevenue = parseFloat(weekOrdersAgg._sum.total_amount || 0);

    const monthlyOrders = monthOrdersAgg._count.id || 0;
    const monthlyRevenue = parseFloat(monthOrdersAgg._sum.total_amount || 0);

    return {
      todayOrders,
      todayRevenue,
      weeklyOrders,
      weeklyRevenue,
      monthlyOrders,
      monthlyRevenue,
      averageOrderValue: 0,
      topSellingFood: "N/A",
      mostOrderedCategory: "N/A",
    };
  }

  /**
   * 2. Orders Report (Paginated)
   */
  async getOrdersReport({ preset, start_date, end_date, search, page = 1, limit = 20 }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      created_at: { gte: start, lte: end },
    };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { order_number: { contains: q, mode: 'insensitive' } },
        { customers: { name: { contains: q, mode: 'insensitive' } } },
        { customers: { phone: { contains: q } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.findMany({
        where,
        include: {
          customers: true,
          order_items: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const data = orders.map((order) => ({
      orderNumber: order.order_number,
      customerName: order.customers ? order.customers.name : 'Guest Customer',
      customerPhone: order.customers ? order.customers.phone : 'N/A',
      orderDate: order.created_at,
      itemsCount: order.order_items ? order.order_items.reduce((sum, i) => sum + i.quantity, 0) : 0,
      grandTotal: parseFloat(order.total_amount),
      status: order.status,
      paymentStatus: order.payment_status,
    }));

    return {
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      orders: data,
    };
  }

  /**
   * 3. Customers Report
   */
  async getCustomersReport({ preset, start_date, end_date, search }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);

    const where = {
      created_at: { gte: start, lte: end },
      status: { notIn: ['Cancelled', 'cancelled'] },
    };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.customers = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      };
    }

    // Group orders by customer_id
    const customerGroups = await prisma.orders.groupBy({
      by: ['customer_id'],
      _count: { id: true },
      _sum: { total_amount: true },
      _max: { created_at: true },
      where: {
        ...where,
        customer_id: { not: null },
      },
      orderBy: {
        _sum: { total_amount: 'desc' },
      },
    });

    const customerIds = customerGroups.map((cg) => cg.customer_id);
    const customersInfo = await prisma.customers.findMany({
      where: { id: { in: customerIds } },
    });

    const data = customerGroups.map((cg) => {
      const info = customersInfo.find((c) => c.id === cg.customer_id);
      const totalOrders = cg._count.id;
      const totalSpending = parseFloat(cg._sum.total_amount || 0);
      const avgOrderValue = totalOrders > 0 ? parseFloat((totalSpending / totalOrders).toFixed(2)) : 0;

      return {
        customerName: info ? info.name : 'Unknown Customer',
        phone: info ? info.phone : 'N/A',
        email: info ? info.email : 'N/A',
        totalOrders,
        totalSpending,
        lastOrderDate: cg._max.created_at,
        averageOrderValue: avgOrderValue,
      };
    });

    return data;
  }

  /**
   * 4. Food Sales Report
   */
  async getFoodSalesReport({ preset, start_date, end_date, search }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);

    // Calculate days diff for Average Daily Sales calculation
    const daysDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const foodGroups = await prisma.order_items.groupBy({
      by: ['food_item_id'],
      _sum: { quantity: true, line_total: true },
      where: {
        food_item_id: { not: null },
        orders: {
          created_at: { gte: start, lte: end },
          status: { notIn: ['Cancelled', 'cancelled'] },
        },
      },
      orderBy: {
        _sum: { line_total: 'desc' },
      },
    });

    const foodItemIds = foodGroups.map((fg) => fg.food_item_id);
    const foodsCatalog = await prisma.food_items.findMany({
      where: { id: { in: foodItemIds } },
    });

    let data = foodGroups.map((fg) => {
      const food = foodsCatalog.find((f) => f.id === fg.food_item_id);
      const quantitySold = fg._sum.quantity || 0;
      const revenue = parseFloat(fg._sum.line_total || 0);
      const avgDailySales = parseFloat((quantitySold / daysDiff).toFixed(2));

      return {
        foodName: food ? food.name : 'Unknown Food Item',
        category: food ? food.category : 'General',
        quantitySold,
        revenue,
        averageDailySales: avgDailySales,
      };
    });

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((item) => item.foodName.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
    }

    return data;
  }

  /**
   * 5. Combo Sales Report
   */
  async getComboSalesReport({ preset, start_date, end_date, search }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);

    const comboGroups = await prisma.order_items.groupBy({
      by: ['combo_id'],
      _sum: { quantity: true, line_total: true },
      where: {
        combo_id: { not: null },
        orders: {
          created_at: { gte: start, lte: end },
          status: { notIn: ['Cancelled', 'cancelled'] },
        },
      },
      orderBy: {
        _sum: { line_total: 'desc' },
      },
    });

    const comboIds = comboGroups.map((cg) => cg.combo_id);
    const combosCatalog = await prisma.combos.findMany({
      where: { id: { in: comboIds } },
    });

    let data = comboGroups.map((cg) => {
      const combo = combosCatalog.find((c) => c.id === cg.combo_id);
      const quantitySold = cg._sum.quantity || 0;
      const revenue = parseFloat(cg._sum.line_total || 0);

      return {
        comboName: combo ? combo.name : 'Unknown Combo',
        quantitySold,
        revenue,
      };
    });

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((item) => item.comboName.toLowerCase().includes(q));
    }

    return data;
  }

  /**
   * 6. Payments Report
   */
  async getPaymentsReport({ preset, start_date, end_date, search }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);

    const where = {
      paid_at: { gte: start, lte: end },
    };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { transaction_id: { contains: q, mode: 'insensitive' } },
        { orders: { order_number: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const paymentsList = await prisma.payments.findMany({
      where,
      include: {
        orders: {
          include: { customers: true },
        },
      },
      orderBy: { paid_at: 'desc' },
    });

    return paymentsList.map((p) => ({
      transactionId: p.transaction_id || 'N/A',
      orderNumber: p.orders ? p.orders.order_number : 'N/A',
      customerName: p.orders && p.orders.customers ? p.orders.customers.name : 'Guest',
      paymentMethod: p.orders ? p.orders.payment_method : 'N/A',
      gateway: p.payment_gateway || 'Cash',
      status: p.status,
      amount: parseFloat(p.amount),
      paidAt: p.paid_at,
    }));
  }

  /**
   * 7. GST / Tax Report (5% Food GST)
   */
  async getTaxReport({ preset, start_date, end_date }) {
    const { start, end } = this.getDateRange(preset, start_date, end_date);

    const salesAgg = await prisma.orders.aggregate({
      _sum: { total_amount: true },
      _count: { id: true },
      where: {
        created_at: { gte: start, lte: end },
        payment_status: { in: ['Paid', 'paid', 'Completed', 'completed', 'Success', 'success'] },
        status: { notIn: ['Cancelled', 'cancelled'] },
      },
    });

    const totalSales = parseFloat(salesAgg._sum.total_amount || 0);

    // Standard Restaurant 5% GST calculation formula:
    // Taxable Amount = Total Sales / 1.05
    // GST Amount = Total Sales - Taxable Amount
    const gstRate = 0.05;
    const taxableAmount = parseFloat((totalSales / (1 + gstRate)).toFixed(2));
    const gstAmount = parseFloat((totalSales - taxableAmount).toFixed(2));
    const netRevenue = taxableAmount;

    return {
      period: { start, end },
      totalSales,
      taxableAmount,
      gstRate: '5%',
      gstAmount,
      cgstAmount: parseFloat((gstAmount / 2).toFixed(2)),
      sgstAmount: parseFloat((gstAmount / 2).toFixed(2)),
      netRevenue,
    };
  }

  /**
   * 8. Export Report Handler (PDF, Excel, CSV)
   */
  async exportReport({ type, format, preset, start_date, end_date }) {
    validateExportParams({ type, format, start_date, end_date });

    const reportType = type.toLowerCase();
    const exportFormat = format.toLowerCase();

    let columns = [];
    let rows = [];
    let reportTitle = '';

    if (reportType === 'sales') {
      reportTitle = 'Sales Summary Report';
      const data = await this.getSalesReport({ preset, start_date, end_date });
      columns = [
        { header: 'Metric', key: 'metric' },
        { header: 'Value', key: 'value' },
      ];
      rows = [
        { metric: 'Total Revenue', value: `INR ${data.summary.totalRevenue}` },
        { metric: 'Total Orders', value: data.summary.totalOrders },
        { metric: 'Average Order Value', value: `INR ${data.summary.averageOrderValue}` },
        { metric: 'Total Customers', value: data.summary.totalCustomers },
        { metric: 'Total Refunds', value: `INR ${data.summary.totalRefunds}` },
        { metric: 'Cancelled Orders', value: data.summary.cancelledOrders },
        { metric: 'Net Revenue', value: `INR ${data.summary.netRevenue}` },
      ];
    } else if (reportType === 'orders') {
      reportTitle = 'Order Transactions Report';
      const result = await this.getOrdersReport({ preset, start_date, end_date, limit: 1000 });
      columns = [
        { header: 'Order Number', key: 'orderNumber' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Customer Phone', key: 'customerPhone' },
        { header: 'Order Date', key: 'orderDate' },
        { header: 'Items Count', key: 'itemsCount' },
        { header: 'Grand Total', key: 'grandTotal' },
        { header: 'Status', key: 'status' },
        { header: 'Payment Status', key: 'paymentStatus' },
      ];
      rows = result.orders;
    } else if (reportType === 'customers') {
      reportTitle = 'Customer Performance Report';
      rows = await this.getCustomersReport({ preset, start_date, end_date });
      columns = [
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Phone', key: 'phone' },
        { header: 'Total Orders', key: 'totalOrders' },
        { header: 'Total Spending', key: 'totalSpending' },
        { header: 'Average Order Value', key: 'averageOrderValue' },
        { header: 'Last Order Date', key: 'lastOrderDate' },
      ];
    } else if (reportType === 'foods') {
      reportTitle = 'Food Item Sales Report';
      rows = await this.getFoodSalesReport({ preset, start_date, end_date });
      columns = [
        { header: 'Food Name', key: 'foodName' },
        { header: 'Category', key: 'category' },
        { header: 'Quantity Sold', key: 'quantitySold' },
        { header: 'Revenue', key: 'revenue' },
        { header: 'Avg Daily Sales', key: 'averageDailySales' },
      ];
    } else if (reportType === 'combos') {
      reportTitle = 'Combo Sales Report';
      rows = await this.getComboSalesReport({ preset, start_date, end_date });
      columns = [
        { header: 'Combo Name', key: 'comboName' },
        { header: 'Quantity Sold', key: 'quantitySold' },
        { header: 'Revenue', key: 'revenue' },
      ];
    } else if (reportType === 'payments') {
      reportTitle = 'Payment Audit Log Report';
      rows = await this.getPaymentsReport({ preset, start_date, end_date });
      columns = [
        { header: 'Transaction ID', key: 'transactionId' },
        { header: 'Order Number', key: 'orderNumber' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Gateway', key: 'gateway' },
        { header: 'Amount', key: 'amount' },
        { header: 'Status', key: 'status' },
        { header: 'Paid At', key: 'paidAt' },
      ];
    } else if (reportType === 'tax') {
      reportTitle = 'GST Tax Report';
      const data = await this.getTaxReport({ preset, start_date, end_date });
      columns = [
        { header: 'Tax Metric', key: 'metric' },
        { header: 'Amount (INR)', key: 'amount' },
      ];
      rows = [
        { metric: 'Total Sales (Gross)', amount: data.totalSales },
        { metric: 'Taxable Amount', amount: data.taxableAmount },
        { metric: 'GST Rate', amount: data.gstRate },
        { metric: 'Total GST Amount (5%)', amount: data.gstAmount },
        { metric: 'CGST (2.5%)', amount: data.cgstAmount },
        { metric: 'SGST (2.5%)', amount: data.sgstAmount },
        { metric: 'Net Revenue', amount: data.netRevenue },
      ];
    }

    if (exportFormat === 'csv') {
      const csvData = generateCSV(columns, rows);
      return {
        contentType: 'text/csv',
        filename: `${reportType}_report_${Date.now()}.csv`,
        buffer: Buffer.from(csvData, 'utf-8'),
      };
    } else if (exportFormat === 'excel') {
      const excelBuffer = generateExcelBuffer(reportTitle, columns, rows);
      return {
        contentType: 'application/vnd.ms-excel',
        filename: `${reportType}_report_${Date.now()}.xls`,
        buffer: excelBuffer,
      };
    } else if (exportFormat === 'pdf') {
      const pdfBuffer = generatePDFBuffer(reportTitle, columns, rows);
      return {
        contentType: 'application/pdf',
        filename: `${reportType}_report_${Date.now()}.pdf`,
        buffer: pdfBuffer,
      };
    }
  }
}

module.exports = new ReportService();
