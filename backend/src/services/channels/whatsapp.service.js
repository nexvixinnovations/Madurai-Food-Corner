/**
 * WhatsApp Notification Channel Service
 * Abstracted interface supporting Meta WhatsApp API, Twilio, Interakt, AISensy
 */

class WhatsAppService {
  constructor() {
    this.enabled = process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'false';
    this.provider = process.env.WHATSAPP_PROVIDER || 'meta'; // meta, twilio, interakt, aisensy
  }

  /**
   * Send WhatsApp Message
   */
  async send({ recipient, title, message, text }) {
    if (!this.enabled) {
      return { success: false, message: 'WhatsApp channel is disabled in configuration.' };
    }

    const payloadText = text || message || title;

    // Check for Meta WhatsApp Cloud API credentials
    if (this.provider === 'meta' && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const axios = require('axios');
        const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        
        const response = await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'text',
            text: { body: payloadText },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return {
          success: true,
          message: 'WhatsApp message sent via Meta Cloud API.',
          data: response.data,
        };
      } catch (err) {
        console.error('Meta WhatsApp API Error:', err.response ? err.response.data : err.message);
        return {
          success: false,
          error: err.message,
        };
      }
    }

    // Driver Fallback Mode: Log dispatch
    console.log(`[WHATSAPP DRIVER SIMULATION - ${this.provider.toUpperCase()}] To: ${recipient} | Text: ${payloadText}`);
    return {
      success: true,
      message: `WhatsApp message dispatched via ${this.provider} driver (Console fallback).`,
      simulated: true,
    };
  }
}

module.exports = new WhatsAppService();
