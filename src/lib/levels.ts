import type { Database } from '@/integrations/supabase/types';

export type LevelName = Database['public']['Enums']['level_name'];

export interface LevelInfo {
  name: LevelName;
  label: string;
  dailyReturn: number;
  directReferrals: number;
  totalUnits: number;
  networkBonus: number;
}

export const LEVELS: LevelInfo[] = [
  { name: 'PRE', label: 'Pre-Qualifica', dailyReturn: 0.80, directReferrals: 0, totalUnits: 0, networkBonus: 0 },
  { name: 'BRONZ', label: 'Bronz', dailyReturn: 1.0, directReferrals: 6, totalUnits: 6, networkBonus: 10 },
  { name: 'SILVER', label: 'Silver', dailyReturn: 2.0, directReferrals: 36, totalUnits: 36, networkBonus: 15 },
  { name: 'SILVER_ELITE', label: 'Silver Elite', dailyReturn: 3.0, directReferrals: 216, totalUnits: 216, networkBonus: 20 },
  { name: 'GOLD', label: 'Gold', dailyReturn: 4.0, directReferrals: 1296, totalUnits: 1296, networkBonus: 20 },
  { name: 'ZAFFIRO', label: 'Zaffiro', dailyReturn: 5.0, directReferrals: 7776, totalUnits: 7776, networkBonus: 25 },
  { name: 'DIAMANTE', label: 'Diamante', dailyReturn: 6.0, directReferrals: 46656, totalUnits: 46656, networkBonus: 30 },
];

export function getLevelInfo(name: LevelName): LevelInfo {
  return LEVELS.find(l => l.name === name) || LEVELS[0];
}

export function getLevelColorClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    PRE: 'text-muted-foreground',
    BRONZ: 'text-way-bronze',
    SILVER: 'text-way-silver',
    SILVER_ELITE: 'text-way-silver-elite',
    GOLD: 'text-way-gold',
    ZAFFIRO: 'text-way-sapphire',
    DIAMANTE: 'text-way-diamond',
  };
  return colorMap[name];
}

export function getLevelBgClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    PRE: 'bg-muted',
    BRONZ: 'bg-way-bronze/20 border-way-bronze/30',
    SILVER: 'bg-way-silver/20 border-way-silver/30',
    SILVER_ELITE: 'bg-way-silver-elite/20 border-way-silver-elite/30',
    GOLD: 'bg-way-gold/20 border-way-gold/30',
    ZAFFIRO: 'bg-way-sapphire/20 border-way-sapphire/30',
    DIAMANTE: 'bg-way-diamond/20 border-way-diamond/30',
  };
  return colorMap[name];
}
