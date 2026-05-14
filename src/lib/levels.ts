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
  gamma: 'Starter',
  beta: 'Silver',
  bronze: 'Gold',
  silver: 'Platinum',
  silver_elite: 'Platinum Elite',
  gold: 'Diamond',
  gold_elite: 'Diamond Elite',
  oro_vip: 'VIP',
};

export const LEVEL_ORDER: LevelName[] = ['gamma', 'beta', 'bronze', 'silver', 'silver_elite', 'gold', 'gold_elite', 'oro_vip'];

export function getLevelLabel(name: LevelName): string {
  return LEVEL_LABELS[name] ?? name;
}

export function getLevelOrder(name: LevelName): number {
  return LEVEL_ORDER.indexOf(name) + 1;
}

/**
 * Color mapping per livello (Starter → VIP).
 * Usa i token semantici way-* già definiti in tailwind.config.ts.
 */
export function getLevelColorClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    gamma: 'text-muted-foreground',          // Starter
    beta: 'text-way-sapphire',               // Silver
    bronze: 'text-way-bronze',               // Gold
    silver: 'text-way-silver-elite',         // Platinum
    silver_elite: 'text-way-silver-elite',   // Platinum Elite
    gold: 'text-way-glow',                   // Diamond
    gold_elite: 'text-way-glow',             // Diamond Elite
    oro_vip: 'text-way-diamond',             // VIP
  };
  return colorMap[name] ?? 'text-muted-foreground';
}

export function getLevelBgClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    gamma: 'bg-muted border-border',
    beta: 'bg-way-sapphire/20 border-way-sapphire/40',
    bronze: 'bg-way-bronze/20 border-way-bronze/40',
    silver: 'bg-way-silver-elite/20 border-way-silver-elite/50',
    silver_elite: 'bg-way-silver-elite/20 border-way-silver-elite/50',
    gold: 'bg-way-glow/25 border-way-glow/60',
    gold_elite: 'bg-way-glow/25 border-way-glow/60',
    oro_vip: 'bg-way-diamond/25 border-way-diamond/60',
  };
  return colorMap[name] ?? 'bg-muted';
}

/**
 * Tier helpers per la Home redesign.
 * Mappa ogni livello al rango, all'icona Lucide e a una classe colore.
 */
import type { LucideIcon } from 'lucide-react';
import { Sparkles, Coins, Gem, Crown, Trophy, Star } from 'lucide-react';

export interface LevelRank {
  rank: number;        // 1..6
  icon: LucideIcon;
  textClass: string;
  ringClass: string;
  bgClass: string;
}

export function getLevelRank(name: LevelName): LevelRank {
  const map: Record<LevelName, LevelRank> = {
    gamma:        { rank: 1, icon: Sparkles, textClass: 'text-stone-400',   ringClass: 'ring-stone-500/40',   bgClass: 'bg-stone-900/40' },
    beta:         { rank: 2, icon: Coins,    textClass: 'text-sky-300',     ringClass: 'ring-sky-500/40',     bgClass: 'bg-sky-950/40' },
    bronze:       { rank: 3, icon: Trophy,   textClass: 'text-amber-700',   ringClass: 'ring-amber-700/50',   bgClass: 'bg-amber-950/40' },
    silver:       { rank: 4, icon: Star,     textClass: 'text-amber-200',   ringClass: 'ring-amber-300/60',   bgClass: 'bg-amber-900/30' },
    silver_elite: { rank: 4, icon: Star,     textClass: 'text-amber-200',   ringClass: 'ring-amber-300/60',   bgClass: 'bg-amber-900/30' },
    gold:         { rank: 5, icon: Gem,      textClass: 'text-amber-300',   ringClass: 'ring-amber-300/80',   bgClass: 'bg-amber-800/40' },
    gold_elite:   { rank: 5, icon: Gem,      textClass: 'text-amber-300',   ringClass: 'ring-amber-300/80',   bgClass: 'bg-amber-800/40' },
    oro_vip:      { rank: 6, icon: Crown,    textClass: 'text-fuchsia-300', ringClass: 'ring-fuchsia-400/70', bgClass: 'bg-fuchsia-950/40' },
  };
  return map[name] ?? map.gamma;
}

