/**
 * Pure Buy Load Test
 * 
 * Simulates concurrent buy orders only.
 * 
 * Usage:
 *   npx tsx load-test/pure-buy.ts
 */

import { io as ioClient } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const NUM_USERS = Number(process.env.NUM_USERS) || 50;
const TRADES_PER_USER = Number(process.env.TRADES_PER_USER) || 20;

const STOCKS = ['NVXA', 'GRNX', 'MDRX', 'FNTX', 'AERO', 'LUXE', 'OMKX', 'AGRI', 'STRM', 'CYBX', 'RLTY', 'MOTO', 'BRIX', 'GLBL', 'QUNT'];

interface TradeResult {
  success: boolean;
  latencyMs: number;
  type: 'BUY';
  error?: string;
  symbol?: string;
  quantity?: number;
}

const results: TradeResult[] = [];

interface UserState {
  token: string;
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
  console.log(`Starting Pure Buy Test with ${NUM_USERS} users, ${TRADES_PER_USER} trades each...`);
  const timestamp = Date.now();

  // Wait for server/game warmup
  await new Promise(r => setTimeout(r, 2000));

  // 1. Register Users
  console.log(`\n[Phase 1] Registering ${NUM_USERS} users...`);
  for (let i = 0; i < NUM_USERS; i++) {
    const email = `purebuy_${timestamp}_${i}@test.com`;
    const password = 'testpassword123';
// ... existing code ...
    await httpPost('/auth/register', {
      email,
      password,
      u1Name: `Buyer_${i}`,
    });

    const loginResult = await httpPost('/auth/login', { email, password });
    if (loginResult.status === 201 && loginResult.data?.data?.token) {
      users.set(email, { token: loginResult.data.data.token });
    }
  }
  console.log(`  [OK] Registered ${users.size} users.`);

  // 2. Execute Buys
  console.log(`\n[Phase 2] Executing ${TRADES_PER_USER} BUY orders per user...`);
  const startTime = performance.now();
  
  // Batch processing
  const BATCH_SIZE = 10;
  // Convert map to array
  const userArray = Array.from(users.values());
  
  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
      const batchUsers = userArray.slice(i, i + BATCH_SIZE);
      const batchPromises = batchUsers.flatMap(user => {
          return Array(TRADES_PER_USER).fill(0).map(async () => {
             const stock = randomStock();
             const quantity = randomQuantity();
             const { status, data, latencyMs } = await httpPost(
                '/game/portfolio/trades',
                { action: 'BUY', symbol: stock, quantity },
                user.token
             );
             results.push({
                success: status === 200,
                latencyMs,
                type: 'BUY',
                error: status !== 200 ? (data?.message || JSON.stringify(data)) : undefined
             });
          });
      });
      await Promise.all(batchPromises);
      await new Promise(r => setTimeout(r, 50)); // Throttle
  }

  const totalTime = (performance.now() - startTime) / 1000;

  // 3. Report
  const successCount = results.filter(r => r.success).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length;
  
  console.log(`\n─── Report ───`);
  console.log(`Total Buys: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed:     ${results.length - successCount}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Throughput: ${(results.length / totalTime).toFixed(2)} req/s`);
}

run().catch(console.error);
