const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validateCreateFood, validateUpdateFood } = require('../validators/food.validator');

class FoodService {
  /**
   * Fetch all food items with search, category, food_type, available filters and sorting
   */
  async getAllFoods({ search, category, food_type, available, sort }) {
    const where = {};

    // Partial search by name (case-insensitive)
    if (search && typeof search === 'string' && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Category filter
    if (category && typeof category === 'string' && category.trim()) {
      where.category = {
        equals: category.trim(),
        mode: 'insensitive',
      };
    }

    // Food Type filter (Veg, Non-Veg, Egg)
    if (food_type && typeof food_type === 'string' && food_type.trim()) {
      where.food_type = {
        equals: food_type.trim(),
        mode: 'insensitive',
      };
    }

    // Available filter
    if (available !== undefined && available !== null && available !== '') {
      if (available === 'true' || available === true) {
        where.available = true;
      } else if (available === 'false' || available === false) {
        where.available = false;
      }
    }

    // Sorting - Default is display_order ASC
    let orderBy = [{ display_order: 'asc' }, { name: 'asc' }];
    if (sort) {
      if (sort === 'display_order_desc') {
        orderBy = [{ display_order: 'desc' }];
      } else if (sort === 'price_asc') {
        orderBy = [{ price: 'asc' }];
      } else if (sort === 'price_desc') {
        orderBy = [{ price: 'desc' }];
      } else if (sort === 'name_asc') {
        orderBy = [{ name: 'asc' }];
      }
    }

    return await prisma.food_items.findMany({
      where,
      orderBy,
    });
  }

  /**
   * Fetch a single food item by ID
   */
  async getFoodById(id) {
    const foodItem = await prisma.food_items.findUnique({
      where: { id },
    });

    if (!foodItem) {
      throw new ApiError(404, 'Food item not found');
    }

    return foodItem;
  }

  /**
   * Create a new food item and upload image to Cloudinary if provided
   */
  async createFood(data, file) {
    // Validate request body fields
    validateCreateFood(data);

    let imageUrl = data.image_url ? data.image_url.trim() : null;
    if (file && file.path) {
      imageUrl = await uploadToCloudinary(file.path);
    }

    let foodType = data.food_type ? data.food_type.trim() : 'Veg';
    if (foodType === 'Non Veg') foodType = 'Non-Veg';
    if (foodType === 'Egg Items') foodType = 'Egg';

    const price = parseFloat(data.price);
    const offerEnabled = data.offer_enabled === 'true' || data.offer_enabled === true;
    let offerPrice = data.offer_price ? parseFloat(data.offer_price) : null;
    if (offerEnabled && data.offer_percentage !== undefined && data.offer_percentage !== null && data.offer_percentage !== '') {
      const pct = parseFloat(data.offer_percentage);
      if (!isNaN(pct) && pct > 0) {
        offerPrice = parseFloat((price * (1 - pct / 100)).toFixed(2));
      }
    }
    const available = data.available !== undefined ? (data.available === 'true' || data.available === true) : true;
    const onlineAvailable = data.online_available !== undefined ? (data.online_available === 'true' || data.online_available === true) : true;
    const displayOrder = data.display_order ? parseInt(data.display_order, 10) : 1;
    const prepTime = data.preparation_time ? parseInt(data.preparation_time, 10) : 15;

    let availableDays = "Every Day";
    if (Array.isArray(data.available_days)) {
      availableDays = data.available_days.join(", ");
    } else if (typeof data.available_days === 'string' && data.available_days.trim()) {
      availableDays = data.available_days.trim();
    }

    const createdFood = await prisma.food_items.create({
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        food_type: foodType,
        description: data.description ? data.description.trim() : null,
        price,
        offer_enabled: offerEnabled,
        offer_price: offerPrice,
        available,
        online_available: onlineAvailable,
        display_order: displayOrder,
        preparation_time: prepTime,
        image_url: imageUrl,
        available_days: availableDays,
      },
    });

    // Auto-schedule for today's menu so it immediately appears on the customer website
    try {
      const now = new Date();
      const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const existingSchedule = await prisma.menu_schedule.findFirst({
        where: { menu_date: targetDate, food_item_id: createdFood.id },
      });
      if (!existingSchedule) {
        await prisma.menu_schedule.create({
          data: {
            menu_date: targetDate,
            food_item_id: createdFood.id,
            display_order: createdFood.display_order || 1,
            available: createdFood.available,
          },
        });
      }
    } catch (e) {
      console.error('Auto menu schedule error:', e.message);
    }

    return createdFood;
  }

  /**
   * Update an existing food item, handling new image upload & old image deletion
   */
  async updateFood(id, data, file) {
    const existingFood = await this.getFoodById(id);

    // Validate update fields
    validateUpdateFood(data);

    let imageUrl = existingFood.image_url;

    // Handle new image upload
    if (file && file.path) {
      // Delete old Cloudinary image if it exists
      if (existingFood.image_url) {
        await deleteFromCloudinary(existingFood.image_url);
      }
      // Upload new image
      imageUrl = await uploadToCloudinary(file.path);
    }

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.food_type !== undefined) updateData.food_type = data.food_type.trim();
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.offer_enabled !== undefined) updateData.offer_enabled = data.offer_enabled === 'true' || data.offer_enabled === true;
    if (data.offer_price !== undefined) updateData.offer_price = data.offer_price ? parseFloat(data.offer_price) : null;
    if (data.available !== undefined) updateData.available = data.available === 'true' || data.available === true;
    if (data.online_available !== undefined) updateData.online_available = data.online_available === 'true' || data.online_available === true;
    if (data.display_order !== undefined) updateData.display_order = parseInt(data.display_order, 10);
    if (data.preparation_time !== undefined) updateData.preparation_time = parseInt(data.preparation_time, 10);
    
    if (data.available_days !== undefined) {
      if (Array.isArray(data.available_days)) {
        updateData.available_days = data.available_days.join(', ');
      } else if (typeof data.available_days === 'string') {
        updateData.available_days = data.available_days.trim();
      }
    }
    
    updateData.image_url = imageUrl;
    updateData.updated_at = new Date();

    return await prisma.food_items.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a food item and remove its image from Cloudinary
   */
  async deleteFood(id) {
    const foodItem = await this.getFoodById(id);

    // Delete image from Cloudinary if present
    if (foodItem.image_url) {
      await deleteFromCloudinary(foodItem.image_url);
    }

    return await prisma.food_items.delete({
      where: { id },
    });
  }

  /**
   * Toggle or patch availability status of a food item
   */
  async toggleFoodStatus(id, availableParam) {
    const foodItem = await this.getFoodById(id);

    let available = !foodItem.available;
    if (availableParam !== undefined && availableParam !== null) {
      available = availableParam === 'true' || availableParam === true;
    }

    return await prisma.food_items.update({
      where: { id },
      data: {
        available,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Bulk enable or disable all food items and combos
   */
  async bulkUpdateAvailability(availableParam) {
    const isAvailable = availableParam === true || availableParam === 'true';

    await prisma.food_items.updateMany({
      data: { available: isAvailable },
    });

    await prisma.combos.updateMany({
      data: { available: isAvailable },
    });

    return { available: isAvailable };
  }
}

module.exports = new FoodService();
