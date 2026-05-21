import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Layers, Save, Trash2 } from 'lucide-react';
import { useLevels, type LevelConfig } from '@/hooks/useLevels';

export default function CompensationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: levels = [], isLoading } = useLevels();
  const [edits, setEdits] = useState<Record<string, Partial<LevelConfig>>>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // Durate configurabili dei due slot di rendita (giornaliero_45 / giornaliero_90)
  const { data: planDays } = useQuery({
    queryKey: ['level_plan_days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key,value')
        .in('key', ['level_plan_short_days', 'level_plan_long_days']);
      if (error) throw error;
      const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
      return {
        short: Number(map.level_plan_short_days ?? 45),
        long: Number(map.level_plan_long_days ?? 90),
      };
    },
    staleTime: 30_000,
  });
  const [daysEdit, setDaysEdit] = useState<{ short?: number; long?: number }>({});
  const shortDays = daysEdit.short ?? planDays?.short ?? 45;
  const longDays = daysEdit.long ?? planDays?.long ?? 90;
  const daysDirty = daysEdit.short !== undefined || daysEdit.long !== undefined;

  const saveDays = useMutation({
    mutationFn: async () => {
      const updates: { key: string; value: string }[] = [];
      if (daysEdit.short !== undefined) updates.push({ key: 'level_plan_short_days', value: String(daysEdit.short) });
      if (daysEdit.long !== undefined) updates.push({ key: 'level_plan_long_days', value: String(daysEdit.long) });
      for (const u of updates) {
        const { error } = await supabase.from('admin_settings').update({ value: u.value }).eq('key', u.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['level_plan_days'] });
      setDaysEdit({});
      toast({ title: 'Durate piani salvate' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Guardrail: blocca se ci sono utenti su questo livello
      const { count: usersOnLevel, error: e1 } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true }).eq('level', id as any);
      if (e1) throw e1;
      if ((usersOnLevel ?? 0) > 0) {
        throw new Error(`Impossibile eliminare: ${usersOnLevel} utenti sono ancora su questo livello.`);
      }
      // Guardrail: blocca se piani lo richiedono come min_level
      const { count: plansUsing, error: e2 } = await supabase
        .from('investment_plans').select('*', { count: 'exact', head: true }).eq('min_level', id as any);
      if (e2) throw e2;
      if ((plansUsing ?? 0) > 0) {
        throw new Error(`Impossibile eliminare: ${plansUsing} piani richiedono questo livello.`);
      }
      const { error } = await supabase.from('levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      setConfirmDel(null);
      toast({ title: 'Livello eliminato' });
    },
    onError: (e: Error) => {
      setConfirmDel(null);
      toast({ title: 'Eliminazione bloccata', description: e.message, variant: 'destructive' });
    },
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

        {/* Durate dei due slot di rendita giornaliera (modificabili) */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
          <p className="text-[0.65rem] font-semibold text-foreground mb-1.5">
            Durate piani (giorni) — usate dalle colonne % qui sotto
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label className="text-[0.6rem] text-muted-foreground">Piano breve (giorni)</Label>
              <Input
                type="number"
                value={shortDays}
                onChange={(e) => setDaysEdit((d) => ({ ...d, short: parseInt(e.target.value) || 0 }))}
                className="h-7 w-28 text-xs"
              />
            </div>
            <div>
              <Label className="text-[0.6rem] text-muted-foreground">Piano lungo (giorni)</Label>
              <Input
                type="number"
                value={longDays}
                onChange={(e) => setDaysEdit((d) => ({ ...d, long: parseInt(e.target.value) || 0 }))}
                className="h-7 w-28 text-xs"
              />
            </div>
            {daysDirty && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveDays.mutate()} disabled={saveDays.isPending}>
                <Save className="h-3 w-3" /> Salva durate
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {levels.map((orig) => {
            const l = merged(orig);
            const dirty = !!edits[l.id];
            return (
              <div key={l.id} className="rounded-lg border border-border bg-card p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Input value={l.name} onChange={(e) => update(l.id, { name: e.target.value })} className="h-7 text-xs font-semibold" />
                    <p className="text-[0.6rem] text-muted-foreground mt-0.5">codice: {l.id}</p>
                  </div>
                  {dirty && (
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveMutation.mutate({ id: l.id, patch: edits[l.id] })} disabled={saveMutation.isPending}>
                      <Save className="h-3 w-3" /> Salva
                    </Button>
                  )}
                  {confirmDel === l.id ? (
                    <>
                      <Button size="sm" variant="destructive" className="h-7 text-[0.65rem]" onClick={() => deleteMutation.mutate(l.id)} disabled={deleteMutation.isPending}>
                        Conferma
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[0.65rem]" onClick={() => setConfirmDel(null)}>
                        Annulla
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setConfirmDel(l.id)} title="Elimina livello">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Ordine</Label>
                    <Input type="number" value={l.ordine ?? ''} onChange={(e) => update(l.id, { ordine: parseInt(e.target.value) || 0 })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Durata (giorni)</Label>
                    <Input type="number" value={l.durata_giorni ?? ''} onChange={(e) => update(l.id, { durata_giorni: e.target.value === '' ? null : parseInt(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">% {shortDays}gg</Label>
                    <Input type="number" step="0.1" value={l.giornaliero_45 ?? ''} onChange={(e) => update(l.id, { giornaliero_45: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">% {longDays}gg</Label>
                    <Input type="number" step="0.1" value={l.giornaliero_90 ?? ''} onChange={(e) => update(l.id, { giornaliero_90: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">% Settimanale</Label>
                    <Input type="number" step="0.1" value={l.settimanale ?? ''} onChange={(e) => update(l.id, { settimanale: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-7 text-xs" />
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
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Prossimo livello</Label>
                    <Input value={l.prossimo_livello ?? ''} onChange={(e) => update(l.id, { prossimo_livello: (e.target.value || null) as any })} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                      <input type="checkbox" checked={l.rete} onChange={(e) => update(l.id, { rete: e.target.checked })} />
                      Rete attiva
                    </label>
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <Label className="text-[0.6rem] text-muted-foreground">Note</Label>
                    <Input value={l.note ?? ''} onChange={(e) => update(l.id, { note: e.target.value || null })} className="h-7 text-xs" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
