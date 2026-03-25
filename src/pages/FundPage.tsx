import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp } from 'lucide-react';

export default function FundPage() {
  const { data: funds = [] } = useQuery({
    queryKey: ['special_funds'],
    queryFn: async () => {
      const { data, error } = await supabase.from('special_funds').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  function FundCard({ fund }: { fund: typeof funds[0] }) {
    const pct = Math.round(Number(fund.raised) / Number(fund.goal) * 100);
    return (
      <Card className={fund.status === 'ended' ? 'opacity-50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-display font-semibold text-foreground">{fund.name}</h4>
              <Badge variant={fund.badge === 'Special Fund' ? 'default' : 'secondary'} className="mt-1">{fund.badge}</Badge>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-primary">{fund.total_return}%</p>
              <p className="text-xs text-muted-foreground">rendimento totale</p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fund.duration}gg</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{fund.min_invest}–{Number(fund.max_invest).toLocaleString()} USDT</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Number(fund.raised).toLocaleString()} / {Number(fund.goal).toLocaleString()} USDT</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="mt-1 h-2" />
          </div>
          {fund.status === 'issuing' && <Button className="mt-3 w-full">Acquista</Button>}
          {fund.status === 'upcoming' && <Button className="mt-3 w-full" variant="secondary" disabled>In arrivo — {fund.open_date}</Button>}
          {fund.status === 'sold_out' && <Button className="mt-3 w-full" variant="secondary" disabled>Esaurito</Button>}
          {fund.status === 'ended' && <Button className="mt-3 w-full" variant="secondary" disabled>Terminato</Button>}
        </CardContent>
      </Card>
    );
  }

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
            {funds.filter(f => f.status === status).map(f => <FundCard key={f.id} fund={f} />)}
            {funds.filter(f => f.status === status).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nessun fondo disponibile</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
