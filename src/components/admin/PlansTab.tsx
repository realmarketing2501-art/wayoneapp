import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, TrendingUp } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  status: string;
  min_level: string;
  duration: number;
  duration_days: number | null;
  daily_return: number | null;
  min_invest: number | null;
  max_invest: number | null;
  pool_total: number;
  pool_filled: number;
};

const STATUSES = ['active', 'paused', 'archived'];
// Mappa codice DB → nome visibile (in ordine di livello MLM)
const LEVELS: { id: string; label: string }[] = [
  { id: 'gamma', label: 'Starter' },
  { id: 'beta', label: 'Silver' },
  { id: 'bronze', label: 'Gold' },
  { id: 'silver', label: 'Platinum' },
  { id: 'silver_elite', label: 'Platinum Elite' },
  { id: 'gold', label: 'Diamond' },
  { id: 'gold_elite', label: 'Diamond Elite' },
  { id: 'oro_vip', label: 'VIP' },
];
const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;

const EMPTY: Omit<Plan, 'id'> = {
  name: '',
  status: 'active',
  min_level: 'gamma',
  duration: 45,
  duration_days: 45,
  daily_return: 1.5,
  min_invest: 50,
  max_invest: 5000,
  pool_total: 100000,
  pool_filled: 0,
};

function FieldGrid({ p, onChange }: { p: Omit<Plan, 'id'>; onChange: (v: Partial<Plan>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <Label className="text-[0.6rem] text-muted-foreground">Nome piano</Label>
        <Input value={p.name} onChange={(e) => onChange({ name: e.target.value })} className="h-7 text-xs" />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Status</Label>
        <Select value={p.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Livello minimo</Label>
        <Select value={p.min_level} onValueChange={(v) => onChange({ min_level: v })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{LEVELS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Durata (giorni)</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={p.duration_days ?? p.duration ?? 0}
          onChange={(e) => {
            const v = parseInt(e.target.value) || 0;
            onChange({ duration_days: v, duration: v });
          }}
          className="h-7 text-xs"
        />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Rendimento %/giorno</Label>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={p.daily_return ?? 0}
          onChange={(e) => onChange({ daily_return: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs"
        />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Min USDT</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={p.min_invest ?? 0}
          onChange={(e) => onChange({ min_invest: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs"
        />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Max USDT</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={p.max_invest ?? 0}
          onChange={(e) => onChange({ max_invest: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs"
        />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Pool totale</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={p.pool_total ?? 0}
          onChange={(e) => onChange({ pool_total: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs"
        />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Pool riempito</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={p.pool_filled ?? 0}
          onChange={(e) => onChange({ pool_filled: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}

export default function PlansTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<Plan>>>({});
  const [creating, setCreating] = useState<Omit<Plan, 'id'> | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin_investment_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('min_invest', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Plan> }) => {
      const p = { ...patch };
      if (p.duration_days !== undefined && p.duration === undefined) p.duration = p.duration_days ?? 0;
      if (p.duration !== undefined && p.duration_days === undefined) p.duration_days = p.duration;
      const { error } = await supabase.from('investment_plans').update(p as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_investment_plans'] });
      qc.invalidateQueries({ queryKey: ['investment_plans'] });
      setEdits({});
      toast({ title: 'Piano aggiornato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const create = useMutation({
    mutationFn: async (payload: Omit<Plan, 'id'>) => {
      const body = { ...payload, duration_days: payload.duration_days ?? payload.duration };
      const { error } = await supabase.from('investment_plans').insert(body as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_investment_plans'] });
      qc.invalidateQueries({ queryKey: ['investment_plans'] });
      setCreating(null);
      toast({ title: 'Piano creato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('investment_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_investment_plans'] });
      qc.invalidateQueries({ queryKey: ['investment_plans'] });
      toast({ title: 'Piano eliminato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const merged = (p: Plan): Plan => ({ ...p, ...(edits[p.id] ?? {}) });
  const update = (id: string, patch: Partial<Plan>) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }




  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Piani di Investimento</h4>
        </div>
        {!creating && (
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setCreating(EMPTY)}>
            <Plus className="h-3 w-3" /> Nuovo piano
          </Button>
        )}
      </div>

      <p className="text-[0.65rem] text-muted-foreground">
        Modifica durata, rendimento giornaliero, importi min/max, pool e stato. Il rendimento totale = giorni × %/giorno.
      </p>

      {creating && (
        <Card className="border-primary/40">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold">Nuovo piano</p>
            <FieldGrid p={creating} onChange={(v) => setCreating({ ...creating, ...v })} />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => create.mutate(creating)}
                disabled={create.isPending || !creating.name}
              >
                {create.isPending ? 'Creazione…' : 'Crea piano'}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCreating(null)}>
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {plans.map((orig) => {
        const p = merged(orig);
        const dirty = !!edits[orig.id];
        const totalReturn = ((p.daily_return ?? 0) * (p.duration_days ?? p.duration ?? 0)).toFixed(2);
        return (
          <Card key={orig.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name || '—'}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <Badge variant="secondary" className="text-[0.55rem]">{p.status}</Badge>
                    <Badge variant="outline" className="text-[0.55rem]">{p.min_level}</Badge>
                    <Badge variant="outline" className="text-[0.55rem]">Tot. {totalReturn}%</Badge>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {dirty && (
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => save.mutate({ id: orig.id, patch: edits[orig.id] })}
                      disabled={save.isPending}
                    >
                      <Save className="h-3 w-3" /> Salva
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      if (confirm(`Eliminare il piano "${p.name}"?`)) remove.mutate(orig.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <FieldGrid p={p} onChange={(v) => update(orig.id, v)} />
            </CardContent>
          </Card>
        );
      })}

      {plans.length === 0 && !creating && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nessun piano. Creane uno con "Nuovo piano".
        </p>
      )}
    </div>
  );
}
