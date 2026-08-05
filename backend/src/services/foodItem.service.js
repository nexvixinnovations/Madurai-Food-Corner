const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

class FoodItemService {
  async getAllFoodItems() {
    return prisma.food_items.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async getFoodItemById(id) {
    const foodItem = await prisma.food_items.findUnique({
      where: { id },
    });
    if (!foodItem) {
      throw new ApiError(404, 'Food item not found');
    }
    return foodItem;
  }

  async createFoodItem(data) {
    return prisma.food_items.create({ data });
  }

  async updateFoodItem(id, data) {
    await this.getFoodItemById(id);
    return prisma.food_items.update({
      where: { id },
      data,
    });
  }

  async deleteFoodItem(id) {
    await this.getFoodItemById(id);
    return prisma.$transaction(async (tx) => {
      // Disassociate historical order items (set food_item_id to null)
      await tx.order_items.updateMany({
        where: { food_item_id: id },
        data: { food_item_id: null },
      });

      // Remove from active menu schedules
      await tx.menu_schedule.deleteMany({
        where: { food_item_id: id },
      });

      // Remove from combo items
      await tx.combo_items.deleteMany({
        where: { food_item_id: id },
      });

      // Remove from special offer items
      await tx.special_offer_items.deleteMany({
        where: { food_item_id: id },
      });

      // Delete the food item
      return tx.food_items.delete({
        where: { id },
      });
    });
  }
}

module.exports = new FoodItemService();
