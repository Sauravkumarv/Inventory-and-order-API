# Inventory and Order API

This project is a beginner-friendly backend API built with Node.js, Express.js, MongoDB, and Mongoose. It handles user authentication, product management, and order creation with stock validation.

## Features
- User registration and login
- JWT authentication
- Product CRUD
- Product search, category filter, in-stock filter, and pagination
- Order creation with total calculation and stock reduction
- User-based order protection
- Simple centralized error handling

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- dotenv
- Helmet
- CORS

## Project Structure
```bash
src/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   └── orderController.js
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── orderRoutes.js
├── utils/
│   └── generateToken.js
├── app.js
└── server.js
```

## Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file from `.env.example`.
3. Make sure MongoDB is running locally or update `MONGODB_URI`.

## Environment Variables
Create a `.env` file with:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory_api
JWT_SECRET=change_this_secret
```

## How to Run
```bash
npm run dev
```

The app runs on `http://localhost:5000` by default.

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Products
- `POST /api/products` (protected)
- `GET /api/products` (public)
- `GET /api/products/:id` (public)
- `PATCH /api/products/:id` (protected)
- `DELETE /api/products/:id` (protected)

### Orders
- `POST /api/orders` (protected)
- `GET /api/orders` (protected)
- `GET /api/orders/:id` (protected)

## Authentication
- Register and log in to receive a JWT.
- Send the token in the header:
  ```http
  Authorization: Bearer <your_token>
  ```
- Product create/update/delete and all order routes require authentication.
- Product read routes are public.

## Example Requests

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Apple smartphone",
  "price": 70000,
  "stockQuantity": 10,
  "category": "electronics"
}
```

### Get Products with filters
```http
GET /api/products?search=iphone&category=electronics&inStock=true&page=1&limit=10
```

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    { "product": "PRODUCT_ID", "quantity": 2 },
    { "product": "ANOTHER_PRODUCT_ID", "quantity": 1 }
  ]
}
```

## Stock Concurrency
If two users try to buy the last item at the same time, the stock check and stock update should happen as one atomic step. In MongoDB, a simple approach is to update stock only when the current stock is enough for the requested quantity.

Example idea:
```js
Product.updateOne(
  { _id: productId, stockQuantity: { $gte: requestedQuantity } },
  { $inc: { stockQuantity: -requestedQuantity } }
)
```

This prevents both requests from successfully reducing the same last item. For multiple related database operations that must all succeed or fail together, a MongoDB transaction can also be used.

This project keeps the logic simple and beginner-friendly while still following the important rule: check stock before order creation and reduce stock only after validation passes.


## AI Usage
AI tools (Codex) were used during development to help with project structure, debugging, validation, and documentation. The generated code was reviewed and tested as part of the development process.

## Notes
- Passwords are never returned in API responses.
- JWT secret is loaded from environment variables.
- Order prices are stored at the time of purchase so old order history remains accurate.
- If an order belongs to another user, the API returns 404 to avoid leaking order details.
