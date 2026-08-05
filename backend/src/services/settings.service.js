const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const { validateUpdateSettings } = require('../validators/settings.validator');

// In-Memory Settings Cache
let cachedSettings = null;

class SettingsService {
  /**
   * Helper function exposed for other backend modules to access cached settings
   */
  async getRestaurantSettings() {
    if (cachedSettings) {
      return cachedSettings;
    }
    return await this.getSettings();
  }

  /**
   * Get single restaurant settings record (fetches from cache or DB; auto-creates if missing)
   */
  async getSettings() {
    let settings = await prisma.settings.findFirst().catch(() => null);

    if (!settings) {
      try {
        settings = await prisma.settings.create({
          data: {
            restaurant_name: 'Madurai Food Corner',
            phone: '+91 98765 43210',
            address: '123 South Veli Street, Madurai',
            email: 'info@maduraifoodcorner.com',
            disabled_dates: '[]',
            date_wise_ordering_enabled: true,
          },
        });
        logger.info('[SettingsService] Default restaurant settings initialized in Neon DB table "settings"');
      } catch (e) {
        logger.error('[SettingsService] Failed to initialize default settings in DB', { error: e.message });
      }
    }

    cachedSettings = settings;
    return settings;
  }

  /**
   * Helper to parse opening/closing time string (e.g., "09:00", "22:30") to Time Date object
   */
  parseTimeString(timeStr) {
    if (!timeStr) return null;
    const parts = String(timeStr).split(':');
    if (parts.length >= 2) {
      const d = new Date();
      d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      return d;
    }
    return null;
  }

  /**
   * Update restaurant settings (matches schema.prisma 'settings' model strictly)
   */
  async updateSettings(data, files) {
    console.log("Settings payload:", data);
    console.log("Available Prisma models:", Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    console.log("Updating restaurant settings in Neon DB table 'settings'");

    const existingSettings = await this.getSettings();

    validateUpdateSettings(data);

    const updateData = {};

    if (data.restaurant_name !== undefined) updateData.restaurant_name = String(data.restaurant_name).trim();
    
    // Map phone_number or phone to schema field 'phone'
    if (data.phone !== undefined || data.phone_number !== undefined) {
      const val = data.phone || data.phone_number;
      if (val) updateData.phone = String(val).trim();
    }

    if (data.email !== undefined) updateData.email = data.email ? String(data.email).trim() : null;
    if (data.address !== undefined) updateData.address = data.address ? String(data.address).trim() : null;
    if (data.gst_number !== undefined) updateData.gst_number = data.gst_number ? String(data.gst_number).trim() : null;
    if (data.currency !== undefined) updateData.currency = data.currency ? String(data.currency).trim() : 'INR';

    if (data.opening_time) updateData.opening_time = this.parseTimeString(data.opening_time);
    if (data.closing_time) updateData.closing_time = this.parseTimeString(data.closing_time);

    if (data.disabled_dates !== undefined) {
      updateData.disabled_dates = typeof data.disabled_dates === 'string' ? data.disabled_dates : JSON.stringify(data.disabled_dates);
    }

    if (data.date_wise_ordering_enabled !== undefined) {
      updateData.date_wise_ordering_enabled = data.date_wise_ordering_enabled === 'true' || data.date_wise_ordering_enabled === true;
    }

    if (data.order_discount_enabled !== undefined) {
      updateData.order_discount_enabled = data.order_discount_enabled === 'true' || data.order_discount_enabled === true;
    }
    if (data.tier1_min_amount !== undefined && data.tier1_min_amount !== null && data.tier1_min_amount !== '') {
      updateData.tier1_min_amount = parseFloat(data.tier1_min_amount);
    }
    if (data.tier1_percentage !== undefined && data.tier1_percentage !== null && data.tier1_percentage !== '') {
      updateData.tier1_percentage = parseFloat(data.tier1_percentage);
    }
    if (data.tier2_min_amount !== undefined) {
      updateData.tier2_min_amount = (data.tier2_min_amount !== null && data.tier2_min_amount !== '') ? parseFloat(data.tier2_min_amount) : null;
    }
    if (data.tier2_percentage !== undefined) {
      updateData.tier2_percentage = (data.tier2_percentage !== null && data.tier2_percentage !== '') ? parseFloat(data.tier2_percentage) : null;
    }

    if (data.ordering_schedule_enabled !== undefined) {
      updateData.ordering_schedule_enabled = data.ordering_schedule_enabled === 'true' || data.ordering_schedule_enabled === true;
    }
    if (data.ordering_start_time !== undefined) updateData.ordering_start_time = data.ordering_start_time ? String(data.ordering_start_time).trim() : null;
    if (data.ordering_end_time !== undefined) updateData.ordering_end_time = data.ordering_end_time ? String(data.ordering_end_time).trim() : null;
    if (data.ordering_time_scope !== undefined) updateData.ordering_time_scope = data.ordering_time_scope ? String(data.ordering_time_scope).trim() : 'EVERYDAY';
    if (data.ordering_target_date !== undefined) updateData.ordering_target_date = data.ordering_target_date ? String(data.ordering_target_date).trim() : null;

    try {
      const updatedSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });

      cachedSettings = updatedSettings;
      logger.info('[SettingsService] Settings updated successfully in Neon DB table "settings"');
      return updatedSettings;
    } catch (error) {
      console.error("Full server-side stack trace during settings update:", error.stack);
      logger.error('[SettingsService] Error updating settings in Prisma', { error: error.message });
      throw new ApiError(500, `Failed to update restaurant settings: ${error.message}`);
    }
  }

  /**
   * Patch operational status toggles
   */
  async updateSettingsStatus(statusPayload) {
    const existingSettings = await this.getSettings();
    const updateData = {};

    if (statusPayload.date_wise_ordering_enabled !== undefined) {
      updateData.date_wise_ordering_enabled = statusPayload.date_wise_ordering_enabled === 'true' || statusPayload.date_wise_ordering_enabled === true;
    }

    try {
      const updatedSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });

      cachedSettings = updatedSettings;
      return updatedSettings;
    } catch (error) {
      console.error("Full server-side stack trace during settings status update:", error.stack);
      throw new ApiError(500, `Failed to update settings status: ${error.message}`);
    }
  }
}

const serviceInstance = new SettingsService();

module.exports = {
  settingsService: serviceInstance,
  getRestaurantSettings: () => serviceInstance.getRestaurantSettings(),
};
