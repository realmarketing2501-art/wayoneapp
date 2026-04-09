import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, RefreshCw, AlertTriangle, CheckCircle, Clock,
  Eye, Loader2, Radio, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WatcherTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watcherStates = [] } = useQuery({
    queryKey: ['admin_watcher_state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watcher_state')
        .select('*')
        .order('network');
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: detectedTxs = [] } = useQuery({
    queryKey: ['admin_detected_txs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('detected_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const { data: pendingIntents = [] } = useQuery({
    queryKey: ['admin_pending_intents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_intents')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const triggerWatcher = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('deposit-watcher');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_watcher_state'] });
      queryClient.invalidateQueries({ queryKey: ['admin_detected_txs'] });
      toast({ title: 'Watcher eseguito', description: `Matched: ${data?.matched || 0}` });
    },
    onError: (e: Error) => toast({ title: 'Errore watcher', description: e.message, variant: 'destructive' }),
  });

  const needsReview = detectedTxs.filter((tx: any) => tx.status === 'needs_review');
  const credited = detectedTxs.filter((tx: any) => tx.status === 'credited');

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      idle: { label: 'Idle', variant: 'secondary' },
      syncing: { label: 'Syncing...', variant: 'default' },
      error: { label: 'Errore', variant: 'destructive' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant} className="text-[0.6rem]">{s.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Trigger manual */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Blockchain Watcher</h3>
        <Button size="sm" onClick={() => triggerWatcher.mutate()} disabled={triggerWatcher.isPending}>
          {triggerWatcher.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
          Esegui ora
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card><CardContent className="p-3 text-center">
          <Radio className="mx-auto h-4 w-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{pendingIntents.length}</p>
          <p className="text-[0.6rem] text-muted-foreground">Intent pendenti</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Eye className="mx-auto h-4 w-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{detectedTxs.length}</p>
          <p className="text-[0.6rem] text-muted-foreground">Tx rilevate</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <CheckCircle className="mx-auto h-4 w-4 text-green-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{credited.length}</p>
          <p className="text-[0.6rem] text-muted-foreground">Accreditati</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <AlertTriangle className="mx-auto h-4 w-4 text-destructive mb-1" />
          <p className="text-lg font-bold text-foreground">{needsReview.length}</p>
          <p className="text-[0.6rem] text-muted-foreground">Da revisione</p>
        </CardContent></Card>
      </div>

      {/* Watcher states */}
      <div className="grid gap-3 sm:grid-cols-2">
        {watcherStates.map((ws: any) => (
          <Card key={ws.id} className={cn(ws.status === 'error' && 'border-destructive/30')}>
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{ws.network}</span>
                </div>
                {statusBadge(ws.status)}
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[0.65rem] text-muted-foreground">
                <div>Ultimo sync: <span className="text-foreground">{ws.last_sync_at ? new Date(ws.last_sync_at).toLocaleString('it-IT') : '—'}</span></div>
                <div>Ultimo blocco: <span className="text-foreground font-mono">{ws.last_block_number || '—'}</span></div>
                <div>Rilevati: <span className="text-foreground">{ws.total_detected}</span></div>
                <div>Confermati: <span className="text-foreground">{ws.total_confirmed}</span></div>
                <div>Accreditati: <span className="text-foreground">{ws.total_credited}</span></div>
                <div>Errori: <span className={cn("text-foreground", ws.total_errors > 0 && "text-destructive")}>{ws.total_errors}</span></div>
              </div>
              {ws.last_error && (
                <div className="rounded bg-destructive/10 p-2 text-[0.6rem] text-destructive">
                  {ws.last_error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs review */}
      {needsReview.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-3.5">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Transazioni da revisione
            </h4>
            <div className="space-y-2">
              {needsReview.map((tx: any) => (
                <div key={tx.id} className="rounded-lg border border-border p-2.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono text-foreground">{Number(tx.amount).toFixed(2)} USDT</span>
                    <Badge variant="destructive" className="text-[0.55rem]">{tx.network}</Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-[0.6rem] truncate">TxHash: {tx.tx_hash}</p>
                  <p className="text-muted-foreground text-[0.6rem]">Da: {tx.from_address}</p>
                  {tx.processing_error && <p className="text-destructive text-[0.6rem]">{tx.processing_error}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent detected txs */}
      <Card>
        <CardContent className="p-3.5">
          <h4 className="text-sm font-semibold text-foreground mb-2">Ultime transazioni rilevate</h4>
          {detectedTxs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nessuna transazione rilevata</p>
          ) : (
            <div className="space-y-2">
              {detectedTxs.slice(0, 20).map((tx: any) => {
                const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
                  detected: { label: 'Rilevata', variant: 'secondary' },
                  credited: { label: 'Accreditata', variant: 'default' },
                  needs_review: { label: 'Review', variant: 'destructive' },
                  pending_confirmations: { label: 'Conferme', variant: 'outline' },
                };
                const s = statusMap[tx.status] || { label: tx.status, variant: 'outline' as const };
                return (
                  <div key={tx.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 text-xs">
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-foreground">{Number(tx.amount).toFixed(2)} USDT</p>
                      <p className="text-[0.6rem] text-muted-foreground truncate">{tx.network} · {tx.tx_hash?.slice(0, 16)}... · {new Date(tx.created_at).toLocaleString('it-IT')}</p>
                    </div>
                    <Badge variant={s.variant} className="shrink-0 text-[0.55rem]">{s.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
