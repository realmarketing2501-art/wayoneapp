import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LevelName } from '@/lib/levels';

export interface LevelConfig {
  id: LevelName;
  name: string;
  ordine: number;
  unita_richieste: number | null;
  produzione_richiesta: number | null;
  bonus_percentuale: number;
  bonus_valore: number;
  giornaliero_45: number | null;
  giornaliero_90: number | null;
  investimento_min: number | null;
  investimento_max: number | null;
  rete: boolean;
  note: string | null;
  prossimo_livello: LevelName | null;
}

/**
 * Fonte di verità per la configurazione dei livelli "Way One Qualifiche".
 * Letta dalla tabella `levels` su DB.
 */
export function useLevels() {
  return useQuery({
    queryKey: ['levels'],
    queryFn: async (): Promise<LevelConfig[]> => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('ordine', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LevelConfig[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLevel(id: LevelName | undefined) {
  const { data: levels } = useLevels();
  return levels?.find((l) => l.id === id);
}
