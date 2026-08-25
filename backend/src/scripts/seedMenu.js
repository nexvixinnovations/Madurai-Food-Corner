const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { cloudinary } = require('../config/cloudinary');
const prisma = require('../config/prisma');

const LOCAL_IMAGE_DIR = 'D:\\Projects\\Madurai Food Corner ERP\\Image';

// Helper to find matching image file in local folder
function findMatchingImageFile(foodName) {
  if (!fs.existsSync(LOCAL_IMAGE_DIR)) {
    console.warn(`[SeedScript] Image directory not found: ${LOCAL_IMAGE_DIR}`);
    return null;
  }

  const files = fs.readdirSync(LOCAL_IMAGE_DIR);
  
  // Normalize target food name (e.g. "Chicken Biriyani" -> "chickenbiriyani")
  const targetNorm = foodName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

    const baseName = path.basename(file, ext);
    const fileNorm = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check exact or close match
    if (fileNorm === targetNorm) {
      return path.join(LOCAL_IMAGE_DIR, file);
    }

    // Special case aliases
    if (targetNorm === 'parotta1piece' && (fileNorm === 'parota' || fileNorm === 'parotta')) {
      return path.join(LOCAL_IMAGE_DIR, file);
    }
    if (targetNorm === 'vegbiriyani' && (fileNorm === 'vegtabebiriyani' || fileNorm === 'vegbiriyani')) {
      return path.join(LOCAL_IMAGE_DIR, file);
    }
  }

  return null;
}

// Upload matched image to Cloudinary without deleting source file
async function uploadImageToCloudinary(filePath, foodName) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    console.log(`[Cloudinary] Uploading ${path.basename(filePath)} for "${foodName}"...`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'madurai_food_corner/foods',
      resource_type: 'image',
    });
    console.log(`[Cloudinary] SUCCESS -> ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`[Cloudinary] FAILED for "${foodName}": ${err.message}`);
    return null;
  }
}

async function seedMenu() {
  console.log('============================================================');
  console.log('STARTING MADURAI FOOD CORNER MENU IMPORT & CLOUDINARY UPLOAD');
  console.log('============================================================\n');

  const report = {
    foodItemsCreatedOrUpdated: 0,
    combosCreatedOrUpdated: 0,
    specialOffersCreatedOrUpdated: 0,
    imageMatches: [],
    missingImages: [],
  };

  // 1. NON-VEG ITEMS
  const nonVegItems = [
    { name: 'Chicken Biriyani', price: 80, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Chicken Rice', price: 80, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Chicken Noodles', price: 80, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Chicken Koththu', price: 100, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Chicken Gravy', price: 70, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Egg Rice', price: 60, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Egg Noodles', price: 60, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Egg Koththu', price: 80, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Plain Biriyani', price: 60, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Egg Biriyani', price: 70, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Chicken Chilly', price: 50, category: 'Non-Veg', food_type: 'Non-Veg' },
    { name: 'Chilly Biriyani', price: 80, category: 'Non-Veg', food_type: 'Non-Veg' },
  ];

  // 2. VEG ITEMS (with daily rotation rules)
  const vegItems = [
    { name: 'Parotta (1 piece)', price: 15, category: 'Veg', food_type: 'Veg', available_days: 'Every Day' },
    { name: 'Curd Rice', price: 50, category: 'Veg', food_type: 'Veg', available_days: 'Every Day' },
    { name: 'Tomato Rice', price: 50, category: 'Veg', food_type: 'Veg', available_days: 'Monday, Thursday, Sunday' },
    { name: 'Veg Biriyani', price: 50, category: 'Veg', food_type: 'Veg', available_days: 'Tuesday, Friday' },
    { name: 'Kuska', price: 50, category: 'Veg', food_type: 'Veg', available_days: 'Wednesday, Saturday' },
  ];

  // 3. EGG ITEMS
  const eggItems = [
    { name: 'Omelette', price: 20, category: 'Egg Items', food_type: 'Non-Veg' },
    { name: 'Plain Omelette', price: 15, category: 'Egg Items', food_type: 'Non-Veg' },
    { name: 'Half Boil', price: 15, category: 'Egg Items', food_type: 'Non-Veg' },
    { name: 'Full Boil', price: 15, category: 'Egg Items', food_type: 'Non-Veg' },
    { name: 'Masala Kalaki', price: 15, category: 'Egg Items', food_type: 'Non-Veg' },
    { name: 'Kalaki', price: 15, category: 'Egg Items', food_type: 'Non-Veg' },
  ];

  // 4. SNACKS ITEMS
  const snackItems = [
    {
      name: 'Tea',
      price: 20,
      category: 'Snacks',
      food_type: 'Veg',
      available_days: 'Every Day',
      defaultImageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=85',
    },
    {
      name: 'Filter Coffee',
      price: 20,
      category: 'Snacks',
      food_type: 'Veg',
      available_days: 'Every Day',
      defaultImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85',
    },
    {
      name: 'Ooluntha Vadai',
      price: 20,
      category: 'Snacks',
      food_type: 'Veg',
      available_days: 'Every Day',
      defaultImageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1000&q=85',
    },
    {
      name: 'Sundal',
      price: 20,
      category: 'Snacks',
      food_type: 'Veg',
      available_days: 'Every Day',
      defaultImageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=85',
    },
    {
      name: 'Green Gram',
      price: 20,
      category: 'Snacks',
      food_type: 'Veg',
      available_days: 'Every Day',
      defaultImageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=85',
    },
  ];

  const allFoodItems = [...nonVegItems, ...vegItems, ...eggItems, ...snackItems];
  const foodItemMap = {}; // name -> DB record

  console.log('1. SEEDING INDIVIDUAL FOOD ITEMS & UPLOADING MATCHED IMAGES...\n');

  for (const item of allFoodItems) {
    const matchedFile = findMatchingImageFile(item.name);
    let imageUrl = null;

    if (matchedFile) {
      report.imageMatches.push({ food: item.name, localFile: path.basename(matchedFile) });
      imageUrl = await uploadImageToCloudinary(matchedFile, item.name);
    } else if (item.defaultImageUrl) {
      imageUrl = item.defaultImageUrl;
    } else {
      report.missingImages.push(item.name);
      console.log(`[Image] NO MATCH for "${item.name}" -> setting image_url = null`);
    }

    // Upsert food item into Neon PostgreSQL
    const existing = await prisma.food_items.findFirst({ where: { name: item.name } });

    let record;
    if (existing) {
      record = await prisma.food_items.update({
        where: { id: existing.id },
        data: {
          price: item.price,
          category: item.category,
          food_type: item.food_type,
          available: true,
          available_days: item.available_days || 'Every Day',
          ...(imageUrl ? { image_url: imageUrl } : {}),
        },
      });
    } else {
      record = await prisma.food_items.create({
        data: {
          name: item.name,
          price: item.price,
          category: item.category,
          food_type: item.food_type,
          available: true,
          available_days: item.available_days || 'Every Day',
          image_url: imageUrl,
        },
      });
    }

    foodItemMap[item.name] = record;
    report.foodItemsCreatedOrUpdated++;
    console.log(`[DB] Food Item Saved: "${record.name}" (ID: ${record.id}) - ₹${record.price}`);
  }

  // 4. VEG COMBOS (Different Dine-In vs Parcel pricing)
  console.log('\n2. SEEDING VEG COMBOS...\n');

  const vegCombos = [
    {
      name: 'Tomato Rice + Curd Rice',
      dine_in_price: 50,
      parcel_price: 70,
      items: [{ name: 'Tomato Rice', qty: 1 }, { name: 'Curd Rice', qty: 1 }],
    },
    {
      name: 'Veg Biriyani + Curd Rice',
      dine_in_price: 50,
      parcel_price: 70,
      items: [{ name: 'Veg Biriyani', qty: 1 }, { name: 'Curd Rice', qty: 1 }],
    },
    {
      name: 'Kuska + Curd Rice',
      dine_in_price: 50,
      parcel_price: 70,
      items: [{ name: 'Kuska', qty: 1 }, { name: 'Curd Rice', qty: 1 }],
    },
  ];

  for (const comboDef of vegCombos) {
    const existingCombo = await prisma.combos.findFirst({ where: { name: comboDef.name } });

    let comboRecord;
    if (existingCombo) {
      comboRecord = await prisma.combos.update({
        where: { id: existingCombo.id },
        data: {
          price: comboDef.dine_in_price,
          dine_in_price: comboDef.dine_in_price,
          parcel_price: comboDef.parcel_price,
          offer_enabled: false,
          available: true,
        },
      });
      // Clear old junction rows
      await prisma.combo_items.deleteMany({ where: { combo_id: comboRecord.id } });
    } else {
      comboRecord = await prisma.combos.create({
        data: {
          name: comboDef.name,
          price: comboDef.dine_in_price,
          dine_in_price: comboDef.dine_in_price,
          parcel_price: comboDef.parcel_price,
          offer_enabled: false,
          available: true,
        },
      });
    }

    // Connect component items
    for (const comp of comboDef.items) {
      const foodItem = foodItemMap[comp.name];
      if (foodItem) {
        await prisma.combo_items.create({
          data: {
            combo_id: comboRecord.id,
            food_item_id: foodItem.id,
            quantity: comp.qty,
          },
        });
      }
    }

    report.combosCreatedOrUpdated++;
    console.log(`[DB] Veg Combo Saved: "${comboRecord.name}" (Dine-In: ₹${comboRecord.dine_in_price}, Parcel: ₹${comboRecord.parcel_price})`);
  }

  // 5. ₹99 SPECIAL COMBOS / OFFERS
  console.log('\n3. SEEDING ₹99 SPECIAL COMBOS & OFFERS...\n');

  const specialCombos = [
    {
      name: 'Plain Biriyani + Chicken Chilly',
      original_price: 110,
      offer_price: 99,
      items: [{ name: 'Plain Biriyani', qty: 1 }, { name: 'Chicken Chilly', qty: 1 }],
    },
    {
      name: '3 Parotta + Chicken Gravy',
      original_price: 115,
      offer_price: 99,
      items: [{ name: 'Parotta (1 piece)', qty: 3 }, { name: 'Chicken Gravy', qty: 1 }],
    },
    {
      name: 'Egg Rice + Chicken Chilly',
      original_price: 110,
      offer_price: 99,
      items: [{ name: 'Egg Rice', qty: 1 }, { name: 'Chicken Chilly', qty: 1 }],
    },
    {
      name: 'Egg Noodles + Chicken Chilly',
      original_price: 110,
      offer_price: 99,
      items: [{ name: 'Egg Noodles', qty: 1 }, { name: 'Chicken Chilly', qty: 1 }],
    },
  ];

  for (const offerDef of specialCombos) {
    const existingCombo = await prisma.combos.findFirst({ where: { name: offerDef.name } });

    let comboRecord;
    if (existingCombo) {
      comboRecord = await prisma.combos.update({
        where: { id: existingCombo.id },
        data: {
          price: offerDef.original_price,
          dine_in_price: offerDef.original_price,
          parcel_price: offerDef.original_price,
          offer_enabled: true,
          offer_price: offerDef.offer_price,
          available: true,
        },
      });
      await prisma.combo_items.deleteMany({ where: { combo_id: comboRecord.id } });
    } else {
      comboRecord = await prisma.combos.create({
        data: {
          name: offerDef.name,
          price: offerDef.original_price,
          dine_in_price: offerDef.original_price,
          parcel_price: offerDef.original_price,
          offer_enabled: true,
          offer_price: offerDef.offer_price,
          available: true,
        },
      });
    }

    for (const comp of offerDef.items) {
      const foodItem = foodItemMap[comp.name];
      if (foodItem) {
        await prisma.combo_items.create({
          data: {
            combo_id: comboRecord.id,
            food_item_id: foodItem.id,
            quantity: comp.qty,
          },
        });
      }
    }

    report.specialOffersCreatedOrUpdated++;
    console.log(`[DB] Special Offer Saved: "${comboRecord.name}" (Original: ₹${offerDef.original_price} -> Offer: ₹${offerDef.offer_price})`);
  }

  console.log('\n============================================================');
  console.log('SEEDING SUMMARY REPORT');
  console.log('============================================================');
  console.log(`Food Items Processed: ${report.foodItemsCreatedOrUpdated} (Non-Veg: 12, Veg: 5, Egg Items: 6)`);
  console.log(`Veg Combos Processed: ${report.combosCreatedOrUpdated}`);
  console.log(`Special Offers Processed: ${report.specialOffersCreatedOrUpdated}`);
  console.log(`\nLocal Images Matched & Uploaded to Cloudinary (${report.imageMatches.length}):`);
  report.imageMatches.forEach(m => console.log(` - ${m.food} -> ${m.localFile}`));
  console.log(`\nItems Without Images (image_url = null) (${report.missingImages.length}):`);
  report.missingImages.forEach(m => console.log(` - ${m}`));
  console.log('============================================================\n');
}

seedMenu()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
