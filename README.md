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

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=8080
DB_URL=postgresql://postgres:postgres@127.0.0.1:5432/vsm_db
AUTH_TOKEN_SECRET=super-secret-jwt-key
AUTH_TOKEN_LIFETIME=24h
ALLOWED_ORIGIN=http://localhost:3000
MAX_GAME_ROUNDS=10
ROUND_DURATION=2
INITIAL_BANK_BALANCE=10000
MUFT_KA_PAISA=1000
CACHE_TIME=30
PRICE_IMPACT_MULTIPLIER=50.0
TOTAL_SUPPLY_PER_STOCK=10000
```

Start the server:

```bash
npm run db:push    # Push schema to DB
npm run seed       # Seed initial data
npm run start:dev  # Start server
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

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

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
