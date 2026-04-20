# ShopEasy Full-Stack E-Commerce

## Tech Stack
- Frontend: React + Tailwind CSS + React Router + Axios
- Backend: Node.js + Express + MongoDB + JWT + bcryptjs

## Project Structure
- frontend/
- backend/

## Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Backend Setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Update values for `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.
3. Install dependencies:
   - `cd backend`
   - `npm install`
4. Seed sample products and admin:
   - `npm run seed`
5. Start backend:
   - `npm run dev`

Expected backend URL: `http://localhost:5000`

## Frontend Setup
1. Copy `frontend/.env.example` to `frontend/.env` (optional).
2. Install dependencies:
   - `cd frontend`
   - `npm install`
3. Start frontend:
   - `npm run dev`

Expected frontend URL: `http://localhost:5173`

## Quick Start (Windows PowerShell)
### Terminal 1 (Backend)
```powershell
cd "C:\Users\NTh542\Desktop\release_mangement\ShopEasy folder\backend"
Copy-Item .env.example .env -Force
npm install
npm run seed
npm run dev
```

### Terminal 2 (Frontend)
```powershell
cd "C:\Users\NTh542\Desktop\release_mangement\ShopEasy folder\frontend"
Copy-Item .env.example .env -Force
npm install
npm run dev
```

## Default Admin
- Email: `admin@shopeasy.com`
- Password: `Admin@123`

## Troubleshooting
- If `npm run seed` fails, ensure you pulled the latest code where the user password pre-save hook is fixed in `backend/src/models/User.js`.
- If MongoDB connection fails, verify `MONGO_URI` in `backend/.env` and ensure the database server is reachable.
- If frontend cannot call backend, confirm `VITE_API_URL` in `frontend/.env` and `CLIENT_URL` in `backend/.env`.

## Smoke Test Checklist
- Backend health: `GET /api/health`
- Register or login user
- Browse products
- Add to cart and update quantity
- Place order from checkout
- View orders page
- Login as admin and update an order status

## Key Features
- User auth with JWT (register/login)
- Product listing, search, category filtering
- Product detail, cart management, checkout
- Order history and profile update
- Admin dashboard for products and orders
