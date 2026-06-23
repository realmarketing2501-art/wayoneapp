import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReferralNode {
  id: string;
  user_id: string;
  username: string;
  level: string;
  has_confirmed_deposit: boolean;
  created_at: string;
  direct_referrals: number;
  referred_by_username: string | null;
  active_investments: number;
  total_invested: number;
  total_earned: number;
  children: ReferralNode[];
}

export function useReferralTree() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-tree', user?.id],
    queryFn: async (): Promise<ReferralNode[]> => {
      if (!user) return [];

      // Fetch only the caller's downline via security-definer RPC.
      const { data: rows, error } = await supabase.rpc('get_referral_tree', { max_depth: 6 });
      if (error) throw error;
      if (!rows) return [];

      type Row = (typeof rows)[number];
      const byParent = new Map<string, Row[]>();
      for (const r of rows as Row[]) {
        const key = (r.referred_by as string) ?? '__root__';
        const arr = byParent.get(key) ?? [];
        arr.push(r);
        byParent.set(key, arr);
      }

      // Find roots: rows whose parent is not in the result set (i.e. direct children of caller).
      const allIds = new Set((rows as Row[]).map((r) => r.id as string));
      const roots = (rows as Row[]).filter((r) => !r.referred_by || !allIds.has(r.referred_by as string));

      const buildChildren = (parentId: string): ReferralNode[] =>
        (byParent.get(parentId) ?? []).map((p) => ({
          id: p.id as string,
          user_id: p.user_id as string,
          username: p.username as string,
          level: p.level as string,
          has_confirmed_deposit: !!p.has_confirmed_deposit,
          created_at: p.created_at as string,
          direct_referrals: (p.direct_referrals as number) ?? 0,
          referred_by_username: ((p as Record<string, unknown>).referred_by_username as string | null) ?? null,
          active_investments: Number((p as Record<string, unknown>).active_investments ?? 0),
          total_invested: Number((p as Record<string, unknown>).total_invested ?? 0),
          total_earned: Number((p as Record<string, unknown>).total_earned ?? 0),
          children: buildChildren(p.id as string),
        }));

      return roots.map((p) => ({
        id: p.id as string,
        user_id: p.user_id as string,
        username: p.username as string,
        level: p.level as string,
        has_confirmed_deposit: !!p.has_confirmed_deposit,
        created_at: p.created_at as string,
        direct_referrals: (p.direct_referrals as number) ?? 0,
        referred_by_username: ((p as Record<string, unknown>).referred_by_username as string | null) ?? null,
        active_investments: Number((p as Record<string, unknown>).active_investments ?? 0),
        total_invested: Number((p as Record<string, unknown>).total_invested ?? 0),
        total_earned: Number((p as Record<string, unknown>).total_earned ?? 0),
        children: buildChildren(p.id as string),
      }));
    },
    enabled: !!user,
  });
}
