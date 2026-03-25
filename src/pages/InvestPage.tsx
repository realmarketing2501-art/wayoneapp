import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
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
      const { error } = await supabase.from('investments').insert({
        user_id: user!.id,
        plan_id: planId,
        plan_name: planName,
        amount,
        days_remaining: duration,
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      toast({ title: 'Investimento creato!', description: 'Il tuo investimento è stato registrato.' });
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
    investMutation.mutate({ planId: plan.id, planName: plan.name, amount, duration: plan.duration });
  };

  return (
    <div className="space-y-6 p-4">
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Il tuo livello</p>
            <p className="font-display text-xl font-bold text-foreground">{levelInfo.label}</p>
            <p className="text-sm text-primary">{levelInfo.dailyReturn}% rendimento giornaliero</p>
          </div>
          <LevelBadge level={level} size="lg" />
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Piani di Investimento</h3>
        <div className="space-y-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.status === 'locked' ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-semibold text-foreground">{plan.name}</h4>
                      {plan.status === 'locked' && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {plan.duration}gg</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {plan.daily_return}%/giorno</span>
                    </div>
                  </div>
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
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
                    <Button className="mt-3 w-full" disabled={plan.status !== 'active'}>
                      {plan.status === 'locked' ? `Richiede ${plan.min_level}` : 'Investi Ora'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">I Miei Investimenti</h3>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Piano</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Giorni</TableHead>
                  <TableHead>Guadagno</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessun investimento</TableCell></TableRow>
                ) : investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.plan_name}</TableCell>
                    <TableCell>{inv.amount} USDT</TableCell>
                    <TableCell>{inv.days_remaining > 0 ? `${inv.days_remaining} restanti` : 'Completato'}</TableCell>
                    <TableCell className="text-primary">+{Number(inv.earned).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'active' ? 'default' : 'secondary'}>
                        {inv.status === 'active' ? 'Attivo' : inv.status === 'completed' ? 'Completato' : 'In attesa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
