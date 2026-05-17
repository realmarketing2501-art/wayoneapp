import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { Clock, TrendingUp, Wallet, Zap, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import imgStarter from '@/assets/plan_starter.jpg';
import imgSilver from '@/assets/plan_silver.jpg';
import imgGold from '@/assets/plan_gold.jpg';
import imgPlatinum from '@/assets/plan_platinum.jpg';
import imgDiamond from '@/assets/plan_diamond.jpg';

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

const fmt = (n: number) =>
  n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const planImage = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('starter')) return imgStarter;
  if (n.includes('diamond') || n.includes('diaman')) return imgDiamond;
  if (n.includes('platin')) return imgPlatinum;
  if (n.includes('gold')) return imgGold;
  if (n.includes('silver')) return imgSilver;
  return imgGold;
};

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
    <div className="min-h-full bg-gradient-to-b from-[#0a1f5c] via-[#0a1747] to-[#040a24] text-white">
      {/* HERO */}
      <header className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-wider text-[#7ec6ff]">
          <Zap className="h-3.5 w-3.5" /> Piani di investimento
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">
          Investi USDT.<br />
          <span className="text-[#00aeff]">Rendimenti giornalieri.</span>
        </h1>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-white/60">Saldo disponibile</p>
            <p className="font-display text-2xl font-bold text-white">
              {fmt(Number(profile?.balance_available ?? 0))}{' '}
              <span className="text-xs text-white/60">USDT</span>
            </p>
          </div>
          <div className="rounded-full bg-[#00aeff]/15 p-2">
            <Wallet className="h-5 w-5 text-[#00aeff]" />
          </div>
        </div>
      </header>

      {/* PLAN CARDS WITH IMAGES */}
      <section className="px-4 pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white/80">
            Scegli il pacchetto
          </h2>
          <span className="text-[0.65rem] text-white/50">{plans.length} piani attivi</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {plans.map((p) => {
            const active = (selected?.id ?? plans[0]?.id) === p.id;
            const d = p.duration_days ?? p.duration;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border text-left transition-all',
                  active
                    ? 'border-[#00aeff] ring-2 ring-[#00aeff]/40 shadow-[0_0_25px_-5px_rgba(0,174,255,0.6)]'
                    : 'border-white/10 hover:border-[#00aeff]/50',
                )}
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <img
                    src={planImage(p.name)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040a24] via-[#040a24]/40 to-transparent" />
                  {active && (
                    <div className="absolute right-2 top-2 rounded-full bg-[#00aeff] p-1">
                      <CheckCircle2 className="h-3 w-3 text-[#0a1f5c]" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-display text-sm font-bold leading-tight text-white drop-shadow">
                      {p.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 bg-[#0a1747]/80 px-3 py-2.5 backdrop-blur">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-lg font-extrabold text-[#00aeff]">
                      {String(p.daily_return).replace('.', ',')}%
                    </span>
                    <span className="text-[0.6rem] uppercase tracking-wider text-white/50">/giorno</span>
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] text-white/70">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{d}gg</span>
                    <span>{p.min_invest}–{p.max_invest && p.max_invest >= 1000000 ? '∞' : p.max_invest}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* INVESTMENT FORM */}
      <section className="px-4 pb-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-white/80">
            Nuovo investimento {selected && <span className="text-[#00aeff]">· {selected.name}</span>}
          </h3>

          <Label className="mb-1.5 block text-[0.65rem] uppercase tracking-wider text-white/60">
            Importo (USDT){selected && ` · ${selected.min_invest}–${selected.max_invest && selected.max_invest >= 1000000 ? '∞' : selected.max_invest}`}
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="es. 250"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border-white/15 bg-[#040a24]/60 text-white placeholder:text-white/40 focus-visible:ring-[#00aeff]"
          />

          {numericAmount > 0 && selected && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-[#040a24]/60 p-3">
                <p className="text-[0.6rem] uppercase tracking-wider text-white/50">Giornaliero</p>
                <p className="font-display text-base font-bold text-[#00aeff]">+{fmt(dailyEarn)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#040a24]/60 p-3">
                <p className="text-[0.6rem] uppercase tracking-wider text-white/50">Totale ({days}gg)</p>
                <p className="font-display text-base font-bold text-emerald-400">+{fmt(totalEarn)}</p>
              </div>
            </div>
          )}

          {validation.error && numericAmount > 0 && (
            <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {validation.error}
            </p>
          )}

          <Button
            className="mt-4 w-full bg-gradient-to-r from-[#00aeff] to-[#0084ff] font-semibold text-[#0a1f5c] hover:opacity-90"
            onClick={handleInvest}
            disabled={investMutation.isPending || !validation.ok}
          >
            {investMutation.isPending ? 'Creazione...' : 'Conferma Investimento'}
          </Button>
        </div>
      </section>

      {/* MY INVESTMENTS */}
      {user && investments.length > 0 && (
        <section className="px-4 pb-8">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-white/80">
            I miei investimenti
          </h3>
          <div className="space-y-2">
            {investments.map((inv) => {
              const progress = inv.duration_days
                ? ((inv.duration_days - inv.days_remaining) / inv.duration_days) * 100
                : 0;
              return (
                <div key={inv.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <img
                    src={planImage(inv.plan_name)}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{inv.plan_name}</p>
                        <p className="text-[0.65rem] text-white/60">
                          {Number(inv.amount).toFixed(2)} USDT · {inv.daily_rate}%/gg ·{' '}
                          {inv.days_remaining > 0 ? `${inv.days_remaining}gg restanti` : 'Completato'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[#00aeff]">+{Number(inv.earned).toFixed(2)}</p>
                        <Badge
                          className={cn(
                            'text-[0.55rem]',
                            inv.status === 'active'
                              ? 'bg-[#00aeff]/20 text-[#7ec6ff]'
                              : 'bg-white/10 text-white/70',
                          )}
                        >
                          {inv.status === 'active' ? 'Attivo' : 'Completato'}
                        </Badge>
                      </div>
                    </div>
                    {inv.duration_days && <Progress value={progress} className="mt-2 h-1.5 bg-white/10" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
