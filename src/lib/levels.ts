import type { Database } from '@/integrations/supabase/types';

export type LevelName = Database['public']['Enums']['level_name'];

/**
 * Static fallback used solo per UI (colori, label) prima che la tabella `levels`
 * venga caricata. La fonte di verità reale è la tabella `levels` su DB,
 * letta tramite `useLevels()` hook.
 */
export interface LevelStaticInfo {
  id: LevelName;
  label: string;
}

export const LEVEL_LABELS: Record<LevelName, string> = {
  gamma: 'Gamma Investitore',
  beta: 'Beta Investitore',
  bronze: 'Bronze Investitore',
  silver: 'Silver Investitore',
  silver_elite: 'Silver Elite',
  gold: 'Gold Investitore',
  gold_elite: 'Gold Elite',
  oro_vip: 'Oro VIP',
};

export const LEVEL_ORDER: LevelName[] = ['gamma', 'beta', 'bronze', 'silver', 'silver_elite', 'gold', 'gold_elite', 'oro_vip'];

export function getLevelLabel(name: LevelName): string {
  return LEVEL_LABELS[name] ?? name;
}

export function getLevelOrder(name: LevelName): number {
  return LEVEL_ORDER.indexOf(name) + 1;
}

export function getLevelColorClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    gamma: 'text-muted-foreground',
    beta: 'text-way-sapphire',
    bronze: 'text-way-bronze',
    silver: 'text-way-silver',
    silver_elite: 'text-way-silver-elite',
    gold: 'text-way-gold',
    gold_elite: 'text-way-glow',
    oro_vip: 'text-way-diamond',
  };
  return colorMap[name] ?? 'text-muted-foreground';
}

export function getLevelBgClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    gamma: 'bg-muted border-border',
    beta: 'bg-way-sapphire/20 border-way-sapphire/30',
    bronze: 'bg-way-bronze/20 border-way-bronze/30',
    silver: 'bg-way-silver/20 border-way-silver/30',
    silver_elite: 'bg-way-silver-elite/20 border-way-silver-elite/30',
    gold: 'bg-way-gold/20 border-way-gold/30',
    gold_elite: 'bg-way-glow/20 border-way-glow/30',
    oro_vip: 'bg-way-diamond/20 border-way-diamond/30',
  };
  return colorMap[name] ?? 'bg-muted';
}
