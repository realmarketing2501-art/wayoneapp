import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function IncomePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [period, setPeriod] = useState<7 | 30 | 90>(7);

  const { data: records = [] } = useQuery({
    queryKey: ['income_records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('income_records').select('*').eq('user_id', user!.id).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totals = {
    interest: records.filter(r => r.type === 'interest').reduce((s, r) => s + Number(r.amount), 0),
    team: records.filter(r => r.type === 'team').reduce((s, r) => s + Number(r.amount), 0),
    bonus: records.filter(r => r.type === 'bonus').reduce((s, r) => s + Number(r.amount), 0),
  };

  const chartData = Array.from({ length: period }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (period - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = records.filter(r => r.date === dateStr);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      interest: dayRecords.filter(r => r.type === 'interest').reduce((s, r) => s + Number(r.amount), 0),
      team: dayRecords.filter(r => r.type === 'team').reduce((s, r) => s + Number(r.amount), 0),
    };
  });

  const IncomeItem = ({ record }: { record: typeof records[0] }) => (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        <Badge variant={record.type === 'interest' ? 'default' : record.type === 'team' ? 'secondary' : 'outline'} className="text-[0.6rem]">
          {record.type === 'interest' ? 'Interessi' : record.type === 'team' ? 'Team' : 'Bonus'}
        </Badge>
        <span className="text-xs text-muted-foreground">{record.date}</span>
      </div>
      <span className="text-sm font-semibold text-primary">+{Number(record.amount).toFixed(2)}</span>
    </div>
  );

  return (
    <div className="space-y-5 p-4">
      <Card className="glow-green border-primary/20">
        <CardContent className="p-4 text-center sm:p-5">
          <p className="text-xs text-muted-foreground sm:text-sm">Reddito Cumulativo Totale</p>
          <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{Number(profile?.total_earned ?? 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground sm:text-sm">USDT</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-2.5 text-center sm:p-3"><p className="text-[0.6rem] text-muted-foreground sm:text-xs">Interessi</p><p className="font-display text-sm font-bold text-primary sm:text-base">{totals.interest.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-2.5 text-center sm:p-3"><p className="text-[0.6rem] text-muted-foreground sm:text-xs">Team</p><p className="font-display text-sm font-bold text-accent sm:text-base">{totals.team.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-2.5 text-center sm:p-3"><p className="text-[0.6rem] text-muted-foreground sm:text-xs">Bonus</p><p className="font-display text-sm font-bold text-way-diamond sm:text-base">{totals.bonus.toFixed(2)}</p></CardContent></Card>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Reddito Giornaliero</p>
            <div className="flex gap-1">
              {([7, 30, 90] as const).map(p => (
                <Button key={p} size="sm" variant={period === p ? 'default' : 'secondary'} onClick={() => setPeriod(p)} className="h-7 px-2 text-xs">{p}gg</Button>
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
                <Area type="monotone" dataKey="interest" stroke="hsl(145, 100%, 45%)" fill="url(#greenGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="team" stroke="hsl(45, 100%, 50%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Storico</h3>
          {records.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nessun reddito registrato</p>
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
