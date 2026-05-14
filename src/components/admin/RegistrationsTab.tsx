import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Search, Globe, Smartphone, Mail, Check } from 'lucide-react';

type SignupEvent = {
  id: string;
  user_id: string;
  email: string | null;
  provider: string;
  event_type: string;
  ip: string | null;
  os: string | null;
  device_type: string | null;
  fingerprint_hash: string | null;
  created_at: string;
};

type Anomaly = {
  id: string;
  user_id: string;
  match_user_id: string | null;
  type: string;
  severity: string;
  details: any;
  resolved: boolean;
  created_at: string;
};

const ANOMALY_LABEL: Record<string, string> = {
  duplicate_ip: 'Stesso IP',
  duplicate_fingerprint: 'Stesso device',
  duplicate_google_sub: 'Stesso account Google',
  duplicate_wallet: 'Stesso wallet',
};

const SEVERITY_COLOR: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-500',
  medium: 'bg-amber-500/15 text-amber-500',
  high: 'bg-destructive/15 text-destructive',
};

export default function RegistrationsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['signup_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signup_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as SignupEvent[];
    },
  });

  const { data: anomalies = [] } = useQuery({
    queryKey: ['account_anomalies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_anomalies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Anomaly[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin_profiles_min'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, username, is_suspended');
      if (error) throw error;
      return data;
    },
  });

  const usernameMap = new Map(profiles.map((p) => [p.user_id, p.username]));

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_anomalies')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account_anomalies'] });
      toast({ title: 'Anomalia risolta' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').update({ is_suspended: true }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_profiles_min'] });
      qc.invalidateQueries({ queryKey: ['admin_profiles'] });
      toast({ title: 'Utente sospeso' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.email?.toLowerCase().includes(q) ||
      e.ip?.includes(q) ||
      usernameMap.get(e.user_id)?.toLowerCase().includes(q)
    );
  });

  const openAnomalies = anomalies.filter((a) => !a.resolved);
  const anomalyCountByUser = anomalies.reduce<Record<string, number>>((acc, a) => {
    if (!a.resolved) acc[a.user_id] = (acc[a.user_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Registrazioni totali</p>
          <p className="font-display text-lg font-bold text-foreground">{events.filter(e => e.event_type === 'signup').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Anomalie aperte</p>
          <p className="font-display text-lg font-bold text-destructive">{openAnomalies.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Login (24h)</p>
          <p className="font-display text-lg font-bold text-primary">
            {events.filter(e => e.event_type === 'login' && Date.now() - new Date(e.created_at).getTime() < 86_400_000).length}
          </p>
        </CardContent></Card>
      </div>

      {/* Anomalie attive */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldAlert className="h-4 w-4 text-destructive" /> Anomalie attive ({openAnomalies.length})
        </h4>
        {openAnomalies.length === 0 && (
          <p className="text-xs text-muted-foreground">Nessuna anomalia da revisionare.</p>
        )}
        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
          {openAnomalies.map((a) => (
            <Card key={a.id} className="border-destructive/30">
              <CardContent className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={SEVERITY_COLOR[a.severity] ?? ''}>{a.severity}</Badge>
                      <Badge variant="outline" className="text-[0.6rem]">{ANOMALY_LABEL[a.type] ?? a.type}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-foreground">
                      <span className="font-semibold">{usernameMap.get(a.user_id) ?? a.user_id.slice(0, 8)}</span>
                      {a.match_user_id && (
                        <> ↔ <span className="font-semibold">{usernameMap.get(a.match_user_id) ?? a.match_user_id.slice(0, 8)}</span></>
                      )}
                    </p>
                    {a.details && (
                      <p className="mt-0.5 text-[0.65rem] text-muted-foreground truncate">
                        {Object.entries(a.details).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                      </p>
                    )}
                    <p className="text-[0.6rem] text-muted-foreground">
                      {new Date(a.created_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="destructive" className="h-7 flex-1 text-[0.65rem]"
                    onClick={() => suspendMutation.mutate(a.user_id)}
                    disabled={suspendMutation.isPending}
                  >
                    Sospendi utente
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-[0.65rem]"
                    onClick={() => resolveMutation.mutate(a.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <Check className="h-3 w-3" /> Risolvi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Registrazioni */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Eventi recenti</h4>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca email, IP, username..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
          {filtered.map((e) => {
            const flagCount = anomalyCountByUser[e.user_id] ?? 0;
            return (
              <Card key={e.id}>
                <CardContent className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={e.event_type === 'signup' ? 'default' : 'secondary'} className="text-[0.55rem]">
                          {e.event_type}
                        </Badge>
                        <Badge variant="outline" className="text-[0.55rem]">{e.provider}</Badge>
                        {flagCount > 0 && (
                          <Badge className="bg-destructive/15 text-destructive text-[0.55rem]">
                            {flagCount} anomali{flagCount === 1 ? 'a' : 'e'}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-foreground">
                        {usernameMap.get(e.user_id) ?? e.user_id.slice(0, 8)} · {e.email ?? '—'}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6rem] text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{e.ip ?? '—'}</span>
                        <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" />{e.os ?? '—'} / {e.device_type ?? '—'}</span>
                        {e.fingerprint_hash && (
                          <span className="font-mono">fp: {e.fingerprint_hash.slice(0, 10)}…</span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-[0.55rem] text-muted-foreground">
                      {new Date(e.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Nessun evento.</p>
          )}
        </div>
      </div>
    </div>
  );
}
