import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Layers, ArrowUpDown, Gift, Save, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelConfig {
  name: string;
  label: string;
  rate: number;
  order: number;
  active: boolean;
}

interface WithdrawalConfig {
  key: string;
  label: string;
  hours: number;
  fee_pct: number;
  active: boolean;
}

function useAdminSetting<T>(key: string, fallback: T) {
  return useQuery({
    queryKey: ['admin_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single();
      if (error) throw error;
      return JSON.parse(data.value) as T;
    },
  });
}

export default function CompensationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: levels = [], isLoading: levelsLoading } = useAdminSetting<LevelConfig[]>('level_config', []);
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useAdminSetting<WithdrawalConfig[]>('withdrawal_config', []);

  const [editLevels, setEditLevels] = useState<LevelConfig[] | null>(null);
  const [editWithdrawals, setEditWithdrawals] = useState<WithdrawalConfig[] | null>(null);

  const currentLevels = editLevels ?? levels;
  const currentWithdrawals = editWithdrawals ?? withdrawals;

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
      setEditLevels(null);
      setEditWithdrawals(null);
      toast({ title: 'Configurazione salvata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const saveLevels = () => {
    if (!editLevels) return;
    saveMutation.mutate({ key: 'level_config', value: JSON.stringify(editLevels) });
  };

  const saveWithdrawals = () => {
    if (!editWithdrawals) return;
    saveMutation.mutate({ key: 'withdrawal_config', value: JSON.stringify(editWithdrawals) });
  };

  const updateLevel = (idx: number, patch: Partial<LevelConfig>) => {
    const arr = [...(editLevels ?? levels)];
    arr[idx] = { ...arr[idx], ...patch };
    setEditLevels(arr);
  };

  const updateWithdrawal = (idx: number, patch: Partial<WithdrawalConfig>) => {
    const arr = [...(editWithdrawals ?? withdrawals)];
    arr[idx] = { ...arr[idx], ...patch };
    setEditWithdrawals(arr);
  };

  if (levelsLoading || withdrawalsLoading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Levels Section */}
      <Card>
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Livelli Utente</h4>
            </div>
            {editLevels && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveLevels} disabled={saveMutation.isPending}>
                <Save className="h-3 w-3" /> Salva
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {currentLevels.map((l, i) => (
              <div key={l.name} className={cn(
                'flex items-center gap-2 rounded-lg border p-2.5 transition-colors',
                l.active ? 'border-border bg-card' : 'border-border/50 bg-muted/50 opacity-60'
              )}>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Nome</Label>
                    <Input
                      value={l.label}
                      onChange={e => updateLevel(i, { label: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Rendimento %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={l.rate}
                      onChange={e => updateLevel(i, { rate: parseFloat(e.target.value) || 0 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Ordine</Label>
                    <Input
                      type="number"
                      value={l.order}
                      onChange={e => updateLevel(i, { order: parseInt(e.target.value) || 0 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="space-y-0.5">
                      <Label className="text-[0.6rem] text-muted-foreground">Attivo</Label>
                      <div>
                        <Switch
                          checked={l.active}
                          onCheckedChange={v => updateLevel(i, { active: v })}
                        />
                      </div>
                    </div>
                    <Badge variant={l.active ? 'default' : 'secondary'} className="text-[0.55rem] mb-1">
                      {l.active ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Rules Section */}
      <Card>
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Regole Prelievo</h4>
            </div>
            {editWithdrawals && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveWithdrawals} disabled={saveMutation.isPending}>
                <Save className="h-3 w-3" /> Salva
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {currentWithdrawals.map((w, i) => (
              <div key={w.key} className={cn(
                'flex items-center gap-2 rounded-lg border p-2.5 transition-colors',
                w.active ? 'border-border bg-card' : 'border-border/50 bg-muted/50 opacity-60'
              )}>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Nome</Label>
                    <Input
                      value={w.label}
                      onChange={e => updateWithdrawal(i, { label: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Ore</Label>
                    <Input
                      type="number"
                      value={w.hours}
                      onChange={e => updateWithdrawal(i, { hours: parseInt(e.target.value) || 0 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[0.6rem] text-muted-foreground">Fee %</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={w.fee_pct}
                      onChange={e => updateWithdrawal(i, { fee_pct: parseFloat(e.target.value) || 0 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="space-y-0.5">
                      <Label className="text-[0.6rem] text-muted-foreground">Attivo</Label>
                      <div>
                        <Switch
                          checked={w.active}
                          onCheckedChange={v => updateWithdrawal(i, { active: v })}
                        />
                      </div>
                    </div>
                    <Badge variant={w.active ? 'default' : 'secondary'} className="text-[0.55rem] mb-1">
                      {w.active ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bonus Placeholder */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Bonus Produzione / Rete</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Questa sezione è predisposta per la configurazione futura dei bonus produzione e rete.
            La struttura dati è già presente nel database e potrà essere attivata dall'admin.
          </p>
          <Badge variant="secondary" className="mt-2 text-[0.6rem]">In arrivo</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
