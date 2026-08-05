/**
 * Background Notification Queue & Retry Service
 */

class NotificationQueueService {
  constructor() {
    this.queue = [];
    this.maxRetries = parseInt(process.env.MAX_NOTIFICATION_RETRIES || '3', 10);
    this.isProcessing = false;
  }

  /**
   * Add job to queue and start processing
   */
  enqueue(job) {
    this.queue.push(job);
    this.processQueue();
  }

  /**
   * Background Queue Processor loop
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        await job.handler();
      } catch (err) {
        console.error(`Error processing queued notification job ${job.id}:`, err.message);
      }
    }

    this.isProcessing = false;
  }
}

module.exports = new NotificationQueueService();
