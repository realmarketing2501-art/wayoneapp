import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownToLine } from 'lucide-react';

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

  // Generate chart data from records
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

  return (
    <div className="space-y-6 p-4">
      <Card className="glow-green border-primary/20">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Reddito Cumulativo Totale</p>
          <p className="font-display text-4xl font-bold text-primary">{Number(profile?.total_earned ?? 0).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">USDT</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">Tutti</TabsTrigger>
          <TabsTrigger value="interest" className="flex-1">Interessi</TabsTrigger>
          <TabsTrigger value="team" className="flex-1">Team</TabsTrigger>
          <TabsTrigger value="bonus" className="flex-1">Bonus</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Interessi</p><p className="font-display font-bold text-primary">{totals.interest.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Team</p><p className="font-display font-bold text-accent">{totals.team.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Bonus</p><p className="font-display font-bold text-way-diamond">{totals.bonus.toFixed(2)}</p></CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Reddito Giornaliero</p>
                <div className="flex gap-1">
                  {([7, 30, 90] as const).map(p => (
                    <Button key={p} size="sm" variant={period === p ? 'default' : 'secondary'} onClick={() => setPeriod(p)}>{p}gg</Button>
                  ))}
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(145, 100%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(145, 100%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,55%)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,55%)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
                    <Area type="monotone" dataKey="interest" stroke="hsl(145, 100%, 45%)" fill="url(#greenGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="team" stroke="hsl(45, 100%, 50%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nessun reddito registrato</TableCell></TableRow>
                  ) : records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === 'interest' ? 'default' : r.type === 'team' ? 'secondary' : 'outline'}>
                          {r.type === 'interest' ? 'Interessi' : r.type === 'team' ? 'Team' : 'Bonus'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary">+{Number(r.amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button className="gap-2"><ArrowDownToLine className="h-4 w-4" /> Incassa Interessi</Button>
            <Button variant="outline" className="gap-2"><ArrowDownToLine className="h-4 w-4" /> Incassa Team</Button>
          </div>
        </TabsContent>
        <TabsContent value="interest">
          <Card><CardContent className="p-4">
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Importo</TableHead></TableRow></TableHeader>
            <TableBody>{records.filter(r => r.type === 'interest').map(r => (
              <TableRow key={r.id}><TableCell className="text-xs">{r.date}</TableCell><TableCell className="text-primary">+{Number(r.amount).toFixed(2)}</TableCell></TableRow>
            ))}{records.filter(r => r.type === 'interest').length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nessun dato</TableCell></TableRow>}</TableBody></Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="team">
          <Card><CardContent className="p-4">
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Importo</TableHead></TableRow></TableHeader>
            <TableBody>{records.filter(r => r.type === 'team').map(r => (
              <TableRow key={r.id}><TableCell className="text-xs">{r.date}</TableCell><TableCell className="text-accent">+{Number(r.amount).toFixed(2)}</TableCell></TableRow>
            ))}{records.filter(r => r.type === 'team').length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nessun dato</TableCell></TableRow>}</TableBody></Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="bonus">
          <Card><CardContent className="p-4">
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Importo</TableHead></TableRow></TableHeader>
            <TableBody>{records.filter(r => r.type === 'bonus').map(r => (
              <TableRow key={r.id}><TableCell className="text-xs">{r.date}</TableCell><TableCell className="text-way-diamond">+{Number(r.amount).toFixed(2)}</TableCell></TableRow>
            ))}{records.filter(r => r.type === 'bonus').length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nessun dato</TableCell></TableRow>}</TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
