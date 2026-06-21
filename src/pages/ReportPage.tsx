import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, Sparkles, Users, Award,
  Lock, Unlock, Wallet, Download, Search, RefreshCw, Filter
} from 'lucide-react';

type Tx = {
  id: string;
  user_id: string;
  type: string;
  direction: 'in' | 'out' | 'internal';
  amount: number;
  asset: string;
  status: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  balance_after: number | null;
  created_at: string;
};

const TYPE_META: Record<string, { label: string; icon: any; color: string; group: string }> = {
  deposit:            { label: 'Deposito',            icon: ArrowDownLeft, color: 'text-primary',          group: 'Movimenti' },
  withdrawal:         { label: 'Prelievo',            icon: ArrowUpRight,  color: 'text-destructive',      group: 'Movimenti' },
  admin_adjustment:   { label: 'Rettifica admin',     icon: Wallet,        color: 'text-amber-400',        group: 'Movimenti' },
  interest:           { label: 'Interesse piano',     icon: TrendingUp,    color: 'text-primary',          group: 'Rendimenti' },
  fund_interest:      { label: 'Interesse fondo',     icon: Sparkles,      color: 'text-way-diamond',      group: 'Rendimenti' },
  investment_lock:    { label: 'Blocco capitale',     icon: Lock,          color: 'text-muted-foreground', group: 'Investimenti' },
  investment_unlock:  { label: 'Sblocco capitale',    icon: Unlock,        color: 'text-primary',          group: 'Investimenti' },
  fund_lock:          { label: 'Blocco fondo',        icon: Lock,          color: 'text-muted-foreground', group: 'Investimenti' },
  fund_unlock:        { label: 'Sblocco fondo',       icon: Unlock,        color: 'text-way-diamond',      group: 'Investimenti' },
  fund_investment:    { label: 'Investimento fondo',  icon: Sparkles,      color: 'text-way-diamond',      group: 'Investimenti' },
  fund_refund:        { label: 'Rimborso fondo',      icon: Unlock,        color: 'text-primary',          group: 'Investimenti' },
  team:               { label: 'Commissione referral',icon: Users,         color: 'text-accent',           group: 'Network' },
  bonus:              { label: 'Bonus livello',       icon: Award,         color: 'text-amber-400',        group: 'Network' },
  level_bonus:        { label: 'Bonus livello',       icon: Award,         color: 'text-amber-400',        group: 'Network' },
};

const metaFor = (t: string) => TYPE_META[t] ?? { label: t, icon: Wallet, color: 'text-foreground', group: 'Altro' };

const DIR_LABEL: Record<string, string> = { in: 'Entrata', out: 'Uscita', internal: 'Interno' };

export default function ReportPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dirFilter, setDirFilter] = useState<string>('all');
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365' | 'all'>('30');

  const { data: txs = [], isFetching, refetch } = useQuery({
    queryKey: ['report_tx', user?.id, period],
    queryFn: async () => {
      let q = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (period !== 'all') {
        const since = new Date();
        since.setDate(since.getDate() - parseInt(period, 10));
        q = q.gte('created_at', since.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Tx[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    return txs.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (dirFilter !== 'all' && t.direction !== dirFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(t.description ?? '').toLowerCase().includes(s) && !t.type.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [txs, typeFilter, dirFilter, search]);

  const totals = useMemo(() => {
    let inSum = 0, outSum = 0, yieldSum = 0, netSum = 0;
    for (const t of filtered) {
      const a = Number(t.amount) || 0;
      if (t.direction === 'in') { inSum += a; netSum += a; }
      if (t.direction === 'out') { outSum += a; netSum -= a; }
      if (t.type === 'interest' || t.type === 'fund_interest') yieldSum += a;
    }
    return { inSum, outSum, yieldSum, netSum };
  }, [filtered]);

  const groups = useMemo(() => {
    const g: Record<string, { count: number; total: number }> = {};
    for (const t of filtered) {
      const grp = metaFor(t.type).group;
      g[grp] = g[grp] ?? { count: 0, total: 0 };
      g[grp].count += 1;
      const a = Number(t.amount) || 0;
      g[grp].total += t.direction === 'out' ? -a : a;
    }
    return g;
  }, [filtered]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    txs.forEach(t => set.add(t.type));
    return Array.from(set).sort();
  }, [txs]);

  const exportCsv = () => {
    const header = ['data','tipo','categoria','direzione','importo','asset','stato','descrizione','saldo_dopo'];
    const rows = filtered.map(t => {
      const m = metaFor(t.type);
      return [
        new Date(t.created_at).toISOString(),
        t.type,
        m.group,
        t.direction,
        Number(t.amount).toFixed(8),
        t.asset,
        t.status,
        (t.description ?? '').replace(/"/g, '""'),
        t.balance_after != null ? Number(t.balance_after).toFixed(8) : '',
      ];
    });
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wayone_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">Report unificato</h1>
          <p className="text-xs text-muted-foreground">Tutti i movimenti del tuo conto in un unico posto</p>
        </div>
        <div className="flex gap-1.5">
          <Button size="icon" variant="outline" onClick={() => refetch()} className="h-8 w-8">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} className="h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Entrate</p>
          <p className="font-display text-base font-bold text-primary">+{totals.inSum.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Uscite</p>
          <p className="font-display text-base font-bold text-destructive">-{totals.outSum.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Rendimenti</p>
          <p className="font-display text-base font-bold text-accent">{totals.yieldSum.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[0.6rem] text-muted-foreground">Saldo netto periodo</p>
          <p className={`font-display text-base font-bold ${totals.netSum >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {totals.netSum >= 0 ? '+' : ''}{totals.netSum.toFixed(2)}
          </p>
        </CardContent></Card>
      </div>

      {/* Group breakdown */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Suddivisione per categoria</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(groups).map(([g, v]) => (
              <div key={g} className="rounded-lg border border-border p-2">
                <p className="text-[0.6rem] text-muted-foreground">{g}</p>
                <p className="text-sm font-semibold">{v.total >= 0 ? '+' : ''}{v.total.toFixed(2)}</p>
                <p className="text-[0.6rem] text-muted-foreground">{v.count} mov.</p>
              </div>
            ))}
            {Object.keys(groups).length === 0 && (
              <p className="col-span-full py-2 text-center text-xs text-muted-foreground">Nessun movimento nel periodo selezionato</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-2 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold">Filtri</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cerca per descrizione o tipo…" value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-8 text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={period} onValueChange={v => setPeriod(v as any)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Ultimi 7gg</SelectItem>
                <SelectItem value="30">Ultimi 30gg</SelectItem>
                <SelectItem value="90">Ultimi 90gg</SelectItem>
                <SelectItem value="365">Ultimo anno</SelectItem>
                <SelectItem value="all">Tutto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dirFilter} onValueChange={setDirFilter}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Direzione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le direzioni</SelectItem>
                <SelectItem value="in">Entrate</SelectItem>
                <SelectItem value="out">Uscite</SelectItem>
                <SelectItem value="internal">Interne</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {typeOptions.map(t => (
                  <SelectItem key={t} value={t}>{metaFor(t).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Movimenti ({filtered.length})</h3>
          </div>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nessun movimento corrisponde ai filtri.</p>
          ) : (
            <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {filtered.map(t => {
                const m = metaFor(t.type);
                const Icon = m.icon;
                const sign = t.direction === 'out' ? '-' : t.direction === 'in' ? '+' : '';
                const amountColor =
                  t.direction === 'out' ? 'text-destructive'
                  : t.direction === 'in' ? 'text-primary'
                  : 'text-muted-foreground';
                return (
                  <div key={t.id} className="flex items-start gap-3 py-2.5">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${m.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{m.label}</p>
                        <Badge variant="outline" className="h-4 px-1 text-[0.55rem]">{DIR_LABEL[t.direction] ?? t.direction}</Badge>
                        {t.status !== 'completed' && (
                          <Badge variant="outline" className="h-4 px-1 text-[0.55rem]">{t.status}</Badge>
                        )}
                      </div>
                      {t.description && <p className="truncate text-[0.7rem] text-muted-foreground">{t.description}</p>}
                      <p className="text-[0.6rem] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${amountColor}`}>{sign}{Number(t.amount).toFixed(2)}</p>
                      <p className="text-[0.6rem] text-muted-foreground">{t.asset}</p>
                    </div>
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
