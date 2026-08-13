const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { validateCreateMenu, validateUpdateMenu } = require('../validators/menu.validator');

class MenuService {
  /**
   * Helper to format YYYY-MM-DD string into a standard Date object for @db.Date queries
   */
  parseMenuDate(dateInput) {
    let dateStr = dateInput;
    if (!dateStr) {
      // Default to today's date in YYYY-MM-DD
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    // Return Date object truncated to midnight UTC for @db.Date field comparison
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      throw new ApiError(400, 'Invalid date format provided. Expected YYYY-MM-DD.');
    }
    
    // Set time to 00:00:00.000 UTC
    return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
  }

  /**
   * Get scheduled menu items for a specific date with optional search & category filter
   */
  async getMenuByDate({ date, search, category }) {
    const targetDate = this.parseMenuDate(date);

    const where = {
      menu_date: targetDate,
    };

    const foodItemWhere = {};
    if (search && typeof search === 'string' && search.trim()) {
      foodItemWhere.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    if (category && typeof category === 'string' && category.trim()) {
      foodItemWhere.category = {
        equals: category.trim(),
        mode: 'insensitive',
      };
    }

    const allFoodItems = await prisma.food_items.findMany({
      where: foodItemWhere,
      orderBy: { display_order: 'asc' },
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[targetDate.getUTCDay()];

    const isAvailableToday = (food) => {
      if (!food) return false;
      // Main Switch OFF (available === false): Total item is set to not available on that day -> hide from website
      if (food.available === false) return false;

      if (!food.available_days || food.available_days.trim() === '' || food.available_days.toLowerCase().includes('every day')) return true;
      return food.available_days.toLowerCase().includes(currentDayName.toLowerCase());
    };

    return allFoodItems
      .filter(isAvailableToday)
      .map((item) => ({
        id: `auto-${item.id}`,
        menu_date: targetDate,
        food_item_id: item.id,
        display_order: item.display_order,
        available: item.online_available !== false,
        online_available: item.online_available !== false,
        food_items: item,
      }));
  }

  /**
   * Fetch a single menu schedule entry by ID
   */
  async getMenuById(id) {
    const entry = await prisma.menu_schedule.findUnique({
      where: { id },
      include: {
        food_items: true,
      },
    });

    if (!entry) {
      throw new ApiError(404, 'Menu schedule entry not found.');
    }

    return entry;
  }

  /**
   * Create a new menu schedule entry with duplicate prevention for (menu_date + food_item_id)
   */
  async createMenuSchedule(data) {
    validateCreateMenu(data);

    const targetDate = this.parseMenuDate(data.menu_date);

    // Verify food_item_id exists
    const foodItem = await prisma.food_items.findUnique({
      where: { id: data.food_item_id },
    });
    if (!foodItem) {
      throw new ApiError(404, 'Food item with the specified ID does not exist.');
    }

    // Check for duplicate entry (menu_date + food_item_id)
    const existingSchedule = await prisma.menu_schedule.findFirst({
      where: {
        menu_date: targetDate,
        food_item_id: data.food_item_id,
      },
    });

    if (existingSchedule) {
      throw new ApiError(400, 'Duplicate entry: This food item is already scheduled for the selected date.');
    }

    const displayOrder = data.display_order ? parseInt(data.display_order, 10) : (foodItem.display_order || 1);
    const available = data.available !== undefined ? (data.available === 'true' || data.available === true) : true;

    return await prisma.menu_schedule.create({
      data: {
        menu_date: targetDate,
        food_item_id: data.food_item_id,
        display_order: displayOrder,
        available,
      },
      include: {
        food_items: true,
      },
    });
  }

  /**
   * Update an existing menu schedule entry
   */
  async updateMenuSchedule(id, data) {
    const existingEntry = await this.getMenuById(id);

    validateUpdateMenu(data);

    const targetDate = data.menu_date ? this.parseMenuDate(data.menu_date) : existingEntry.menu_date;
    const targetFoodItemId = data.food_item_id || existingEntry.food_item_id;

    // If changing date or food item, check duplicate entry excluding current record
    if (data.menu_date || data.food_item_id) {
      if (data.food_item_id) {
        const foodItemExists = await prisma.food_items.findUnique({ where: { id: data.food_item_id } });
        if (!foodItemExists) {
          throw new ApiError(404, 'Food item with the specified ID does not exist.');
        }
      }

      const duplicateCheck = await prisma.menu_schedule.findFirst({
        where: {
          menu_date: targetDate,
          food_item_id: targetFoodItemId,
          NOT: { id },
        },
      });

      if (duplicateCheck) {
        throw new ApiError(400, 'Duplicate entry: Another menu entry exists for this food item on the specified date.');
      }
    }

    const updateData = {};
    if (data.menu_date) updateData.menu_date = targetDate;
    if (data.food_item_id) updateData.food_item_id = targetFoodItemId;
    if (data.display_order !== undefined && data.display_order !== null && data.display_order !== '') {
      updateData.display_order = parseInt(data.display_order, 10);
    }
    if (data.available !== undefined && data.available !== null) {
      updateData.available = data.available === 'true' || data.available === true;
    }

    return await prisma.menu_schedule.update({
      where: { id },
      data: updateData,
      include: {
        food_items: true,
      },
    });
  }

  /**
   * Delete food entry from a day's menu schedule
   */
  async deleteMenuSchedule(id) {
    await this.getMenuById(id);

    return await prisma.menu_schedule.delete({
      where: { id },
    });
  }

  /**
   * Toggle or patch availability status of a scheduled menu item
   */
  async toggleMenuStatus(id, availableParam) {
    const existingEntry = await this.getMenuById(id);

    let available = !existingEntry.available;
    if (availableParam !== undefined && availableParam !== null) {
      available = availableParam === 'true' || availableParam === true;
    }

    return await prisma.menu_schedule.update({
      where: { id },
      data: { available },
      include: {
        food_items: true,
      },
    });
  }
}

module.exports = new MenuService();
