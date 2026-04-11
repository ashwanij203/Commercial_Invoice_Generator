# Jaiswal Furniture & Electronics — Billing System

A production-ready billing and invoice management system built with React.js, Node.js, Express, and MongoDB.

---

## Features

- JWT Authentication (register / login / logout)
- Dashboard with revenue charts (daily, monthly, all-time)
- Customer management (add, edit, delete, search)
- Product inventory with GST % and stock tracking
- Invoice creation with multi-product, auto-calculation
- Subtotal, discount per item, GST breakdown, grand total
- Auto-generated invoice numbers (JFE-2024-0001)
- Payment modes: Cash, UPI, Card, Net Banking, Credit
- Payment status: Paid, Pending, Partial
- Printable, PDF-ready invoice layout with GST breakdown
- Search and filter invoices by name, date range, status
- Export invoices to CSV
- Dark mode toggle
- Fully responsive (mobile + desktop)
- Toast notifications, form validation

---

## Project Structure

```
jaiswal-billing/
├── backend/
│   ├── config/
│   │   └── seed.js              # Sample data seeder
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── productController.js
│   │   ├── invoiceController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   └── Invoice.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── customers.js
│   │   ├── products.js
│   │   ├── invoices.js
│   │   └── dashboard.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ui/
    │   │       ├── Layout.jsx
    │   │       ├── Sidebar.jsx
    │   │       ├── Modal.jsx
    │   │       └── ConfirmDialog.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── InvoicesPage.jsx
    │   │   ├── NewInvoicePage.jsx
    │   │   ├── InvoiceViewPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── utils/
    │   │   ├── api.js             # Axios instance
    │   │   └── format.js          # Currency/date helpers
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Local Setup

### Prerequisites

- Node.js v18 or higher
- MongoDB Atlas account (free tier works)
- npm or yarn

---

### Step 1 — Clone or extract the project

```bash
cd jaiswal-billing
```

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/jaiswal_billing
JWT_SECRET=change_this_to_a_long_random_string_at_least_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Seed sample data (optional but recommended)
```bash
npm run seed
# Creates: admin@jaiswal.com / admin123
# + 5 customers, 10 products, 6 sample invoices
```

#### Start backend
```bash
npm run dev       # development (with nodemon)
npm start         # production
```

Backend runs on: http://localhost:5000

---

### Step 3 — Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

`.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend runs on: http://localhost:5173

---

### Step 4 — Login

Open http://localhost:5173

If you ran the seed:
- Email: `admin@jaiswal.com`
- Password: `admin123`

---

## API Endpoints

| Method | Route                     | Description              |
|--------|---------------------------|--------------------------|
| POST   | /api/auth/register        | Register admin           |
| POST   | /api/auth/login           | Login                    |
| GET    | /api/auth/me              | Get current user         |
| PUT    | /api/auth/profile         | Update shop profile      |
| GET    | /api/customers            | List customers           |
| POST   | /api/customers            | Add customer             |
| PUT    | /api/customers/:id        | Update customer          |
| DELETE | /api/customers/:id        | Delete customer          |
| GET    | /api/products             | List products            |
| POST   | /api/products             | Add product              |
| PUT    | /api/products/:id         | Update product           |
| DELETE | /api/products/:id         | Delete product           |
| GET    | /api/invoices             | List invoices (filtered) |
| POST   | /api/invoices             | Create invoice           |
| GET    | /api/invoices/:id         | Get single invoice       |
| DELETE | /api/invoices/:id         | Delete invoice           |
| GET    | /api/invoices/export/csv  | Export to CSV            |
| GET    | /api/dashboard/stats      | Dashboard statistics     |

---

## Deployment

### MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user (username + password)
4. Add your IP to Network Access (or 0.0.0.0/0 for all)
5. Copy the connection string and replace in `.env`

---

### Backend — Deploy on Render

1. Push your `backend/` folder to a GitHub repo
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. Add environment variables:
   - `MONGODB_URI` → your Atlas URI
   - `JWT_SECRET` → random secret string
   - `JWT_EXPIRE` → `7d`
   - `NODE_ENV` → `production`
   - `FRONTEND_URL` → your Vercel frontend URL
6. Deploy!

---

### Backend — Deploy on Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select the backend repo
4. Add env variables in Variables tab
5. Railway auto-detects Node.js and deploys

---

### Frontend — Deploy on Vercel

1. Push `frontend/` to GitHub
2. Go to https://vercel.com → New Project
3. Import repo
4. Set environment variable:
   - `VITE_API_URL` → `https://your-backend.onrender.com/api`
5. Deploy!

After deploy, update `FRONTEND_URL` in your backend env to the Vercel URL.

---

## Printing Invoices / PDF

1. Open any invoice page
2. Click **Print Invoice** or **Download PDF**
3. In the browser print dialog, select **"Save as PDF"**
4. The invoice is print-optimized — nav/buttons are hidden in print mode

---

## GST Calculation Logic

For each line item:
```
Base Amount   = Price × Quantity
After Disc    = Base Amount − Discount
GST Amount    = After Disc × (GST% / 100)
Line Total    = After Disc + GST Amount
```

Grand Total = Sum of all Line Totals

GST breakdown splits into CGST (50%) + SGST (50%) as per Indian GST rules.

---

## Demo Credentials

After running `npm run seed`:

| Field    | Value               |
|----------|---------------------|
| Email    | admin@jaiswal.com   |
| Password | admin123            |

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React 18 + Vite         |
| Styling    | Tailwind CSS v3         |
| Charts     | Recharts                |
| Backend    | Node.js + Express 4     |
| Database   | MongoDB + Mongoose      |
| Auth       | JWT (jsonwebtoken)      |
| HTTP       | Axios                   |
| Icons      | Lucide React            |
| Toasts     | React Hot Toast         |
