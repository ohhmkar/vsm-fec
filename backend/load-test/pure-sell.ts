/**
 * Pure Sell Load Test
 * 
 * Simulates concurrent sell orders only.
 * Note: Users must own stocks to sell. This script first executes a
 * "seed phase" to buy stocks, then measures the "sell phase".
 * 
 * Usage:
 *   npx tsx load-test/pure-sell.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const NUM_USERS = Number(process.env.NUM_USERS) || 50;
const TRADES_PER_USER = Number(process.env.TRADES_PER_USER) || 20;

const STOCKS = ['NVXA', 'GRNX', 'MDRX', 'FNTX', 'AERO', 'LUXE', 'OMKX', 'AGRI', 'STRM', 'CYBX', 'RLTY', 'MOTO', 'BRIX', 'GLBL', 'QUNT'];

interface TradeResult {
  success: boolean;
  latencyMs: number;
  type: 'SELL';
  error?: string;
  symbol?: string;
  quantity?: number;
}

const results: TradeResult[] = [];

interface UserState {
  token: string;
  stocks: Map<string, number>; // symbol -> quantity owned
}

const users = new Map<string, UserState>();

// Helpers
function randomStock(): string {
  return STOCKS[Math.floor(Math.random() * STOCKS.length)];
}

function randomQuantity(): number {
  return Math.floor(Math.random() * 5) + 1; // 1-5 shares
}

async function httpPost(path: string, body: object, token?: string): Promise<{ status: number; data: any; latencyMs: number }> {
  const start = performance.now();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data, latencyMs: performance.now() - start };
  } catch (err: any) {
    return { status: 0, data: { error: err.message }, latencyMs: performance.now() - start };
  }
}

// Main logic
async function run() {
  console.log(`Starting Pure Sell Test with ${NUM_USERS} users, ${TRADES_PER_USER} trades each...`);
  const timestamp = Date.now();

  // 1. Register Users
  console.log(`\n[Phase 1] Registering ${NUM_USERS} users...`);
  for (let i = 0; i < NUM_USERS; i++) {
    const email = `puresell_${timestamp}_${i}@test.com`;
    const password = 'testpassword123';

    await httpPost('/auth/register', {
      email,
      password,
      u1Name: `Seller_${i}`,
    });

    const loginResult = await httpPost('/auth/login', { email, password });
    if (loginResult.status === 201 && loginResult.data?.data?.token) {
      users.set(email, { token: loginResult.data.data.token, stocks: new Map() });
    }
  }
  console.log(`  [OK] Registered ${users.size} users.`);

  // 2. Seed Phase: Users buy stocks (Not timed/measured for load, just setup)
  console.log(`\n[Phase 2 - Setup] Seeding portfolios (buying stocks so they can be sold)...`);
  
  // Wait a bit to ensure server is ready/round started
  await new Promise(r => setTimeout(r, 2000));
  
  const setupPromises: Promise<void>[] = [];
  let completed = 0;
  
  // Batch users to avoid hammering the server with 750 concurrent requests
  const BATCH_SIZE = 10;
  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
      const batchUsers = Array.from(users.values()).slice(i, i + BATCH_SIZE);
      const batchPromises = batchUsers.flatMap(user => 
          STOCKS.map(async (stock) => {
              const qty = 2; // Small quantity to ensure affordability
              const res = await httpPost('/game/portfolio/trades', { action: 'BUY', symbol: stock, quantity: qty }, user.token);
              if (res.status === 200) {
                  user.stocks.set(stock, (user.stocks.get(stock) || 0) + qty);
              } else {
                 if (completed % 50 === 0) console.log(`[Seed Log] Failed for stock ${stock}: ${res.status} ${JSON.stringify(res.data)}`);
              }
              completed++;
          })
      );
      await Promise.all(batchPromises);
      console.log(`  Processed batch ${i / BATCH_SIZE + 1}/${Math.ceil(NUM_USERS / BATCH_SIZE)}`);
      // Small delay between batches
      await new Promise(r => setTimeout(r, 100)); 
  }
  
  // Verify seeding
  let totalSharesOwned = 0;
  for (const user of users.values()) {
      for (const qty of user.stocks.values()) {
        totalSharesOwned += qty;
      }
  }
  console.log(`  [OK] Portfolios seeded. Total shares owned across all users: ${totalSharesOwned}`);

  if (totalSharesOwned === 0) {
      console.error("  [FAIL] Seeding failed completely. Aborting test.");
      return;
  }

  // 3. Execute Sells (This is the actual test)
  console.log(`\n[Phase 3 - Test] Executing ${TRADES_PER_USER} SELL orders per user...`);
  const startTime = performance.now();
  const testPromises: Promise<void>[] = [];

  for (const user of users.values()) {
    for (let i = 0; i < TRADES_PER_USER; i++) {
        testPromises.push((async () => {
            // Add jitter to avoid instantaneous burst
            await new Promise(r => setTimeout(r, Math.random() * 200));

            // Pick a random stock that the user owns
            const owned = Array.from(user.stocks.entries()).filter(([sym, qty]) => qty > 0);
            if (owned.length === 0) return; 

            const [stock, ownedQty] = owned[Math.floor(Math.random() * owned.length)];
            const quantity = Math.min(ownedQty, randomQuantity()); // ensure we don't oversell

            const { status, data, latencyMs } = await httpPost(
                '/game/portfolio/trades',
                { action: 'SELL', symbol: stock, quantity },
                user.token
            );
            
            // Optimistically update local state just to allow next random pick to be valid-ish
            if (status === 200) {
                user.stocks.set(stock, ownedQty - quantity);
            }

            results.push({
                success: status === 200,
                latencyMs,
                type: 'SELL',
                error: status !== 200 ? (data?.message || JSON.stringify(data)) : undefined
            });
        })());
    }
  }

  await Promise.all(testPromises);
  const totalTime = (performance.now() - startTime) / 1000;

  // 4. Report
  const successCount = results.filter(r => r.success).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / (results.length || 1);
  
  console.log(`\n─── Report ───`);
  console.log(`Total Sells: ${results.length}`);
  console.log(`Successful:  ${successCount}`);
  console.log(`Failed:      ${results.length - successCount}`);
  console.log(`Total Time:  ${totalTime.toFixed(2)}s`);
  console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Throughput:  ${(results.length / totalTime).toFixed(2)} req/s`);
}

run().catch(console.error);
