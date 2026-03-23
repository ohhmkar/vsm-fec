<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:fec-vsm-rules -->
# FEC-VSM Project Guidelines

## CRITICAL RULES

### 1. NO EMOJIS
**AVOID EMOJIS UNLESS ABSOLUTELY NECESSARY.** Use text-based indicators instead:
- Bad: "Hello!" / "+5%" / "🔒"
- Good: "Hello" / "+5%" / "[LOCKED]"

### 2. Naming Conventions
- Ticker symbols: 4 uppercase letters (e.g., NVXA, GRNX, OILI)
- Stock names: Full descriptive names (e.g., "NovaTech AI Systems")
- Round labels: "Round X" format

### 3. Currency Formatting
- Use `formatCurrency()` from `@/lib/utils` for INR display
- Starting balance: ₹10,00,000 (10 Lakh)

### 4. Sector Conventions
- Energy sector: GRNX (existing), OILI (IPO stock)
- Technology sector: QUNT (existing), TECH (IPO stock)

### 5. Backend API Patterns
- Admin endpoints: `/admin/*`
- Game endpoints: `/game/*`
- Socket events: Use existing patterns (e.g., `stock:price-update`, `news:update`)
- Response format: `{ status: 'Success' | 'Failure', data?: any, message?: string }`

### 6. Frontend State Management
- Use Zustand stores for state management
- Auth: `useAuthStore`
- Market: `useMarketStore`
- Portfolio: `usePortfolioStore`
- News: `useNewsStore`

### 7. Component Structure
- Admin components: `src/components/admin/*`
- UI components: `src/components/ui/*`
- Chart components: `src/components/charts/*`
- Logic components: `src/components/logic/*`

### 8. Database Patterns
- Prisma ORM for all DB operations
- Use transactions for multi-table updates
- JSON fields for arrays (stocks, holdings, rules)
<!-- END:fec-vsm-rules -->
