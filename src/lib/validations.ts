import { z } from 'zod';
import type { LevelConfig } from '@/hooks/useLevels';
import type { Duration } from '@/lib/calculations';

/**
 * Validazione client-side dell'investimento secondo lo schema "Way One Qualifiche".
 * La validazione server-side corrispondente è nella RPC `create_investment`.
 */

export interface InvestmentValidationInput {
  level: LevelConfig | undefined;
  amount: number;
  duration: Duration;
  availableBalance: number;
}

export interface InvestmentValidationResult {
  ok: boolean;
  error?: string;
}

export function validateInvestment(input: InvestmentValidationInput): InvestmentValidationResult {
  const { level, amount, duration, availableBalance } = input;

  if (!level) {
    return { ok: false, error: 'Configurazione livello non disponibile' };
  }

  if (!amount || amount <= 0 || Number.isNaN(amount)) {
    return { ok: false, error: 'Importo non valido' };
  }

  if (![45, 90].includes(duration)) {
    return { ok: false, error: 'Durata non valida: scegli 45 o 90 giorni' };
  }

  // Gamma: importo 50–100, solo 45gg
  if (level.id === 'gamma') {
    if (duration !== 45) {
      return { ok: false, error: 'Per Gamma è disponibile solo il piano a 45 giorni' };
    }
    const min = level.investimento_min ?? 50;
    const max = level.investimento_max ?? 100;
    if (amount < min || amount > max) {
      return { ok: false, error: `Per Gamma l'investimento deve essere compreso tra ${min} e ${max} USDT` };
    }
  }

  // Beta: max 100, solo 45gg
  if (level.id === 'beta') {
    if (duration !== 45) {
      return { ok: false, error: 'Per Beta è disponibile solo il piano a 45 giorni' };
    }
    const max = level.investimento_max ?? 100;
    if (amount > max) {
      return { ok: false, error: `Per Beta l'investimento massimo è ${max} USDT` };
    }
  }

  // Tutti: durata deve essere supportata dal livello
  const rate = duration === 45 ? level.giornaliero_45 : level.giornaliero_90;
  if (rate === null) {
    return { ok: false, error: `Questo livello non prevede il piano a ${duration} giorni` };
  }

  if (amount > availableBalance) {
    return { ok: false, error: `Saldo insufficiente: hai ${availableBalance.toFixed(2)} USDT disponibili` };
  }

  return { ok: true };
}

export const investmentSchema = z.object({
  amount: z.number().positive('Importo deve essere positivo').finite('Importo non valido'),
  duration: z.union([z.literal(45), z.literal(90)]),
  planId: z.string().uuid(),
});
