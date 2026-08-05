const prisma = require('../src/config/prisma');

async function migrateOffers() {
  console.log('=== MIGRATING ₹99 SPECIALS TO SPECIAL_OFFERS TABLE ===');

  // Fetch catalog foods for matching
  const allFoods = await prisma.food_items.findMany();
  const foodMap = new Map(allFoods.map(f => [f.name.trim().toLowerCase(), f]));

  const targetOffers = [
    {
      tag_name: '₹99 SPECIAL',
      title: '₹99 SPECIAL: Plain Biriyani + Chicken Chilly',
      components: [
        { name: 'Plain Biriyani', qty: 1 },
        { name: 'Chicken Chilly', qty: 1 },
      ],
      price: 110,
      offer_price: 99
    },
    {
      tag_name: '₹99 SPECIAL',
      title: '₹99 SPECIAL: 3 Parotta + Chicken Gravy',
      components: [
        { name: 'Parotta', qty: 3 },
        { name: 'Chicken Gravy', qty: 1 },
      ],
      price: 115,
      offer_price: 99
    },
    {
      tag_name: '₹99 SPECIAL',
      title: '₹99 SPECIAL: Egg Rice + Chicken Chilly',
      components: [
        { name: 'Egg Rice', qty: 1 },
        { name: 'Chicken Chilly', qty: 1 },
      ],
      price: 110,
      offer_price: 99
    },
    {
      tag_name: '₹99 SPECIAL',
      title: '₹99 SPECIAL: Egg Noodles + Chicken Chilly',
      components: [
        { name: 'Egg Noodles', qty: 1 },
        { name: 'Chicken Chilly', qty: 1 },
      ],
      price: 110,
      offer_price: 99
    }
  ];

  for (const offerData of targetOffers) {
    // Check if offer already exists
    let existingOffer = await prisma.special_offers.findFirst({
      where: {
        OR: [
          { title: { contains: offerData.title, mode: 'insensitive' } },
          { title: { contains: offerData.components.map(c => c.name).join(' + '), mode: 'insensitive' } }
        ]
      }
    });

    if (!existingOffer) {
      existingOffer = await prisma.special_offers.create({
        data: {
          tag_name: offerData.tag_name,
          title: offerData.title,
          price: offerData.price,
          offer_price: offerData.offer_price,
          offer_enabled: true,
          available: true
        }
      });
      console.log(`[Created Offer] ${existingOffer.title}`);
    } else {
      console.log(`[Existing Offer Found] ${existingOffer.title}`);
    }

    // Connect special_offer_items
    for (const comp of offerData.components) {
      const foodItem = foodMap.get(comp.name.trim().toLowerCase());
      if (foodItem) {
        const link = await prisma.special_offer_items.findFirst({
          where: { special_offer_id: existingOffer.id, food_item_id: foodItem.id }
        });
        if (!link) {
          await prisma.special_offer_items.create({
            data: {
              special_offer_id: existingOffer.id,
              food_item_id: foodItem.id,
              quantity: comp.qty
            }
          });
          console.log(`  -> Linked ${comp.qty}x ${foodItem.name}`);
        }
      }
    }
  }

  // Remove the ₹99 items from combos table so they don't appear under Combos
  const combosToRemove = await prisma.combos.findMany({
    where: {
      OR: [
        { offer_enabled: true },
        { offer_price: 99 },
        { name: { contains: 'Chicken Chilly', mode: 'insensitive' } },
        { name: { contains: 'Chicken Gravy', mode: 'insensitive' } },
      ]
    }
  });

  for (const c of combosToRemove) {
    await prisma.combos.delete({ where: { id: c.id } });
    console.log(`[Removed from Combos Table] ${c.name}`);
  }

  console.log('=== MIGRATION COMPLETE ===');
  await prisma.$disconnect();
}

migrateOffers().catch(err => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
});
