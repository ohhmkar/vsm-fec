export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Sector =
  | 'Technology'
  | 'Energy'
  | 'Healthcare'
  | 'Finance'
  | 'Industrials'
  | 'Consumer Discretionary'
  | 'Materials'
  | 'Communication'
  | 'Real Estate';

export interface Stock {
  ticker: string;
  name: string;
  sector: Sector;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  peRatio: number;
  high52w: number;
  low52w: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  history: OHLCV[];
}

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  ticker: string;
  name: string;
  shares: number;
  price: number;
  total: number;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  memberSince: string;
  isAdmin?: boolean;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
}
