export type LevelName = 'PRE' | 'BRONZ' | 'SILVER' | 'SILVER_ELITE' | 'GOLD' | 'ZAFFIRO' | 'DIAMANTE';

export interface Level {
  name: LevelName;
  label: string;
  dailyReturn: number;
  directReferrals: number;
  totalUnits: number;
  networkBonus: number;
  color: string;
}

export const LEVELS: Level[] = [
  { name: 'PRE', label: 'Pre-Qualifica', dailyReturn: 0.80, directReferrals: 0, totalUnits: 0, networkBonus: 0, color: 'muted-foreground' },
  { name: 'BRONZ', label: 'Bronz', dailyReturn: 1.0, directReferrals: 6, totalUnits: 6, networkBonus: 10, color: 'way-bronze' },
  { name: 'SILVER', label: 'Silver', dailyReturn: 2.0, directReferrals: 36, totalUnits: 36, networkBonus: 15, color: 'way-silver' },
  { name: 'SILVER_ELITE', label: 'Silver Elite', dailyReturn: 3.0, directReferrals: 216, totalUnits: 216, networkBonus: 20, color: 'way-silver-elite' },
  { name: 'GOLD', label: 'Gold', dailyReturn: 4.0, directReferrals: 1296, totalUnits: 1296, networkBonus: 20, color: 'way-gold' },
  { name: 'ZAFFIRO', label: 'Zaffiro', dailyReturn: 5.0, directReferrals: 7776, totalUnits: 7776, networkBonus: 25, color: 'way-sapphire' },
  { name: 'DIAMANTE', label: 'Diamante', dailyReturn: 6.0, directReferrals: 46656, totalUnits: 46656, networkBonus: 30, color: 'way-diamond' },
];

export interface UserData {
  username: string;
  level: LevelName;
  balance: number;
  dailyEarning: number;
  totalEarned: number;
  nextPayout: string;
  referralCode: string;
  directReferrals: number;
  totalNetwork: number;
  networkVolume: number;
}

export const mockUser: UserData = {
  username: 'CryptoMaster92',
  level: 'SILVER',
  balance: 2450.80,
  dailyEarning: 49.02,
  totalEarned: 1284.50,
  nextPayout: '2026-03-24T18:00:00',
  referralCode: 'WAY1-X7K9M2',
  directReferrals: 12,
  totalNetwork: 48,
  networkVolume: 24500,
};

export interface InvestmentPlan {
  id: string;
  name: string;
  duration: number;
  dailyReturn: number;
  minInvest: number;
  maxInvest: number;
  poolFilled: number;
  poolTotal: number;
  status: 'active' | 'inactive' | 'locked';
  minLevel: LevelName;
}

export const mockPlans: InvestmentPlan[] = [
  { id: 'p1', name: 'Conservative', duration: 7, dailyReturn: 0.6, minInvest: 50, maxInvest: 500, poolFilled: 34200, poolTotal: 50000, status: 'active', minLevel: 'PRE' },
  { id: 'p2', name: 'Stable', duration: 30, dailyReturn: 1.2, minInvest: 100, maxInvest: 5000, poolFilled: 128000, poolTotal: 200000, status: 'active', minLevel: 'BRONZ' },
  { id: 'p3', name: 'Growth', duration: 60, dailyReturn: 2.5, minInvest: 500, maxInvest: 25000, poolFilled: 450000, poolTotal: 500000, status: 'active', minLevel: 'SILVER' },
  { id: 'p4', name: 'Premium Elite', duration: 90, dailyReturn: 4.0, minInvest: 1000, maxInvest: 50000, poolFilled: 0, poolTotal: 1000000, status: 'locked', minLevel: 'GOLD' },
];

export interface ActiveInvestment {
  id: string;
  planName: string;
  amount: number;
  startDate: string;
  daysRemaining: number;
  earned: number;
  status: 'active' | 'completed' | 'pending';
}

export const mockActiveInvestments: ActiveInvestment[] = [
  { id: 'INV-001', planName: 'Stable', amount: 500, startDate: '2026-03-10', daysRemaining: 16, earned: 84.0, status: 'active' },
  { id: 'INV-002', planName: 'Conservative', amount: 200, startDate: '2026-03-20', daysRemaining: 3, earned: 4.8, status: 'active' },
  { id: 'INV-003', planName: 'Growth', amount: 1000, startDate: '2026-02-15', daysRemaining: 0, earned: 950.0, status: 'completed' },
];

export interface IncomeRecord {
  id: string;
  date: string;
  type: 'interest' | 'team' | 'bonus';
  amount: number;
}

export const mockIncomeRecords: IncomeRecord[] = [
  { id: 'r1', date: '2026-03-24', type: 'interest', amount: 12.50 },
  { id: 'r2', date: '2026-03-24', type: 'team', amount: 36.52 },
  { id: 'r3', date: '2026-03-23', type: 'interest', amount: 12.50 },
  { id: 'r4', date: '2026-03-23', type: 'bonus', amount: 100.00 },
  { id: 'r5', date: '2026-03-22', type: 'interest', amount: 12.50 },
  { id: 'r6', date: '2026-03-22', type: 'team', amount: 28.40 },
  { id: 'r7', date: '2026-03-21', type: 'interest', amount: 12.50 },
  { id: 'r8', date: '2026-03-20', type: 'interest', amount: 12.50 },
];

export const mockDailyIncome = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  interest: Math.round((8 + Math.random() * 10) * 100) / 100,
  team: Math.round((Math.random() * 40) * 100) / 100,
  bonus: i % 7 === 0 ? Math.round(Math.random() * 100 * 100) / 100 : 0,
}));

export interface SpecialFund {
  id: string;
  name: string;
  badge: 'Special Fund' | 'Cooperation Fund';
  totalReturn: number;
  duration: number;
  minInvest: number;
  maxInvest: number;
  raised: number;
  goal: number;
  openDate: string;
  closeDate: string;
  status: 'issuing' | 'upcoming' | 'sold_out' | 'ended';
}

export const mockFunds: SpecialFund[] = [
  { id: 'f1', name: 'Alpha Growth Fund', badge: 'Special Fund', totalReturn: 45, duration: 30, minInvest: 500, maxInvest: 10000, raised: 72000, goal: 100000, openDate: '2026-03-20', closeDate: '2026-04-20', status: 'issuing' },
  { id: 'f2', name: 'Omega Yield Pool', badge: 'Cooperation Fund', totalReturn: 80, duration: 60, minInvest: 1000, maxInvest: 50000, raised: 350000, goal: 500000, openDate: '2026-03-15', closeDate: '2026-05-15', status: 'issuing' },
  { id: 'f3', name: 'Beta Starter Fund', badge: 'Special Fund', totalReturn: 25, duration: 14, minInvest: 100, maxInvest: 2000, raised: 0, goal: 50000, openDate: '2026-04-01', closeDate: '2026-04-15', status: 'upcoming' },
  { id: 'f4', name: 'Genesis Pool', badge: 'Special Fund', totalReturn: 60, duration: 45, minInvest: 200, maxInvest: 5000, raised: 80000, goal: 80000, openDate: '2026-02-01', closeDate: '2026-03-17', status: 'sold_out' },
  { id: 'f5', name: 'Legacy Fund I', badge: 'Cooperation Fund', totalReturn: 120, duration: 90, minInvest: 5000, maxInvest: 100000, raised: 200000, goal: 200000, openDate: '2025-12-01', closeDate: '2026-03-01', status: 'ended' },
];

export interface WithdrawalRecord {
  id: string;
  date: string;
  amount: number;
  fee: number;
  net: number;
  type: 'fast' | 'medium' | 'slow';
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

export const mockWithdrawals: WithdrawalRecord[] = [
  { id: 'W-001', date: '2026-03-22', amount: 500, fee: 100, net: 400, type: 'fast', status: 'completed', txHash: '0x1a2b3c...' },
  { id: 'W-002', date: '2026-03-20', amount: 1000, fee: 100, net: 900, type: 'medium', status: 'completed', txHash: '0x4d5e6f...' },
  { id: 'W-003', date: '2026-03-24', amount: 200, fee: 10, net: 190, type: 'slow', status: 'pending' },
];

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  total: number;
  type: 'daily' | 'weekly';
  completed: boolean;
}

export const mockTasks: Task[] = [
  { id: 't1', title: 'Daily Login', description: 'Accedi alla piattaforma', reward: 0.5, progress: 1, total: 1, type: 'daily', completed: true },
  { id: 't2', title: 'Share Referral Link', description: 'Condividi il tuo link referral', reward: 1.0, progress: 0, total: 1, type: 'daily', completed: false },
  { id: 't3', title: 'Make a Deposit', description: 'Effettua un deposito di almeno 50 USDT', reward: 2.0, progress: 0, total: 1, type: 'daily', completed: false },
  { id: 't4', title: '7-Day Streak', description: 'Accedi per 7 giorni consecutivi', reward: 10.0, progress: 5, total: 7, type: 'weekly', completed: false },
  { id: 't5', title: 'Invite 3 Friends', description: 'Invita 3 amici questa settimana', reward: 15.0, progress: 1, total: 3, type: 'weekly', completed: false },
];

export interface NetworkNode {
  id: string;
  username: string;
  level: LevelName;
  joinDate: string;
  active: boolean;
  children?: NetworkNode[];
}

export const mockNetworkTree: NetworkNode = {
  id: 'u0',
  username: 'CryptoMaster92',
  level: 'SILVER',
  joinDate: '2026-01-15',
  active: true,
  children: [
    {
      id: 'u1', username: 'AlphaTrader', level: 'BRONZ', joinDate: '2026-02-01', active: true,
      children: [
        { id: 'u11', username: 'Nova99', level: 'PRE', joinDate: '2026-03-01', active: true, children: [] },
        { id: 'u12', username: 'CryptoKid', level: 'PRE', joinDate: '2026-03-05', active: false, children: [] },
      ]
    },
    {
      id: 'u2', username: 'BetaInvestor', level: 'PRE', joinDate: '2026-02-10', active: true,
      children: [
        { id: 'u21', username: 'LunaFi', level: 'PRE', joinDate: '2026-03-10', active: true, children: [] },
      ]
    },
    { id: 'u3', username: 'GammaHold', level: 'PRE', joinDate: '2026-02-15', active: true, children: [] },
    { id: 'u4', username: 'DeltaYield', level: 'BRONZ', joinDate: '2026-02-20', active: true, children: [] },
    { id: 'u5', username: 'EpsilonDev', level: 'PRE', joinDate: '2026-03-01', active: false, children: [] },
    { id: 'u6', username: 'ZetaPro', level: 'PRE', joinDate: '2026-03-05', active: true, children: [] },
  ]
};
