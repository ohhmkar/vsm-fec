# FEC Virtual Stock Market (FEC-VSM)

A high-performance virtual stock market simulation platform designed for college events and finance competitions. It features real-time simulated market data, sub-second latency updates, and a comprehensive trading interface.

## 🚀 Key Features

- **Real-Time Market Engine**: Simulates realistic stock price movements using Ornstein-Uhlenbeck processes and jump diffusion models.
- **Live Trading Interface**: Buy and sell stocks instantly with dynamic validation and portfolio updates.
- **Dynamic Portfolio Tracking**: Real-time calculation of Net Worth, P&L, and Weighted Average Cost Basis (WACB).
- **Interactive Charts**: Candlestick and Area charts with multiple timeframes and sparklines for quick trend analysis.
- **Power-Ups System**: Gamified elements like "Insider Trading" (news peeks) and "Muft Ka Paisa" (cash grants).
- **Security**: Rate limiting, localized input validation, and secure authentication via NextAuth/JWT.
- **Admin Dashboard**: Control game states (Start/Stop), view active users, and monitor market health.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) with Turbopack
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand (Persisted Store)
- **Charts**: Recharts, Chart.js
- **Network**: Socket.io-client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon / Supabase)
- **ORM**: Drizzle ORM
- **Real-time**: Socket.io
- **Security**: Helmet, Rate-Limit, BCrypt

## 📂 Project Structure

```bash
FEC-VSM/
├── backend/                # Express.js Server & Game Engine
│   ├── src/
│   │   ├── controllers/    # API Route Handlers
│   │   ├── game/           # Core Game Logic & Simulation Loop
│   │   ├── models/         # Database Models (Drizzle)
│   │   └── ...
│   └── ...
├── frontend/               # Next.js Client Application
│   ├── src/
│   │   ├── app/            # App Router Pages
│   │   ├── components/     # Reusable UI & Charts
│   │   ├── store/          # Zustand Global State
│   │   └── ...
│   └── ...
└── README.md
```

## ⚡️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL Database (Local or Cloud like Neon/Supabase)

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=8080
DATABASE_URL="postgres://user:pass@host/db"
JWT_SECRET="your-super-secret-jwt-key"
ALLOWED_ORIGIN="http://localhost:3000"
NODE_ENV="development"

# Game Logic Config
INITIAL_BANK_BALANCE=100000
ROUND_DURATION=15  # Minutes
```

Run migrations and start the server:
```bash
npm run db:push    # Push schema to DB
npm run start:dev  # Start server with watch mode
```

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key" # Must match backend JWT_SECRET ideally, or be unique for Auth.js
```

Start the application:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the platform.

## 🛡️ Security & Architecture Notes
- **Game Loop**: The backend runs a recursive game loop that handles state transitions (`TRADING_STAGE` -> `CALCULATION_STAGE`). It does not rely on external cron jobs.
- **Cost Basis**: Portfolio cost basis is calculated on the backend (Weighted Average) to ensure data integrity and prevent client-side manipulation.
- **Rate Limiting**: API endpoints are protected against spam/DDoS using `express-rate-limit`.
- **Lockfiles**: Ensure you interact with `package-lock.json` only within the respective `backend` or `frontend` directories. The root directory should typically remain clean.

## 🤝 Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
