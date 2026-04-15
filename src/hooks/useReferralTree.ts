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
  children: ReferralNode[];
}

export function useReferralTree() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-tree', user?.id],
    queryFn: async (): Promise<ReferralNode[]> => {
      if (!user) return [];

      // Get current user's profile id
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) return [];

      // Fetch all profiles that are in the user's downline (up to 3 levels deep)
      // We fetch all profiles and build the tree client-side
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, level, has_confirmed_deposit, created_at, direct_referrals, referred_by');

      if (error || !allProfiles) return [];

      // Build tree recursively
      const buildChildren = (parentId: string, depth: number): ReferralNode[] => {
        if (depth > 6) return []; // max depth
        return allProfiles
          .filter((p) => p.referred_by === parentId)
          .map((p) => ({
            id: p.id,
            user_id: p.user_id,
            username: p.username,
            level: p.level,
            has_confirmed_deposit: p.has_confirmed_deposit,
            created_at: p.created_at,
            direct_referrals: p.direct_referrals,
            children: buildChildren(p.id, depth + 1),
          }));
      };

      return buildChildren(myProfile.id, 0);
    },
    enabled: !!user,
  });
}
