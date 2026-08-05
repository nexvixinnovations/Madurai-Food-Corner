/**
 * Notification Template Engine for dynamic email HTML and text notifications
 */

const TEMPLATES = {
  order_confirmation: {
    title: 'Order Placed Successfully',
    subject: 'Madurai Food Corner - Order Confirmation {{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e11d48; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Madurai Food Corner</h1>
          <p style="margin: 5px 0 0 0;">Order Confirmation</p>
        </div>
        <div style="padding: 20px;">
          <h3>Hello {{customerName}},</h3>
          <p>Thank you for your order! We have received your request and are processing it.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> {{orderNumber}}</p>
            <p style="margin: 5px 0;"><strong>Required Date:</strong> {{requiredDate}}</p>
            <p style="margin: 5px 0;"><strong>Order Type:</strong> {{orderType}}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> INR {{totalAmount}}</p>
          </div>
          <p>We will notify you as soon as your order status changes.</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          Madurai Food Corner ERP • South Veli Street, Madurai
        </div>
      </div>
    `,
    text: 'Hello {{customerName}}, thank you for your order {{orderNumber}} totaling INR {{totalAmount}}. We are processing your request.',
  },

  payment_success: {
    title: 'Payment Received',
    subject: 'Payment Successful - Order {{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #16a34a; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Madurai Food Corner</h1>
          <p style="margin: 5px 0 0 0;">Payment Received</p>
        </div>
        <div style="padding: 20px;">
          <h3>Hello {{customerName}},</h3>
          <p>Your payment of <strong>INR {{amount}}</strong> for Order <strong>{{orderNumber}}</strong> was successful via {{paymentMethod}}.</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p>Your order status has been updated to Accepted.</p>
        </div>
      </div>
    `,
    text: 'Hello {{customerName}}, your payment of INR {{amount}} for order {{orderNumber}} was successful via {{paymentMethod}} (Txn ID: {{transactionId}}).',
  },

  payment_failed: {
    title: 'Payment Failed',
    subject: 'Payment Failed - Order {{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Madurai Food Corner</h1>
          <p style="margin: 5px 0 0 0;">Payment Attempt Failed</p>
        </div>
        <div style="padding: 20px;">
          <h3>Hello {{customerName}},</h3>
          <p>Your payment attempt for Order <strong>{{orderNumber}}</strong> could not be processed.</p>
          <p>Please re-try paying online or choose Cash on delivery.</p>
        </div>
      </div>
    `,
    text: 'Hello {{customerName}}, your payment attempt for order {{orderNumber}} failed. Please try again or select cash on delivery.',
  },

  order_accepted: {
    title: 'Order Accepted',
    subject: 'Order {{orderNumber}} Accepted',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Madurai Food Corner</h2>
        <p>Hello {{customerName}}, your order <strong>{{orderNumber}}</strong> has been accepted by the restaurant kitchen!</p>
      </div>
    `,
    text: 'Hello {{customerName}}, your order {{orderNumber}} has been accepted by Madurai Food Corner!',
  },

  order_ready: {
    title: 'Order Ready for Pickup/Delivery',
    subject: 'Order {{orderNumber}} is Ready!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Madurai Food Corner</h2>
        <p>Hello {{customerName}}, your order <strong>{{orderNumber}}</strong> is ready!</p>
      </div>
    `,
    text: 'Hello {{customerName}}, your order {{orderNumber}} is ready at Madurai Food Corner!',
  },

  order_completed: {
    title: 'Order Completed',
    subject: 'Thank You! Order {{orderNumber}} Completed',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Madurai Food Corner</h2>
        <p>Hello {{customerName}}, your order <strong>{{orderNumber}}</strong> is complete. We hope you enjoyed your food!</p>
      </div>
    `,
    text: 'Hello {{customerName}}, thank you for dining with Madurai Food Corner! Order {{orderNumber}} is completed.',
  },

  order_cancelled: {
    title: 'Order Cancelled',
    subject: 'Order {{orderNumber}} Cancelled',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Madurai Food Corner</h2>
        <p>Hello {{customerName}}, your order <strong>{{orderNumber}}</strong> has been cancelled.</p>
      </div>
    `,
    text: 'Hello {{customerName}}, your order {{orderNumber}} has been cancelled.',
  },

  refund_processed: {
    title: 'Refund Processed',
    subject: 'Refund Processed for Order {{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Madurai Food Corner</h2>
        <p>Hello {{customerName}}, a refund of <strong>INR {{amount}}</strong> has been processed for Order <strong>{{orderNumber}}</strong>.</p>
      </div>
    `,
    text: 'Hello {{customerName}}, a refund of INR {{amount}} for order {{orderNumber}} has been processed.',
  },

  welcome_message: {
    title: 'Welcome to Madurai Food Corner',
    subject: 'Welcome to Madurai Food Corner!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Madurai Food Corner</h2>
        <p>Hello {{customerName}}, welcome! Explore authentic South Indian food & special combo meals on our app and website.</p>
      </div>
    `,
    text: 'Hello {{customerName}}, welcome to Madurai Food Corner! Explore authentic South Indian delicacies today.',
  },

  festival_offer: {
    title: 'Special Promotional Offer',
    subject: 'Special Festival Offer from Madurai Food Corner!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Special Festival Offer!</h2>
        <p>Hello {{customerName}}, enjoy <strong>{{offerTitle}}</strong>! {{description}}</p>
      </div>
    `,
    text: 'Hello {{customerName}}, enjoy special offer: {{offerTitle}} at Madurai Food Corner!',
  },
};

/**
 * Render template string replacing {{variable}} placeholders with data
 */
const renderTemplate = (templateName, variables = {}) => {
  const tpl = TEMPLATES[templateName];
  if (!tpl) return null;

  let title = tpl.title;
  let subject = tpl.subject;
  let html = tpl.html;
  let text = tpl.text;

  Object.keys(variables).forEach((key) => {
    const val = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    title = title.replace(regex, val);
    subject = subject.replace(regex, val);
    html = html.replace(regex, val);
    text = text.replace(regex, val);
  });

  return { title, subject, html, text };
};

module.exports = {
  TEMPLATES,
  renderTemplate,
};
