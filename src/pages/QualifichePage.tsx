import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/LevelBadge";
import { useLevels } from "@/hooks/useLevels";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Gift, Network, Wallet, AlertTriangle } from "lucide-react";

const formatUsdt = (value: number | null | undefined) =>
  value == null ? "—" : `${Number(value).toLocaleString("it-IT")} USDT`;

export default function QualifichePage() {
  const { data: levels = [], isLoading } = useLevels();
  const { data: profile } = useProfile();
  const currentLevel = profile?.level ?? "gamma";

  const { data: funds = [] } = useQuery({
    queryKey: ["qualifiche_funds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("special_funds")
        .select("id,name,status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const fundName = (poolId?: string | null, levelName?: string) => {
    if (!poolId) return `Pool ${levelName ?? "dedicata"} da configurare`;
    return funds.find((f) => f.id === poolId)?.name ?? "Pool collegata";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeLevels = levels.filter((l) => l.active !== false);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Qualifiche WayOne</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          I livelli non sono piani da acquistare: sbloccano bonus potenziali, profondità rete, pool speciali e vantaggi
          futuri.
        </p>
      </div>

      <Card className="border-amber-400/30 bg-amber-500/10">
        <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-foreground">Regola fondamentale</p>
            <p>
              Il capitale già investito resta bloccato fino alla scadenza del piano. Salire di livello non modifica
              retroattivamente investimenti già attivi e non sblocca capitale già vincolato.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {activeLevels.map((l) => {
          const isCurrent = l.id === currentLevel;
          return (
            <Card key={l.id} className={isCurrent ? "border-primary/60 bg-primary/5" : ""}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <LevelBadge level={l.id} size="md" />
                  {isCurrent && <Badge className="text-[0.65rem]">Tu sei qui</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-[0.65rem] text-muted-foreground">Investimento</p>
                    <p className="font-semibold text-foreground">
                      {formatUsdt(l.investimento_min)} – {formatUsdt(l.investimento_max)}
                    </p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-[0.65rem] text-muted-foreground">Unità richieste</p>
                    <p className="font-semibold text-foreground">{l.unita_richieste?.toLocaleString("it-IT") ?? "—"}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-[0.65rem] text-muted-foreground">Produzione</p>
                    <p className="font-semibold text-foreground">{formatUsdt(l.produzione_richiesta)}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-[0.65rem] text-muted-foreground">Target 75gg</p>
                    <p className="font-semibold text-primary">
                      {l.giornaliero_45 != null ? `${l.giornaliero_45}%/gg` : "—"}
                    </p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-[0.65rem] text-muted-foreground">Target 90gg</p>
                    <p className="font-semibold text-accent">
                      {l.giornaliero_90 != null ? `${l.giornaliero_90}%/gg` : "—"}
                    </p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-[0.65rem] text-muted-foreground">Bonus potenziale</p>
                    <p className="font-semibold text-foreground">
                      {l.bonus_percentuale}% · {formatUsdt(l.bonus_valore)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                      <Network className="h-3.5 w-3.5 text-primary" /> Rete
                    </div>
                    <p className="text-muted-foreground">
                      Profondità e produzione contano solo con utenti attivi, non solo registrati.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                      <Gift className="h-3.5 w-3.5 text-primary" /> Pool sbloccata
                    </div>
                    <p className="text-muted-foreground">{fundName(l.pool_id, l.name)}</p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                      <Wallet className="h-3.5 w-3.5 text-primary" /> Saldo utilizzabile
                    </div>
                    <p className="text-muted-foreground">Solo saldo disponibile, bonus disponibili o nuovo deposito.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-2 text-[0.7rem] text-muted-foreground">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                    <Lock className="h-3.5 w-3.5 text-primary" /> Capitale bloccato
                  </div>
                  I livelli sbloccano vantaggi futuri, ma non liberano capitale già investito e non cambiano i piani già
                  attivi.
                </div>

                {l.note && <p className="text-[0.7rem] italic text-muted-foreground">{l.note}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
