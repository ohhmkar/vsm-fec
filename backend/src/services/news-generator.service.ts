const CELEBRITIES = [
  { name: 'Elon Musk', sector: 'Tech/Auto' },
  { name: 'Dwayne Johnson', sector: 'Entertainment' },
  { name: 'Taylor Swift', sector: 'Entertainment' },
  { name: 'Narendra Modi', sector: 'Politics' },
  { name: 'Cristiano Ronaldo', sector: 'Sports' },
  { name: 'MrBeast', sector: 'Entertainment' },
  { name: 'Oprah Winfrey', sector: 'Media' },
  { name: 'Virat Kohli', sector: 'Sports' },
  { name: 'Billie Eilish', sector: 'Entertainment' },
  { name: 'Shah Rukh Khan', sector: 'Entertainment' },
  { name: 'Mark Zuckerberg', sector: 'Tech' },
  { name: 'Gordon Ramsay', sector: 'Food' },
  { name: 'Mukesh Ambani', sector: 'Energy/Business' },
  { name: 'Sundar Pichai', sector: 'Tech' },
  { name: 'Nirmala Sitharaman', sector: 'Finance' },
  { name: 'Sania Mirza', sector: 'Sports' },
  { name: 'Amitabh Bachchan', sector: 'Entertainment' },
];

const PLACES = [
  { name: 'Antarctica', type: 'Location' },
  { name: 'Mumbai', type: 'City' },
  { name: 'Area 51', type: 'Mystery' },
  { name: 'Mount Everest', type: 'Landmark' },
  { name: 'Paris', type: 'City' },
  { name: 'Mars', type: 'Space' },
  { name: 'Sahara Desert', type: 'Location' },
  { name: 'Silicon Valley', type: 'Tech Hub' },
  { name: 'Tokyo', type: 'City' },
  { name: 'The Moon', type: 'Space' },
  { name: 'Atlantis', type: 'Mythical' },
  { name: 'Times Square', type: 'Landmark' },
  { name: 'Bengaluru', type: 'City' },
  { name: 'Dubai', type: 'City' },
  { name: 'London', type: 'City' },
  { name: 'Monaco', type: 'Location' },
];

const COMPANIES = [
  { name: 'Google', sector: 'Tech' },
  { name: 'NASA', sector: 'Space' },
  { name: 'Tesla', sector: 'Auto/Energy' },
  { name: "McDonald's", sector: 'Food' },
  { name: 'Amazon', sector: 'E-commerce' },
  { name: 'OpenAI', sector: 'Tech/AI' },
  { name: 'ISRO', sector: 'Space' },
  { name: 'Netflix', sector: 'Media' },
  { name: 'Apple', sector: 'Tech' },
  { name: 'SpaceX', sector: 'Space' },
  { name: 'IKEA', sector: 'Retail' },
  { name: 'FIFA', sector: 'Sports' },
  { name: 'Samsung', sector: 'Tech' },
  { name: 'Microsoft', sector: 'Tech' },
  { name: 'Flipkart', sector: 'E-commerce' },
  { name: 'Reliance', sector: 'Energy' },
];

const OBJECTS = [
  'a giant rubber duck',
  'an AI-powered toaster',
  'invisible pizza',
  'time machine',
  'dancing robot',
  'cursed smartphone',
  'flying car',
  'talking cat',
  'infinite coffee mug',
  'glitch in reality',
  'mysterious button',
  'exploding watermelon',
  'quantum levitator',
  'holographic assistant',
  'self-aware drone',
  'memory eraser',
  'clone army',
  'crypto-powered blender',
  'sentient toaster',
  'digital twin',
];

const ACTIONS = [
  'accidentally launched',
  'secretly built',
  'hacked',
  'turned into',
  'discovered',
  'banned',
  'cloned',
  'teleported',
  'acquired',
  'merged with',
  'disrupted',
  'revolutionized',
  'teased',
  'confirmed',
  'denied',
  'explored',
  'patented',
  'leaked',
  'foreclosed',
  'sent to',
];

const OUTCOMES = [
  'sending shockwaves through markets',
  'raising eyebrows on Dalal Street',
  'changing the game forever',
  'breaking the internet',
  'defying all predictions',
  'shocking industry insiders',
  'making headlines worldwide',
  'becoming the talk of the town',
  'setting social media ablaze',
  'dividing expert opinion',
  'baffling scientists',
  'delighting fans',
  'outraging critics',
  'winning accolades',
  'triggering investigations',
];

const SENTIMENTS = ['BULLISH', 'BEARISH', 'NEUTRAL'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateNewsItem(): { content: string; sentiment: string } {
  const template = randomInt(0, 4);
  let content: string;

  switch (template) {
    case 0: {
      const celeb = randomChoice(CELEBRITIES);
      const place = randomChoice(PLACES);
      const action = randomChoice(ACTIONS);
      const obj = randomChoice(OBJECTS);
      content = `${celeb.name} and ${place.name} ${action} ${obj}`;
      break;
    }
    case 1: {
      const celeb = randomChoice(CELEBRITIES);
      const company = randomChoice(COMPANIES);
      const action = randomChoice(ACTIONS);
      const outcome = randomChoice(OUTCOMES);
      content = `${celeb.name} ${action} ${company.name}, ${outcome}`;
      break;
    }
    case 2: {
      const company1 = randomChoice(COMPANIES);
      const company2 = randomChoice(COMPANIES);
      const action = randomChoice(ACTIONS);
      content = `${company1.name} ${action} ${company2.name} in surprise move`;
      break;
    }
    case 3: {
      const place = randomChoice(PLACES);
      const action = randomChoice(ACTIONS);
      const obj = randomChoice(OBJECTS);
      const outcome = randomChoice(OUTCOMES);
      content = `${place.name} ${action} ${obj}, ${outcome}`;
      break;
    }
    case 4:
    default: {
      const celeb = randomChoice(CELEBRITIES);
      const place = randomChoice(PLACES);
      const company = randomChoice(COMPANIES);
      content = `${place.name} buzz: ${celeb.name} rumored to join ${company.name}`;
      break;
    }
  }

  const sentiment = randomChoice(SENTIMENTS);

  return {
    content,
    sentiment,
  };
}

export function generateMultipleNews(count: number = 5): { content: string; sentiment: string }[] {
  const news: { content: string; sentiment: string }[] = [];
  const usedContents = new Set<string>();

  let attempts = 0;
  while (news.length < count && attempts < count * 10) {
    attempts++;
    const item = generateNewsItem();
    if (!usedContents.has(item.content)) {
      usedContents.add(item.content);
      news.push(item);
    }
  }

  return news;
}

export async function generateAndStoreNews(round: number, count: number = 5) {
  const { prisma } = await import('../services/prisma.service');
  
  const newsItems = generateMultipleNews(count);
  
  const createdNews = [];
  
  for (const item of newsItems) {
    const news = await prisma.news.create({
      data: {
        content: item.content,
        sentiment: item.sentiment,
        type: 'GENERATED',
        isAdminNews: false,
        roundApplicable: round,
        forInsider: false,
        priceImpact: 0,
      },
    });
    createdNews.push(news);
  }

  return createdNews;
}

export function generatePreviewNews(count: number = 3): { content: string; sentiment: string }[] {
  return generateMultipleNews(count);
}
