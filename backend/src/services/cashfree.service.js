const { Cashfree, CFEnvironment } = require('cashfree-pg');
const ApiError = require('../utils/apiError');
const envConfig = require('../config/env.config');

class CashfreeService {
  constructor() {
    this.init();
  }

  init() {
    const appId = (
      process.env.CASHFREE_APP_ID ||
      process.env.CASHFREE_CLIENT_ID ||
      process.env.CF_APP_ID ||
      envConfig.CASHFREE_APP_ID ||
      ''
    ).trim();

    const secretKey = (
      process.env.CASHFREE_SECRET_KEY ||
      process.env.CASHFREE_CLIENT_SECRET ||
      process.env.CF_SECRET_KEY ||
      envConfig.CASHFREE_SECRET_KEY ||
      ''
    ).trim();

    Cashfree.XClientId = appId;
    Cashfree.XClientSecret = secretKey;

    const apiVersion = (
      process.env.CASHFREE_API_VERSION ||
      envConfig.CASHFREE_API_VERSION ||
      '2023-08-01'
    ).trim();
    Cashfree.XApiVersion = apiVersion;

    const envRaw = (process.env.CASHFREE_ENV || envConfig.CASHFREE_ENV || 'SANDBOX').trim();
    const env = envRaw.toUpperCase();
    
    if (CFEnvironment) {
      Cashfree.XEnvironment = env === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    } else if (Cashfree.Environment) {
      Cashfree.XEnvironment = env === 'PRODUCTION' ? Cashfree.Environment.PRODUCTION : Cashfree.Environment.SANDBOX;
    } else {
      Cashfree.XEnvironment = env === 'PRODUCTION' ? 2 : 1;
    }
  }

  /**
   * Create a Cashfree Payment Session for an order
   * @param {Object} params
   * @param {string} params.orderId - Unique order ID/number
   * @param {number} params.amount - Total order amount
   * @param {string} params.customerName - Name of customer
   * @param {string} params.customerPhone - Mobile phone of customer (10 digits)
   * @param {string} [params.customerEmail] - Customer email address
   * @param {string} [params.returnUrl] - Optional custom return URL
   */
  async createPaymentSession({ orderId, amount, customerName, customerPhone, customerEmail, returnUrl }) {
    this.init(); // Refresh credentials in case .env updated

    const appId = Cashfree.XClientId;
    const secretKey = Cashfree.XClientSecret;

    if (!appId || !secretKey) {
      console.error('[CASHFREE CREDENTIAL CHECK FAILED]', {
        appIdPresent: !!appId,
        secretKeyPresent: !!secretKey,
        envVarsLoaded: Object.keys(process.env).filter(k => k.includes('CASHFREE')),
      });
      throw new ApiError(500, 'Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured on the backend server.');
    }

    // Clean phone number (must be 10 digits)
    const cleanedPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);
    const validPhone = cleanedPhone.length === 10 ? cleanedPhone : '9999999999';

    // Format customer ID safe for Cashfree
    const safeCustomerId = `CUST_${(customerPhone || 'GUEST').replace(/\D/g, '') || Date.now()}`;

    const requestPayload = {
      order_id: String(orderId),
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: safeCustomerId,
        customer_name: customerName || 'Valued Customer',
        customer_phone: validPhone,
        customer_email: customerEmail || 'customer@maduraifoodcorner.com',
      },
      order_meta: {
        return_url: returnUrl || `${process.env.FRONTEND_URL || 'https://maduraifoodcorner.com'}/order-success/${orderId}?order_id={order_id}&payment_status={order_status}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
      },
    };

    try {
      const isProduction = Cashfree.XEnvironment === (CFEnvironment ? CFEnvironment.PRODUCTION : 2);
      const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
      const fullRequestUrl = `${baseUrl}/orders`;

      const headersUsed = {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': Cashfree.XApiVersion || '2023-08-01',
        'Content-Type': 'application/json',
      };

      console.log('[CASHFREE REQUEST DEBUG]', {
        url: fullRequestUrl,
        headerNames: Object.keys(headersUsed),
        envValue: process.env.CASHFREE_ENV
      });

      const cf = new Cashfree();
      const response = await cf.PGCreateOrder(requestPayload);
      
      if (!response.data || !response.data.payment_session_id) {
        throw new ApiError(500, 'Failed to obtain payment session from Cashfree Payment Gateway.');
      }

      return {
        payment_session_id: response.data.payment_session_id,
        order_id: response.data.order_id,
        order_status: response.data.order_status,
        cf_order_id: response.data.cf_order_id,
      };
    } catch (error) {
      console.error('[CASHFREE SERVICE ERROR]', error?.response?.data || error.message);
      const errorMessage = error?.response?.data?.message || error.message || 'Cashfree payment session creation failed';
      throw new ApiError(error.statusCode || 500, `Cashfree PG Error: ${errorMessage}`);
    }
  }

  /**
   * Fetch payment details from Cashfree for verification
   */
  async getOrderDetails(orderId) {
    this.init();
    try {
      const cf = new Cashfree();
      const response = await cf.PGFetchOrder(String(orderId));
      return response.data;
    } catch (error) {
      console.error('[CASHFREE FETCH ORDER ERROR]', error?.response?.data || error.message);
      throw new ApiError(500, 'Failed to fetch order status from Cashfree');
    }
  }

  /**
   * Verify Cashfree Webhook Signature
   */
  verifyWebhookSignature(signature, rawBody, timestamp) {
    try {
      this.init();
      const cf = new Cashfree();
      return cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (error) {
      console.error('[CASHFREE WEBHOOK VERIFY ERROR]', error.message);
      return false;
    }
  }
}

module.exports = new CashfreeService();
