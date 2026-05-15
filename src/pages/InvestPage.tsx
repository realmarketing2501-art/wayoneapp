import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { Clock, TrendingUp, Calculator, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Plan = {
  id: string;
  name: string;
  duration_days: number | null;
  duration: number;
  daily_return: number;
  min_invest: number | null;
  max_invest: number | null;
  status: string;
};

const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvestPage() {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['investment_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('status', 'active')
        .order('duration_days', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');

  const selected = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? plans[0] ?? null,
    [plans, selectedId],
  );
  const days = selected?.duration_days ?? selected?.duration ?? 0;
  const dailyRate = selected?.daily_return ?? 0;
  const numericAmount = parseFloat(amount) || 0;
  const dailyEarn = numericAmount * (dailyRate / 100);
  const totalEarn = dailyEarn * days;

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const investMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('Nessun piano selezionato');
      const { data, error } = await supabase.rpc('create_investment', {
        p_user_id: user!.id,
        p_plan_id: selected.id,
        p_plan_name: selected.name,
        p_amount: numericAmount,
        p_duration: days,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Investimento creato!', description: 'Il primo accredito interessi arriverà fra 24 ore.' });
      setAmount('');
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const validation: { ok: boolean; error?: string } = useMemo(() => {
    if (!selected) return { ok: false, error: 'Seleziona un piano' };
    if (!numericAmount) return { ok: false };
    if (selected.min_invest && numericAmount < selected.min_invest)
      return { ok: false, error: `Minimo ${selected.min_invest} USDT` };
    if (selected.max_invest && numericAmount > selected.max_invest)
      return { ok: false, error: `Massimo ${selected.max_invest} USDT` };
    if (numericAmount > Number(profile?.balance_available ?? 0))
      return { ok: false, error: 'Saldo insufficiente' };
    return { ok: true };
  }, [selected, numericAmount, profile?.balance_available]);

  const handleInvest = () => {
    if (!user) return toast({ title: 'Accedi per investire', variant: 'destructive' });
    if (!validation.ok) return toast({ title: 'Verifica importo', description: validation.error, variant: 'destructive' });
    investMutation.mutate();
  };

  return (
    <div className="space-y-5 p-4">
      {/* Saldo */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Saldo disponibile</p>
          <p className="font-display text-2xl font-bold text-primary">
            {fmt(Number(profile?.balance_available ?? 0))} <span className="text-sm text-muted-foreground">USDT</span>
          </p>
        </CardContent>
      </Card>

      {/* Piani */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Scegli un piano</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {plans.map((p) => {
            const active = (selected?.id ?? plans[0]?.id) === p.id;
            const d = p.duration_days ?? p.duration;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <div className="text-sm font-display font-bold">{p.name}</div>
                <div className="text-[0.65rem] text-muted-foreground">{d} giorni</div>
                <div className="mt-1 text-xs font-semibold text-primary">
                  {String(p.daily_return).replace('.', ',')}%/gg
                </div>
                <div className="mt-1 text-[0.6rem] text-muted-foreground">
                  Min {p.min_invest} · Max {p.max_invest && p.max_invest >= 1000000 ? '∞' : p.max_invest}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form investimento */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Nuovo investimento</h3>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Importo (USDT){selected && ` · range ${selected.min_invest}–${selected.max_invest && selected.max_invest >= 1000000 ? '∞' : selected.max_invest}`}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="es. 250"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {numericAmount > 0 && selected && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-[0.65rem] text-muted-foreground">Giornaliero</p>
                <p className="font-display text-base font-semibold text-primary">+{fmt(dailyEarn)} USDT</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-[0.65rem] text-muted-foreground">Totale ({days}gg)</p>
                <p className="font-display text-base font-semibold text-accent">+{fmt(totalEarn)} USDT</p>
              </div>
            </div>
          )}

          {validation.error && numericAmount > 0 && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {validation.error}
            </p>
          )}

          <Button className="w-full" onClick={handleInvest} disabled={investMutation.isPending || !validation.ok}>
            {investMutation.isPending ? 'Creazione...' : 'Conferma Investimento'}
          </Button>
        </CardContent>
      </Card>

      {/* I miei investimenti */}
      {user && investments.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-base font-semibold">I miei investimenti</h3>
          <div className="space-y-2">
            {investments.map((inv) => {
              const progress = inv.duration_days
                ? ((inv.duration_days - inv.days_remaining) / inv.duration_days) * 100
                : 0;
              return (
                <Card key={inv.id}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.plan_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(inv.amount).toFixed(2)} USDT · {inv.daily_rate}%/gg ·{' '}
                          {inv.days_remaining > 0 ? `${inv.days_remaining}gg restanti` : 'Completato'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary">+{Number(inv.earned).toFixed(2)}</p>
                        <Badge variant={inv.status === 'active' ? 'default' : 'secondary'} className="text-[0.6rem]">
                          {inv.status === 'active' ? 'Attivo' : 'Completato'}
                        </Badge>
                      </div>
                    </div>
                    {inv.duration_days && <Progress value={progress} className="mt-2 h-1.5" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
