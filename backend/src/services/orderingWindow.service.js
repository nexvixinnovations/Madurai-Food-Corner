const prisma = require('../config/prisma');

class OrderingWindowService {
  /**
   * Format 24-hour time string (e.g. "14:00") into 12-hour AM/PM format (e.g. "2:00 PM")
   */
  format12Hour(time24) {
    if (!time24) return '';
    const parts = String(time24).split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mStr} ${period}`;
  }

  /**
   * Check if current server time (in Asia/Kolkata timezone) is within allowed ordering window.
   * Cross-midnight windows (e.g. 14:00 -> 10:00) are fully supported.
   */
  async getOrderingStatus(targetDateStr) {
    const settings = await prisma.settings.findFirst().catch(() => null);

    if (!settings || !settings.ordering_schedule_enabled) {
      return {
        enabled: false,
        isOpen: true,
        startTime: '14:00',
        endTime: '10:00',
        formattedStartTime: '2:00 PM',
        formattedEndTime: '10:00 AM',
        scope: 'EVERYDAY',
        bannerText: 'Orders are currently open!',
        statusText: 'ORDERING OPEN',
        reason: 'Ordering window restriction disabled'
      };
    }

    const startTimeStr = settings.ordering_start_time || '14:00';
    const endTimeStr = settings.ordering_end_time || '10:00';
    const scope = settings.ordering_time_scope || 'EVERYDAY';

    // Get current server time in IST (Asia/Kolkata timezone offset UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);

    const currentHour = istTime.getHours();
    const currentMin = istTime.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    const [startH, startM] = startTimeStr.split(':').map(n => parseInt(n, 10) || 0);
    const [endH, endM] = endTimeStr.split(':').map(n => parseInt(n, 10) || 0);

    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    let isOpen = false;
    if (startTotalMin < endTotalMin) {
      // Standard daytime window (e.g. 09:00 to 22:00)
      isOpen = currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
    } else {
      // Cross-midnight window (e.g. 14:00 (2 PM) to 10:00 (10 AM next morning))
      isOpen = currentTotalMin >= startTotalMin || currentTotalMin <= endTotalMin;
    }

    const fmtStart = this.format12Hour(startTimeStr);
    const fmtEnd = this.format12Hour(endTimeStr);

    const bannerText = `Orders for tomorrow's lunch are accepted from ${fmtStart} today until ${fmtEnd} tomorrow.`;
    const statusText = isOpen
      ? `ORDERING OPEN — Order before ${fmtEnd} for tomorrow's lunch.`
      : `ORDERING CLOSED — Ordering opens today at ${fmtStart} for tomorrow's lunch.`;

    return {
      enabled: true,
      isOpen,
      startTime: startTimeStr,
      endTime: endTimeStr,
      formattedStartTime: fmtStart,
      formattedEndTime: fmtEnd,
      scope,
      bannerText,
      statusText,
      serverTimeIst: istTime.toISOString()
    };
  }
}

module.exports = new OrderingWindowService();
