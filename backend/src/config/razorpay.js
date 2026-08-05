const Razorpay = require('razorpay');
const config = require('./index');

const razorpayInstance = new Razorpay({
  key_id: config.razorpay.keyId || 'dummy_key_id',
  key_secret: config.razorpay.keySecret || 'dummy_key_secret',
});

module.exports = razorpayInstance;
