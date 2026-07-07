import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useLevels } from '@/hooks/useLevels';
import { useProfile } from '@/hooks/useProfile';
import { Sparkles, Coins, Star, Gem, Crown, Info, Users, TrendingUp, Gift, ChevronRight, Check } from 'lucide-react';

const ICONS = [Sparkles, Coins, Star, Gem, Crown];
const COLORS = [
  'from-slate-400/20 to-slate-500/10 border-slate-400/40 text-slate-300',
  'from-sky-400/25 to-blue-500/10 border-sky-400/50 text-sky-300',
  'from-amber-400/25 to-yellow-500/10 border-amber-400/50 text-amber-300',
  'from-fuchsia-400/25 to-purple-500/10 border-fuchsia-400/50 text-fuchsia-300',
  'from-cyan-300/30 to-emerald-400/15 border-cyan-300/60 text-cyan-200',
];

export default function QualifichePage() {
  const { data: levels = [], isLoading } = useLevels();
  const { data: profile } = useProfile();
  const currentLevel = profile?.level ?? 'gamma';
  const [howItWorks, setHowItWorks] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const currentIdx = levels.findIndex((l) => l.id === currentLevel);
  const currentUnits = profile?.units ?? 0;
  const currentProd = Number(profile?.production ?? 0);

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Livelli & Referral</h2>
          <p className="text-sm text-muted-foreground mt-1">Più inviti, più guadagni ogni giorno.</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setHowItWorks(true)}>
          <Info className="h-3.5 w-3.5" /> Come funziona
        </Button>
      </div>

      {/* Progress card */}
      {currentIdx >= 0 && (
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Il tuo livello</p>
                <p className="font-display text-lg font-bold text-foreground">{levels[currentIdx].name}</p>
              </div>
              <Badge className="text-xs">{levels[currentIdx].giornaliero_90}% / giorno</Badge>
            </div>
            {levels[currentIdx + 1] && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Prossimo: <span className="text-foreground font-medium">{levels[currentIdx + 1].name}</span></span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[0.65rem]">
                      <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Diretti</span>
                      <span className="text-foreground font-medium">{currentUnits}/{levels[currentIdx + 1].unita_richieste ?? 0}</span>
                    </div>
                    <Progress value={Math.min(100, (currentUnits / (levels[currentIdx + 1].unita_richieste || 1)) * 100)} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[0.65rem]">
                      <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Rete USDT</span>
                      <span className="text-foreground font-medium">{Math.round(currentProd)}/{Math.round(Number(levels[currentIdx + 1].produzione_richiesta ?? 0))}</span>
                    </div>
                    <Progress value={Math.min(100, (currentProd / (Number(levels[currentIdx + 1].produzione_richiesta) || 1)) * 100)} className="h-1.5" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Livelli list */}
      <div className="space-y-2.5">
        {levels.map((l, idx) => {
          const Icon = ICONS[idx] ?? Sparkles;
          const isCurrent = l.id === currentLevel;
          const isUnlocked = idx <= currentIdx;
          const colorClass = COLORS[idx] ?? COLORS[0];
          return (
            <Card key={l.id} className={`overflow-hidden border ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-0">
                <div className={`bg-gradient-to-r ${colorClass} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-full bg-background/40 p-1.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{l.name}</p>
                      <p className="text-[0.65rem] opacity-80">Livello {l.ordine}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold leading-none">{l.giornaliero_90}%</p>
                    <p className="text-[0.6rem] opacity-80">al giorno · 90gg</p>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[0.6rem] text-muted-foreground">Diretti</p>
                    <p className="font-semibold text-foreground">{l.unita_richieste || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] text-muted-foreground">Rete USDT</p>
                    <p className="font-semibold text-foreground">{l.produzione_richiesta ? Number(l.produzione_richiesta).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] text-muted-foreground">Referral</p>
                    <p className="font-semibold text-primary">{l.bonus_percentuale}%</p>
                  </div>
                </div>
                {l.bonus_valore > 0 && (
                  <div className="px-3 pb-3">
                    <div className="rounded-md bg-accent/10 border border-accent/30 px-2.5 py-1.5 flex items-center gap-2">
                      <Gift className="h-3.5 w-3.5 text-accent" />
                      <p className="text-[0.7rem] text-foreground">
                        Bonus una-tantum: <span className="font-bold text-accent">+{l.bonus_valore.toLocaleString()} USDT</span>
                      </p>
                    </div>
                  </div>
                )}
                {isCurrent && (
                  <div className="border-t border-primary/30 bg-primary/5 px-3 py-1.5 flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" />
                    <p className="text-[0.65rem] text-primary font-medium">Sei qui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Come funziona dialog */}
      <Dialog open={howItWorks} onOpenChange={setHowItWorks}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Come funziona
            </DialogTitle>
            <DialogDescription>Livelli, investimenti e referral in 3 minuti.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <section className="space-y-1.5">
              <h3 className="font-bold text-foreground flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" /> 1. Investi</h3>
              <p className="text-muted-foreground text-xs">
                Deposita USDT e attiva un piano <strong>a 90 giorni</strong>. Ogni giorno ricevi automaticamente la % del tuo livello sul capitale investito.
              </p>
              <div className="rounded-md bg-secondary p-2 text-[0.7rem]">
                <p><strong>Esempio Starter</strong> (1.0%/gg): 1.000 USDT × 1.0% = <span className="text-primary font-bold">10 USDT/giorno</span> × 90 = <span className="text-primary font-bold">900 USDT totali</span>.</p>
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-foreground flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> 2. Invita persone</h3>
              <p className="text-muted-foreground text-xs">
                Condividi il tuo link referral. Ogni volta che un tuo invitato guadagna interesse giornaliero, <strong>tu ricevi una commissione</strong> pari alla % del tuo livello — senza toglierla a lui.
              </p>
              <div className="rounded-md bg-secondary p-2 text-[0.7rem] space-y-1">
                <p><strong>Sei Builder (8%)</strong> e hai 5 diretti che investono 1.000 USDT ciascuno:</p>
                <p>5 × 10 USDT/gg × <span className="text-accent font-bold">8%</span> = <span className="text-accent font-bold">4 USDT/gg extra</span> = <span className="text-accent font-bold">120 USDT/mese</span> passivi.</p>
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-foreground flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> 3. Sali di livello</h3>
              <p className="text-muted-foreground text-xs">
                Più diretti attivi e più capitale investito nella tua rete → sali di livello → guadagni di più su tutto: rendita giornaliera + % referral più alta + bonus una-tantum.
              </p>
              <div className="rounded-md border border-border p-2 space-y-1 text-[0.7rem]">
                {levels.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{l.name}</span>
                    <span className="text-muted-foreground">
                      <span className="text-primary font-semibold">{l.giornaliero_90}%/gg</span>
                      {' · '}
                      <span className="text-accent font-semibold">{l.bonus_percentuale}% referral</span>
                      {l.bonus_valore > 0 && <> {' · '}<span className="text-foreground">+{l.bonus_valore} USDT</span></>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-foreground flex items-center gap-1.5"><Gift className="h-4 w-4 text-primary" /> 4. Bonus una-tantum</h3>
              <p className="text-muted-foreground text-xs">
                La prima volta che raggiungi Builder/Leader/Elite/Diamond ricevi un <strong>bonus in USDT accreditato subito</strong> sul saldo, oltre a tutti i guadagni ricorrenti.
              </p>
            </section>

            <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs">
              <p className="font-semibold text-foreground mb-1">In sintesi</p>
              <p className="text-muted-foreground">Investi → guadagni ogni giorno. Inviti amici → guadagni sui loro guadagni. Sali di livello → tutto raddoppia. Zero lavoro, tutto automatico.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
