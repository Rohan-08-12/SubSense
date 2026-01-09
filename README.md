# Subscription Tracker Backend

A full-stack subscription tracking application with Plaid integration for automatic subscription detection from bank transactions.

---

## 🌐 Live Application

- **Frontend (Live App):** https://polite-donut-3b0bf1.netlify.app
- **Backend API:** https://subsense.onrender.com

👉 **Note:** Users only need to open the **frontend link** to use the application.  
The frontend automatically communicates with the backend API in the background.

---

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Plaid API credentials (for bank integration)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Rohan-08-12/SubSense.git
cd SubSense
2. Install dependencies
bash
Copy code
npm install
3. Set up environment variables
Create a .env file in the root directory with the following variables:

env
Copy code
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
Database Setup
bash
Copy code
# Generate Prisma client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate
Running the Application
Option 1: Run Both Servers Together (Recommended)
bash
Copy code
npm run dev:all
This starts:

Backend: http://localhost:3000

Frontend: http://localhost:3001

Option 2: Run Servers Separately
Backend
Development mode:

bash
Copy code
npm run dev
Production mode:

bash
Copy code
npm start
Frontend
bash
Copy code
npm run frontend
Available Scripts
npm start – Start backend in production mode

npm run dev – Start backend with nodemon

npm run frontend – Serve frontend on port 3001

npm run dev:all – Run backend and frontend together

npm run prisma:generate – Generate Prisma client

npm run prisma:migrate – Apply Prisma migrations

npm run prisma:studio – Open Prisma Studio

Project Structure
pgsql
Copy code
SubSense/
├── frontend/
│   └── index.html          # Frontend UI (React via CDN)
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Prisma migrations
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── utils/
└── server.js               # Backend entry point
API Endpoints
Authentication
POST /api/auth/register – Register a new user

POST /api/auth/login – Login user

GET /api/auth/me – Get current user (protected)

Plaid Integration
POST /api/plaid/link-token

POST /api/plaid/exchange-public-token

GET /api/plaid/accounts

POST /api/plaid/sync-transactions

Subscriptions
GET /api/subscriptions

GET /api/subscriptions/stats

POST /api/subscriptions/detect

PUT /api/subscriptions/:id

DELETE /api/subscriptions/:id

Deployment
Frontend: Deployed on Netlify

Backend: Deployed on Render

Database: PostgreSQL hosted on Supabase

The application follows a separated frontend–backend deployment model suitable for production environments.

Development Notes
Prisma migrations are committed and applied in production

Environment variables are never committed to source control

Backend includes rate limiting and security headers

Render free tier may sleep after inactivity (cold start expected)

License
ISC
```
