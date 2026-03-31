import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LevelConfig {
  name: string;
  label: string;
  rate: number;
  order: number;
  active: boolean;
}

export interface WithdrawalConfig {
  key: string;
  label: string;
  hours: number;
  fee_pct: number;
  active: boolean;
}

function useAdminSettingPublic<T>(key: string, fallback: T) {
  return useQuery({
    queryKey: ['admin_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single();
      if (error) return fallback;
      try { return JSON.parse(data.value) as T; } catch { return fallback; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

const DEFAULT_LEVELS: LevelConfig[] = [
  { name: 'BRONZ', label: 'Bronz', rate: 1.0, order: 1, active: true },
  { name: 'SILVER', label: 'Silver', rate: 2.0, order: 2, active: true },
  { name: 'SILVER_ELITE', label: 'Silver Elite', rate: 3.0, order: 3, active: true },
  { name: 'GOLD', label: 'Gold', rate: 4.0, order: 4, active: true },
  { name: 'DIAMANTE', label: 'Diamante', rate: 5.0, order: 5, active: true },
];

const DEFAULT_WITHDRAWALS: WithdrawalConfig[] = [
  { key: 'fast', label: 'Veloce', hours: 24, fee_pct: 20, active: true },
  { key: 'medium', label: 'Medio', hours: 48, fee_pct: 10, active: true },
  { key: 'slow', label: 'Lento', hours: 72, fee_pct: 5, active: true },
];

export function useLevelConfig() {
  return useAdminSettingPublic<LevelConfig[]>('level_config', DEFAULT_LEVELS);
}

export function useWithdrawalConfig() {
  return useAdminSettingPublic<WithdrawalConfig[]>('withdrawal_config', DEFAULT_WITHDRAWALS);
}
