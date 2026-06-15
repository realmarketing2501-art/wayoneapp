import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDemoMode() {
  return useQuery({
    queryKey: ['demo_mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'demo_mode')
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? 'false') === 'true';
    },
    staleTime: 30_000,
  });
}
