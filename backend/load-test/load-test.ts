/**
 * Load Test Script for FEC-VSM Backend
 * 
 * Tests concurrent buy -> sell -> buy -> sell cycles.
 * Each user buys stocks first, then sells them, repeatedly.
 * 
 * Usage:
 *   npx tsx load-test/load-test.ts
 * 
 * Prerequisites:
 *   - Server running on http://localhost:8080
 *   - Database seeded (npm run seed)
 *   - Game started (auto-starts in dev mode)
 */

import { io as ioClient, Socket } from 'socket.io-client';

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const NUM_USERS = Number(process.env.NUM_USERS) || 40;
const CYCLES_PER_USER = Number(process.env.CYCLES_PER_USER) || 40;
const STOCKS = ['PETR', 'AGRI', 'CRED', 'BLUE', 'GRID', 'INFR', 'AURU', 'TRSP', 'SCRT', 'MEDC', 'VOLT', 'TITA', 'URBC', 'FIBR', 'NEXT', 'FINV', 'GRNF', 'HELX'];

// ─── Tracking ────────────────────────────────────────────────────────────────

interface TradeResult {
  success: boolean;
  latencyMs: number;
  type: 'BUY' | 'SELL';
  error?: string;
  symbol?: string;
  quantity?: number;
}

const results: TradeResult[] = [];
let socketUpdatesReceived = 0;
let tradeEventsReceived = 0;

interface UserState {
  token: string;
  stocks: Map<string, number>; // symbol -> quantity owned
  balance: number;
}

const users = new Map<string, UserState>();
const initialPrices = new Map<string, number>();
const afterBuyPrices = new Map<string, number>();
const afterSellPrices = new Map<string, number>();

// Seed price for all stocks
const SEED_PRICE = 100;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

async function httpGet(path: string, token?: string): Promise<{ status: number; data: any; latencyMs: number }> {
  const start = performance.now();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    const data = await res.json();
    return { status: res.status, data, latencyMs: performance.now() - start };
  } catch (err: any) {
    return { status: 0, data: { error: err.message }, latencyMs: performance.now() - start };
  }
}

// ─── Phase 1: Register & Login Users ─────────────────────────────────────────

async function createTestUsers(count: number): Promise<void> {
  console.log(`\n[Phase 1] Registering ${count} test users...`);
  const timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    const email = `loadtest_${timestamp}_${i}@test.com`;
    const password = 'testpassword123';

    const regResult = await httpPost('/auth/register', {
      email,
      password,
      u1Name: `LoadUser_${i}`,
    });

    if (regResult.status !== 201) {
      console.error(`  [FAIL] Failed to register user ${i}: ${JSON.stringify(regResult.data)}`);
      continue;
    }

    const loginResult = await httpPost('/auth/login', { email, password });
    if (loginResult.status !== 201 || !loginResult.data?.data?.token) {
      console.error(`  [FAIL] Failed to login user ${i}: ${JSON.stringify(loginResult.data)}`);
      continue;
    }

    users.set(email, {
      token: loginResult.data.data.token,
      stocks: new Map(),
      balance: 10000, // Initial balance from config
    });
  }

  console.log(`  [OK] Successfully created ${users.size}/${count} users`);
}

// ─── Phase 2: Connect Socket.IO Listener ─────────────────────────────────────

function connectSocketListener(token: string): Socket {
  console.log('\n[Phase 2] Connecting Socket.IO listener...');
  const socket = ioClient(BASE_URL, {
    transports: ['websocket'],
    extraHeaders: { authorization: `Bearer ${token}` },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('  [OK] Socket.IO connected');
  });

  socket.on('stock:price-update', () => {
    socketUpdatesReceived++;
  });

  socket.on('trade:executed', () => {
    tradeEventsReceived++;
  });

  socket.on('connect_error', (err: any) => {
    console.log(`  [WARN] Socket connection error: ${err.message}`);
  });

  return socket;
}

// ─── Phase 3: Trade Functions ─────────────────────────────────────────────────

async function runBuyTrade(user: UserState, stock: string, quantity: number): Promise<TradeResult> {
  const { status, data, latencyMs } = await httpPost(
    '/game/portfolio/trades',
    { action: 'BUY', symbol: stock, quantity },
    user.token,
  );

  if (status === 200) {
    const current = user.stocks.get(stock) || 0;
    user.stocks.set(stock, current + quantity);
  }

  return {
    success: status === 200,
    latencyMs,
    type: 'BUY',
    error: status !== 200 ? (data?.message || data?.error || JSON.stringify(data)) : undefined,
  };
}

async function runSellTrade(user: UserState): Promise<TradeResult> {
  // Find a stock the user owns with enough quantity
  const ownedStocks = Array.from(user.stocks.entries())
    .filter(([, qty]) => qty >= 1) // Must have at least 1 share
    .sort(() => Math.random() - 0.5); // Shuffle for variety
  
  if (ownedStocks.length === 0) {
    return {
      success: false,
      latencyMs: 0,
      type: 'SELL',
      error: 'No stocks to sell',
    };
  }

  const [stock, ownedQty] = ownedStocks[0];
  // Sell exactly what the user owns (or random quantity if they have enough)
  const quantity = ownedQty >= randomQuantity() ? randomQuantity() : ownedQty;

  const { status, data, latencyMs } = await httpPost(
    '/game/portfolio/trades',
    { action: 'SELL', symbol: stock, quantity },
    user.token,
  );

  if (status === 200) {
    const current = user.stocks.get(stock) || 0;
    user.stocks.set(stock, Math.max(0, current - quantity));
  }

  return {
    success: status === 200,
    latencyMs,
    type: 'SELL',
    error: status !== 200 ? (data?.message || data?.error || JSON.stringify(data)) : undefined,
  };
}

// ─── Phase 4: Run Buy-Sell Cycles ─────────────────────────────────────────────

async function runBuySellCycle(user: UserState, cycleIndex: number): Promise<void> {
  const stock = randomStock();
  const quantity = randomQuantity();
  
  const buyResult = await runBuyTrade(user, stock, quantity);
  results.push(buyResult);
}

async function runAllSells(user: UserState, expectedSells: number): Promise<void> {
  // Sell exactly expectedSells times - matching number of buys
  for (let i = 0; i < expectedSells; i++) {
    const ownedStocks = Array.from(user.stocks.entries())
      .filter(([, qty]) => qty >= 1);
    
    if (ownedStocks.length === 0) {
      results.push({ success: false, latencyMs: 0, type: 'SELL', error: 'No stocks left' });
      continue;
    }
    
    const [stock] = ownedStocks[0];
    const sellResult = await runSellTradeDirect(user, stock, 1);
    results.push(sellResult);
    
    if (sellResult.success) {
      const current = user.stocks.get(stock) || 0;
      user.stocks.set(stock, Math.max(0, current - 1));
    } else {
      await syncPortfolio(user);
    }
    
    // Longer delay to ensure DB sync
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

async function syncPortfolio(user: UserState) {
  // Re-fetch portfolio to get accurate state
  const response = await httpGet('/game/info/portfolio', user.token);
  if (response.data?.data?.portfolio) {
    user.stocks.clear();
    for (const stock of response.data.data.portfolio) {
      if (stock.volume > 0) {
        user.stocks.set(stock.name, stock.volume);
      }
    }
  }
}

async function runSellTradeDirect(user: UserState, stock: string, quantity: number): Promise<TradeResult> {
  const { status, data, latencyMs } = await httpPost(
    '/game/portfolio/trades',
    { action: 'SELL', symbol: stock, quantity },
    user.token,
  );

  if (status === 200) {
    const current = user.stocks.get(stock) || 0;
    user.stocks.set(stock, Math.max(0, current - quantity));
  }

  return {
    success: status === 200,
    latencyMs,
    type: 'SELL',
    error: status !== 200 ? (data?.message || data?.error || JSON.stringify(data)) : undefined,
  };
}

async function runConcurrentBuySellCycles(cycles: number) {
  console.log(`\n[Phase 3a] Running ${cycles} BUY trades per user concurrently...`);
  console.log(`   Total: ${users.size} users x ${cycles} buys = ${users.size * cycles} trades`);
  
  let startTime = performance.now();
  
  // Phase A: All buys first
  const buyPromises: Promise<void>[] = [];
  for (const [email, user] of users) {
    for (let i = 0; i < cycles; i++) {
      buyPromises.push(runBuySellCycle(user, i));
    }
  }
  await Promise.all(buyPromises);
  
  const buyTime = performance.now() - startTime;
  const buyResults = results.filter(r => r.type === 'BUY');
  console.log(`  [OK] BUYs completed in ${(buyTime / 1000).toFixed(2)}s`);
  console.log(`  [BUY] ${buyResults.filter(r => r.success).length}/${buyResults.length} succeeded`);
  
  // Wait for DB to fully sync
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Record prices after buys
  await recordAfterBuyPrices();
  
  // Log local state
  let totalOwned = 0;
  for (const [email, user] of users) {
    const owned = Array.from(user.stocks.values()).reduce((a, b) => a + b, 0);
    totalOwned += owned;
  }
  console.log(`  [INFO] Total stocks owned by all users: ${totalOwned}`);
  
  console.log(`\n[Phase 3b] Running SELL trades per user...`);
  console.log(`   Each user sells exactly ${cycles} times`);
  
  startTime = performance.now();
  
  // Phase B: Sells per user sequentially, users in parallel
  const sellPromises: Promise<void>[] = [];
  for (const [email, user] of users) {
    sellPromises.push(runAllSells(user, cycles));
  }
  await Promise.all(sellPromises);
  
  const sellTime = performance.now() - startTime;
  const sellResults = results.filter(r => r.type === 'SELL');
  
  console.log(`\n  [OK] SELLs completed in ${(sellTime / 1000).toFixed(2)}s`);
  console.log(`  [SELL] ${sellResults.filter(r => r.success).length}/${sellResults.length} succeeded`);
  
  const totalTime = buyTime + sellTime;
  console.log(`\n  [THROUGHPUT] ${(results.length / (totalTime / 1000)).toFixed(1)} trades/sec`);
}

// ─── Phase 5: Check Price Drift ──────────────────────────────────────────────

async function checkPriceDrift() {
  console.log('\n[Price Impact Analysis]');
  const firstUser = users.values().next().value;
  if (!firstUser) return;
  
  const { data } = await httpGet('/game/info/stocks', firstUser.token);

  if (data?.data) {
    console.log('  ' + '-'.repeat(75));
    console.log('  Stock      Before Test   After Buy    After Sell    BUY%     SELL%    NET%');
    console.log('  ' + '-'.repeat(75));
    
    for (const stock of data.data) {
      const beforeTest = initialPrices.get(stock.id) || SEED_PRICE;
      const afterBuy = afterBuyPrices.get(stock.id) || beforeTest;
      const afterSell = stock.value;
      
      const buyChange = ((afterBuy - beforeTest) / beforeTest * 100);
      const sellChange = ((afterSell - afterBuy) / afterBuy * 100);
      const netChange = ((afterSell - beforeTest) / beforeTest * 100);
      
      const buySign = buyChange >= 0 ? '+' : '';
      const sellSign = sellChange >= 0 ? '+' : '';
      const netSign = netChange >= 0 ? '+' : '';
      
      const buyStr = `[${buySign}${buyChange.toFixed(1)}%]`;
      const sellStr = `[${sellSign}${sellChange.toFixed(1)}%]`;
      const netStr = `[${netSign}${netChange.toFixed(1)}%]`;
      
      console.log(`  ${stock.id.padEnd(8)} $${beforeTest.toFixed(2)}       $${afterBuy.toFixed(2)}      $${afterSell.toFixed(2)}       ${buyStr.padEnd(12)} ${sellStr.padEnd(12)} ${netStr}`);
    }
    console.log('  ' + '-'.repeat(75));
  }
}

async function recordInitialPrices() {
  const firstUser = users.values().next().value;
  if (!firstUser) return;
  
  const { data } = await httpGet('/game/info/stocks', firstUser.token);
  if (data?.data) {
    console.log('\n[INFO] Recording initial stock prices (before test):');
    for (const stock of data.data) {
      initialPrices.set(stock.id, stock.value);
    }
    console.log(`  Recorded ${initialPrices.size} stock prices`);
    for (const [id, price] of initialPrices) {
      console.log(`    ${id}: $${price.toFixed(2)}`);
    }
  }
}

async function recordAfterBuyPrices() {
  const firstUser = users.values().next().value;
  if (!firstUser) return;
  
  const { data } = await httpGet('/game/info/stocks', firstUser.token);
  if (data?.data) {
    for (const stock of data.data) {
      afterBuyPrices.set(stock.id, stock.value);
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('  LOAD TEST REPORT');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const latencies = successful.map(r => r.latencyMs).sort((a, b) => a - b);

  console.log(`\n  Total Trades:     ${results.length}`);
  console.log(`  Successful:       ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Failed:         ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`);

  if (latencies.length > 0) {
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`\n  Latency (successful trades):`);
    console.log(`    Avg:  ${avg.toFixed(1)} ms`);
    console.log(`    P50:  ${p50.toFixed(1)} ms`);
    console.log(`    P95:  ${p95.toFixed(1)} ms`);
    console.log(`    P99:  ${p99.toFixed(1)} ms`);
  }

  const buys = results.filter(r => r.type === 'BUY');
  const sells = results.filter(r => r.type === 'SELL');
  console.log(`\n  BUYs:  ${buys.filter(r => r.success).length}/${buys.length} succeeded`);
  console.log(`  SELLs: ${sells.filter(r => r.success).length}/${sells.length} succeeded`);

  console.log(`\n  Socket.IO Events:`);
  console.log(`    stock:price-update: ${socketUpdatesReceived}`);
  console.log(`    trade:executed:     ${tradeEventsReceived}`);

  // Group errors by type
  const errorGroups = new Map<string, number>();
  failed.forEach(r => {
    const key = r.error?.substring(0, 60) || 'Unknown';
    errorGroups.set(key, (errorGroups.get(key) || 0) + 1);
  });
  
  console.log(`\n  Error Breakdown:`);
  for (const [error, count] of errorGroups) {
    console.log(`    ${count}x ${error}`);
  }

  console.log('\n' + '='.repeat(60));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('FEC-VSM Buy-Sell Load Test');
  console.log(`   Server:   ${BASE_URL}`);
  console.log(`   Users:    ${NUM_USERS}`);
  console.log(`   Cycles:   ${CYCLES_PER_USER} per user (each cycle = 1 buy + 1 sell)`);
  console.log(`   Total:   ~${NUM_USERS * CYCLES_PER_USER * 2} trades expected`);

  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    console.log('   Server: [OK] Online');
  } catch (err: any) {
    console.error(`\n[FAIL] Cannot reach server at ${BASE_URL}: ${err.message}`);
    console.error('   Make sure the server is running: npm run start:dev');
    process.exit(1);
  }

  await createTestUsers(NUM_USERS);
  if (users.size === 0) {
    console.error('\n[FAIL] No test users created. Is the game in ON/OPEN state?');
    process.exit(1);
  }

  const firstUser = users.values().next().value!;
  const socket = connectSocketListener(firstUser.token);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Record initial prices before any trades
  await recordInitialPrices();

  const startTime = performance.now();
  await runConcurrentBuySellCycles(CYCLES_PER_USER);
  const totalTime = performance.now() - startTime;

  await checkPriceDrift();
  await new Promise(resolve => setTimeout(resolve, 1000));

  printReport();
  console.log(`\n[INFO] Total time: ${(totalTime / 1000).toFixed(2)}s`);

  socket.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
