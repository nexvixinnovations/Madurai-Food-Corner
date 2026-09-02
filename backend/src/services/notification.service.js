const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const emailService = require('./channels/email.service');
const whatsappService = require('./channels/whatsapp.service');
const smsService = require('./channels/sms.service');
const pushService = require('./channels/push.service');
const { renderTemplate } = require('../utils/notificationTemplate.util');
const { validateSendNotification } = require('../validators/notification.validator');

class NotificationService {
  /**
   * Fetch all notification logs with filters & search. Sorted newest first.
   */
  async getAllNotifications({ channel, status, event, date, recipient, search }) {
    const where = {};

    if (channel && typeof channel === 'string' && channel.trim()) {
      where.channel = { equals: channel.trim(), mode: 'insensitive' };
    }

    if (status && typeof status === 'string' && status.trim()) {
      where.status = { equals: status.trim(), mode: 'insensitive' };
    }

    if (event && typeof event === 'string' && event.trim()) {
      where.event = { equals: event.trim(), mode: 'insensitive' };
    }

    if (recipient && typeof recipient === 'string' && recipient.trim()) {
      where.recipient = { contains: recipient.trim(), mode: 'insensitive' };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
        { recipient: { contains: q, mode: 'insensitive' } },
      ];
    }

    return await prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Fetch single notification detail by ID
   */
  async getNotificationById(id) {
    const log = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!log) {
      throw new ApiError(404, 'Notification log entry not found.');
    }

    return log;
  }

  /**
   * Dispatch notification via appropriate channel & log in database
   */
  async sendNotification(data) {
    validateSendNotification(data);

    const channel = data.channel.toLowerCase().trim();
    const recipient = data.recipient.trim();
    const eventName = data.event ? data.event.trim() : 'manual_notification';

    let title = data.title ? data.title.trim() : 'Notification';
    let subject = data.subject ? data.subject.trim() : title;
    let message = data.message ? data.message.trim() : title;
    let html = data.html || null;

    // Render template if template name specified
    if (data.template) {
      const rendered = renderTemplate(data.template, data.variables || {});
      if (rendered) {
        title = rendered.title;
        subject = rendered.subject;
        message = rendered.text;
        html = rendered.html;
      }
    }

    let dispatchResult = { success: false, message: 'Unsupported channel' };

    try {
      if (channel === 'email') {
        dispatchResult = await emailService.send({ recipient, subject, title, html, text: message, attachments: data.attachments });
      } else if (channel === 'whatsapp') {
        dispatchResult = await whatsappService.send({ recipient, title, message, text: message });
      } else if (channel === 'sms') {
        dispatchResult = await smsService.send({ recipient, title, message, text: message });
      } else if (channel === 'push') {
        dispatchResult = await pushService.send({ recipient, title, message, text: message, data: data.variables });
      } else if (channel === 'in_app') {
        dispatchResult = { success: true, message: 'In-app notification logged.' };
      }
    } catch (err) {
      dispatchResult = { success: false, error: err.message };
    }

    const logStatus = dispatchResult.success ? 'sent' : 'failed';
    const errorMessage = dispatchResult.error || (dispatchResult.success ? null : dispatchResult.message);

    // Save notification log in notifications table if table exists
    if (prisma.notifications && typeof prisma.notifications.create === 'function') {
      try {
        return await prisma.notifications.create({
          data: {
            title,
            message,
            type: data.type || 'info',
            channel,
            recipient,
            event: eventName,
            status: logStatus,
            error_message: errorMessage,
            retry_count: 0,
            read_status: false,
          },
        });
      } catch (dbErr) {
        console.warn('[NOTIFICATION DB LOG NOTICE]', dbErr.message);
      }
    }

    return {
      title,
      message,
      type: data.type || 'info',
      channel,
      recipient,
      event: eventName,
      status: logStatus,
      error_message: errorMessage,
      created_at: new Date(),
    };
  }

  /**
   * Dispatch a test notification
   */
  async sendTestNotification({ channel = 'email', recipient = 'test@example.com' }) {
    return await this.sendNotification({
      channel,
      recipient,
      title: 'Madurai Food Corner ERP Test Notification',
      message: 'This is a test notification to verify channel configuration.',
      event: 'test_notification',
    });
  }

  /**
   * Retry a failed notification log
   */
  async retryNotification(id) {
    const log = await this.getNotificationById(id);

    if (log.status === 'sent') {
      throw new ApiError(400, 'This notification has already been successfully sent.');
    }

    const currentRetry = (log.retry_count || 0) + 1;
    let dispatchResult = { success: false, message: 'Unsupported channel' };

    try {
      if (log.channel === 'email') {
        dispatchResult = await emailService.send({ recipient: log.recipient, title: log.title, text: log.message });
      } else if (log.channel === 'whatsapp') {
        dispatchResult = await whatsappService.send({ recipient: log.recipient, title: log.title, message: log.message });
      } else if (log.channel === 'sms') {
        dispatchResult = await smsService.send({ recipient: log.recipient, title: log.title, message: log.message });
      } else if (log.channel === 'push') {
        dispatchResult = await pushService.send({ recipient: log.recipient, title: log.title, message: log.message });
      }
    } catch (err) {
      dispatchResult = { success: false, error: err.message };
    }

    const newStatus = dispatchResult.success ? 'sent' : 'failed';
    const errorMessage = dispatchResult.error || (dispatchResult.success ? null : dispatchResult.message);

    return await prisma.notifications.update({
      where: { id },
      data: {
        status: newStatus,
        retry_count: currentRetry,
        error_message: errorMessage,
      },
    });
  }
}

module.exports = new NotificationService();
