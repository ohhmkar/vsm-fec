/**
 * 50 Demo Accounts Load Test
 * 
 * Creates 50 users and simulates a mixed workload of buying and selling.
 * Each user runs strictly sequentially (Buy -> Wait -> Sell -> Wait -> Repeat).
 * Users run concurrently with each other.
 * 
 * Usage:
 *   npx tsx load-test/demo-50-users.ts
 */

import { io as ioClient } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const NUM_USERS = 50; 
const CYCLES = 10; // Number of buy/sell cycles per user

const STOCKS = ['PETR', 'AGRI', 'CRED', 'BLUE', 'GRID', 'INFR', 'AURU', 'TRSP', 'SCRT', 'MEDC', 'VOLT', 'TITA', 'URBC', 'FIBR', 'NEXT', 'FINV', 'GRNF', 'HELX'];

interface TradeResult {
  success: boolean;
  latencyMs: number;
  type: 'BUY' | 'SELL';
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
  console.log(`Starting 50 Demo Accounts Simulation...`);
  const timestamp = Date.now();

  // 1. Register Users
  console.log(`\n[Phase 1] Registering ${NUM_USERS} users...`);
  const registrationPromises = [];
  
  for (let i = 0; i < NUM_USERS; i++) {
    registrationPromises.push((async () => {
        const email = `demo50_${timestamp}_${i}@test.com`;
        const password = 'testpassword123';

        // Attempt registration (ignore if already exists, just proceed to login)
        await httpPost('/auth/register', {
          email,
          password,
          u1Name: `DemoUser_${i}`,
        });

        const loginResult = await httpPost('/auth/login', { email, password });
        if (loginResult.status >= 200 && loginResult.status < 300 && loginResult.data?.data?.token) {
            users.set(email, { 
                token: loginResult.data.data.token, 
                stocks: new Map() 
            });
            process.stdout.write('.'); // Progress indicator
        } else {
            console.error(`\nFailed to login user ${i}:`, loginResult.data);
        }
    })());
  }
  
  await Promise.all(registrationPromises);
  console.log(`\n[OK] Registered & Logged in ${users.size} users.`);

  if (users.size === 0) {
      console.error("No users registered. Exiting.");
      process.exit(1);
  }

  // 2. Mixed Trading Loop
  console.log(`\n[Phase 2] Simulating mixed trading activity...`);
  const startTime = performance.now();
  
  // Create a worker function for each user
  const userWorkers = Array.from(users.values()).map(async (user, index) => {
    // Stagger start time slightly (0-2 seconds) to avoid initial spike
    const startDelay = Math.random() * 2000;
    await new Promise(r => setTimeout(r, startDelay));

    for (let c = 0; c < CYCLES; c++) {
        // --- BUY STEP ---
        const stock = randomStock();
        const qty = randomQuantity();
        
        const buyRes = await httpPost(
            '/game/portfolio/trades',
            { action: 'BUY', symbol: stock, quantity: qty },
            user.token
        );
        
        const isBuySuccess = buyRes.status >= 200 && buyRes.status < 300;
        
        if (isBuySuccess) {
             const currentQty = user.stocks.get(stock) || 0;
             user.stocks.set(stock, currentQty + qty);
        }
        
        results.push({
            success: isBuySuccess,
            latencyMs: buyRes.latencyMs,
            type: 'BUY',
            error: !isBuySuccess ? (JSON.stringify(buyRes.data)) : undefined,
            symbol: stock,
            quantity: qty
        });

        // Think time between buy and sell (500ms - 1500ms)
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000)); 

        // --- SELL STEP (if we have stock) ---
        // Find what we own
        const owned = Array.from(user.stocks.entries()).filter(([s, q]) => q > 0);
        
        // 80% chance to sell something if we own anything
        if (owned.length > 0 && Math.random() < 0.8) {
            const [sellStock, ownedQty] = owned[Math.floor(Math.random() * owned.length)];
            // Sell random portion 1..owned
            const sellQty = Math.floor(Math.random() * ownedQty) + 1;
            
            const sellRes = await httpPost(
                 '/game/portfolio/trades',
                { action: 'SELL', symbol: sellStock, quantity: sellQty },
                user.token
            );

            const isSellSuccess = sellRes.status >= 200 && sellRes.status < 300;

            if (isSellSuccess) {
                user.stocks.set(sellStock, ownedQty - sellQty);
            }
            results.push({
                success: isSellSuccess,
                latencyMs: sellRes.latencyMs,
                type: 'SELL',
                error: !isSellSuccess ? (JSON.stringify(sellRes.data)) : undefined,
                symbol: sellStock,
                quantity: sellQty
            });
        }
        
        // Delay before next cycle
        await new Promise(r => setTimeout(r, 200 + Math.random() * 500));
    }
  });

  await Promise.all(userWorkers);
  const totalTime = (performance.now() - startTime) / 1000;

  // 3. Report
  const successCount = results.filter(r => r.success).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / (results.length || 1);
  
  console.log(`\n─── Report ───`);
  console.log(`Total Trades Initiated: ${results.length}`);
  console.log(`Successful:             ${successCount}`);
  console.log(`Failed:                 ${results.length - successCount}`);
  console.log(`Total Wall Time:        ${totalTime.toFixed(2)}s`);
  console.log(`Avg Request Latency:    ${avgLatency.toFixed(2)}ms`);
  console.log(`Approx Throughput:      ${(results.length / totalTime).toFixed(2)} req/s`);
  
  // Error breakdown
  const errorMap = new Map<string, number>();
  results.filter(r => !r.success).forEach(r => {
      const msg = r.error || 'Unknown';
      // Truncate long error messages
      const shortMsg = msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
      errorMap.set(shortMsg, (errorMap.get(shortMsg) || 0) + 1);
  });
  
  if (errorMap.size > 0) {
      console.log(`\nError Breakdown:`);
      errorMap.forEach((count, msg) => console.log(`  ${count}x: ${msg}`));
  }
}

run().catch(console.error);
