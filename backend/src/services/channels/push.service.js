/**
 * Firebase Push Notification (FCM) Channel Service
 */

class PushService {
  constructor() {
    this.enabled = process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false';
  }

  /**
   * Send FCM Push Notification
   */
  async send({ recipient, title, message, text, data }) {
    if (!this.enabled) {
      return { success: false, message: 'Push notification channel is disabled in configuration.' };
    }

    const payloadText = text || message || title;

    // Driver Fallback / FCM Simulation
    console.log(`[FCM PUSH NOTIFICATION DRIVER SIMULATION] Target/Token: ${recipient} | Title: ${title} | Body: ${payloadText}`);
    return {
      success: true,
      message: 'FCM Push Notification dispatched successfully (Console driver simulation).',
      simulated: true,
    };
  }
}

module.exports = new PushService();
