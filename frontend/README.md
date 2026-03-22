# VSM Frontend

The user-facing dashboard for the FEC Virtual Stock Market, built with Next.js 16.

## ⚡️ Technology Stack

- **Next.js 16**: App Router + Turbopack for lightning-fast HMR.
- **Tailwind CSS**: Utility-first styling.
- **Zustand**: Lightweight global state management (Portfolio, Market Data).
- **Framer Motion**: Smooth animations for UI transitions.
- **Recharts**: Responsive charts for stock history and portfolio performance.
- **Socket.io-client**: Real-time communication with the backend.

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000).

### Environment Variables (.env)

Create a `.env` file in this directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:8080" # Backend URL
NEXTAUTH_URL="http://localhost:3000"        # Frontend URL (required for NextAuth)
NEXTAUTH_SECRET="your-secret-key"           # Secure random string
```

## 📂 Key Directories

- `src/app`: App Router pages and layouts.
  - `(auth)`: Login/Register pages.
  - `(dashboard)`: Main trading interface.
- `src/components`:
  - `charts/`: Reusable chart components.
  - `ui/`: Shared UI elements (Buttons, Modals, Cards).
- `src/store`: Zustand stores (`marketStore`, `portfolioStore`, `authStore`).
- `src/lib`: Utilities and mock data generators.

## 🔄 State Management

We use **Zustand** to handle application state:

- **`marketStore`**: Handles the list of stocks, real-time price updates, and socket connections.
- **`portfolioStore`**: Manages the user's cash, holdings, and transaction history.
- **`authStore`**: Manages user session and authentication status.

## 🎨 Styling

Global styles are defined in `src/app/globals.css`. We use a custom dark theme with specific CSS variables:

- `--bg-base`: Deep midnight background.
- `--accent-green`: Success/Profit indicator.
- `--accent-red`: Loss/Danger indicator.
- `--accent-blue`: Primary brand color.
