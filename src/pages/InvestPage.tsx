import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { LevelBadge } from '@/components/LevelBadge';
import { useProfile } from '@/hooks/useProfile';
import { useLevels, useLevel } from '@/hooks/useLevels';
import { dailyReturn, totalReturn, type Duration, isDurationAvailable, getDailyRateForLevel } from '@/lib/calculations';
import { validateInvestment } from '@/lib/validations';
import { Clock, TrendingUp, Calculator } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function InvestPage() {
  const { data: profile } = useProfile();
  const { data: levels = [] } = useLevels();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userLevelId = profile?.level ?? 'gamma';
  const userLevel = useLevel(userLevelId);

  const [duration, setDuration] = useState<Duration>(45);
  const [amount, setAmount] = useState<string>('');

  // Auto-switch a 45 se 90 non disponibile per il livello
  const can45 = isDurationAvailable(userLevel, 45);
  const can90 = isDurationAvailable(userLevel, 90);
  const effectiveDuration: Duration = can90 ? duration : 45;

  const dailyRate = getDailyRateForLevel(userLevel, effectiveDuration);
  const numericAmount = parseFloat(amount) || 0;
  const dailyEarn = dailyRate ? dailyReturn(numericAmount, dailyRate) : 0;
  const totalEarn = dailyRate ? totalReturn(numericAmount, dailyRate, effectiveDuration) : 0;

  const { data: plans = [] } = useQuery({
    queryKey: ['investment_plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('investment_plans').select('*').order('duration_days');
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
    mutationFn: async () => {
      const plan = plans.find((p) => p.duration_days === effectiveDuration);
      if (!plan) throw new Error('Piano non trovato');
      const { data, error } = await supabase.rpc('create_investment', {
        p_user_id: user!.id,
        p_plan_id: plan.id,
        p_plan_name: plan.name,
        p_amount: numericAmount,
        p_duration: effectiveDuration,
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

  const handleInvest = () => {
    if (!user) {
      toast({ title: 'Accedi per investire', variant: 'destructive' });
      return;
    }
    const result = validateInvestment({
      level: userLevel,
      amount: numericAmount,
      duration: effectiveDuration,
      availableBalance: Number(profile?.balance_available ?? 0),
    });
    if (!result.ok) {
      toast({ title: 'Verifica importo', description: result.error, variant: 'destructive' });
      return;
    }
    investMutation.mutate();
  };

  const validationPreview = useMemo(() => {
    if (!numericAmount) return null;
    return validateInvestment({
      level: userLevel,
      amount: numericAmount,
      duration: effectiveDuration,
      availableBalance: Number(profile?.balance_available ?? 0),
    });
  }, [userLevel, numericAmount, effectiveDuration, profile?.balance_available]);

  return (
    <div className="space-y-5 p-4">
      {/* Livello card */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">Il tuo livello</p>
            <p className="font-display text-lg font-bold text-foreground sm:text-xl">{userLevel?.name ?? '—'}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-primary">
              {userLevel?.giornaliero_45 != null && <span>45gg: {userLevel.giornaliero_45}%/gg</span>}
              {userLevel?.giornaliero_90 != null && <span>90gg: {userLevel.giornaliero_90}%/gg</span>}
            </div>
          </div>
          <LevelBadge level={userLevelId} size="sm" />
        </CardContent>
      </Card>

      {/* Simulatore / Form investimento */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold sm:text-lg">Nuovo Investimento</h3>
          </div>

          {/* Toggle 45/90 */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Durata</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={effectiveDuration === 45 ? 'default' : 'outline'}
                onClick={() => setDuration(45)}
                disabled={!can45}
                className="flex-col h-auto py-2.5"
              >
                <span className="font-display font-bold">45 giorni</span>
                {userLevel?.giornaliero_45 != null && (
                  <span className="text-[0.65rem] opacity-80">{userLevel.giornaliero_45}%/gg</span>
                )}
              </Button>
              <Button
                type="button"
                variant={effectiveDuration === 90 ? 'default' : 'outline'}
                onClick={() => setDuration(90)}
                disabled={!can90}
                className="flex-col h-auto py-2.5"
              >
                <span className="font-display font-bold">90 giorni</span>
                {can90 ? (
                  <span className="text-[0.65rem] opacity-80">{userLevel?.giornaliero_90}%/gg</span>
                ) : (
                  <span className="text-[0.6rem] opacity-70">Non disponibile</span>
                )}
              </Button>
            </div>
            {!can90 && (
              <p className="text-[0.65rem] text-muted-foreground mt-1.5">
                Il livello {userLevel?.name} non prevede il piano a 90 giorni.
              </p>
            )}
          </div>

          {/* Importo */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Importo (USDT)
              {userLevelId === 'gamma' && ' · range 50–100'}
              {userLevelId === 'beta' && ' · max 100'}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={userLevelId === 'gamma' ? '50–100' : 'es. 250'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-[0.65rem] text-muted-foreground mt-1">
              Disponibile: {Number(profile?.balance_available ?? 0).toFixed(2)} USDT
            </p>
          </div>

          {/* Anteprima rendimento */}
          {numericAmount > 0 && dailyRate != null && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-[0.65rem] text-muted-foreground">Giornaliero</p>
                <p className="font-display text-base font-semibold text-primary">+{dailyEarn.toFixed(2)} USDT</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-[0.65rem] text-muted-foreground">Totale ({effectiveDuration}gg)</p>
                <p className="font-display text-base font-semibold text-accent">+{totalEarn.toFixed(2)} USDT</p>
              </div>
            </div>
          )}

          {/* Errore validazione */}
          {validationPreview && !validationPreview.ok && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {validationPreview.error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleInvest}
            disabled={investMutation.isPending || !validationPreview?.ok}
          >
            {investMutation.isPending ? 'Creazione...' : 'Conferma Investimento'}
          </Button>
        </CardContent>
      </Card>

      {/* Piani info */}
      <div>
        <h3 className="mb-3 font-display text-base font-semibold sm:text-lg">Piani Disponibili</h3>
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-3.5">
                <h4 className="font-display font-semibold text-foreground">{plan.name}</h4>
                <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {plan.duration_days} giorni</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Tasso da livello</span>
                </div>
                <Badge variant="secondary" className="mt-2 text-[0.6rem]">Min {plan.min_invest} USDT</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* I miei investimenti */}
      {user && investments.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-base font-semibold sm:text-lg">I Miei Investimenti</h3>
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
                    {inv.duration_days && (
                      <Progress value={progress} className="mt-2 h-1.5" />
                    )}
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
