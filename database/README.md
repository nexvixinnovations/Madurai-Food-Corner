# Database Architecture & Management

This directory manages database schemas, Prisma migrations, and SQL utilities for **Madurai Food Corner ERP** hosted on **Neon PostgreSQL**.

---

## 🗃️ Models List

The database consists of 11 relational tables:
1. `users`: System administrative & staff user accounts
2. `customers`: Customer accounts and delivery profiles
3. `food_items`: Menu food item catalog
4. `menu_schedules`: Day-of-week and meal-type scheduling mappings
5. `combos`: Special meal packages and combos
6. `combo_items`: Many-to-many junction mapping combos to contained food items
7. `special_offers`: Promotional coupons and discount rules
8. `orders`: Customer purchase order headers
9. `order_items`: Line items within orders
10. `payments`: Razorpay transaction records and payment states
11. `settings`: Key-value restaurant operational settings

---

## 🚀 Syncing Schema with Neon PostgreSQL

To apply schema changes to your Neon PostgreSQL instance:

```bash
cd ../backend
npx prisma db push
```

To create a named SQL migration:

```bash
cd ../backend
npx prisma migrate dev --name init_schema
```
