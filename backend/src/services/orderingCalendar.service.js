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
  /**
   * Admin API: PUT /api/admin/ordering-calendar
   * Upsert calendar date overrides in Neon PostgreSQL ordering_calendar table
   */
  async updateAdminCalendar(payload) {
    logger.info('[OrderingCalendar] Updating ordering calendar');

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
      // Fetch all existing calendar records and index by ISO date string (YYYY-MM-DD)
      const existingRecords = await prisma.ordering_calendar.findMany();
      const existingMap = new Map();
      existingRecords.forEach((r) => {
        const iso = this.formatDateIso(r.order_date);
        if (iso) existingMap.set(iso, r);
      });

      const results = [];

      for (const item of datesList) {
        if (!item || !item.order_date) continue;
        const parsedDate = this.parseDateUtc(item.order_date);
        if (!parsedDate) continue;

        const dateIso = this.formatDateIso(parsedDate);
        if (!dateIso) continue;

        const isOpen = item.is_open === true || item.is_open === 'true';

        try {
          const existingRecord = existingMap.get(dateIso);
          let savedRecord;

          if (existingRecord) {
            savedRecord = await prisma.ordering_calendar.update({
              where: { id: existingRecord.id },
              data: { is_open: isOpen, updated_at: new Date() },
            });
          } else {
            savedRecord = await prisma.ordering_calendar.create({
              data: { order_date: parsedDate, is_open: isOpen },
            });
            existingMap.set(dateIso, savedRecord);
          }

          results.push({
            order_date: dateIso,
            is_open: savedRecord.is_open,
          });

          logger.info(`[OrderingCalendar] Saved override: ${dateIso} -> ${savedRecord.is_open ? 'OPEN' : 'CLOSED'}`);
        } catch (itemErr) {
          logger.error(`[OrderingCalendar] Failed date override for ${dateIso}:`, itemErr.message);
        }
      }

      // Sync settings.disabled_dates array with all currently closed dates in database
      try {
        const allClosedRecords = await prisma.ordering_calendar.findMany({
          where: { is_open: false },
        });
        const closedDatesList = allClosedRecords.map((r) => this.formatDateIso(r.order_date)).filter(Boolean);

        const currentSettings = await prisma.settings.findFirst();
        if (currentSettings) {
          await prisma.settings.update({
            where: { id: currentSettings.id },
            data: { disabled_dates: JSON.stringify(closedDatesList) },
          });
        }
      } catch (settingsErr) {
        logger.warn('[OrderingCalendar] Failed to sync disabled_dates in settings table:', settingsErr.message);
      }

      logger.info('[OrderingCalendar] Calendar update committed successfully', { updatedCount: results.length });
      return results;
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
    const cleanStr = typeof dateStr === 'string' ? dateStr.trim().split('T')[0] : '';
    if (!cleanStr) return false;

    try {
      const closedRecords = await prisma.ordering_calendar.findMany({
        where: { is_open: false },
      });

      const closedSet = new Set(closedRecords.map((r) => this.formatDateIso(r.order_date)).filter(Boolean));
      const isClosed = closedSet.has(cleanStr);

      if (isClosed) {
        logger.warn(`[OrderingCalendar] Date check result: ${cleanStr} is CLOSED`);
      } else {
        logger.info(`[OrderingCalendar] Date check result: ${cleanStr} is OPEN (default/override)`);
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
