import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, ListChecks } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string;
  type: string;
  total: number;
  reward: number;
  active: boolean;
};

const EMPTY: Omit<Task, 'id'> = {
  title: '',
  description: '',
  type: 'invite',
  total: 1,
  reward: 1,
  active: true,
};

function Fields({ t, onChange }: { t: Omit<Task, 'id'>; onChange: (v: Partial<Task>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <Label className="text-[0.6rem] text-muted-foreground">Titolo</Label>
        <Input value={t.title} onChange={(e) => onChange({ title: e.target.value })} className="h-7 text-xs" />
      </div>
      <div className="col-span-2">
        <Label className="text-[0.6rem] text-muted-foreground">Descrizione</Label>
        <Textarea value={t.description} onChange={(e) => onChange({ description: e.target.value })} rows={2} className="text-xs" />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Tipo</Label>
        <Input value={t.type} onChange={(e) => onChange({ type: e.target.value })} className="h-7 text-xs" placeholder="invite / deposit / invest" />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Obiettivo</Label>
        <Input type="number" inputMode="numeric" value={t.total} onChange={(e) => onChange({ total: parseInt(e.target.value) || 1 })} className="h-7 text-xs" />
      </div>
      <div>
        <Label className="text-[0.6rem] text-muted-foreground">Ricompensa USDT</Label>
        <Input type="number" inputMode="decimal" step="0.01" value={t.reward} onChange={(e) => onChange({ reward: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" />
      </div>
      <div className="flex items-end gap-2">
        <Switch checked={t.active} onCheckedChange={(v) => onChange({ active: v })} />
        <span className="text-xs">Attiva</span>
      </div>
    </div>
  );
}

export default function TasksTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<Task>>>({});
  const [creating, setCreating] = useState<Omit<Task, 'id'> | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin_task_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from('task_templates').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_task_templates'] });
      qc.invalidateQueries({ queryKey: ['task_templates'] });
      setEdits({});
      toast({ title: 'Attività aggiornata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const create = useMutation({
    mutationFn: async (payload: Omit<Task, 'id'>) => {
      const { error } = await supabase.from('task_templates').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_task_templates'] });
      qc.invalidateQueries({ queryKey: ['task_templates'] });
      setCreating(null);
      toast({ title: 'Attività creata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_task_templates'] });
      qc.invalidateQueries({ queryKey: ['task_templates'] });
      toast({ title: 'Attività eliminata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const merged = (t: Task): Task => ({ ...t, ...(edits[t.id] ?? {}) });
  const update = (id: string, patch: Partial<Task>) =>
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
          <ListChecks className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Attività utente</h4>
        </div>
        {!creating && (
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setCreating(EMPTY)}>
            <Plus className="h-3 w-3" /> Nuova
          </Button>
        )}
      </div>

      {creating && (
        <Card className="border-primary/40">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold">Nuova attività</p>
            <Fields t={creating} onChange={(v) => setCreating({ ...creating, ...v })} />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => create.mutate(creating)} disabled={create.isPending || !creating.title}>
                {create.isPending ? 'Creazione…' : 'Crea'}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCreating(null)}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.map((orig) => {
        const t = merged(orig);
        const dirty = !!edits[orig.id];
        return (
          <Card key={orig.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.title || '—'}</p>
                  <div className="flex gap-1 mt-0.5">
                    <Badge variant="secondary" className="text-[0.55rem]">{t.type}</Badge>
                    <Badge variant={t.active ? 'default' : 'outline'} className="text-[0.55rem]">
                      {t.active ? 'attiva' : 'disattiva'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {dirty && (
                    <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => save.mutate({ id: orig.id, patch: edits[orig.id] })} disabled={save.isPending}>
                      <Save className="h-3 w-3" /> Salva
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1 text-xs"
                    onClick={() => { if (confirm(`Eliminare l'attività "${t.title}"?`)) remove.mutate(orig.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Fields t={t} onChange={(v) => update(orig.id, v)} />
            </CardContent>
          </Card>
        );
      })}

      {tasks.length === 0 && !creating && (
        <p className="py-8 text-center text-sm text-muted-foreground">Nessuna attività. Creane una con "Nuova".</p>
      )}
    </div>
  );
}
