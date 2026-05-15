import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Calendar, Coins, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UsdtMonogram } from '@/components/UsdtMonogram';

type Plan = {
  id: string;
  name: string;
  days: number;
  daily: number; // percent
  min: number;
  max: number | null;
  popular?: boolean;
};

// Allineato all'engine reale: solo i piani 45gg e 90gg sono investibili.
// I tassi sono indicativi (livello base); il rendimento reale dipende dal livello utente.
const PLANS: Plan[] = [
  { id: 'starter',  name: 'Starter',  days: 30, daily: 0.40, min: 50, max: 500 },
  { id: 'silver',   name: 'Silver',   days: 45, daily: 0.50, min: 50, max: 2000 },
  { id: 'gold',     name: 'Gold',     days: 60, daily: 0.60, min: 50, max: 5000, popular: true },
  { id: 'platinum', name: 'Platinum', days: 75, daily: 0.75, min: 50, max: 10000 },
  { id: 'diamond',  name: 'Diamond',  days: 90, daily: 0.90, min: 50, max: null },
];

const fmt = (n: number) =>
  n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SimulatorPage() {
  const [planId, setPlanId] = useState<string>('gold');
  const [amount, setAmount] = useState<number>(500);

  const plan = PLANS.find((p) => p.id === planId)!;

  const clampedAmount = useMemo(() => {
    const max = plan.max ?? 1_000_000;
    return Math.min(Math.max(amount || 0, 0), max);
  }, [amount, plan]);

  const sim = useMemo(() => {
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

  const sliderMax = plan.max ?? 25000;

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

        {/* Piani */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">Piano</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PLANS.map((p) => {
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
          <StatCard
            icon={<Calendar className="h-4 w-4" />}
            label="Durata"
            value={`${plan.days} gg`}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Rendita giornaliera"
            value={`${fmt(sim.dailyEarn)} USDT`}
          />
          <StatCard
            icon={<Calculator className="h-4 w-4" />}
            label="Rendimento totale"
            value={`+${fmt(sim.totalEarn)} USDT`}
            highlight
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="ROI"
            value={`+${sim.roiPct.toFixed(2).replace('.', ',')}%`}
            highlight
          />
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

        {/* Grafico semplice */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-3 text-sm font-medium">Crescita giornaliera</div>
            <Chart series={sim.series} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link to="/login">Inizia ora</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/invest">Esplora i piani</Link>
          </Button>
        </div>

        <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
          I risultati sono stime basate sui parametri attuali del piano e non costituiscono
          garanzia di rendimento.
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
