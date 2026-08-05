/**
 * SMS Notification Channel Service
 */

class SmsService {
  constructor() {
    this.enabled = process.env.ENABLE_SMS_NOTIFICATIONS !== 'false';
  }

  /**
   * Send SMS
   */
  async send({ recipient, title, message, text }) {
    if (!this.enabled) {
      return { success: false, message: 'SMS channel is disabled in configuration.' };
    }

    const payloadText = text || message || title;

    // Check for Twilio SMS credentials
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const res = await client.messages.create({
          body: payloadText,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient,
        });

        return {
          success: true,
          message: 'SMS sent successfully via Twilio.',
          sid: res.sid,
        };
      } catch (err) {
        console.error('Twilio SMS Error:', err.message);
        return {
          success: false,
          error: err.message,
        };
      }
    }

    // Driver Fallback Mode: Log dispatch
    console.log(`[SMS DRIVER SIMULATION] To: ${recipient} | Text: ${payloadText}`);
    return {
      success: true,
      message: 'SMS message dispatched (Console fallback).',
      simulated: true,
    };
  }
}

module.exports = new SmsService();
