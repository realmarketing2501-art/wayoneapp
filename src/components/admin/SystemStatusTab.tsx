import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, AlertTriangle, CheckCircle2, RefreshCw, PlayCircle,
  Database, Clock, TrendingUp, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ConsistencyRow = {
  user_id: string;
  username: string;
  issue_type: string;
  severity: string;
  expected: number;
  actual: number;
  diff: number;
  details: string;
};

const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'pochi sec fa';
  if (mins < 60) return `${mins} min fa`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h fa`;
  return d.toLocaleString('it-IT');
};

export default function SystemStatusTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState<string | null>(null);

  // Watcher state per network
  const { data: watchers = [], refetch: refetchWatchers } = useQuery({
    queryKey: ['admin_watcher_state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watcher_state')
        .select('*')
        .order('network');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Last cron-driven activities
  const { data: lastDailyPayout } = useQuery({
    queryKey: ['admin_last_daily_payout'],
    queryFn: async () => {
      const { data } = await supabase
        .from('income_records')
        .select('created_at')
        .eq('type', 'daily_interest')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.created_at as string | undefined;
    },
    refetchInterval: 60000,
  });

  const { data: lastMatchedDeposit } = useQuery({
    queryKey: ['admin_last_matched_deposit'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deposit_intents')
        .select('updated_at, amount_usd, network')
        .eq('status', 'matched')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: pendingCounts } = useQuery({
    queryKey: ['admin_pending_counts'],
    queryFn: async () => {
      const [intents, withdrawals, anomalies] = await Promise.all([
        supabase.from('deposit_intents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('account_anomalies').select('id', { count: 'exact', head: true }).eq('resolved', false),
      ]);
      return {
        pendingIntents: intents.count ?? 0,
        pendingWithdrawals: withdrawals.count ?? 0,
        openAnomalies: anomalies.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  // Consistency check (manual run)
  const {
    data: consistency = [],
    refetch: runConsistency,
    isFetching: checking,
  } = useQuery<ConsistencyRow[]>({
    queryKey: ['admin_consistency_check'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('system_consistency_check');
      if (error) throw error;
      return (data as ConsistencyRow[]) || [];
    },
    enabled: false,
  });

  const triggerWatcher = useMutation({
    mutationFn: async () => {
      setRunning('deposit-watcher');
      const { data, error } = await supabase.functions.invoke('deposit-watcher', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Deposit watcher eseguito',
        description: `Match: ${data?.matched ?? 0} · Scaduti: ${data?.expired ?? 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin_watcher_state'] });
      refetchWatchers();
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
    onSettled: () => setRunning(null),
  });

  const triggerDailyReturns = useMutation({
    mutationFn: async () => {
      setRunning('daily-returns');
      const { data, error } = await supabase.functions.invoke('daily-returns', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({ title: 'Daily returns eseguito', description: JSON.stringify(data).slice(0, 120) });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
    onSettled: () => setRunning(null),
  });

  const issuesBySeverity = {
    high: consistency.filter((c) => c.severity === 'high').length,
    medium: consistency.filter((c) => c.severity === 'medium').length,
    low: consistency.filter((c) => c.severity === 'low').length,
  };

  return (
    <div className="space-y-4">
      {/* JOB STATUS */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Stato Job & Cron</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { refetchWatchers(); }}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {watchers.map((w: any) => {
              const healthy = w.status === 'idle' || w.status === 'ok';
              const errored = w.status === 'error' || (w.last_error && w.last_error_at);
              return (
                <div key={w.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold">{w.network}</span>
                    <Badge variant={errored ? 'destructive' : healthy ? 'default' : 'secondary'} className="text-[0.55rem]">
                      {w.status}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[0.65rem] text-muted-foreground">
                    <span>Ultima sync:</span><span className="font-mono text-foreground">{fmtTime(w.last_sync_at)}</span>
                    <span>Block #:</span><span className="font-mono text-foreground">{w.last_block_number ?? '—'}</span>
                    <span>Rilevati:</span><span className="font-mono text-foreground">{w.total_detected}</span>
                    <span>Confermati:</span><span className="font-mono text-foreground">{w.total_confirmed}</span>
                    <span>Accreditati:</span><span className="font-mono text-emerald-500">{w.total_credited}</span>
                    <span>Errori:</span><span className="font-mono text-rose-500">{w.total_errors}</span>
                  </div>
                  {w.last_error && (
                    <p className="mt-2 truncate rounded bg-destructive/10 px-2 py-1 text-[0.6rem] text-destructive" title={w.last_error}>
                      {w.last_error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-3">
            <JobRow icon={Database} label="Ultimo deposito accreditato" value={fmtTime(lastMatchedDeposit?.updated_at)} hint={lastMatchedDeposit ? `${lastMatchedDeposit.amount_usd} USDT · ${lastMatchedDeposit.network}` : ''} />
            <JobRow icon={TrendingUp} label="Ultimo daily-returns" value={fmtTime(lastDailyPayout)} hint="cron 02:00 UTC" />
            <JobRow icon={Clock} label="In attesa" value={`${pendingCounts?.pendingIntents ?? 0} D · ${pendingCounts?.pendingWithdrawals ?? 0} W`} hint={`${pendingCounts?.openAnomalies ?? 0} anomalie aperte`} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={() => triggerWatcher.mutate()} disabled={running !== null} className="gap-1.5">
              {running === 'deposit-watcher' ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
              Esegui deposit-watcher
            </Button>
            <Button size="sm" variant="outline" onClick={() => triggerDailyReturns.mutate()} disabled={running !== null} className="gap-1.5">
              {running === 'daily-returns' ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
              Esegui daily-returns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CONSISTENCY CHECK */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Controllo Coerenza Sistema</h3>
            </div>
            <Button size="sm" onClick={() => runConsistency()} disabled={checking} className="gap-1.5">
              {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {consistency.length === 0 && !checking ? 'Esegui scan' : 'Riesegui'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Verifica saldo profilo vs ledger, capitale bloccato vs investimenti attivi e metriche MLM (units).
          </p>

          {checking && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisi in corso...
            </div>
          )}

          {!checking && consistency.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Nessuna incoerenza rilevata. Premi "Esegui scan" per ricontrollare.
            </div>
          )}

          {!checking && consistency.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="destructive" className="text-[0.6rem]">{issuesBySeverity.high} critiche</Badge>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 text-[0.6rem]">{issuesBySeverity.medium} medie</Badge>
                <Badge variant="outline" className="text-[0.6rem]">{issuesBySeverity.low} minori</Badge>
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-[0.7rem]">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-2 py-1.5">Sev.</th>
                      <th className="px-2 py-1.5">Utente</th>
                      <th className="px-2 py-1.5">Tipo</th>
                      <th className="px-2 py-1.5 text-right">Atteso</th>
                      <th className="px-2 py-1.5 text-right">Reale</th>
                      <th className="px-2 py-1.5 text-right">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consistency.map((row, i) => (
                      <tr key={i} className="border-b border-border/40 last:border-0" title={row.details}>
                        <td className="px-2 py-1.5">
                          <span className={cn(
                            'inline-flex h-2 w-2 rounded-full',
                            row.severity === 'high' ? 'bg-rose-500' :
                            row.severity === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'
                          )} />
                        </td>
                        <td className="px-2 py-1.5 font-mono text-foreground">{row.username}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.issue_type}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{Number(row.expected).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{Number(row.actual).toFixed(2)}</td>
                        <td className={cn('px-2 py-1.5 text-right font-mono font-semibold',
                          Number(row.diff) > 0 ? 'text-rose-500' : 'text-amber-500'
                        )}>{Number(row.diff) > 0 ? '+' : ''}{Number(row.diff).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JobRow({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 font-mono text-xs font-semibold text-foreground">{value}</p>
      {hint && <p className="text-[0.6rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}
