import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LevelBadge } from '@/components/LevelBadge';
import { useLevels } from '@/hooks/useLevels';
import { useProfile } from '@/hooks/useProfile';

export default function QualifichePage() {
  const { data: levels = [], isLoading } = useLevels();
  const { data: profile } = useProfile();
  const currentLevel = profile?.level ?? 'gamma';

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Qualifiche Way One</h2>
        <p className="text-sm text-muted-foreground mt-1">Tabella ufficiale dei livelli, requisiti e rendimenti.</p>
      </div>

      <div className="space-y-3">
        {levels.map((l) => {
          const isCurrent = l.id === currentLevel;
          return (
            <Card key={l.id} className={isCurrent ? 'border-primary/60 bg-primary/5' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <LevelBadge level={l.id} size="md" />
                  {isCurrent && <Badge className="text-[0.65rem]">Tu sei qui</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-muted-foreground text-[0.65rem]">Unità richieste</p>
                    <p className="font-semibold text-foreground">{l.unita_richieste ?? '—'}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-muted-foreground text-[0.65rem]">Produzione richiesta</p>
                    <p className="font-semibold text-foreground">{l.produzione_richiesta ? `${Number(l.produzione_richiesta).toLocaleString()} USDT` : '—'}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-muted-foreground text-[0.65rem]">Rendimento 45gg</p>
                    <p className="font-semibold text-primary">{l.giornaliero_45 != null ? `${l.giornaliero_45}%/gg` : '—'}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-muted-foreground text-[0.65rem]">Rendimento 90gg</p>
                    <p className="font-semibold text-accent">{l.giornaliero_90 != null ? `${l.giornaliero_90}%/gg` : '—'}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-muted-foreground text-[0.65rem]">Bonus %</p>
                    <p className="font-semibold text-foreground">{l.bonus_percentuale}%</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-muted-foreground text-[0.65rem]">Bonus valore</p>
                    <p className="font-semibold text-foreground">{l.bonus_valore.toLocaleString()} USDT</p>
                  </div>
                </div>
                {(l.investimento_min != null || l.investimento_max != null) && (
                  <p className="text-[0.65rem] text-muted-foreground">
                    Investimento: {l.investimento_min ?? 'min libero'} – {l.investimento_max ?? 'max libero'} USDT
                  </p>
                )}
                {l.note && <p className="text-[0.65rem] text-muted-foreground italic">{l.note}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
