import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockUser, mockIncomeRecords, mockDailyIncome } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownToLine } from 'lucide-react';

export default function IncomePage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const chartData = mockDailyIncome.slice(0, period);

  const totals = {
    interest: mockIncomeRecords.filter(r => r.type === 'interest').reduce((s, r) => s + r.amount, 0),
    team: mockIncomeRecords.filter(r => r.type === 'team').reduce((s, r) => s + r.amount, 0),
    bonus: mockIncomeRecords.filter(r => r.type === 'bonus').reduce((s, r) => s + r.amount, 0),
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <Card className="glow-green border-primary/20">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Reddito Cumulativo Totale</p>
          <p className="font-display text-4xl font-bold text-primary">{mockUser.totalEarned.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">USDT</p>
        </CardContent>
      </Card>

      {/* Tabs */}
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

          {/* Chart */}
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
                    <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="interest" stroke="hsl(145, 100%, 45%)" fill="url(#greenGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="team" stroke="hsl(45, 100%, 50%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Records */}
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
                  {mockIncomeRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === 'interest' ? 'default' : r.type === 'team' ? 'secondary' : 'outline'}>
                          {r.type === 'interest' ? 'Interessi' : r.type === 'team' ? 'Team' : 'Bonus'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary">+{r.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Collect Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button className="gap-2"><ArrowDownToLine className="h-4 w-4" /> Incassa Interessi</Button>
            <Button variant="outline" className="gap-2"><ArrowDownToLine className="h-4 w-4" /> Incassa Team</Button>
          </div>
        </TabsContent>
        <TabsContent value="interest"><p className="p-4 text-center text-sm text-muted-foreground">Filtra per interessi — prossimamente</p></TabsContent>
        <TabsContent value="team"><p className="p-4 text-center text-sm text-muted-foreground">Filtra per team — prossimamente</p></TabsContent>
        <TabsContent value="bonus"><p className="p-4 text-center text-sm text-muted-foreground">Filtra per bonus — prossimamente</p></TabsContent>
      </Tabs>
    </div>
  );
}
