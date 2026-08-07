const service = require('./src/services/orderingCalendar.service');

async function test() {
  try {
    const res = await service.updateAdminCalendar([
      { order_date: "2026-08-09", is_open: false },
      { order_date: "2026-08-16", is_open: false }
    ]);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
