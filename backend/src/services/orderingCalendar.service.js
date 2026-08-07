const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class OrderingCalendarService {
  /**
   * Helper to format Date object to YYYY-MM-DD string without timezone skew
   */
  formatDateIso(dateObj) {
    if (!dateObj) return '';
    if (typeof dateObj === 'string') return dateObj.split('T')[0];
    try {
      const d = new Date(dateObj);
      if (isNaN(d.getTime())) return '';
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  }

  /**
   * Helper to convert YYYY-MM-DD string to UTC midnight Date object
   */
  parseDateUtc(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) {
      return new Date(Date.UTC(dateStr.getUTCFullYear(), dateStr.getUTCMonth(), dateStr.getUTCDate(), 0, 0, 0, 0));
    }
    if (typeof dateStr !== 'string') return null;
    const cleanStr = dateStr.trim().split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  /**
   * Admin API: GET /api/admin/ordering-calendar
   * Fetch all calendar availability overrides stored in Neon PostgreSQL ordering_calendar table
   */
  async getAdminCalendar() {
    try {
      const records = await prisma.ordering_calendar.findMany({
        orderBy: { order_date: 'asc' },
      });

      logger.info('[OrderingCalendar] Fetched admin calendar overrides from Neon DB', { count: records.length });

      return records.map((r) => ({
        order_date: this.formatDateIso(r.order_date),
        is_open: r.is_open ?? true,
      }));
    } catch (err) {
      console.error("Full server-side stack trace during getAdminCalendar:", err.stack);
      logger.error('[OrderingCalendar] Error fetching admin calendar from DB', { error: err.message });
      throw new ApiError(500, 'Failed to fetch ordering calendar from database.');
    }
  }

  /**
   * Admin API: PUT /api/admin/ordering-calendar
   * Upsert calendar date overrides in Neon PostgreSQL ordering_calendar table using Prisma transaction
   */
  async updateAdminCalendar(payload) {
    console.log("Calendar payload:", payload);
    console.log("Available Prisma models:", Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    console.log("Updating ordering calendar");

    let datesList = [];
    if (Array.isArray(payload)) {
      datesList = payload;
    } else if (payload && Array.isArray(payload.dates)) {
      datesList = payload.dates;
    } else if (payload && typeof payload === 'object' && payload.order_date) {
      datesList = [payload];
    } else {
      logger.warn('[OrderingCalendar] Invalid update payload format received', { payload });
      throw new ApiError(400, 'Invalid request body. Expected a "dates" array or list of date objects.');
    }

    logger.info('[OrderingCalendar] Processing calendar update request', { totalDatesToUpdate: datesList.length });

    try {
      return await prisma.$transaction(async (tx) => {
        const results = [];

        for (const item of datesList) {
          if (!item || !item.order_date) continue;
          const parsedDate = this.parseDateUtc(item.order_date);
          if (!parsedDate) continue;

          const isOpen = item.is_open === true || item.is_open === 'true';

          const upserted = await tx.ordering_calendar.upsert({
            where: { order_date: parsedDate },
            update: { is_open: isOpen },
            create: { order_date: parsedDate, is_open: isOpen },
          });

          const formattedIso = this.formatDateIso(upserted.order_date);
          results.push({
            order_date: formattedIso,
            is_open: upserted.is_open,
          });

          logger.info(`[OrderingCalendar] Saved override: ${formattedIso} -> ${upserted.is_open ? 'OPEN' : 'CLOSED'}`);
        }

        logger.info('[OrderingCalendar] Calendar transaction committed successfully', { updatedCount: results.length });
        return results;
      });
    } catch (err) {
      console.error("Full server-side stack trace during ordering calendar update:", err.stack);
      logger.error('[OrderingCalendar] Error updating ordering calendar in DB', { error: err.message });
      throw new ApiError(500, `Failed to update ordering calendar: ${err.message}`);
    }
  }

  /**
   * Website Public API: GET /api/website/ordering-calendar
   * Returns list of closed dates for customer checkout calendar. Missing dates default to OPEN.
   */
  async getWebsiteClosedDates() {
    try {
      const closedRecords = await prisma.ordering_calendar.findMany({
        where: { is_open: false },
        orderBy: { order_date: 'asc' },
      });

      const closedDates = closedRecords.map((r) => this.formatDateIso(r.order_date)).filter(Boolean);

      logger.info('[OrderingCalendar] Public closed dates fetched for website', { closedCount: closedDates.length });

      return {
        closed_dates: closedDates,
      };
    } catch (err) {
      console.error("Full server-side stack trace during getWebsiteClosedDates:", err.stack);
      logger.error('[OrderingCalendar] Error fetching public website closed dates', { error: err.message });
      throw new ApiError(500, 'Failed to fetch customer ordering calendar.');
    }
  }

  /**
   * Backend Validation Helper: Check if a specific required_date is closed in Neon DB ordering_calendar
   */
  async isDateClosed(dateStr) {
    if (!dateStr) return false;
    const parsedDate = this.parseDateUtc(dateStr);
    if (!parsedDate) return false;

    try {
      const record = await prisma.ordering_calendar.findUnique({
        where: { order_date: parsedDate },
      });

      const isClosed = record ? record.is_open === false : false;
      const formattedDateStr = this.formatDateIso(parsedDate);

      if (isClosed) {
        logger.warn(`[OrderingCalendar] Date check result: ${formattedDateStr} is CLOSED`);
      } else {
        logger.info(`[OrderingCalendar] Date check result: ${formattedDateStr} is OPEN (default/override)`);
      }

      return isClosed;
    } catch (err) {
      console.error("Full server-side stack trace during isDateClosed:", err.stack);
      logger.error('[OrderingCalendar] Error checking date availability in DB', { dateStr, error: err.message });
      return false;
    }
  }
}

module.exports = new OrderingCalendarService();
