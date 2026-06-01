import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Calendar, Coins, ArrowLeft, Sparkles, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UsdtMonogram } from '@/components/UsdtMonogram';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Plan = {
  id: string;
  name: string;
  days: number;
  daily: number; // percent
  min: number;
  max: number | null;
  popular?: boolean;
};

type WithdrawalMode = {
  key: string;
  label: string;
  hours: number;
  fee_pct: number;
  active?: boolean;
};

// Fallback usato SOLO se il DB non ha piani attivi (es. configurazione iniziale).
const FALLBACK_PLANS: Plan[] = [
  { id: 'silver',   name: 'Silver',   days: 45, daily: 0.50, min: 50, max: 2000 },
  { id: 'gold',     name: 'Gold',     days: 60, daily: 0.60, min: 50, max: 5000, popular: true },
  { id: 'diamond',  name: 'Diamond',  days: 90, daily: 0.90, min: 50, max: null },
];

const fmt = (n: number) =>
  n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SimulatorPage() {
  // Piani reali dal DB (RLS: leggibili anche da anon)
  const { data: dbPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['public_simulator_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('id, name, daily_return, duration_days, duration, min_invest, max_invest, status')
        .eq('status', 'active')
        .order('min_invest', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // Config prelievi (RPC pubblica)
  const { data: withdrawalModes = [] } = useQuery({
    queryKey: ['public_simulator_withdrawal_config'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_setting', { p_key: 'withdrawal_config' });
      if (error) throw error;
      try {
        const parsed = JSON.parse(data ?? '[]') as WithdrawalMode[];
        return parsed.filter((m) => m.active !== false);
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const plans: Plan[] = useMemo(() => {
    if (!dbPlans.length) return FALLBACK_PLANS;
    // Marca "popular" sul piano centrale
    const mapped = dbPlans.map((p) => ({
      id: p.id,
      name: p.name,
      days: p.duration_days ?? p.duration ?? 30,
      daily: Number(p.daily_return ?? 0),
      min: Number(p.min_invest ?? 50),
      max: p.max_invest != null ? Number(p.max_invest) : null,
    })) as Plan[];
    const mid = Math.floor(mapped.length / 2);
    if (mapped[mid]) mapped[mid].popular = true;
    return mapped;
  }, [dbPlans]);

  const [planId, setPlanId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500);

  // Seleziona di default il piano "popular" o il primo
  useEffect(() => {
    if (!planId && plans.length) {
      const def = plans.find((p) => p.popular) ?? plans[0];
      setPlanId(def.id);
      if (amount < def.min) setAmount(def.min);
    }
  }, [plans, planId, amount]);

  const plan = plans.find((p) => p.id === planId) ?? plans[0];

  const clampedAmount = useMemo(() => {
    if (!plan) return 0;
    const max = plan.max ?? 1_000_000;
    return Math.min(Math.max(amount || 0, 0), max);
  }, [amount, plan]);

  const sim = useMemo(() => {
    if (!plan) return { dailyEarn: 0, totalEarn: 0, finalBalance: 0, roiPct: 0, series: [] as { day: number; total: number }[] };
    const dailyRate = plan.daily / 100;
    const dailyEarn = clampedAmount * dailyRate;
    const totalEarn = dailyEarn * plan.days;
    const finalBalance = clampedAmount + totalEarn;
    const roiPct = plan.daily * plan.days;
    const series: { day: number; total: number }[] = [];
    for (let d = 0; d <= plan.days; d++) {
      series.push({ day: d, total: clampedAmount + dailyEarn * d });
    }
    return { dailyEarn, totalEarn, finalBalance, roiPct, series };
  }, [clampedAmount, plan]);

  const sliderMax = plan?.max ?? 25000;

  return (
    <div className="min-h-[100dvh] usdt-bg">
      <header className="sticky top-0 z-40 usdt-header safe-top">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </Link>
          <div className="flex items-center gap-2">
            <UsdtMonogram size={28} letter="U" />
            <span className="font-display text-lg font-bold usdt-gold-text">USDT</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-6 text-center">
          <Badge className="mb-3 inline-flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/15">
            <Sparkles className="h-3 w-3" />
            Simulatore
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Simula il tuo investimento
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scegli un piano, imposta l'importo e vedi il rendimento stimato in tempo reale.
          </p>
        </div>

        {plansLoading && (
          <div className="mb-6 text-center text-sm text-muted-foreground">Caricamento piani…</div>
        )}

        {!plansLoading && !plans.length && (
          <Card className="mb-6 border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nessun piano attivo disponibile al momento.
            </CardContent>
          </Card>
        )}

        {plan && (
          <>
            {/* Piani */}
            <div className="mb-6">
              <Label className="mb-3 block text-sm font-medium">Piano</Label>
              <div className={`grid grid-cols-2 gap-2 sm:grid-cols-${Math.min(plans.length, 5)}`}>
                {plans.map((p) => {
                  const active = p.id === planId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPlanId(p.id);
                        if (p.max && amount > p.max) setAmount(p.max);
                        if (amount < p.min) setAmount(p.min);
                      }}
                      className={`relative rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-semibold text-primary-foreground">
                          TOP
                        </span>
                      )}
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{p.days} gg</div>
                      <div className="mt-1 text-xs font-medium text-primary">
                        {p.daily.toString().replace('.', ',')}%/gg
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Importo */}
            <Card className="mb-6">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Importo (USDT)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Min {plan.min} · Max {plan.max ? fmt(plan.max) : '∞'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-primary" />
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    min={plan.min}
                    max={plan.max ?? undefined}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="mt-4">
                  <Slider
                    value={[clampedAmount]}
                    min={plan.min}
                    max={sliderMax}
                    step={10}
                    onValueChange={(v) => setAmount(v[0])}
                  />
                  <div className="mt-2 flex justify-between text-[0.65rem] text-muted-foreground">
                    <span>{plan.min} USDT</span>
                    <span>{fmt(sliderMax)} USDT</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[100, 500, 1000, 5000].map((v) => {
                    const ok = v >= plan.min && (!plan.max || v <= plan.max);
                    if (!ok) return null;
                    return (
                      <Button
                        key={v}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(v)}
                      >
                        {fmt(v)}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Risultati */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<Calendar className="h-4 w-4" />} label="Durata" value={`${plan.days} gg`} />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Rendita giornaliera" value={`${fmt(sim.dailyEarn)} USDT`} />
              <StatCard icon={<Calculator className="h-4 w-4" />} label="Rendimento totale" value={`+${fmt(sim.totalEarn)} USDT`} highlight />
              <StatCard icon={<Sparkles className="h-4 w-4" />} label="ROI" value={`+${sim.roiPct.toFixed(2).replace('.', ',')}%`} highlight />
            </div>

            {/* Riepilogo finale */}
            <Card className="mb-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Saldo finale stimato
                    </div>
                    <div className="mt-1 font-display text-3xl font-bold">
                      {fmt(sim.finalBalance)} <span className="text-base text-muted-foreground">USDT</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Capitale {fmt(clampedAmount)} + interessi {fmt(sim.totalEarn)}
                    </div>
                  </div>
                  <UsdtMonogram size={56} letter="U" />
                </div>
              </CardContent>
            </Card>

            {/* Simulazione prelievo (fee dinamiche da admin) */}
            {withdrawalModes.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Coins className="h-4 w-4 text-primary" />
                    Stima prelievo del saldo finale
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {withdrawalModes.map((m) => {
                      const fee = (sim.finalBalance * m.fee_pct) / 100;
                      const net = sim.finalBalance - fee;
                      return (
                        <div key={m.key} className="rounded-lg border border-border bg-card p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{m.label}</span>
                            <Badge variant="outline" className="text-[0.6rem]">{m.hours}h</Badge>
                          </div>
                          <div className="mt-1 text-[0.7rem] text-muted-foreground">Fee {m.fee_pct}%</div>
                          <div className="mt-2 text-base font-bold text-primary">{fmt(net)} USDT</div>
                          <div className="text-[0.65rem] text-muted-foreground">Fee: -{fmt(fee)}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grafico */}
            <Card className="mb-6">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-medium">Crescita giornaliera</div>
                <Chart series={sim.series} />
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link to="/login">Inizia ora</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/invest">Esplora i piani</Link>
          </Button>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            Strumento di simulazione: i risultati sono stime basate sui parametri attuali del piano
            e sulle fee di prelievo configurate. Non costituiscono garanzia di rendimento e non
            generano operazioni reali.
          </span>
        </p>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary/40' : ''}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
        </div>
        <div
          className={`mt-1 font-display text-lg font-bold ${
            highlight ? 'text-primary' : ''
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function Chart({ series }: { series: { day: number; total: number }[] }) {
  if (series.length < 2) return null;
  const w = 320;
  const h = 120;
  const min = series[0].total;
  const max = series[series.length - 1].total;
  const range = max - min || 1;
  const stepX = w / (series.length - 1);
  const points = series
    .map((p, i) => `${i * stepX},${h - ((p.total - min) / range) * h}`)
    .join(' ');
  const area = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      <defs>
        <linearGradient id="sim-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sim-grad)" />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
