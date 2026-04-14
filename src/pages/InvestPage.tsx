import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/LevelBadge';
import { useProfile } from '@/hooks/useProfile';
import { getLevelInfo } from '@/lib/levels';
import { Lock, TrendingUp, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function InvestPage() {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [investAmount, setInvestAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const level = profile?.level ?? 'PRE';
  const levelInfo = getLevelInfo(level);

  const { data: plans = [] } = useQuery({
    queryKey: ['investment_plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('investment_plans').select('*').order('daily_return');
      if (error) throw error;
      return data;
    },
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const investMutation = useMutation({
    mutationFn: async ({ planId, planName, amount, duration }: { planId: string; planName: string; amount: number; duration: number }) => {
      const { data, error } = await supabase.rpc('create_investment', {
        p_user_id: user!.id,
        p_plan_id: planId,
        p_plan_name: planName,
        p_amount: amount,
        p_duration: duration,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Investimento creato!', description: 'Il tuo investimento è stato registrato e il saldo aggiornato.' });
      setSelectedPlan(null);
      setInvestAmount('');
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const handleInvest = (plan: typeof plans[0]) => {
    const amount = parseFloat(investAmount);
    if (!amount || amount < Number(plan.min_invest) || amount > Number(plan.max_invest)) {
      toast({ title: 'Importo non valido', description: `Min ${plan.min_invest} — Max ${plan.max_invest} USDT`, variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Accedi per investire', variant: 'destructive' });
      return;
    }
    const available = Number(profile?.balance_available ?? 0);
    if (amount > available) {
      toast({ title: 'Saldo insufficiente', description: `Hai ${available.toFixed(2)} USDT disponibili. Deposita prima di investire.`, variant: 'destructive' });
      return;
    }
    investMutation.mutate({ planId: plan.id, planName: plan.name, amount, duration: plan.duration });
  };

  return (
    <div className="space-y-5 p-4">
      {/* Level card */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">Il tuo livello</p>
            <p className="font-display text-lg font-bold text-foreground sm:text-xl">{levelInfo.label}</p>
            <p className="text-sm text-primary">{levelInfo.dailyReturn}% rendimento giornaliero</p>
          </div>
          <LevelBadge level={level} size="sm" />
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="mb-3 font-display text-base font-semibold sm:text-lg">Piani di Investimento</h3>
        <div className="space-y-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.status === 'locked' ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-semibold text-foreground truncate">{plan.name}</h4>
                      {plan.status === 'locked' && <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {plan.duration}gg</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {plan.daily_return}%/giorno</span>
                    </div>
                  </div>
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
                    {plan.status === 'active' ? 'Attivo' : plan.status === 'locked' ? 'Bloccato' : 'Inattivo'}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{plan.min_invest}–{Number(plan.max_invest).toLocaleString()} USDT</span>
                    <span>{Math.round(Number(plan.pool_filled) / Number(plan.pool_total) * 100)}% pool</span>
                  </div>
                  <Progress value={Number(plan.pool_filled) / Number(plan.pool_total) * 100} className="mt-1 h-2" />
                </div>
                <Dialog open={selectedPlan === plan.id} onOpenChange={(open) => { setSelectedPlan(open ? plan.id : null); setInvestAmount(''); }}>
                  <DialogTrigger asChild>
                    <Button className="mt-3 w-full" size="sm" disabled={plan.status !== 'active'}>
                      {plan.status === 'locked' ? `Richiede ${plan.min_level}` : 'Investi Ora'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader><DialogTitle>Investi in {plan.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Range: {plan.min_invest} – {Number(plan.max_invest).toLocaleString()} USDT</p>
                      <Input type="number" placeholder="Importo USDT" value={investAmount} onChange={e => setInvestAmount(e.target.value)} />
                      <Button className="w-full" onClick={() => handleInvest(plan)} disabled={investMutation.isPending}>
                        {investMutation.isPending ? 'Creazione...' : 'Conferma Investimento'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nessun piano disponibile</p>}
        </div>
      </div>

      {/* My investments - mobile friendly cards instead of table */}
      {user && investments.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-base font-semibold sm:text-lg">I Miei Investimenti</h3>
          <div className="space-y-2">
            {investments.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.plan_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.amount} USDT · {inv.days_remaining > 0 ? `${inv.days_remaining}gg restanti` : 'Completato'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-primary">+{Number(inv.earned).toFixed(2)}</p>
                      <Badge variant={inv.status === 'active' ? 'default' : 'secondary'} className="text-[0.6rem]">
                        {inv.status === 'active' ? 'Attivo' : 'Completato'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
