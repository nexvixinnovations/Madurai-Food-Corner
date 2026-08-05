/**
 * Email Notification Channel Service
 */

class EmailService {
  constructor() {
    this.enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false';
  }

  /**
   * Send Email Notification
   */
  async send({ recipient, subject, title, html, text, attachments }) {
    if (!this.enabled) {
      return { success: false, message: 'Email channel is disabled in configuration.' };
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;

    // Check if SMTP transport credentials are configured
    if (smtpHost && smtpUser) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Madurai Food Corner" <${process.env.SMTP_USER}>`,
          to: recipient,
          subject: subject || title || 'Madurai Food Corner ERP Notification',
          text,
          html,
          attachments,
        });

        return {
          success: true,
          message: 'Email sent successfully via SMTP.',
          messageId: info.messageId,
        };
      } catch (err) {
        console.error('SMTP Email Error:', err.message);
        return {
          success: false,
          error: err.message,
        };
      }
    }

    // Driver Fallback Mode: Log dispatch
    console.log(`[EMAIL DRIVER SIMULATION] To: ${recipient} | Subject: ${subject || title} | Message: ${text || title}`);
    return {
      success: true,
      message: 'Email dispatch simulated successfully (Console driver fallback).',
      simulated: true,
    };
  }
}

module.exports = new EmailService();
