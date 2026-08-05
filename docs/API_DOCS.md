# API Endpoint Specifications

All API endpoints are prefixed with `/api/v1/` and return JSON responses adhering to standard response wrappers:

### Success Response Format
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Detailed error message description",
  "errors": []
}
```

---

## 🔐 1. Authentication Module (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user / staff member | No |
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/v1/auth/me` | Fetch current authenticated user profile | Yes |
| `POST` | `/api/v1/auth/refresh-token` | Refresh expired access token | Yes |
| `POST` | `/api/v1/auth/logout` | Invalidate current session | Yes |

---

## 🍲 2. Food Items Module (`/api/v1/food-items`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/food-items` | Get list of food items (supports category filter) | No |
| `GET` | `/api/v1/food-items/:id` | Get details of specific food item | No |
| `POST` | `/api/v1/food-items` | Create new food item (Admin) | Admin |
| `PUT` | `/api/v1/food-items/:id` | Update food item details | Admin |
| `DELETE` | `/api/v1/food-items/:id` | Soft delete food item | Admin |

---

## 📅 3. Menu Schedule Module (`/api/v1/menu-schedules`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/menu-schedules` | Fetch current active menu schedules | No |
| `POST` | `/api/v1/menu-schedules` | Create a new day/meal menu schedule | Admin |
| `PUT` | `/api/v1/menu-schedules/:id` | Update menu schedule | Admin |
| `DELETE` | `/api/v1/menu-schedules/:id` | Remove menu schedule entry | Admin |

---

## 🍱 4. Combos Module (`/api/v1/combos`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/combos` | Get list of active meal combos | No |
| `GET` | `/api/v1/combos/:id` | Get combo details with contained food items | No |
| `POST` | `/api/v1/combos` | Create combo package with item associations | Admin |
| `PUT` | `/api/v1/combos/:id` | Update combo package | Admin |
| `DELETE` | `/api/v1/combos/:id` | Soft delete combo package | Admin |

---

## 🏷️ 5. Special Offers Module (`/api/v1/offers`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/offers` | Fetch active promotional offers & discount coupons | No |
| `POST` | `/api/v1/offers` | Create special offer / coupon code | Admin |
| `PUT` | `/api/v1/offers/:id` | Update offer configuration | Admin |
| `DELETE` | `/api/v1/offers/:id` | Soft delete offer | Admin |

---

## 🛒 6. Orders Module (`/api/v1/orders`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders` | List customer orders (Customer/Admin) | Yes |
| `GET` | `/api/v1/orders/:id` | Get single order details with itemized list | Yes |
| `POST` | `/api/v1/orders` | Create new food order | Yes |
| `PATCH` | `/api/v1/orders/:id/status` | Update order status (PENDING, PREPARING, OUT_FOR_DELIVERY, COMPLETED, CANCELLED) | Admin/Staff |

---

## 💳 7. Payments Module (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/razorpay/create-order` | Initiate Razorpay order for customer checkout | Yes |
| `POST` | `/api/v1/payments/razorpay/verify` | Verify Razorpay payment signature & confirm order | Yes |
| `GET` | `/api/v1/payments/:orderId` | Get payment log for an order | Yes |

---

## 📊 8. Reports Module (`/api/v1/reports`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/sales` | Get daily, weekly, monthly sales summary | Admin |
| `GET` | `/api/v1/reports/top-items` | Get report of top-performing menu items | Admin |
| `GET` | `/api/v1/reports/dashboard-stats` | Get high-level KPI dashboard metrics | Admin |

---

## ⚙️ 9. Settings Module (`/api/v1/settings`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/settings` | Get restaurant configuration settings | Admin/Public |
| `PUT` | `/api/v1/settings` | Update restaurant settings (operating hours, tax rates) | Admin |
