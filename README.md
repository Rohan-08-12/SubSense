# SubSense - Subscription Tracker

A full-stack subscription tracking application with Plaid integration for automatic subscription detection from bank transactions. SubSense provides a stunning, real-time dashboard to monitor all your recurring costs.

---

## 🚀 Features

- **Next.js Frontend:** Modern App Router architecture, powered by Tailwind CSS and shadcn/ui.
- **Dynamic Animations:** Framer Motion-powered scroll expansion heroes for a premium landing experience.
- **Real-time Dashboard:** Live metrics, recent charges, and interactive charts using Recharts for a clean visual representation of subscription spending.
- **Plaid Integration:** Securely connect your real-world bank accounts to automatically track and detect subscriptions.
- **Express / Node.js Backend:** Fast and reliable REST API powered by Express.
- **Prisma & PostgreSQL:** Strong typed ORM interacting with a robust database setup.

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js (App Router)
- React & TypeScript
- Tailwind CSS
- shadcn/ui (Radix)
- Framer Motion
- Recharts

**Backend:**
- Node.js & Express
- Prisma ORM
- PostgreSQL
- Plaid Link API
- JWT Authentication

---

## ⚙️ Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- PostgreSQL database (e.g., Supabase, Neon)
- Plaid API credentials (for bank integration)

---

## 📥 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Rohan-08-12/SubSense.git
cd SubSense
```

### 2. Install dependencies

You'll need to install dependencies for both the backend and frontend:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Server
PORT=3000

# JWT Secret
JWT_SECRET="your-secret-key"

# Plaid API
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="sandbox"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate
```

---

## 🏃‍♂️ Running the Application

### Option 1: Run Both Servers Together (Recommended)

From the root directory, you can start both the Node.js backend and the Next.js frontend concurrently:

```bash
npm run dev:all
```

This starts:
- **Backend:** `http://localhost:3000`
- **Frontend:** `http://localhost:3001`

### Option 2: Run Servers Separately

**Backend**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

**Frontend**
```bash
# Starting the Next.js dev server
npm run frontend
```

---

## 📂 Project Structure

```text
SubSense/
├── frontend/             # Next.js Application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components (UI, providers)
│   │   └── lib/          # Utility functions and API helpers
│   ├── tailwind.config.ts
│   └── next.config.ts
├── prisma/               # Database Setup
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Prisma migrations
├── src/                  # Express Backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── services/
└── server.js             # Backend entry point
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login user
- `GET /api/auth/me` – Get current user (protected)

### Plaid Integration
- `POST /api/plaid/link-token`
- `POST /api/plaid/exchange-public-token`
- `GET /api/plaid/accounts`
- `POST /api/plaid/sync-transactions`

### Subscriptions
- `GET /api/subscriptions`
- `GET /api/subscriptions/stats`
- `POST /api/subscriptions/detect`
- `PUT /api/subscriptions/:id`
- `DELETE /api/subscriptions/:id`

---

## 📄 License
ISC
