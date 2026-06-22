import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Info, TrendingUp, Sparkles, Users, Award } from 'lucide-react';

type IncomeType = 'interest' | 'fund_interest' | 'referral_commission' | 'team' | 'level_bonus' | 'bonus';

const TYPE_META: Record<IncomeType, { label: string; color: string; icon: any; desc: string }> = {
  interest:            { label: 'Investimento',   color: 'bg-primary/15 text-primary border-primary/30',          icon: TrendingUp, desc: 'Interesse giornaliero generato dai tuoi pacchetti di investimento.' },
  fund_interest:       { label: 'Fondo Speciale', color: 'bg-way-diamond/15 text-way-diamond border-way-diamond/30', icon: Sparkles,   desc: 'Rendimento giornaliero generato dalle quote in un Fondo Speciale.' },
  referral_commission: { label: 'Referral 1.5%',  color: 'bg-accent/15 text-accent border-accent/30',             icon: Users,      desc: '1.5% sui guadagni di ogni tuo diretto L1 (investimenti e fondi).' },
  team:                { label: 'Referral',       color: 'bg-accent/15 text-accent border-accent/30',             icon: Users,      desc: 'Commissioni dalla tua rete (storico).' },
  level_bonus:         { label: 'Bonus livello (storico)', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Award, desc: 'Bonus di qualifica del vecchio sistema MLM (non più attivo).' },
  bonus:               { label: 'Bonus',          color: 'bg-muted text-foreground border-border',                icon: Award,      desc: 'Bonus promozionale o accredito straordinario.' },
};

const resolveType = (t: string): IncomeType => (TYPE_META as any)[t] ? (t as IncomeType) : 'bonus';

export default function IncomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [showLegend, setShowLegend] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ['income_records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('income_records').select('*').eq('user_id', user!.id).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const sumBy = (k: IncomeType) => records.filter(r => resolveType(r.type) === k).reduce((s, r) => s + Number(r.amount), 0);
  const totals = {
    interest: sumBy('interest'),
    fund_interest: sumBy('fund_interest'),
    team: sumBy('team') + sumBy('level_bonus'),
    bonus: sumBy('bonus'),
  };

  const chartData = Array.from({ length: period }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (period - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = records.filter(r => r.date === dateStr);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      interest: dayRecords.filter(r => resolveType(r.type) === 'interest').reduce((s, r) => s + Number(r.amount), 0),
      fund: dayRecords.filter(r => resolveType(r.type) === 'fund_interest').reduce((s, r) => s + Number(r.amount), 0),
      team: dayRecords.filter(r => ['team','level_bonus'].includes(resolveType(r.type))).reduce((s, r) => s + Number(r.amount), 0),
    };
  });

  const IncomeItem = ({ record }: { record: typeof records[0] }) => {
    const meta = TYPE_META[resolveType(record.type)];
    const Icon = meta.icon;
    return (
      <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 text-[0.65rem] ${meta.color}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{record.date}</span>
        </div>
        <span className="text-sm font-semibold text-primary">+{Number(record.amount).toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5 p-4">
      <Card className="glow-green border-primary/20">
        <CardContent className="p-4 text-center sm:p-5">
          <p className="text-xs text-muted-foreground sm:text-sm">{t('income.cumulativeTotal')}</p>
          <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{Number(profile?.total_earned ?? 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground sm:text-sm">USDT</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card><CardContent className="p-2.5 text-center sm:p-3">
          <p className="text-[0.6rem] text-muted-foreground sm:text-xs">Investimento</p>
          <p className="font-display text-sm font-bold text-primary sm:text-base">{totals.interest.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-2.5 text-center sm:p-3">
          <p className="text-[0.6rem] text-muted-foreground sm:text-xs">Fondo Speciale</p>
          <p className="font-display text-sm font-bold text-way-diamond sm:text-base">{totals.fund_interest.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-2.5 text-center sm:p-3">
          <p className="text-[0.6rem] text-muted-foreground sm:text-xs">Referral / Livello</p>
          <p className="font-display text-sm font-bold text-accent sm:text-base">{totals.team.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-2.5 text-center sm:p-3">
          <p className="text-[0.6rem] text-muted-foreground sm:text-xs">Bonus</p>
          <p className="font-display text-sm font-bold sm:text-base">{totals.bonus.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 sm:p-4">
          <button onClick={() => setShowLegend(s => !s)} className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Cosa significano le categorie?</span>
            </div>
            <span className="text-xs text-muted-foreground">{showLegend ? 'Nascondi' : 'Mostra'}</span>
          </button>
          {showLegend && (
            <div className="mt-3 space-y-2.5">
              {(Object.keys(TYPE_META) as IncomeType[]).map(k => {
                const m = TYPE_META[k];
                const Icon = m.icon;
                return (
                  <div key={k} className="flex gap-2.5">
                    <Badge variant="outline" className={`h-fit gap-1 shrink-0 text-[0.65rem] ${m.color}`}>
                      <Icon className="h-3 w-3" />{m.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">{t('income.dailyIncome')}</p>
            <div className="flex gap-1">
              {([7, 30, 90] as const).map(p => (
                <Button key={p} size="sm" variant={period === p ? 'default' : 'secondary'} onClick={() => setPeriod(p)} className="h-7 px-2 text-xs">{t('income.periodDays', { n: p })}</Button>
              ))}
            </div>
          </div>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 100%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145, 100%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(0,0%,55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(0,0%,55%)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))', fontSize: 12 }} />
                <Area type="monotone" dataKey="interest" name="Investimento" stroke="hsl(145, 100%, 45%)" fill="url(#greenGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="fund" name="Fondo" stroke="hsl(190, 90%, 55%)" fill="transparent" strokeWidth={1.5} />
                <Area type="monotone" dataKey="team" name="Referral" stroke="hsl(45, 100%, 50%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">{t('income.history')}</h3>
          {records.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('income.empty')}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {records.slice(0, 50).map(r => <IncomeItem key={r.id} record={r} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
