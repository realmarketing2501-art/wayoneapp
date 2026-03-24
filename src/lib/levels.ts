import { LEVELS, type LevelName } from '@/data/mockData';

export function getLevelInfo(name: LevelName) {
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
