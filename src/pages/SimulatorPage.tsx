import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, Coins, ArrowLeft, Sparkles, Info, Lock, Gift, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { UsdtMonogram } from "@/components/UsdtMonogram";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_LEVELS = [
  {
    id: "gamma",
    name: "Starter",
    min: 50,
    max: 100,
    daily75: 1.0,
    daily90: 1.5,
    units: 6,
    production: 600,
    bonusPct: 0,
    bonusValue: 0,
  },
  {
    id: "beta",
    name: "Silver",
    min: 100,
    max: 200,
    daily75: 1.0,
    daily90: 1.5,
    units: 36,
    production: 3600,
    bonusPct: 10,
    bonusValue: 360,
  },
  {
    id: "bronze",
    name: "Gold",
    min: 300,
    max: 800,
    daily75: 1.5,
    daily90: 2.0,
    units: 216,
    production: 21600,
    bonusPct: 15,
    bonusValue: 3240,
  },
  {
    id: "silver",
    name: "Platinum",
    min: 400,
    max: 1000,
    daily75: 1.5,
    daily90: 2.0,
    units: 1296,
    production: 129600,
    bonusPct: 15,
    bonusValue: 19440,
  },
  {
    id: "silver_elite",
    name: "Platinum Elite",
    min: 500,
    max: 1500,
    daily75: 1.5,
    daily90: 2.0,
    units: 7776,
    production: 777600,
    bonusPct: 20,
    bonusValue: 155520,
  },
  {
    id: "smeraldo",
    name: "Smeraldo",
    min: 2500,
    max: 5000,
    daily75: 1.5,
    daily90: 2.0,
    units: 46656,
    production: 4665600,
    bonusPct: 20,
    bonusValue: 933120,
  },
];

type SimLevel = (typeof FALLBACK_LEVELS)[number];
type DurationMode = 75 | 90;

const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString("it-IT");

export default function SimulatorPage() {
  const { data: dbLevels = [], isLoading } = useQuery({
    queryKey: ["public_simulator_levels_v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("levels")
        .select(
          "id,name,ordine,active,investimento_min,investimento_max,giornaliero_45,giornaliero_90,unita_richieste,produzione_richiesta,bonus_percentuale,bonus_valore",
        )
        .eq("active", true)
        .order("ordine", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const levels = useMemo<SimLevel[]>(() => {
    if (!dbLevels.length) return FALLBACK_LEVELS;
    return dbLevels.map((l) => ({
      id: String(l.id),
      name: l.name,
      min: Number(l.investimento_min ?? 50),
      max: Number(l.investimento_max ?? 1000),
      daily75: Number(l.giornaliero_45 ?? 0),
      daily90: Number(l.giornaliero_90 ?? 0),
      units: Number(l.unita_richieste ?? 0),
      production: Number(l.produzione_richiesta ?? 0),
      bonusPct: Number(l.bonus_percentuale ?? 0),
      bonusValue: Number(l.bonus_valore ?? 0),
    }));
  }, [dbLevels]);

  const [levelId, setLevelId] = useState<string>("");
  const [duration, setDuration] = useState<DurationMode>(90);
  const [amount, setAmount] = useState<number>(50);

  useEffect(() => {
    if (!levelId && levels.length) {
      setLevelId(levels[0].id);
      setAmount(levels[0].min);
    }
  }, [levels, levelId]);

  const level = levels.find((l) => l.id === levelId) ?? levels[0];

  useEffect(() => {
    if (!level) return;
    if (amount < level.min) setAmount(level.min);
    if (level.max && amount > level.max) setAmount(level.max);
  }, [level?.id]);

  const clampedAmount = useMemo(() => {
    if (!level) return 0;
    return Math.min(Math.max(amount || 0, level.min), level.max || 1_000_000);
  }, [amount, level]);

  const sim = useMemo(() => {
    if (!level) return { dailyRate: 0, dailyEarn: 0, totalEarn: 0, finalBalance: 0, bonusValue: 0 };
    const dailyRate = duration === 75 ? level.daily75 : level.daily90;
    const dailyEarn = clampedAmount * (dailyRate / 100);
    const totalEarn = dailyEarn * duration;
    const finalBalance = clampedAmount + totalEarn;
    return { dailyRate, dailyEarn, totalEarn, finalBalance, bonusValue: level.bonusValue };
  }, [clampedAmount, duration, level]);

  if (!level && isLoading) {
    return (
      <div className="min-h-[100dvh] usdt-bg flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] usdt-bg">
      <header className="sticky top-0 z-40 usdt-header safe-top">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Indietro
          </Link>
          <div className="flex items-center gap-2">
            <UsdtMonogram size={28} letter="U" />
            <span className="font-display text-lg font-bold usdt-gold-text">WAYONE</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-6 text-center">
          <Badge className="mb-3 inline-flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/15">
            <Sparkles className="h-3 w-3" /> Simulatore pubblico
          </Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight">Simula piano, livello e bonus</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Calcolo indicativo: non crea investimenti, non modifica wallet e non garantisce risultati.
          </p>
        </div>

        <Card className="mb-6 border-amber-400/30 bg-amber-500/10">
          <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p>
              Il capitale investito resta bloccato fino alla scadenza. I livelli sbloccano bonus potenziali, profondità
              rete e pool speciali, ma non modificano retroattivamente investimenti già attivi.
            </p>
          </CardContent>
        </Card>

        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">Livello / piano simulato</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {levels.map((l) => {
              const active = l.id === levelId;
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setLevelId(l.id);
                    setAmount(Math.max(l.min, Math.min(amount, l.max || amount)));
                  }}
                  className={`rounded-xl border p-3 text-left transition-all ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <div className="text-sm font-semibold">{l.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {fmtInt(l.min)}–{fmtInt(l.max)} USDT
                  </div>
                  <div className="mt-1 text-xs font-medium text-primary">
                    {duration === 75 ? l.daily75 : l.daily90}%/gg target
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="space-y-5 p-5">
            <div>
              <Label className="mb-2 block text-sm font-medium">Durata</Label>
              <div className="grid grid-cols-2 gap-2">
                {[75, 90].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={duration === d ? "default" : "outline"}
                    onClick={() => setDuration(d as DurationMode)}
                  >
                    {d} giorni
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Importo simulato
                </Label>
                <span className="text-xs text-muted-foreground">
                  Min {fmtInt(level?.min ?? 0)} · Max {fmtInt(level?.max ?? 0)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-primary" />
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  min={level?.min}
                  max={level?.max}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="text-lg font-semibold"
                />
              </div>
              <div className="mt-4">
                <Slider
                  value={[clampedAmount]}
                  min={level?.min ?? 0}
                  max={level?.max ?? 1000}
                  step={10}
                  onValueChange={(v) => setAmount(v[0])}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="usdt-card-gold">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Rendimento stimato</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capitale bloccato</span>
                  <span className="font-semibold">{fmt(clampedAmount)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target giornaliero</span>
                  <span className="font-semibold text-primary">{sim.dailyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stima giornaliera</span>
                  <span className="font-semibold">{fmt(sim.dailyEarn)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stima {duration} giorni</span>
                  <span className="font-semibold">{fmt(sim.totalEarn)} USDT</span>
                </div>
                <div className="border-t border-primary/20 pt-2 flex justify-between">
                  <span className="text-muted-foreground">Capitale + stima</span>
                  <span className="font-display font-bold usdt-gold-text">{fmt(sim.finalBalance)} USDT</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Bonus e rete</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unità richieste</span>
                  <span className="font-semibold">{fmtInt(level?.units ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produzione richiesta</span>
                  <span className="font-semibold">{fmtInt(level?.production ?? 0)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus produzione</span>
                  <span className="font-semibold">{level?.bonusPct ?? 0}%</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-muted-foreground">Bonus potenziale</span>
                  <span className="font-display font-bold text-primary">{fmt(level?.bonusValue ?? 0)} USDT</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Network className="mb-1 h-4 w-4 text-primary" />
                Il bonus produzione è separato dal rendimento del piano ed è soggetto ai requisiti di livello, rete
                attiva e produzione.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-dashed">
          <CardContent className="flex gap-3 p-4 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Puoi entrare in nuove pool solo con saldo disponibile, bonus disponibili, profitti disponibili o nuovo
              deposito. Il capitale già bloccato in un piano attivo non è riutilizzabile fino alla scadenza.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
