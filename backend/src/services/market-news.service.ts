import { prisma } from '../services/prisma.service';
import { logger } from '../services/logging.service';
import { broadcastStockUpdate } from '../services/socket.service';
import { roundTo2Places } from '../common/utils';

interface MarketNews {
  id: number;
  sector: string;
  content: string;
  impact: 'BULLISH' | 'BEARISH' | 'AMBIGUOUS';
  impactPercent: number;
}

const MARKET_NEWS: MarketNews[] = [
  { id: 1, sector: 'Oil & Gas', content: 'US-led strikes damage multiple Middle East oil facilities, pushing Brent above $120', impact: 'BULLISH', impactPercent: 3 },
  { id: 2, sector: 'Airlines', content: 'Jet fuel prices surge as crude spikes amid escalating Gulf conflict', impact: 'BEARISH', impactPercent: -3 },
  { id: 3, sector: 'Specialty Chemicals', content: 'Crude derivatives correct sharply after OPEC signals supply increase', impact: 'BULLISH', impactPercent: 2 },
  { id: 4, sector: 'FMCG', content: 'Food inflation rises as fertilizer and logistics costs spike globally', impact: 'BEARISH', impactPercent: -2 },
  { id: 5, sector: 'Banking', content: 'Central bank hints at delaying rate cuts due to sticky inflation', impact: 'BEARISH', impactPercent: -2 },
  { id: 6, sector: 'NBFC', content: 'Regulator flags rising unsecured credit risk, tighter norms expected', impact: 'BEARISH', impactPercent: -4 },
  { id: 7, sector: 'IT Services', content: 'US corporates begin cutting discretionary tech spending amid slowdown fears', impact: 'BEARISH', impactPercent: -3 },
  { id: 8, sector: 'Capital Goods', content: 'Governments globally accelerate military spending after geopolitical escalation', impact: 'BULLISH', impactPercent: 3 },
  { id: 9, sector: 'Renewable Energy', content: 'Fossil fuel volatility pushes governments to fast-track green energy targets', impact: 'BULLISH', impactPercent: 2 },
  { id: 10, sector: 'Auto', content: 'Steel and aluminium prices spike due to global supply disruptions', impact: 'BEARISH', impactPercent: -2 },
  { id: 11, sector: 'Cement', content: 'Government announces massive infra push ahead of elections', impact: 'BULLISH', impactPercent: 4 },
  { id: 12, sector: 'Real Estate', content: 'Interest rates expected to stay higher for longer amid inflation concerns', impact: 'BEARISH', impactPercent: -3 },
  { id: 13, sector: 'Metals', content: 'China announces production cuts to control emissions', impact: 'BULLISH', impactPercent: 3 },
  { id: 14, sector: 'Textiles', content: 'Cotton prices crash after global oversupply', impact: 'BULLISH', impactPercent: 2 },
  { id: 15, sector: 'Quick Commerce', content: 'New labour laws mandate benefits for gig workers, raising operating costs', impact: 'BEARISH', impactPercent: -3 },
  { id: 16, sector: 'Telecom', content: 'Government allows tariff hikes to improve sector viability', impact: 'BULLISH', impactPercent: 3 },
  { id: 17, sector: 'Power Exchange', content: 'Regulator considers market coupling to standardise pricing', impact: 'BEARISH', impactPercent: -2 },
  { id: 18, sector: 'Capital Goods', content: 'Order inflows remain strong but execution delays rise due to supply bottlenecks', impact: 'AMBIGUOUS', impactPercent: 0 },
  { id: 19, sector: 'Pharma Exports', content: 'USFDA increases scrutiny on Indian plants after multiple observations', impact: 'BEARISH', impactPercent: -3 },
  { id: 20, sector: 'Logistics', content: 'Red Sea shipping disruptions increase freight rates globally', impact: 'BULLISH', impactPercent: 3 },
  { id: 21, sector: 'Jewellery Retail', content: 'Gold hits all-time highs amid geopolitical uncertainty, demand softens in retail markets', impact: 'AMBIGUOUS', impactPercent: 0 },
  { id: 22, sector: 'Stock Exchange', content: 'Retail participation surges but regulator cuts transaction fees', impact: 'AMBIGUOUS', impactPercent: 0 },
  { id: 23, sector: 'Insurance', content: 'Rising bond yields improve investment income outlook for insurers', impact: 'BULLISH', impactPercent: 3 },
  { id: 24, sector: 'QSR', content: 'Input costs rise while urban demand weakens slightly', impact: 'BEARISH', impactPercent: -2 },
  { id: 25, sector: 'Fertilizers', content: 'Natural gas prices spike due to supply disruptions', impact: 'BEARISH', impactPercent: -3 },
  { id: 26, sector: 'EV', content: 'Government reduces EV subsidies citing fiscal constraints', impact: 'BEARISH', impactPercent: -4 },
  { id: 27, sector: 'Semiconductors', content: 'Taiwan supply chain disruptions trigger global chip shortage fears', impact: 'BULLISH', impactPercent: 4 },
  { id: 28, sector: 'Media', content: 'Companies cut ad spends amid economic uncertainty', impact: 'BEARISH', impactPercent: -2 },
  { id: 29, sector: 'Hospital Chain', content: 'Health insurance penetration rises, driving higher patient inflows', impact: 'BULLISH', impactPercent: 3 },
  { id: 30, sector: 'Cash Logistics', content: 'Digital payments hit record highs, reducing cash usage trends', impact: 'BEARISH', impactPercent: -2 },
];

const SECTOR_TO_TICKERS: Record<string, string[]> = {
  'Oil & Gas': [],
  'Specialty Chemicals': ['PETR'],
  'FMCG': ['AGRI'],
  'NBFC': ['CRED'],
  'IT Services': ['BLUE'],
  'Power Exchange': ['GRID'],
  'Capital Goods': ['INFR'],
  'Jewellery Retail': ['AURU'],
  'Stock Exchange': ['TRSP'],
  'Insurance': ['SCRT'],
  'Hospital Chain': ['MEDC'],
  'Renewable Energy': ['VOLT'],
  'Metals': ['TITA'],
  'Quick Commerce': ['URBC'],
  'Logistics': ['FIBR'],
  'Semiconductors': ['NEXT'],
  'Retail Brokerage': ['FINV'],
  'Fertilizers': ['GRNF'],
  'Pharma Exports': ['HELX'],
  'Banking': [],
  'Airlines': [],
  'Real Estate': [],
  'Textiles': [],
  'Telecom': [],
  'Cement': [],
  'Auto': [],
  'QSR': [],
  'EV': [],
  'Media': [],
  'Cash Logistics': [],
};

let marketImpactInterval: NodeJS.Timeout | null = null;

export function getRandomMarketNews(count: number = 1): MarketNews[] {
  const shuffled = [...MARKET_NEWS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomMarketNewsBySentiment(
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): MarketNews | null {
  const filtered = MARKET_NEWS.filter(news => {
    if (sentiment === 'NEUTRAL') {
      return news.impact === 'AMBIGUOUS';
    }
    return news.impact === sentiment;
  });
  
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export async function applyMarketNewsImpact(news: MarketNews): Promise<void> {
  if (news.impact === 'AMBIGUOUS' || news.impactPercent === 0) {
    logger.info(`News ${news.id} is ambiguous, no market impact`);
    return;
  }

  const tickers = SECTOR_TO_TICKERS[news.sector] || [];
  
  if (tickers.length === 0) {
    logger.info(`No tickers mapped for sector ${news.sector}, skipping impact`);
    return;
  }

  logger.info(`Applying ${news.impact} impact (${news.impactPercent}%) to ${tickers.join(', ')} from news: ${news.content}`);

  const durationMs = 90000;
  const steps = 45;
  const stepInterval = durationMs / steps;
  const impactPerStep = news.impactPercent / steps;

  let step = 0;

  const executeStep = async () => {
    step++;

    for (const ticker of tickers) {
      try {
        const stock = await prisma.stock.findUnique({
          where: { symbol: ticker },
          select: { price: true, name: true },
        });

        if (!stock) continue;

        const currentPrice = stock.price;
        const pricePerStep = currentPrice * (impactPerStep / 100);
        const newPrice = Math.max(0.01, roundTo2Places(currentPrice + pricePerStep));

        await prisma.stock.update({
          where: { symbol: ticker },
          data: { price: newPrice },
        });

        broadcastStockUpdate(ticker, newPrice, currentPrice, news.impact === 'BULLISH' ? 'BUY' : 'SELL', 100);
      } catch (err) {
        logger.warn(`Failed to update price for ${ticker}:`, err);
      }
    }

    if (step >= steps) {
      logger.info(`Market impact from news ${news.id} completed`);
      if (marketImpactInterval) {
        clearInterval(marketImpactInterval);
        marketImpactInterval = null;
      }
    }
  };

  marketImpactInterval = setInterval(executeStep, stepInterval);
  await executeStep();
}

export async function triggerMarketNewsEvent(
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  round: number
): Promise<{ news: MarketNews; dbNews: any } | null> {
  const newsItem = getRandomMarketNewsBySentiment(sentiment);
  
  if (!newsItem) {
    logger.warn(`No news found for sentiment: ${sentiment}`);
    return null;
  }

  const dbNews = await prisma.news.create({
    data: {
      content: newsItem.content,
      sentiment: sentiment === 'NEUTRAL' ? 'NEUTRAL' : sentiment,
      type: 'REAL',
      isAdminNews: true,
      roundApplicable: round,
      priceImpact: Math.abs(newsItem.impactPercent),
    },
  });

  logger.info(`Triggered real market news event: ${sentiment} - ${newsItem.content}`);

  if (newsItem.impact !== 'AMBIGUOUS') {
    await applyMarketNewsImpactSlow(newsItem, sentiment);
  }

  return { news: newsItem, dbNews };
}

async function applyMarketNewsImpactSlow(
  news: MarketNews,
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): Promise<void> {
  const tickers = SECTOR_TO_TICKERS[news.sector] || [];
  
  if (tickers.length === 0) {
    logger.info(`No tickers mapped for sector ${news.sector}, skipping impact`);
    return;
  }

  const baseImpact = Math.abs(news.impactPercent);
  const minImpact = Math.min(baseImpact, 1);
  const maxImpact = Math.min(baseImpact, 5);
  const actualImpactPercent = -(minImpact + Math.random() * (maxImpact - minImpact));
  
  const isPositive = sentiment === 'BULLISH';
  const finalImpact = isPositive ? Math.abs(actualImpactPercent) : actualImpactPercent;

  logger.info(`Applying ${isPositive ? 'BULLISH' : 'BEARISH'} impact (${finalImpact.toFixed(2)}%) to ${tickers.join(', ')}`);

  const durationMs = 60000 + Math.random() * 60000;
  const steps = 60;
  const stepInterval = durationMs / steps;
  const impactPerStep = finalImpact / steps;

  let step = 0;
  const initialPrices = new Map<string, number>();

  for (const ticker of tickers) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: ticker },
      select: { price: true },
    });
    if (stock) {
      initialPrices.set(ticker, stock.price);
    }
  }

  const executeStep = async () => {
    step++;

    for (const ticker of tickers) {
      try {
        const stock = await prisma.stock.findUnique({
          where: { symbol: ticker },
          select: { price: true, name: true },
        });

        if (!stock) continue;

        const currentPrice = stock.price;
        const priceChange = currentPrice * (impactPerStep / 100);
        const newPrice = Math.max(0.01, roundTo2Places(currentPrice + priceChange));

        await prisma.stock.update({
          where: { symbol: ticker },
          data: { price: newPrice },
        });

        broadcastStockUpdate(ticker, newPrice, currentPrice, isPositive ? 'BUY' : 'SELL', 150);
      } catch (err) {
        logger.warn(`Failed to update price for ${ticker}:`, err);
      }
    }

    if (step >= steps) {
      logger.info(`Market impact from news "${news.content}" completed`);
      if (marketImpactInterval) {
        clearInterval(marketImpactInterval);
        marketImpactInterval = null;
      }
    }
  };

  marketImpactInterval = setInterval(executeStep, stepInterval);
  await executeStep();
}

export function stopMarketImpact(): void {
  if (marketImpactInterval) {
    clearInterval(marketImpactInterval);
    marketImpactInterval = null;
  }
}

export function getAllMarketNews(): MarketNews[] {
  return MARKET_NEWS;
}
