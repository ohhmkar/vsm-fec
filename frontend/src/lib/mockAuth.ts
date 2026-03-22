import { User } from '@/types';

export interface MockCredentials {
  email: string;
  password: string;
  user: User;
}

export const MOCK_USERS: MockCredentials[] = [
  {
    email: 'demo@fec.com',
    password: 'demo1234',
    user: {
      id: 'usr_demo_001',
      email: 'demo@fec.com',
      name: 'Demo Trader',
      memberSince: '2025-01-15',
    },
  },
  {
    email: 'trader@fec.com',
    password: 'trader1234',
    user: {
      id: 'usr_trader_002',
      email: 'trader@fec.com',
      name: 'Alex Morgan',
      memberSince: '2025-03-01',
    },
  },
  {
    email: 'admin@fec.com',
    password: 'admin1234',
    user: {
      id: 'usr_admin_003',
      email: 'admin@fec.com',
      name: 'Jordan Blake',
      memberSince: '2024-11-20',
    },
  },
];

export function authenticateUser(email: string, password: string): User | null {
  const match = MOCK_USERS.find(
    (u) => u.email === email && u.password === password
  );
  return match ? match.user : null;
}
