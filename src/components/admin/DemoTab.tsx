import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDemoMode } from '@/hooks/useDemoMode';
import { AlertTriangle, FlaskConical, Trash2 } from 'lucide-react';

export default function DemoTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: demoOn = false, isLoading } = useDemoMode();
  const [confirm, setConfirm] = useState('');

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'demo_mode', value: next ? 'true' : 'false' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: (_, next) => {
      qc.invalidateQueries({ queryKey: ['demo_mode'] });
      toast({ title: next ? 'Modalità Demo attivata' : 'Modalità Demo disattivata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const wipe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('admin_wipe_demo_data', { p_confirm: confirm });
      if (error) throw error;
      return data as { deleted_users: number };
    },
    onSuccess: (res) => {
      qc.invalidateQueries();
      setConfirm('');
      toast({ title: 'Dati demo eliminati', description: `Account rimossi: ${res?.deleted_users ?? 0}` });
    },
    onError: (e: Error) => toast({ title: 'Errore wipe', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Modalità Demo</h3>
            {demoOn ? <Badge className="text-[0.6rem]">ATTIVA</Badge> : <Badge variant="secondary" className="text-[0.6rem]">SPENTA</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Quando attiva, gli admin possono accreditare USDT gratuiti agli utenti per testare rete, referral e investimenti.
            In produzione tienila spenta.
          </p>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="text-sm">Abilita accredito test</Label>
            <Switch
              checked={demoOn}
              disabled={isLoading || toggle.isPending}
              onCheckedChange={(v) => toggle.mutate(v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={demoOn ? 'border-destructive/40' : 'opacity-60'}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-display text-sm font-semibold text-destructive">Pulizia dati demo</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Elimina <strong>tutti</strong> gli utenti non-admin e il loro storico (saldi, transazioni, investimenti, fondi, depositi, prelievi, referral).
            Azzera i contatori di piani e fondi. Operazione <strong>irreversibile</strong>. Disponibile solo con Modalità Demo attiva.
          </p>
          <div>
            <Label className="text-xs">Per confermare digita: <code className="font-mono">WIPE</code></Label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="WIPE"
              disabled={!demoOn}
              className="mt-1"
            />
          </div>
          <Button
            variant="destructive"
            className="w-full"
            disabled={!demoOn || confirm !== 'WIPE' || wipe.isPending}
            onClick={() => wipe.mutate()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {wipe.isPending ? 'Pulizia in corso…' : 'Cancella tutti i dati demo'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
