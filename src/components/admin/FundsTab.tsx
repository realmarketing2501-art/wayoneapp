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
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';

type Fund = {
  id: string;
  name: string;
  badge: string;
  total_return: number;
  duration: number;
  min_invest: number;
  max_invest: number;
  raised: number;
  goal: number;
  open_date: string;
  close_date: string;
  status: string;
};

const STATUSES = ['upcoming', 'issuing', 'sold_out', 'ended'];
const STATUS_LABEL: Record<string, string> = {
  upcoming: 'In arrivo',
  issuing: 'Attivo (acquistabile)',
  sold_out: 'Esaurito (goal raggiunto)',
  ended: 'Terminato (scaduto)',
};

const EMPTY: Omit<Fund, 'id'> = {
  name: '',
  badge: 'Special Fund',
  total_return: 15,
  duration: 60,
  min_invest: 100,
  max_invest: 5000,
  raised: 0,
  goal: 100000,
  open_date: new Date().toISOString().slice(0, 10),
  close_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: 'issuing',
};

export default function FundsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<Fund>>>({});
  const [creating, setCreating] = useState<Omit<Fund, 'id'> | null>(null);

  const { data: funds = [], isLoading } = useQuery({
    queryKey: ['admin_funds'],
    queryFn: async () => {
      const { data, error } = await supabase.from('special_funds').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Fund[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Fund> }) => {
      const { error } = await supabase.from('special_funds').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_funds'] });
      qc.invalidateQueries({ queryKey: ['special_funds'] });
      setEdits({});
      toast({ title: 'Fondo aggiornato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const create = useMutation({
    mutationFn: async (payload: Omit<Fund, 'id'>) => {
      const { error } = await supabase.from('special_funds').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_funds'] });
      qc.invalidateQueries({ queryKey: ['special_funds'] });
      setCreating(null);
      toast({ title: 'Fondo creato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('special_funds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_funds'] });
      qc.invalidateQueries({ queryKey: ['special_funds'] });
      toast({ title: 'Fondo eliminato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const merged = (f: Fund): Fund => ({ ...f, ...(edits[f.id] ?? {}) });
  const update = (id: string, patch: Partial<Fund>) =>
    setEdits((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  if (isLoading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const FieldGrid = ({ f, onChange }: { f: Omit<Fund, 'id'>; onChange: (p: Partial<Fund>) => void }) => (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2"><Label className="text-[0.6rem] text-muted-foreground">Nome</Label><Input value={f.name} onChange={(e) => onChange({ name: e.target.value })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Badge</Label><Input value={f.badge} onChange={(e) => onChange({ badge: e.target.value })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Status (auto da date e goal)</Label>
        <Select value={f.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Rendim. tot %</Label><Input type="number" step="0.1" value={f.total_return} onChange={(e) => onChange({ total_return: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Durata gg</Label><Input type="number" value={f.duration} onChange={(e) => onChange({ duration: parseInt(e.target.value) || 0 })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Min USDT</Label><Input type="number" value={f.min_invest} onChange={(e) => onChange({ min_invest: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Max USDT</Label><Input type="number" value={f.max_invest} onChange={(e) => onChange({ max_invest: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Goal</Label><Input type="number" value={f.goal} onChange={(e) => onChange({ goal: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Raised</Label><Input type="number" value={f.raised} onChange={(e) => onChange({ raised: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Apertura</Label><Input type="date" value={f.open_date} onChange={(e) => onChange({ open_date: e.target.value })} className="h-7 text-xs" /></div>
      <div><Label className="text-[0.6rem] text-muted-foreground">Chiusura</Label><Input type="date" value={f.close_date} onChange={(e) => onChange({ close_date: e.target.value })} className="h-7 text-xs" /></div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Fondi Speciali</h4>
        </div>
        {!creating && (
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setCreating(EMPTY)}>
            <Plus className="h-3 w-3" /> Nuovo
          </Button>
        )}
      </div>

      {creating && (
        <Card className="border-primary/40">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold">Nuovo fondo</p>
            <FieldGrid f={creating} onChange={(p) => setCreating({ ...creating, ...p })} />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => create.mutate(creating)} disabled={create.isPending || !creating.name}>
                {create.isPending ? 'Creazione…' : 'Crea fondo'}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCreating(null)}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {funds.map((orig) => {
        const f = merged(orig);
        const dirty = !!edits[orig.id];
        return (
          <Card key={orig.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{f.name}</p>
                  <Badge variant="secondary" className="text-[0.55rem]">{STATUS_LABEL[f.status] ?? f.status}</Badge>
                </div>
                <div className="flex gap-1.5">
                  {dirty && (
                    <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => save.mutate({ id: orig.id, patch: edits[orig.id] })} disabled={save.isPending}>
                      <Save className="h-3 w-3" /> Salva
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs" onClick={() => { if (confirm('Eliminare il fondo?')) remove.mutate(orig.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <FieldGrid f={f} onChange={(p) => update(orig.id, p)} />
            </CardContent>
          </Card>
        );
      })}
      {funds.length === 0 && !creating && (
        <p className="py-8 text-center text-sm text-muted-foreground">Nessun fondo. Creane uno con "Nuovo".</p>
      )}
    </div>
  );
}
