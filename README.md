# FEC Virtual Stock Market (FEC-VSM)

A virtual stock market simulation platform for college events and finance competitions. It includes real-time simulated market data, trading capabilities, and player tracking.

## Key Features

- **Market Engine**: Simulates stock price movements using Ornstein-Uhlenbeck processes and jump diffusion models.
- **Trading Interface**: Buy and sell stocks with synchronized portfolio updates.
- **Portfolio Tracking**: Calculates Net Worth, P&L, and Weighted Average Cost Basis (WACB).
- **Charts**: Candlestick charts with multiple timeframes (`1m`, `10m`, `30m`, `1h`, `ALL`).
- **Power-Ups**: Includes features like "Insider Trading" (news peeks) and "Muft Ka Paisa" (cash grants).
- **Security**: Includes rate limiting, input validation, and JWT authentication.
- **Admin Dashboard**: Controls game states (Open/Close trading) and monitors market health.

## Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router) with Turbopack
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand (Persisted Store)
- **Charts**: Recharts, Chart.js
- **Network**: Socket.io-client

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Real-time**: Socket.io
- **Security**: Helmet, Rate-Limit, BCrypt

---

## Local Setup Guide

Follow these steps to get the project running on your local machine.

### Prerequisites

- **Node.js** 18+ and **pnpm** (or npm)
- **PostgreSQL** 12+ (local instance or running via Docker)
- **Git**

### 1. Database Setup

Ensure you have a PostgreSQL database running.

**Option A: Local PostgreSQL (macOS Homebrew example)**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb vsm_db
```

**Option B: Existing PostgreSQL**
- Create a database named `vsm_db` if it doesn't exist.

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
pnpm install
```

Create a `.env` file (copy from `.env.example` if available, or use the template below):

```env
# Database Connection
DB_URL=postgresql://postgres:postgres@localhost:5432/vsm_db

# Server Config
PORT=8080
ALLOWED_ORIGIN=http://localhost:3000

# Authentication
AUTH_TOKEN_SECRET=super-secret-jwt-key-change-in-production
AUTH_TOKEN_LIFETIME=24h

# Game Configuration (Defaults)
MAX_GAME_ROUNDS=10
ROUND_DURATION=2
INITIAL_BANK_BALANCE=10000
MUFT_KA_PAISA=1000
CACHE_TIME=30
PRICE_IMPACT_MULTIPLIER=50.0
TOTAL_SUPPLY_PER_STOCK=10000
```

Initialize the database and start the server:

```bash
# Push Prisma schema to database
pnpm db:push

# Seed the database with initial data (stocks, users, etc.)
pnpm seed

# Start development server
pnpm start:dev
```

The backend API will be running at `http://localhost:8080`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
pnpm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

Start the development server:

```bash
pnpm dev
```

The application will be running at `http://localhost:3000`.

### Verification

1.  Open [http://localhost:3000](http://localhost:3000) in your browser.
2.  You should see the login page.
3.  Ensure the backend shows logs indicating successful connection and game initialization.

---

## Configuration

### Game Config Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_GAME_ROUNDS` | 10 | Maximum number of rounds |
| `ROUND_DURATION` | 2 | Round duration in minutes |
| `INITIAL_BANK_BALANCE` | 10000 | Starting cash per player |
| `MUFT_KA_PAISA` | 1000 | Free money powerup amount |
| `PRICE_IMPACT_MULTIPLIER` | 50.0 | Stock price volatility (higher = more volatile) |
| `TOTAL_SUPPLY_PER_STOCK` | 10000 | Shares per stock |

### Price Impact Formula

```
impact = (trade_quantity / TOTAL_SUPPLY_PER_STOCK) * PRICE_IMPACT_MULTIPLIER
new_price = current_price * (1 +/- impact)
```

Example with multiplier 50.0 and supply 10000:
- Buy 5 shares = **2.5% price increase**
- Sell 5 shares = **2.5% price decrease**

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | adminpassword | Admin |
| omkar@example.com | omkar123 | Admin |
| manan@example.com | manan123 | Player |
| atharva@example.com | atharva123 | Player |

### Login URLs

| Type | URL |
|------|-----|
| Player | http://localhost:3000/login |
| Admin | http://localhost:3000/login/admin |

---

## Load Testing

Run the load test script:

```bash
cd backend
npx tsx load-test/load-test.ts
```

### Configuration

Edit these constants in `load-test/load-test.ts`:

```typescript
const NUM_USERS = 20;           // Number of test users
const CYCLES_PER_USER = 20;    // Trades per user
```

### Expected Performance

| Metric | Target |
|--------|--------|
| BUY Success | 85-100% |
| SELL Success | 40-70% |
| Throughput | 300-600 trades/sec |
| P95 Latency | <800ms |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Player login |
| POST | `/auth/login-admin` | Admin login |

### Game

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/game/info/stocks` | Get all stocks |
| GET | `/game/info/portfolio` | Get player portfolio |
| POST | `/game/portfolio/trades` | Execute trade |
| GET | `/leaderboard` | Get leaderboard |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/start-game` | Start new game |
| POST | `/admin/start-round` | Start next round |
| POST | `/admin/terminate-game` | End game |

### Trade Request

```json
POST /game/portfolio/trades
{
  "action": "BUY",
  "symbol": "NVXA",
  "quantity": 5
}
```

---

## Database Management

```bash
# Push schema
npm run db:push

# Seed data
npm run seed

# Full reset
lsof -ti:8080 | xargs kill -9
npm run db:push
npm run seed
npm run start:dev
```

---

## Troubleshooting

### Port 8080 in use
```bash
lsof -ti:8080 | xargs kill -9
```

### Tables don't exist
```bash
npm run db:push
```

### Login fails (404)
```bash
npm run seed
```

### Login fails (503)
Game not started. Admin needs to call `/admin/start-game`.

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema |
| `npm run seed` | Seed database |
| `npm run start:dev` | Start backend |
| `npx tsx load-test/load-test.ts` | Run load test |

---

## Architecture Notes

- **REST APIs**: Portfolio data via `/game/info/portfolio`. Trading via `POST /game/portfolio/trades`.
- **Database Locks**: Trades use transaction isolation to prevent double-spends.
- **WebSocket**: Leaderboard and news broadcast via Socket.IO during active rounds.
- **Caching**: `/leaderboard` uses in-memory caching.
- **Game Loop**: State transitions between `TRADING_STAGE` and `CALCULATION_STAGE`.
- **Rate Limiting**: API endpoints protected with `express-rate-limit`.

---

## Project Structure

```
FEC-VSM/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API handlers
│   │   ├── game/           # Game logic
│   │   ├── services/      # DB, socket, cache
│   │   └── models/        # Schema models
│   ├── prisma/            # Schema
│   ├── load-test/         # Load testing
│   └── .env               # Configuration
├── frontend/              # Next.js app
├── DEVELOPER_GUIDE.md     # Detailed guide
└── README.md
```

---

---

## Deployment Guide (Neon + Vercel)

### Prerequisites

- [Neon](https://neon.tech) account (free tier)
- [Vercel](https://vercel.com) account (free tier)
- Git repository pushed to GitHub/GitLab

### Step 1: Neon Database Setup

1. Log in to [Neon](https://neon.tech) and create a new project
2. Choose a region closest to your users
3. Wait for the project to be created
4. Go to **Dashboard** > **Connection Details**
5. Copy the **Connection String** (starts with `postgresql://`)

### Step 2: Backend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com) and import your repository
2. Configure the project:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

3. Add Environment Variables in Vercel:

   | Variable | Value |
   |----------|-------|
   | `DB_URL` | Neon connection string (add `?sslmode=require` at the end) |
   | `PORT` | 8080 |
   | `ALLOWED_ORIGIN` | Your Vercel frontend URL (e.g., `https://your-app.vercel.app`) |
   | `AUTH_TOKEN_SECRET` | Generate a secure random string (use `openssl rand -base64 32`) |
   | `AUTH_TOKEN_LIFETIME` | 24h |
   | `MAX_GAME_ROUNDS` | 10 |
   | `ROUND_DURATION` | 2 |
   | `INITIAL_BANK_BALANCE` | 10000 |
   | `MUFT_KA_PAISA` | 1000 |
   | `CACHE_TIME` | 30 |
   | `PRICE_IMPACT_MULTIPLIER` | 50.0 |
   | `TOTAL_SUPPLY_PER_STOCK` | 10000 |

4. Deploy the backend

5. Note your backend URL (e.g., `https://your-backend.vercel.app`)

### Step 3: Frontend Deployment (Vercel)

1. In your Vercel dashboard, import the repository again (or add a new project)
2. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

3. Add Environment Variables:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Your Vercel backend URL (e.g., `https://your-backend.vercel.app`) |
   | `NEXTAUTH_SECRET` | Generate a secure random string |
   | `NEXTAUTH_URL` | Your Vercel frontend URL |

4. Deploy the frontend

### Step 4: Database Initialization

Since Vercel serverless functions can't run long-running seed scripts, you have two options:

**Option A: Use Neon CLI**
```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth login

# Get connection string
neonctl projects list

# Push schema
cd backend
neonctl database create --project-name <your-project>
```

**Option B: Seed locally with remote DB**
```bash
# Update your local .env with Neon connection string
DB_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# Push schema and seed
cd backend
pnpm db:push
pnpm seed
```

### Step 5: Verify Deployment

1. Open your Vercel frontend URL
2. Try logging in with seeded test accounts
3. Verify WebSocket connection works (check browser console for Socket.IO errors)

### Troubleshooting

- **500 Error on API calls**: Check Vercel function logs for Prisma connection errors
- **WebSocket issues**: Ensure `ALLOWED_ORIGIN` includes your frontend URL
- **Database connection**: Ensure `?sslmode=require` is appended to Neon URL

---

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
