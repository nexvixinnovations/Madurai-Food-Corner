const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validateCreateOffer, validateUpdateOffer } = require('../validators/offer.validator');
const { parseFoodItems } = require('../validators/combo.validator');

class OfferService {
  parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Get all special offers with relational items and component day-of-week availability check.
   */
  async getAllOffers({ search, available, active, date }) {
    const where = {};

    if (active === 'true' || active === true) {
      where.available = true;
      where.offer_enabled = true;
    } else {
      if (available !== undefined && available !== null && available !== '') {
        where.available = available === 'true' || available === true;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const query = search.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { tag_name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const offers = await prisma.special_offers.findMany({
      where,
      include: {
        special_offer_items: {
          include: {
            food_items: true,
          },
        },
      },
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    });

    const targetDateObj = date ? new Date(date) : new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[targetDateObj.getDay()];

    return offers.filter((offer) => {
      if (!offer.special_offer_items || offer.special_offer_items.length === 0) return true;
      return offer.special_offer_items.every((soi) => {
        const fi = soi.food_items;
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
   * Fetch a single offer by ID
   */
  async getOfferById(id) {
    const offer = await prisma.special_offers.findUnique({
      where: { id },
      include: {
        special_offer_items: {
          include: {
            food_items: true,
          },
        },
      },
    });

    if (!offer) {
      throw new ApiError(404, 'Special offer not found.');
    }

    return offer;
  }

  /**
   * Create a new promotional offer and link component items in transaction
   */
  async createOffer(data, file) {
    validateCreateOffer(data);

    const foodItems = parseFoodItems(data);
    let existingFoodItems = [];
    if (foodItems.length > 0) {
      const foodItemIds = foodItems.map((item) => item.food_item_id);
      existingFoodItems = await prisma.food_items.findMany({
        where: { id: { in: foodItemIds } },
      });
    }

    const foodMap = new Map(existingFoodItems.map((f) => [f.id, f]));

    const autoNameParts = foodItems.map((item) => {
      const foodObj = foodMap.get(item.food_item_id);
      const foodName = foodObj ? foodObj.name : 'Food Item';
      return item.quantity > 1 ? `${item.quantity} ${foodName}` : foodName;
    });

    const itemsSummary = autoNameParts.join(' + ');
    const tagName = (data.tag_name || data.tagName || 'SPECIAL OFFER').trim();
    const fullTitle = data.title && data.title.trim() ? data.title.trim() : (itemsSummary ? `${tagName}: ${itemsSummary}` : tagName);

    const originalSumPrice = foodItems.reduce((sum, item) => {
      const foodObj = foodMap.get(item.food_item_id);
      const itemPrice = foodObj ? Number(foodObj.price) : 0;
      return sum + itemPrice * item.quantity;
    }, 0);

    let imageUrl = null;
    if (file && file.path) {
      imageUrl = await uploadToCloudinary(file.path, 'madurai_food_corner/offers');
    }

    const price = data.price ? parseFloat(data.price) : (originalSumPrice > 0 ? originalSumPrice : null);
    const offerEnabled = data.offer_enabled === 'true' || data.offer_enabled === true;
    const offerPrice = data.offer_price !== undefined && data.offer_price !== null && data.offer_price !== '' ? parseFloat(data.offer_price) : 99.0;
    const available = data.available !== undefined ? (data.available === 'true' || data.available === true) : true;

    return await prisma.$transaction(async (tx) => {
      return await tx.special_offers.create({
        data: {
          tag_name: tagName,
          title: fullTitle,
          description: data.description ? data.description.trim() : null,
          image_url: imageUrl,
          price,
          offer_enabled: offerEnabled,
          offer_price: offerPrice,
          available,
          special_offer_items: foodItems.length > 0 ? {
            create: foodItems.map((item) => ({
              food_item_id: item.food_item_id,
              quantity: parseInt(item.quantity, 10),
            })),
          } : undefined,
        },
        include: {
          special_offer_items: {
            include: {
              food_items: true,
            },
          },
        },
      });
    });
  }

  /**
   * Update an existing promotional offer
   */
  async updateOffer(id, data, file) {
    const existingOffer = await this.getOfferById(id);
    validateUpdateOffer(data);

    let imageUrl = existingOffer.image_url;
    if (file && file.path) {
      if (existingOffer.image_url) {
        await deleteFromCloudinary(existingOffer.image_url);
      }
      imageUrl = await uploadToCloudinary(file.path, 'madurai_food_corner/offers');
    }

    const updateData = {};
    if (data.tag_name !== undefined) updateData.tag_name = data.tag_name ? data.tag_name.trim() : null;
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.price !== undefined) updateData.price = data.price ? parseFloat(data.price) : null;
    if (data.offer_enabled !== undefined) updateData.offer_enabled = data.offer_enabled === 'true' || data.offer_enabled === true;
    if (data.offer_price !== undefined) updateData.offer_price = data.offer_price ? parseFloat(data.offer_price) : null;
    if (data.available !== undefined) updateData.available = data.available === 'true' || data.available === true;
    
    updateData.image_url = imageUrl;

    return await prisma.special_offers.update({
      where: { id },
      data: updateData,
      include: {
        special_offer_items: {
          include: {
            food_items: true,
          },
        },
      },
    });
  }

  /**
   * Delete an offer and remove image from Cloudinary
   */
  async deleteOffer(id) {
    const offer = await this.getOfferById(id);

    if (offer.image_url) {
      await deleteFromCloudinary(offer.image_url);
    }

    return await prisma.$transaction(async (tx) => {
      await tx.order_items.updateMany({
        where: { special_offer_id: id },
        data: { special_offer_id: null },
      });
      await tx.special_offer_items.deleteMany({
        where: { special_offer_id: id },
      });
      return tx.special_offers.delete({
        where: { id },
      });
    });
  }

  /**
   * Toggle offer availability status
   */
  async toggleOfferStatus(id, available) {
    await this.getOfferById(id);
    return await prisma.special_offers.update({
      where: { id },
      data: { available },
      include: {
        special_offer_items: {
          include: {
            food_items: true,
          },
        },
      },
    });
  }
}

module.exports = new OfferService();
