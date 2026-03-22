

import { Stock, OHLCV, Sector } from '@/types';

// Seeded PRNG for deterministic data
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  nextGaussian(): number {
    const u = this.next();
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}

interface StockSeed {
  ticker: string;
  name: string;
  sector: Sector;
  basePrice: number;
  volatility: number;
  drift: number;
  marketCapMultiplier: number;
  avgVolume: number;
  peRatio: number;
}

const STOCK_SEEDS: StockSeed[] = [
  { ticker: 'NVXA', name: 'NovaTech AI Systems', sector: 'Technology', basePrice: 287.50, volatility: 0.028, drift: 0.0008, marketCapMultiplier: 1.8e9, avgVolume: 12500000, peRatio: 42.3 },
  { ticker: 'GRNX', name: 'GreenWave Energy Corp', sector: 'Energy', basePrice: 64.20, volatility: 0.022, drift: 0.0003, marketCapMultiplier: 850e6, avgVolume: 5800000, peRatio: 18.7 },
  { ticker: 'MDRX', name: 'MedCore Pharmaceuticals', sector: 'Healthcare', basePrice: 156.80, volatility: 0.024, drift: 0.0005, marketCapMultiplier: 1.2e9, avgVolume: 7200000, peRatio: 28.4 },
  { ticker: 'FNTX', name: 'Fintera Banking Group', sector: 'Finance', basePrice: 89.40, volatility: 0.018, drift: 0.0002, marketCapMultiplier: 2.1e9, avgVolume: 9400000, peRatio: 14.2 },
  { ticker: 'AERO', name: 'Apex Aerospace Inc', sector: 'Industrials', basePrice: 198.60, volatility: 0.02, drift: 0.0004, marketCapMultiplier: 1.5e9, avgVolume: 4300000, peRatio: 22.8 },
  { ticker: 'LUXE', name: 'Luminary Retail Holdings', sector: 'Consumer Discretionary', basePrice: 42.30, volatility: 0.025, drift: -0.0001, marketCapMultiplier: 600e6, avgVolume: 6100000, peRatio: 16.5 },
  { ticker: 'OMKX', name: 'Omkar Crypto Exchange', sector: 'Finance', basePrice: 124.70, volatility: 0.035, drift: 0.0006, marketCapMultiplier: 950e6, avgVolume: 15800000, peRatio: 35.1 },
  { ticker: 'AGRI', name: 'AgriVault Commodities', sector: 'Materials', basePrice: 37.90, volatility: 0.019, drift: 0.0001, marketCapMultiplier: 420e6, avgVolume: 3200000, peRatio: 12.8 },
  { ticker: 'STRM', name: 'StreamVault Media', sector: 'Communication', basePrice: 78.50, volatility: 0.023, drift: 0.0003, marketCapMultiplier: 1.1e9, avgVolume: 8700000, peRatio: 25.6 },
  { ticker: 'CYBX', name: 'CyberShield Security', sector: 'Technology', basePrice: 215.30, volatility: 0.026, drift: 0.0007, marketCapMultiplier: 1.4e9, avgVolume: 6500000, peRatio: 38.9 },
  { ticker: 'RLTY', name: 'RealNest Property Trust', sector: 'Real Estate', basePrice: 52.10, volatility: 0.015, drift: 0.0001, marketCapMultiplier: 780e6, avgVolume: 4100000, peRatio: 11.3 },
  { ticker: 'MOTO', name: 'MotorFlex Automotive', sector: 'Consumer Discretionary', basePrice: 147.20, volatility: 0.021, drift: -0.0002, marketCapMultiplier: 1.3e9, avgVolume: 7800000, peRatio: 19.4 },
  { ticker: 'BRIX', name: 'BioRix Life Sciences', sector: 'Healthcare', basePrice: 93.60, volatility: 0.03, drift: 0.0004, marketCapMultiplier: 680e6, avgVolume: 5400000, peRatio: 31.7 },
  { ticker: 'GLBL', name: 'GlobalRoute Logistics', sector: 'Industrials', basePrice: 68.80, volatility: 0.017, drift: 0.0002, marketCapMultiplier: 920e6, avgVolume: 6800000, peRatio: 15.9 },
  { ticker: 'QUNT', name: 'Quantum Data Infrastructure', sector: 'Technology', basePrice: 312.40, volatility: 0.032, drift: 0.0009, marketCapMultiplier: 2.4e9, avgVolume: 11200000, peRatio: 48.2 },
];

function generateIntradayOHLCV(seed: StockSeed, minutes: number): OHLCV[] {
  const rng = new SeededRandom(hashString(seed.ticker));
  const history: OHLCV[] = [];
  let price = seed.basePrice;

  const today = new Date();
  const startDate = new Date(today.getTime() - minutes * 60 * 1000);

  // Approximate scaling for minute data from daily volatility
  const minuteVolatility = seed.volatility / Math.sqrt(390); // 390 trading mins in a day
  const minuteDrift = seed.drift / 390;
  const minuteVolume = seed.avgVolume / 390;

  for (let i = 0; i < minutes; i++) {
    const date = new Date(startDate.getTime() + i * 60 * 1000);

    // Random walk with drift
    const minuteReturn = minuteDrift + minuteVolatility * rng.nextGaussian();
    const open = price;
    const close = price * (1 + minuteReturn);

    const intraRange = minuteVolatility * rng.nextRange(0.5, 2.0);
    const high = Math.max(open, close) * (1 + intraRange * rng.nextRange(0.2, 0.8));
    const low = Math.min(open, close) * (1 - intraRange * rng.nextRange(0.2, 0.8));

    const volumeVariation = rng.nextRange(0.6, 1.6);
    const volume = Math.round(minuteVolume * volumeVariation);

    history.push({
      date: date.toISOString(),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    });

    price = close;
  }

  return history;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function generateAllStocks(): Stock[] {
  return STOCK_SEEDS.map((seed) => {
    // Generate 3 hours of minute-by-minute data (180 minutes)
    const history = generateIntradayOHLCV(seed, 180);
    const latest = history[history.length - 1];
    const prevDay = history[0]; // compare to market open
    const allCloses = history.map((h) => h.close);
    const high52w = Math.max(...allCloses) * 1.08;
    const low52w = Math.min(...allCloses) * 0.92;
    const totalVol = history.reduce((s, h) => s + h.volume, 0);

    return {
      ticker: seed.ticker,
      name: seed.name,
      sector: seed.sector,
      price: latest.close,
      previousClose: prevDay.close, // Using start of simulation as previous close for demo
      change: round2(latest.close - prevDay.close),
      changePercent: round2(((latest.close - prevDay.close) / prevDay.close) * 100),
      marketCap: round2(latest.close * seed.marketCapMultiplier / seed.basePrice),
      volume: latest.volume,
      avgVolume: Math.round(totalVol / history.length),
      peRatio: seed.peRatio,
      high52w: round2(high52w),
      low52w: round2(low52w),
      open: latest.open,
      dayHigh: Math.max(...history.map(h => h.high)),
      dayLow: Math.min(...history.map(h => h.low)),
      history,
    };
  });
}

export function simulatePriceTick(stock: Stock): Stock {
  const rng = Math.random;
  const seed = STOCK_SEEDS.find((s) => s.ticker === stock.ticker);
  if (!seed) return stock;

  const microVolatility = seed.volatility * 0.15;
  const change = microVolatility * (rng() * 2 - 1);
  const newPrice = round2(stock.price * (1 + change));
  const dayChange = round2(newPrice - stock.previousClose);
  const dayChangePercent = round2((dayChange / stock.previousClose) * 100);

  return {
    ...stock,
    price: newPrice,
    change: dayChange,
    changePercent: dayChangePercent,
    dayHigh: Math.max(stock.dayHigh, newPrice),
    dayLow: Math.min(stock.dayLow, newPrice),
    volume: stock.volume + Math.round(rng() * 50000),
  };
}

export function calculateMarketIndex(stocks: Stock[]): number {
  // Weighted index based on market cap
  const totalCap = stocks.reduce((s, st) => s + st.marketCap, 0);
  const weightedPrice = stocks.reduce((s, st) => {
    const weight = st.marketCap / totalCap;
    return s + st.price * weight;
  }, 0);
  // Normalize to base 1000
  const baseWeightedPrice = STOCK_SEEDS.reduce((s, seed) => {
    const seedCap = seed.marketCapMultiplier;
    const totalSeedCap = STOCK_SEEDS.reduce((ss, se) => ss + se.marketCapMultiplier, 0);
    return s + seed.basePrice * (seedCap / totalSeedCap);
  }, 0);
  return round2((weightedPrice / baseWeightedPrice) * 1000);
}

export function calculateIndexHistory(stocks: Stock[]): { date: string; value: number }[] {
  if (stocks.length === 0) return [];
  const days = stocks[0].history.length;
  const totalSeedCap = STOCK_SEEDS.reduce((s, se) => s + se.marketCapMultiplier, 0);
  const baseWeightedPrice = STOCK_SEEDS.reduce((s, seed) => {
    return s + seed.basePrice * (seed.marketCapMultiplier / totalSeedCap);
  }, 0);

  const result: { date: string; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const weightedPrice = stocks.reduce((s, st) => {
      const seed = STOCK_SEEDS.find((se) => se.ticker === st.ticker);
      if (!seed) return s;
      const weight = seed.marketCapMultiplier / totalSeedCap;
      return s + st.history[i].close * weight;
    }, 0);
    result.push({
      date: stocks[0].history[i].date,
      value: round2((weightedPrice / baseWeightedPrice) * 1000),
    });
  }
  return result;
}

export function getSectors(): Sector[] {
  return [...new Set(STOCK_SEEDS.map((s) => s.sector))] as Sector[];
}
