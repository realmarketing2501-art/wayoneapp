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
  gamma: 'Mozzo',
  beta: 'Marinaio',
  bronze: 'Nostromo',
  silver: 'Capitano',
  silver_elite: 'Capitano',
  gold: 'Ammiraglio',
  gold_elite: 'Ammiraglio',
  oro_vip: 'Re dei Mari',
};

export const LEVEL_ORDER: LevelName[] = ['gamma', 'beta', 'bronze', 'silver', 'silver_elite', 'gold', 'gold_elite', 'oro_vip'];

export function getLevelLabel(name: LevelName): string {
  return LEVEL_LABELS[name] ?? name;
}

export function getLevelOrder(name: LevelName): number {
  return LEVEL_ORDER.indexOf(name) + 1;
}

/**
 * Pirate-tier color mapping (Mozzo → Re dei Mari).
 * Usa i token semantici way-* già definiti in tailwind.config.ts.
 */
export function getLevelColorClass(name: LevelName): string {
  const colorMap: Record<LevelName, string> = {
    gamma: 'text-muted-foreground',          // Mozzo
    beta: 'text-way-sapphire',               // Marinaio
    bronze: 'text-way-bronze',               // Nostromo
    silver: 'text-way-silver-elite',         // Capitano
    silver_elite: 'text-way-silver-elite',   // Capitano
    gold: 'text-way-glow',                   // Ammiraglio
    gold_elite: 'text-way-glow',             // Ammiraglio
    oro_vip: 'text-way-diamond',             // Re dei Mari
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
 * Pirate-tier helpers for the Home redesign.
 * Mappa ogni livello al rango pirata, all'icona Lucide e a una classe colore "ink/pergamena".
 */
import type { LucideIcon } from 'lucide-react';
import { Anchor, Sailboat, Ship, Compass, Crown, Skull } from 'lucide-react';

export interface PirateRank {
  rank: number;        // 1..8
  icon: LucideIcon;
  textClass: string;   // amber/gold scale per rank
  ringClass: string;
  bgClass: string;
}

export function getPirateRank(name: LevelName): PirateRank {
  const map: Record<LevelName, PirateRank> = {
    gamma:        { rank: 1, icon: Anchor,   textClass: 'text-stone-400',  ringClass: 'ring-stone-500/40',  bgClass: 'bg-stone-900/40' },
    beta:         { rank: 2, icon: Sailboat, textClass: 'text-sky-300',    ringClass: 'ring-sky-500/40',    bgClass: 'bg-sky-950/40' },
    bronze:       { rank: 3, icon: Ship,     textClass: 'text-amber-700',  ringClass: 'ring-amber-700/50',  bgClass: 'bg-amber-950/40' },
    silver:       { rank: 4, icon: Compass,  textClass: 'text-amber-200',  ringClass: 'ring-amber-300/60',  bgClass: 'bg-amber-900/30' },
    silver_elite: { rank: 4, icon: Compass,  textClass: 'text-amber-200',  ringClass: 'ring-amber-300/60',  bgClass: 'bg-amber-900/30' },
    gold:         { rank: 5, icon: Crown,    textClass: 'text-amber-300',  ringClass: 'ring-amber-300/80',  bgClass: 'bg-amber-800/40' },
    gold_elite:   { rank: 5, icon: Crown,    textClass: 'text-amber-300',  ringClass: 'ring-amber-300/80',  bgClass: 'bg-amber-800/40' },
    oro_vip:      { rank: 6, icon: Skull,    textClass: 'text-fuchsia-300',ringClass: 'ring-fuchsia-400/70',bgClass: 'bg-fuchsia-950/40' },
  };
  return map[name] ?? map.gamma;
}
