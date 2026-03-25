# Admin Guide & Documentation

This guide details the administrative endpoints and procedures for managing the Virtual Stock Market game.

## Game Lifecycle Management

### 1. **Start Game**
Initializes the game state, connects to the database, and opens the server for player logins.
*   **Endpoint:** `POST /admin/start-game`
*   **Actions:** Sets game stage to `ON`. Does **not** start the first round automatically.

### 2. **Start Round**
Begins a trading round.
*   **Endpoint:** `POST /admin/start-round`
*   **Body:**
    ```json
    {
      "roundNo": 1,       // Optional: Defaults to next logical round
      "duration": 15      // Optional: Duration in minutes. Overrides DB config.
    }
    ```
*   **Behavior:**
    *   Sets stage to `OPEN`.
    *   Starts countdown timer (default 10 mins or as specified).
    *   Snapshots opening prices.
    *   Triggers pre-round scenarios/news events.
    *   Accepts buy/sell orders.

### 3. **Extend Round**
Adds time to the current active round.
*   **Endpoint:** `POST /admin/rounds/extend`
*   **Body:**
    ```json
    { "minutes": 5 }
    ```
*   **Behavior:** Adds minutes to the countdown. Notifies all clients via socket.

### 4. **End Round (Force)**
Immediately ends the current round, skipping remaining time.
*   **Endpoint:** `POST /admin/rounds/end-now`
*   **Behavior:**
    *   Sets stage to `CLOSE`.
    *   Stops trading.
    *   Processes dividends.
    *   Updates portfolio values.
    *   Clears temporary round data (e.g., IPO locks).

### 5. **Pause/Resume Game**
Temporarily halts market activity.
*   **Endpoint:** `POST /admin/game/pause` / `POST /admin/game/resume`
*   **Behavior:**
    *   **Pause:** Stops timer, blocks new trades.
    *   **Resume:** Resumes timer from where it left off, enables trades.

### 6. **Terminate Game**
Stops the game server (process level) or ends game logic completely.
*   **Endpoint:** `POST /admin/terminate-game`
*   **Behavior:** Sets stage to `OFF`.

### 7. **Reset Game Data**
Wipes all game data (players, portfolios, transactions) to start fresh.
*   **Endpoint:** `POST /admin/reset-game`
*   **Body:** `{ "pass": "reset_game_bro" }`
*   **Warning:** Destructive action. Cannot be undone.

---

## Game Configuration

### 1. **Configure Rounds**
Set up duration and rules for specific rounds in advance.
*   **Endpoint:** `POST /admin/rounds/config`
*   **Body:**
    ```json
    {
      "roundNo": 2,
      "duration": 20,
      "message": "Bull Run",
      "rules": { "volatilityMultiplier": 1.5 }
    }
    ```

### 2. **Manage Stocks**
Add new stocks or update existing ones.
*   **Endpoint:** `POST /admin/add-stock`
*   **Body:** Stock object (Symbol, Name, Sector, Base Price, etc.)

---

## IPO Management

### 1. **Check Eligibility**
Get a list of users eligible for IPO allocation based on portfolio criteria.
*   **Endpoint:** `GET /admin/ipo/eligibility?excludeSector=Banking`

### 2. **Allocate IPO Stocks**
Assign IPO shares to specific players before the IPO round.
*   **Endpoint:** `POST /admin/ipo/allocate`
*   **Body:**
    ```json
    {
      "allocations": [
        { "playerId": "uuid", "symbol": "ZETA", "quantity": 50, "round": 5 }
      ]
    }
    ```
*   **Note:** Allocated shares are claimed by users in `ipoRound`. They are locked from selling until `ipoRound + 1`.

---

## Market Control

### 1. **Generate News**
Manually spawn news events to influence market sentiment.
*   **Endpoint:** `POST /admin/news/generate`
*   **Body:** `{ "round": 1, "count": 3 }`

### 2. **Trigger Market Event**
Force a global market trend immediately.
*   **Endpoint:** `POST /admin/news/market-event`
*   **Body:** `{ "sentiment": "BULLISH" }` (or "BEARISH", "NEUTRAL")

### 3. **Declare Dividends**
Announce dividends for a stock.
*   **Endpoint:** `POST /admin/dividends/declare`
*   **Body:**
    ```json
    { "symbol": "PETR", "amount": 10, "round": 3 }
    ```
*   **Effect:** Payout occurs automatically at the end of the specified round.

---

## Player Management

### 1. **View Leaderboard & Players**
Get detailed player stats including hidden test users.
*   **Endpoint:** `GET /admin/leaderboard?includeTestUsers=true`

### 2. **Update User Balance**
Manually adjust a player's bank balance.
*   **Endpoint:** `POST /admin/users/balance`
*   **Body:**
    ```json
    {
      "playerId": "uuid",
      "amount": 5000,
      "operation": "ADD" // or "SUBTRACT", "SET"
    }
    ```

---

## Debug & Maintenance

*   `POST /admin/flush-database`: clear entire DB (Pass: `flush_db_bro`)
*   `POST /admin/flush-player-table`: clear players only (Pass: `flush_player_table_bro`)
*   `POST /admin/flush-user-table`: clear users only (Pass: `flush_user_table_bro`)
*   `POST /admin/scenario`: Trigger a predefined scenario script.

## Known Issues (Fixed)
*   **Round Timer:** Rounds now auto-end when the duration expires. Previously required manual intervention.
*   **IPO Allocation:** IPO transactions are now atomic.
*   **Trading Restrictions:** IPO stocks are now strictly locked during their launch round (Round X) and become tradeable in Round X+1.
