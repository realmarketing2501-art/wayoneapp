import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Layers, Save } from 'lucide-react';
import { useLevels, type LevelConfig } from '@/hooks/useLevels';

export default function CompensationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: levels = [], isLoading } = useLevels();
  const [edits, setEdits] = useState<Record<string, Partial<LevelConfig>>>({});

  const saveMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LevelConfig> }) => {
      const { error } = await supabase.from('levels').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      setEdits({});
      toast({ title: 'Configurazione salvata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const update = (id: string, patch: Partial<LevelConfig>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const merged = (l: LevelConfig): LevelConfig => ({ ...l, ...(edits[l.id] ?? {}) });

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <Card>
      <CardContent className="p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Livelli Way One</h4>
        </div>
        <div className="space-y-2">
          {levels.map((orig) => {
            const l = merged(orig);
            const dirty = !!edits[l.id];
            return (
              <div key={l.id} className="rounded-lg border border-border bg-card p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{l.name}</p>
                    <p className="text-[0.6rem] text-muted-foreground">{l.id} · ordine {l.ordine}</p>
                  </div>
                  {dirty && (
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveMutation.mutate({ id: l.id, patch: edits[l.id] })} disabled={saveMutation.isPending}>
                      <Save className="h-3 w-3" /> Salva
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">% 45gg</Label>
                    <Input type="number" step="0.1" value={l.giornaliero_45 ?? ''} onChange={(e) => update(l.id, { giornaliero_45: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">% 90gg</Label>
                    <Input type="number" step="0.1" value={l.giornaliero_90 ?? ''} onChange={(e) => update(l.id, { giornaliero_90: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Unità req</Label>
                    <Input type="number" value={l.unita_richieste ?? ''} onChange={(e) => update(l.id, { unita_richieste: e.target.value === '' ? null : parseInt(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Produzione req</Label>
                    <Input type="number" value={l.produzione_richiesta ?? ''} onChange={(e) => update(l.id, { produzione_richiesta: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Bonus %</Label>
                    <Input type="number" step="0.1" value={l.bonus_percentuale} onChange={(e) => update(l.id, { bonus_percentuale: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Bonus valore</Label>
                    <Input type="number" value={l.bonus_valore} onChange={(e) => update(l.id, { bonus_valore: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Min invest</Label>
                    <Input type="number" value={l.investimento_min ?? ''} onChange={(e) => update(l.id, { investimento_min: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Max invest</Label>
                    <Input type="number" value={l.investimento_max ?? ''} onChange={(e) => update(l.id, { investimento_max: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                </div>
                {l.note && <Badge variant="secondary" className="text-[0.6rem]">{l.note}</Badge>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
