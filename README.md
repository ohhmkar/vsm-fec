# FEC Virtual Stock Market (FEC-VSM)

A virtual stock market platform designed for live simulation events. It features real-time simulated market data, a dynamic portfolio evaluation system, and event-specific power-ups. The backend leverages an Ornstein-Uhlenbeck process with jump diffusion for realistic pricing models.

## Features

- **Real-Time Market Data**: WebSockets stream price updates to all connected clients.
- **Dynamic Portfolio Valuation**: Automated recalculation of net worth driven by real-time ticker data.
- **News System**: A synced news ticker that correlates with simulated market shocks.
- **Power-Ups Module**:
  - *Insider Trading*: Provides early access to upcoming market events.
  - *Muft Ka Paisa*: Triggers an immediate cash grant.
  - *Stock Betting*: Allows traders to lock capital on bullish or bearish predictions for specific tickers.
- **Admin Dashboard**: Restricted visibility containing the live portfolios, rankings, and active trades of all users.
- **Leaderboard**: Real-time ranking system based on total portfolio value.

## Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Recharts, Framer Motion.
- **Backend**: Node.js, Express, Socket.IO.
- **Database**: PostgreSQL (Neon Database recommended), Drizzle ORM.

## Local Hosting Guide

### 1. Database Setup (Neon)
1. Create a PostgreSQL project on [Neon.tech](https://neon.tech/).
2. Copy your connection string. It will look similar to: `postgresql://user:password@hostname/dbname?sslmode=require`.

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="your-neon-connection-string"
PORT=8080
ALLOWED_ORIGIN="http://localhost:3000"
JWT_SECRET="generate-a-secure-secret-key"

# Game Configuration
MAX_GAME_ROUNDS=12
ROUND_DURATION=15 # in minutes
INITIAL_BANK_BALANCE=100000
MUFT_KA_PAISA=50000
```

Run database migrations to generate the schema in Neon, and start the server:
```bash
npm run db:push
npm run start:dev
```
*(In development mode, the game and initial trading round will automatically start on boot.)*

### 3. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:8080"
NEXTAUTH_SECRET="generate-another-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

Start the Next.js development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

## Deployment Guide

### Backend (e.g., Render, Railway)
1. Provision a Node.js web service.
2. Add your Environment Variables (`DATABASE_URL`, `PORT`, `ALLOWED_ORIGIN` pointing to your deployed frontend, `JWT_SECRET`, and Game Configs).
3. **Build Command**: `npm install && npm run build` (Ensures TypeScript is compiled to `dist/`).
4. **Start Command**: `node dist/app.js` (Or equivalent entry point).
5. Expose the port so the frontend can connect via HTTPS and WSS (WebSocket Secure).

### Frontend (e.g., Vercel)
1. Deploy the `frontend` folder directly to Vercel/Netlify.
2. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g., `https://api.yourdomain.com`).
   - `NEXTAUTH_SECRET`: The same secret used locally.
   - `NEXTAUTH_URL`: Your deployed Vercel URL.
3. The platform will automatically detect Next.js, compile, and serve the trading dashboard.

## Admin Controls

The virtual stock market operates on a strict backend state machine (`INVALID` -> `ON` -> `OPEN`). 
- **Admin Account**: You can register an account with `isAdmin: true` by calling `/auth/register` manually, or toggling the flag directly in your Neon DB dashboard.
- **Start Game**: Triggers the `ON` stage (allows users to log in).
- **Start Round**: Triggers the `OPEN` stage (allows actual trading, market data streaming, and portfolio valuation). 
*(Note: These triggers run automatically only when booting the backend using `start:dev` for local testing convenience. In production, an admin must invoke the API endpoints `POST /admin/start-game` and `POST /admin/start-round`.)*
