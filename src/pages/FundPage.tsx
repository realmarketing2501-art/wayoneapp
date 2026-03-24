import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { mockFunds, type SpecialFund } from '@/data/mockData';
import { Calendar, TrendingUp } from 'lucide-react';

function FundCard({ fund }: { fund: SpecialFund }) {
  const pct = Math.round(fund.raised / fund.goal * 100);
  return (
    <Card className={fund.status === 'ended' ? 'opacity-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-display font-semibold text-foreground">{fund.name}</h4>
            <Badge variant={fund.badge === 'Special Fund' ? 'default' : 'secondary'} className="mt-1">{fund.badge}</Badge>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold text-primary">{fund.totalReturn}%</p>
            <p className="text-xs text-muted-foreground">rendimento totale</p>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fund.duration}gg</span>
          <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{fund.minInvest}–{fund.maxInvest.toLocaleString()} USDT</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fund.raised.toLocaleString()} / {fund.goal.toLocaleString()} USDT</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-1 h-2" />
        </div>
        {fund.status === 'issuing' && <Button className="mt-3 w-full">Acquista</Button>}
        {fund.status === 'upcoming' && <Button className="mt-3 w-full" variant="secondary" disabled>In arrivo — {fund.openDate}</Button>}
        {fund.status === 'sold_out' && <Button className="mt-3 w-full" variant="secondary" disabled>Esaurito</Button>}
        {fund.status === 'ended' && <Button className="mt-3 w-full" variant="secondary" disabled>Terminato</Button>}
      </CardContent>
    </Card>
  );
}

export default function FundPage() {
  return (
    <div className="space-y-6 p-4">
      <h2 className="font-display text-xl font-bold">Fondi Speciali</h2>
      <Tabs defaultValue="issuing">
        <TabsList className="w-full">
          <TabsTrigger value="issuing" className="flex-1">In corso</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">In arrivo</TabsTrigger>
          <TabsTrigger value="sold_out" className="flex-1">Esauriti</TabsTrigger>
          <TabsTrigger value="ended" className="flex-1">Terminati</TabsTrigger>
        </TabsList>
        {(['issuing', 'upcoming', 'sold_out', 'ended'] as const).map(status => (
          <TabsContent key={status} value={status} className="space-y-3">
            {mockFunds.filter(f => f.status === status).map(f => <FundCard key={f.id} fund={f} />)}
            {mockFunds.filter(f => f.status === status).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nessun fondo disponibile</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
