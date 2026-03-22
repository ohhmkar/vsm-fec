# VSM Backend

The core game engine and API server for the FEC Virtual Stock Market.

## 🔧 Architecture

The backend is built on **Express.js** and uses **Drizzle ORM** for type-safe database interactions. It handles:
1.  **Game State Management**: Controls the flow of the game (Lobby -> Trading -> Calculation -> Ended).
2.  **Market Simulation**: Generates realistic stock price movements.
3.  **Order Matching/Execution**: Validates and processes buy/sell orders securely.
4.  **Real-time Broadcasting**: Pushes price and game state updates via Socket.io.

## 🚀 Setup & Commands

### Install Dependencies
```bash
npm install
```

### Database Migration
This project uses Drizzle Kit for migrations.
```bash
npm run db:push
```
*Note: Ensure your `DATABASE_URL` is set in `.env` before running this.*

### Development Server
Starts the server with hot-reloading (using `tsx`).
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server listening port | `8080` |
| `DATABASE_URL` | PostgreSQL Connection String | - |
| `JWT_SECRET` | Secret handling auth tokens | - |
| `ALLOWED_ORIGIN` | CORS allowed origin (Frontend URL) | `http://localhost:3000` |
| `INITIAL_BANK_BALANCE` | Starting cash for new users | `100000` |
| `ROUND_DURATION` | Duration of one trading round (minutes) | `15` |

## 📡 API Overview

### Auth
- `POST /auth/login`
- `POST /auth/register`

### Game & Trading
- `POST /game/buy-stock` - Execute a buy order.
- `POST /game/sell-stock` - Execute a sell order.
- `GET /game/info/stocks` - Get current stock prices.
- `GET /game/info/portfolio` - Get user's portfolio.

### Real-time Events (Socket.io)
- `game:stage` - Broadcasts current game stage.
- `market:update` - Broadcasts new stock prices.

## 🛡 Security Features
- **Rate Limiting**: Applied to sensitive routes to prevent abuse.
- **Input Validation**: Strict type checking and logic validation (e.g., no negative quantities).
- **Helmet**: Sets secure HTTP headers.
