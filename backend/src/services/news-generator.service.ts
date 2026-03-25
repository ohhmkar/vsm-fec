const CELEBRITIES = [
  { name: 'Sandeep Menon', sector: 'Tech/Auto' },
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
  { name: 'Elon Musk', sector: 'Tech/Space' },
  { name: 'Alia Bhatt', sector: 'Entertainment' },
  { name: 'Ranveer Singh', sector: 'Entertainment' },
  { name: 'Jeff Bezos', sector: 'Business' },
  { name: 'Emma Watson', sector: 'Entertainment' },
  { name: 'Lionel Messi', sector: 'Sports' },
  { name: 'Kylian Mbappé', sector: 'Sports' },
  { name: 'Deepika Padukone', sector: 'Entertainment' },
  { name: 'Tim Cook', sector: 'Tech' },
  { name: 'Satya Nadella', sector: 'Tech' },
  { name: 'Greta Thunberg', sector: 'Activism' },
  { name: 'Rihanna', sector: 'Music/Business' },
  { name: 'Drake', sector: 'Music' },
  { name: 'PewDiePie', sector: 'Internet' },
  { name: 'Anushka Sharma', sector: 'Entertainment' },
  { name: 'Hardik Pandya', sector: 'Sports' },
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
  { name: 'Las Vegas', type: 'City' },
  { name: 'Himalayas', type: 'Mountain Range' },
  { name: 'New York', type: 'City' },
  { name: 'Black Hole', type: 'Space' },
  { name: 'Bermuda Triangle', type: 'Mystery' },
  { name: 'Great Wall of China', type: 'Landmark' },
  { name: 'Venice', type: 'City' },
  { name: 'Amazon Rainforest', type: 'Location' },
  { name: 'Seoul', type: 'City' },
  { name: 'Neptune', type: 'Space' },
  { name: 'Chernobyl', type: 'Historical Site' },
  { name: 'Hollywood', type: 'Entertainment Hub' },
  { name: 'Goa', type: 'Location' },
  { name: 'Switzerland', type: 'Country' },
  { name: 'Singapore', type: 'City' },
  { name: 'Maldives', type: 'Location' },
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
  { name: 'Meta', sector: 'Tech' },
  { name: 'Adobe', sector: 'Software' },
  { name: 'Uber', sector: 'Transport' },
  { name: 'Airbnb', sector: 'Hospitality' },
  { name: 'Byju’s', sector: 'EdTech' },
  { name: 'Zomato', sector: 'Food Tech' },
  { name: 'Swiggy', sector: 'Food Tech' },
  { name: 'Intel', sector: 'Tech' },
  { name: 'AMD', sector: 'Tech' },
  { name: 'Tata Group', sector: 'Conglomerate' },
  { name: 'Infosys', sector: 'Tech' },
  { name: 'Paytm', sector: 'Fintech' },
  { name: 'Spotify', sector: 'Media' },
  { name: 'Snapchat', sector: 'Social Media' },
  { name: 'Discord', sector: 'Communication' },
  { name: 'Red Bull', sector: 'Energy/Media' },
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
  'AI-generated politician',
  'self-cooking meal',
  'gravity switch',
  'telepathic headset',
  'infinite battery phone',
  'robot butler',
  'hacker-proof laptop',
  'emotion detector',
  'dream recorder',
  'portable black hole',
  'anti-aging serum',
  'smart mirror',
  'voice cloning device',
  'parallel universe portal',
  'digital soul backup',
  'hoverboard',
  'DNA editor',
  'mind control chip',
  'weather machine',
  'invisibility cloak',
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
  'accidentally deleted',
  'reverse engineered',
  'auctioned off',
  'mass produced',
  'recalled',
  'weaponized',
  'open-sourced',
  'crowdfunded',
  'misplaced',
  'live-streamed',
  'rebranded',
  'outsourced',
  'fast-tracked',
  'blacklisted',
  'whistleblowed',
  'test-launched',
  'beta tested',
  'scrapped',
  'revived',
  'upgraded',
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
  'causing global confusion',
  'sparking meme wars',
  'crashing multiple servers',
  'forcing emergency meetings',
  'sending stocks into chaos',
  'creating overnight millionaires',
  'triggering worldwide debates',
  'breaking all previous records',
  'causing unexpected alliances',
  'leading to bizarre conspiracy theories',
  'inspiring a new startup wave',
  'resulting in mass panic',
  'leading to government bans',
  'going viral instantly',
  'creating history overnight',
];

const SENTIMENTS = ['BULLISH', 'BEARISH', 'NEUTRAL'];

// Import real market news
let marketNewsModule: any = null;
async function getMarketNewsModule() {
  if (!marketNewsModule) {
    marketNewsModule = await import('./market-news.service');
  }
  return marketNewsModule;
}

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
      case 5: {
  const celeb = randomChoice(CELEBRITIES);
  const obj = randomChoice(OBJECTS);
  const outcome = randomChoice(OUTCOMES);
  content = `${celeb.name} unveils ${obj}, ${outcome}`;
  break;
}

case 6: {
  const company = randomChoice(COMPANIES);
  const obj = randomChoice(OBJECTS);
  const action = randomChoice(ACTIONS);
  content = `${company.name} ${action} a new ${obj}`;
  break;
}

case 7: {
  const celeb1 = randomChoice(CELEBRITIES);
  const celeb2 = randomChoice(CELEBRITIES);
  const action = randomChoice(ACTIONS);
  const outcome = randomChoice(OUTCOMES);
  content = `${celeb1.name} ${action} ${celeb2.name}, ${outcome}`;
  break;
}

case 8: {
  const place = randomChoice(PLACES);
  const company = randomChoice(COMPANIES);
  const action = randomChoice(ACTIONS);
  content = `${company.name} ${action} operations in ${place.name}`;
  break;
}

case 9: {
  const obj = randomChoice(OBJECTS);
  const place = randomChoice(PLACES);
  const outcome = randomChoice(OUTCOMES);
  content = `${obj} spotted in ${place.name}, ${outcome}`;
  break;
}

case 10: {
  const celeb = randomChoice(CELEBRITIES);
  const company = randomChoice(COMPANIES);
  const place = randomChoice(PLACES);
  content = `${celeb.name} seen at ${company.name} HQ in ${place.name}`;
  break;
}

case 11: {
  const company1 = randomChoice(COMPANIES);
  const company2 = randomChoice(COMPANIES);
  const outcome = randomChoice(OUTCOMES);
  content = `${company1.name} vs ${company2.name}: battle intensifies, ${outcome}`;
  break;
}

case 12: {
  const place = randomChoice(PLACES);
  const celeb = randomChoice(CELEBRITIES);
  const obj = randomChoice(OBJECTS);
  content = `${place.name} witnesses ${celeb.name} testing ${obj}`;
  break;
}

case 13: {
  const celeb = randomChoice(CELEBRITIES);
  const action = randomChoice(ACTIONS);
  const outcome = randomChoice(OUTCOMES);
  content = `BREAKING: ${celeb.name} ${action} something big, ${outcome}`;
  break;
}

case 14: {
  const company = randomChoice(COMPANIES);
  const action = randomChoice(ACTIONS);
  const obj = randomChoice(OBJECTS);
  const outcome = randomChoice(OUTCOMES);
  content = `${company.name} ${action} ${obj}, ${outcome}`;
  break;
}
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
