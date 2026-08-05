const p = require('../src/config/prisma');
p.combos.findMany({ include: { combo_items: { include: { food_items: true } } } }).then(r => {
  r.forEach(c => {
    console.log('Combo:', c.name, '| available:', c.available, '| offer_enabled:', c.offer_enabled, '| created_at:', c.created_at);
    c.combo_items.forEach(ci => {
      const fi = ci.food_items;
      console.log('  Component:', fi ? fi.name : 'NONE', '| available:', fi ? fi.available : 'N/A', '| available_days:', fi ? fi.available_days : 'N/A');
    });
  });
}).catch(console.error).finally(() => p.$disconnect());
