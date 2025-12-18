# Subscription Tracker Backend

A full-stack subscription tracking application with Plaid integration for automatic subscription detection from bank transactions.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Plaid API credentials (for bank integration)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd subscription-tracker-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/subscription_tracker"

# Server
PORT=3000

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Plaid API (if using bank integration)
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="sandbox" # or "development" or "production"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Running the Application

### Option 1: Run Both Servers Together (Recommended)

Run both the backend and frontend servers simultaneously:

```bash
npm run dev:all
```

This will start:
- **Backend server** on `http://localhost:3000` (with auto-reload via nodemon)
- **Frontend server** on `http://localhost:3001`

### Option 2: Run Servers Separately

#### Backend Only

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The backend will be available at `http://localhost:3000`

#### Frontend Only

```bash
npm run frontend
```

The frontend will be available at `http://localhost:3001`

## Available Scripts

- `npm start` - Start the backend server in production mode
- `npm run dev` - Start the backend server in development mode (with nodemon)
- `npm run frontend` - Start the frontend server on port 3001
- `npm run dev:all` - Start both backend and frontend servers concurrently
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
subscription-tracker-backend/
├── frontend/
│   └── index.html          # Frontend React application
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── repositories/       # Data access layer
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
└── server.js               # Main server entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Plaid Integration
- `POST /api/plaid/link-token` - Get Plaid link token
- `POST /api/plaid/exchange-public-token` - Exchange public token
- `GET /api/plaid/accounts` - Get connected accounts
- `POST /api/plaid/sync-transactions` - Sync transactions

### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
- `GET /api/subscriptions/stats` - Get subscription statistics
- `POST /api/subscriptions/detect` - Detect subscriptions from transactions
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

## Accessing the Application

Once both servers are running:

1. Open your browser and navigate to: `http://localhost:3001`
2. The frontend will communicate with the backend API at `http://localhost:3000`

## Development Tips

- The backend uses `nodemon` for automatic server restarts on file changes
- The frontend is a single-page React application served via `http-server`
- Use `npm run prisma:studio` to visually inspect and edit your database
- Check the terminal output for any errors or connection issues

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is already in use:
- Backend: Set `PORT` environment variable to a different port
- Frontend: Modify the port in `package.json` scripts or pass `-p` flag to `http-server`

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Run `npm run prisma:migrate` to ensure database is up to date

### Module Not Found Errors
- Run `npm install` to ensure all dependencies are installed
- Run `npm run prisma:generate` if Prisma-related errors occur

### PrismaConfigEnvErr or Config File Errors
If you encounter errors like `Failed to load config file` or `PrismaConfigEnvErr`:
- This project doesn't require a `prisma.config.ts` file - all Prisma configuration is in `prisma/schema.prisma`
- If you see a `prisma.config.ts` file, you can safely delete it
- Ensure your `.env` file has the `DATABASE_URL` variable set correctly
- Run `npm run prisma:generate` after setting up your environment variables

## License

ISC

