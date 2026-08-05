const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validateCreateCombo, validateUpdateCombo, parseFoodItems } = require('../validators/combo.validator');

class ComboService {
  /**
   * Fetch all combos with search, available, and offer_enabled filters. Sorted by created_at DESC.
   */
  async getAllCombos({ search, available, offer_enabled, date }) {
    const where = {};

    // Partial search by combo name (case-insensitive)
    if (search && typeof search === 'string' && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Available filter
    if (available !== undefined && available !== null && available !== '') {
      where.available = available === 'true' || available === true;
    }

    // Offer Enabled filter
    if (offer_enabled !== undefined && offer_enabled !== null && offer_enabled !== '') {
      where.offer_enabled = offer_enabled === 'true' || offer_enabled === true;
    }

    const combos = await prisma.combos.findMany({
      where,
      include: {
        combo_items: {
          include: {
            food_items: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Component Day-of-Week Availability Filter
    const targetDateObj = date ? new Date(date) : new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[targetDateObj.getDay()];

    return combos.filter((combo) => {
      if (!combo.combo_items || combo.combo_items.length === 0) return true;
      // All component items must be available and valid for the current day
      return combo.combo_items.every((ci) => {
        const fi = ci.food_items;
        if (!fi) return true;
        if (fi.available === false) return false;
        if (fi.available_days && fi.available_days.trim() !== '' && !fi.available_days.includes('Every Day')) {
          const daysList = fi.available_days.split(',').map((d) => d.trim());
          if (!daysList.includes(currentDayName)) {
            return false;
          }
        }
        return true;
      });
    });
  }

  /**
   * Fetch a single combo by ID with nested food items and quantities
   */
  async getComboById(id) {
    const combo = await prisma.combos.findUnique({
      where: { id },
      include: {
        combo_items: {
          include: {
            food_items: true,
          },
        },
      },
    });

    if (!combo) {
      throw new ApiError(404, 'Combo deal not found.');
    }

    return combo;
  }

  /**
   * Create a new combo meal and link food items
   */
  async createCombo(data, file) {
    const foodItems = parseFoodItems(data);
    data.food_items = foodItems;

    validateCreateCombo(data);

    // Verify all referenced food_item_ids exist in food_items table
    const foodItemIds = foodItems.map((item) => item.food_item_id);
    const existingFoodItems = await prisma.food_items.findMany({
      where: { id: { in: foodItemIds } },
    });

    const foodMap = new Map(existingFoodItems.map((f) => [f.id, f]));

    if (foodMap.size !== new Set(foodItemIds).size) {
      throw new ApiError(404, 'One or more selected food items do not exist in the food catalog.');
    }

    // Build auto-generated combo name considering item quantities (e.g. "3 Parotta + Chicken Gravy")
    const autoNameParts = foodItems.map((item) => {
      const foodObj = foodMap.get(item.food_item_id);
      const foodName = foodObj ? foodObj.name : 'Food Item';
      return item.quantity > 1 ? `${item.quantity} ${foodName}` : foodName;
    });

    const autoName = autoNameParts.join(' + ');
    const comboName = data.name && String(data.name).trim() !== '' ? String(data.name).trim() : autoName;

    // Calculate sum of original prices of component items
    const originalSumPrice = foodItems.reduce((sum, item) => {
      const foodObj = foodMap.get(item.food_item_id);
      const itemPrice = foodObj ? Number(foodObj.price) : 0;
      return sum + itemPrice * item.quantity;
    }, 0);

    // Upload image to Cloudinary if file provided
    let imageUrl = null;
    if (file && file.path) {
      imageUrl = await uploadToCloudinary(file.path, 'madurai_food_corner/combos');
    }

    const price = data.price ? parseFloat(data.price) : originalSumPrice;
    const dineInPrice = data.dine_in_price ? parseFloat(data.dine_in_price) : price;
    const parcelPrice = data.parcel_price ? parseFloat(data.parcel_price) : price;
    const offerEnabled = data.offer_enabled === 'true' || data.offer_enabled === true;
    const offerPrice = data.offer_price ? parseFloat(data.offer_price) : null;
    const available = data.available !== undefined ? (data.available === 'true' || data.available === true) : true;

    // Create combo record with nested combo_items in atomic transaction
    return await prisma.$transaction(async (tx) => {
      return await tx.combos.create({
        data: {
          name: comboName,
          price,
          dine_in_price: dineInPrice,
          parcel_price: parcelPrice,
          offer_enabled: offerEnabled,
          offer_price: offerPrice,
          available,
          image_url: imageUrl,
          combo_items: {
            create: foodItems.map((item) => ({
              food_item_id: item.food_item_id,
              quantity: parseInt(item.quantity, 10),
            })),
          },
        },
        include: {
          combo_items: {
            include: {
              food_items: true,
            },
          },
        },
      });
    });
  }

  /**
   * Update an existing combo meal and handle image replacement / food item list updates
   */
  async updateCombo(id, data, file) {
    const existingCombo = await this.getComboById(id);

    if (data.food_items !== undefined) {
      const parsedItems = parseFoodItems(data.food_items);
      data.food_items = parsedItems;
    }

    validateUpdateCombo(data);

    // Handle Image Replacement
    let imageUrl = existingCombo.image_url;
    if (file && file.path) {
      if (existingCombo.image_url) {
        await deleteFromCloudinary(existingCombo.image_url);
      }
      imageUrl = await uploadToCloudinary(file.path, 'madurai_food_corner/combos');
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.offer_enabled !== undefined) updateData.offer_enabled = data.offer_enabled === 'true' || data.offer_enabled === true;
    if (data.offer_price !== undefined) updateData.offer_price = data.offer_price ? parseFloat(data.offer_price) : null;
    if (data.available !== undefined) updateData.available = data.available === 'true' || data.available === true;
    updateData.image_url = imageUrl;

    // If updating food_items, delete existing combo_items and recreate
    if (data.food_items && Array.isArray(data.food_items)) {
      const foodItemIds = data.food_items.map((item) => item.food_item_id);
      const existingFoodItems = await prisma.food_items.findMany({
        where: { id: { in: foodItemIds } },
        select: { id: true },
      });

      if (existingFoodItems.length !== new Set(foodItemIds).size) {
        throw new ApiError(404, 'One or more selected food items do not exist in the food catalog.');
      }

      // Execute transaction to replace combo_items
      await prisma.$transaction([
        prisma.combo_items.deleteMany({ where: { combo_id: id } }),
        prisma.combo_items.createMany({
          data: data.food_items.map((item) => ({
            combo_id: id,
            food_item_id: item.food_item_id,
            quantity: parseInt(item.quantity, 10),
          })),
        }),
      ]);
    }

    return await prisma.combos.update({
      where: { id },
      data: updateData,
      include: {
        combo_items: {
          include: {
            food_items: true,
          },
        },
      },
    });
  }

  /**
   * Delete a combo meal and remove its image from Cloudinary
   */
  async deleteCombo(id) {
    const combo = await this.getComboById(id);

    if (combo.image_url) {
      await deleteFromCloudinary(combo.image_url);
    }

    return await prisma.$transaction(async (tx) => {
      await tx.order_items.updateMany({
        where: { combo_id: id },
        data: { combo_id: null },
      });
      await tx.combo_items.deleteMany({
        where: { combo_id: id },
      });
      return tx.combos.delete({
        where: { id },
      });
    });
  }

  /**
   * Toggle or patch availability status of a combo
   */
  async toggleComboStatus(id, availableParam) {
    const combo = await this.getComboById(id);

    let available = !combo.available;
    if (availableParam !== undefined && availableParam !== null) {
      available = availableParam === 'true' || availableParam === true;
    }

    return await prisma.combos.update({
      where: { id },
      data: { available },
      include: {
        combo_items: {
          include: {
            food_items: true,
          },
        },
      },
    });
  }
}

module.exports = new ComboService();
