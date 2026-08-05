const { z } = require('zod');

const createFoodItemSchema = {
  body: z.object({
    name: z.string().min(2, 'Item name is required'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    price: z.number().positive('Price must be greater than 0'),
    isVeg: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  }),
};

const updateFoodItemSchema = {
  body: createFoodItemSchema.body.partial(),
};

module.exports = {
  createFoodItemSchema,
  updateFoodItemSchema,
};
