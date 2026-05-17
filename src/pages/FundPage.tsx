import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Calendar, TrendingUp } from 'lucide-react';

type Fund = {
  id: string; name: string; badge: string; total_return: number; duration: number;
  min_invest: number; max_invest: number; raised: number; goal: number;
  open_date: string; status: string;
};

export default function FundPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [buying, setBuying] = useState<Fund | null>(null);
  const [amount, setAmount] = useState<string>('');

  const { data: funds = [] } = useQuery({
    queryKey: ['special_funds'],
    queryFn: async () => {
      const { data, error } = await supabase.from('special_funds').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Fund[];
    },
  });

  const invest = useMutation({
    mutationFn: async () => {
      if (!user || !buying) throw new Error('Accedi per investire');
      const amt = parseFloat(amount);
      const { data, error } = await supabase.rpc('invest_in_fund', {
        p_user_id: user.id, p_fund_id: buying.id, p_amount: amt,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['special_funds'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Quota acquistata', description: `${amount} USDT investiti nel fondo ${buying?.name}.` });
      setBuying(null); setAmount('');
    },
    onError: (e: Error) => toast({ title: 'Errore acquisto', description: e.message, variant: 'destructive' }),
  });

  function FundCard({ fund }: { fund: Fund }) {
    const pct = fund.goal > 0 ? Math.round((Number(fund.raised) / Number(fund.goal)) * 100) : 0;
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
          {fund.status === 'issuing' && <Button className="mt-3 w-full" onClick={() => { setBuying(fund); setAmount(String(fund.min_invest)); }}>Acquista</Button>}
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

      <Dialog open={!!buying} onOpenChange={(o) => { if (!o) { setBuying(null); setAmount(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Acquista quote · {buying?.name}</DialogTitle></DialogHeader>
          {buying && (
            <div className="space-y-3">
              <div className="rounded-md bg-secondary p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Rendimento</span><span className="font-semibold">{buying.total_return}% in {buying.duration}gg</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Range</span><span>{buying.min_invest}–{Number(buying.max_invest).toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Disponibili nel fondo</span><span>{(Number(buying.goal) - Number(buying.raised)).toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tuo saldo disponibile</span><span>{Number(profile?.balance_available ?? 0).toFixed(2)} USDT</span></div>
              </div>
              <div>
                <Label className="text-xs">Importo (USDT)</Label>
                <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} min={buying.min_invest} max={buying.max_invest} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBuying(null)}>Annulla</Button>
            <Button onClick={() => invest.mutate()} disabled={invest.isPending || !amount || !user}>
              {invest.isPending ? 'Acquisto…' : 'Conferma acquisto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
