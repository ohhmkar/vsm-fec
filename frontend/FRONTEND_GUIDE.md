# Frontend Developer Guide

This guide details the internal architecture, state management patterns, and key component logic of the VSM frontend.

## 🏗 Architecture Overview

The frontend is a **Next.js 13+ (App Router)** application using **TypeScript** and **Tailwind CSS**. It relies heavily on **Zustand** for client-side state management and **Socket.io** for real-time market data updates.

### Key Stores (`src/store`)

1.  **`marketStore.ts`**:
    - **Purpose**: Manages real-time stock prices, market trends (bull/bear), and socket connection.
    - **Socket Events**: Listens for `market:update`, `game:stage:change`, and `news:update`.
    - **State**: Holds `stocks` map, `marketTrend`, and `socket` instance.

2.  **`portfolioStore.ts`**:
    - **Purpose**: Tracks user holdings, cash balance, and transaction history.
    - **Sync Logic**: Often needs to be manually synced with backend (via `fetchPortfolio`) after trades or round updates.

3.  **`authStore.ts`**:
    - **Purpose**: Persists user session state (user ID, admin status) alongside NextAuth.

## 🧩 Key Components & Logic

### Admin Dashboard (`src/app/(dashboard)/admin-dashboard/page.tsx`)

- **Role**: The control center for Game Admins. It allows managing players, rounds, IPOs, and game state.
- **Data Fetching**: Uses a set of `useCallback` wrapped fetch functions to load:
  - `players`: User leaderboard.
  - `roundConfigs`: Game schedule.
  - `gameState`: Current round and stage.
  - `ipoStocks`: Pending IPOs.
- **Critical State**:
  - `players`: Typed as `PlayerData` (includes `wealth`, `stocks`, etc).
  - `roundConfigs`: Configuration for upcoming rounds.

### Stock Trading (`src/app/(dashboard)/stocks/page.tsx`)

- **Role**: The main market view. Displays live stock cards with sparklines.
- **Components**:
  - `StockCard`: Displays individual stock data.
  - `QuickTradeModal`: Handles buy/sell logic.
- **Real-time Updates**: Subscribes to `marketStore` to re-render prices instantly on socket events.

### Leaderboard (`src/app/(dashboard)/leaderboard/page.tsx`)

- **Role**: Displays global player rankings based on total portfolio value.
- **Updates**:
  - Fetches on mount and user change.
  - Listens to `leaderboard:update` socket event for live changes.
  - Refetches when `game:stage:CALCULATION_STAGE` event fires (end of round).

## 🐛 Common Issues & Fixes

### 1. `useEffect` Dependency Loops

- **Problem**: Fetching data inside `useEffect` without `useCallback` or stable references causes infinite re-renders.
- **Fix**: Wrap fetch functions in `useCallback` with stable dependencies (like `user?.id`) and include them in the `useEffect` dependency array.

### 2. State Updates During Render

- **Problem**: Calling `setState` (e.g., `setLoading`) directly inside a `useEffect` that depends on the state being set.
- **Fix**: Use local derived state or ensure state updates only happen in response to async operations or events, not just "render happened".

### 3. Type Safety (`any`)

- **Problem**: Explicit `any` creates holes in TypeScript coverage.
- **Fix**:
  - Use `unknown` for catch blocks (`err instanceof Error`).
  - Extend `NextAuth` types in `types/next-auth.d.ts`.
  - Define interfaces for API responses (like `PlayerData`).

## 🛠 Development Commands

- **Run Dev Server**: `npm run dev`
- **Lint Code**: `npm run lint` (Use this to catch dependency issues!)
- **Type Check**: `tsc --noEmit`
