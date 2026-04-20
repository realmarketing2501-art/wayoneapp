import type { LevelConfig } from '@/hooks/useLevels';
import type { LevelName } from '@/lib/levels';

/**
 * Formule di calcolo "Way One Qualifiche" — fonte unica di verità per l'UI.
 * La logica server-side equivalente vive nelle RPC `create_investment` e
 * `daily-returns` edge function.
 */

export type Duration = 45 | 90;

export function dailyReturn(capital: number, dailyPct: number): number {
  return capital * (dailyPct / 100);
}

export function totalReturn(capital: number, dailyPct: number, days: number): number {
  return dailyReturn(capital, dailyPct) * days;
}

export function productionBonus(production: number, bonusPct: number): number {
  return production * (bonusPct / 100);
}

export function getDailyRateForLevel(level: LevelConfig | undefined, duration: Duration): number | null {
  if (!level) return null;
  return duration === 45 ? level.giornaliero_45 : level.giornaliero_90;
}

export function isDurationAvailable(level: LevelConfig | undefined, duration: Duration): boolean {
  return getDailyRateForLevel(level, duration) !== null;
}

export interface LevelProgress {
  current: LevelConfig;
  next: LevelConfig | null;
  unitsMissing: number;
  productionMissing: number;
  unitsPct: number;        // 0-100
  productionPct: number;   // 0-100
  overallPct: number;      // min between units & production %
}

export function computeProgress(
  levels: LevelConfig[],
  currentLevelId: LevelName,
  units: number,
  production: number,
): LevelProgress | null {
  const current = levels.find((l) => l.id === currentLevelId);
  if (!current) return null;

  const next = current.prossimo_livello
    ? levels.find((l) => l.id === current.prossimo_livello) ?? null
    : null;

  if (!next || next.unita_richieste === null || next.produzione_richiesta === null) {
    return { current, next, unitsMissing: 0, productionMissing: 0, unitsPct: 100, productionPct: 100, overallPct: 100 };
  }

  const unitsMissing = Math.max(0, next.unita_richieste - units);
  const productionMissing = Math.max(0, Number(next.produzione_richiesta) - production);
  const unitsPct = Math.min(100, (units / next.unita_richieste) * 100);
  const productionPct = Math.min(100, (production / Number(next.produzione_richiesta)) * 100);

  return {
    current,
    next,
    unitsMissing,
    productionMissing,
    unitsPct,
    productionPct,
    overallPct: Math.min(unitsPct, productionPct),
  };
}
