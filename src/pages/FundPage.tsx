import { useState } from 'react';
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
import { Calendar, TrendingUp, Sparkles } from 'lucide-react';

import imgGrowth from '@/assets/fund_growth.jpg';
import imgPremium from '@/assets/fund_premium.jpg';
import imgRocket from '@/assets/fund_rocket.jpg';

const FUND_IMAGES = [imgGrowth, imgPremium, imgRocket];

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
      const { data, error } = await supabase
        .from('special_funds')
        .select('*')
        .order('created_at', { ascending: false });
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

  const fundImage = (idx: number) => FUND_IMAGES[idx % FUND_IMAGES.length];

  function FundCard({ fund, idx }: { fund: Fund; idx: number }) {
    const pct = fund.goal > 0 ? Math.round((Number(fund.raised) / Number(fund.goal)) * 100) : 0;
    const dim = fund.status === 'ended';
    return (
      <div
        className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur transition-all hover:border-[#00aeff]/50 ${
          dim ? 'opacity-50' : ''
        }`}
      >
        {/* IMAGE HERO */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <img
            src={fundImage(idx)}
            alt={fund.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040a24] via-[#040a24]/30 to-transparent" />
          <Badge className="absolute left-3 top-3 border-0 bg-[#00aeff]/90 text-[0.6rem] font-semibold text-[#0a1f5c]">
            {fund.badge}
          </Badge>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <h4 className="font-display text-lg font-bold leading-tight text-white drop-shadow">
                {fund.name}
              </h4>
              <p className="text-[0.65rem] uppercase tracking-wider text-white/70">
                {fund.duration} giorni
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold text-[#00aeff] drop-shadow">
                {fund.total_return}%
              </p>
              <p className="text-[0.6rem] uppercase tracking-wider text-white/70">rendimento</p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="space-y-3 p-4">
          <div className="flex gap-3 text-[0.7rem] text-white/70">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#00aeff]" />{fund.duration}gg</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-[#00aeff]" />{fund.min_invest}–{Number(fund.max_invest).toLocaleString()} USDT</span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[0.65rem] text-white/60">
              <span>{Number(fund.raised).toLocaleString()} / {Number(fund.goal).toLocaleString()} USDT</span>
              <span className="font-semibold text-[#00aeff]">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5 bg-white/10" />
          </div>
          {fund.status === 'issuing' && (
            <Button
              className="w-full bg-gradient-to-r from-[#00aeff] to-[#0084ff] font-semibold text-[#0a1f5c] hover:opacity-90"
              onClick={() => { setBuying(fund); setAmount(String(fund.min_invest)); }}
            >
              Acquista quote
            </Button>
          )}
          {fund.status === 'upcoming' && (
            <Button className="w-full bg-white/10 text-white/70" disabled>In arrivo · {fund.open_date}</Button>
          )}
          {fund.status === 'sold_out' && (
            <Button className="w-full bg-white/10 text-white/70" disabled>Esaurito</Button>
          )}
          {fund.status === 'ended' && (
            <Button className="w-full bg-white/10 text-white/70" disabled>Terminato</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-[#0a1f5c] via-[#0a1747] to-[#040a24] text-white">
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-wider text-[#7ec6ff]">
          <Sparkles className="h-3.5 w-3.5" /> Fondi speciali
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">
          Pacchetti curati.<br />
          <span className="text-[#00aeff]">Rendimento totale fisso.</span>
        </h1>
        <p className="mt-2 text-xs text-white/60">
          Quote a tempo limitato. I capitali vengono allocati a strategie aggregate gestite dal team.
        </p>
      </header>

      <div className="px-4 pb-8">
        <Tabs defaultValue="issuing">
          <TabsList className="grid w-full grid-cols-4 bg-white/5">
            <TabsTrigger value="issuing" className="data-[state=active]:bg-[#00aeff] data-[state=active]:text-[#0a1f5c]">In corso</TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#00aeff] data-[state=active]:text-[#0a1f5c]">In arrivo</TabsTrigger>
            <TabsTrigger value="sold_out" className="data-[state=active]:bg-[#00aeff] data-[state=active]:text-[#0a1f5c]">Esauriti</TabsTrigger>
            <TabsTrigger value="ended" className="data-[state=active]:bg-[#00aeff] data-[state=active]:text-[#0a1f5c]">Terminati</TabsTrigger>
          </TabsList>
          {(['issuing', 'upcoming', 'sold_out', 'ended'] as const).map(status => {
            const list = funds.filter(f => f.status === status);
            return (
              <TabsContent key={status} value={status} className="mt-4 space-y-4">
                {list.map((f, i) => <FundCard key={f.id} fund={f} idx={i} />)}
                {list.length === 0 && (
                  <p className="py-10 text-center text-sm text-white/50">Nessun fondo disponibile</p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <Dialog open={!!buying} onOpenChange={(o) => { if (!o) { setBuying(null); setAmount(''); } }}>
        <DialogContent className="border-white/10 bg-[#0a1747] text-white">
          <DialogHeader>
            <DialogTitle>Acquista quote · <span className="text-[#00aeff]">{buying?.name}</span></DialogTitle>
          </DialogHeader>
          {buying && (
            <div className="space-y-3">
              <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <div className="flex justify-between"><span className="text-white/60">Rendimento</span><span className="font-semibold text-[#00aeff]">{buying.total_return}% in {buying.duration}gg</span></div>
                <div className="flex justify-between"><span className="text-white/60">Range</span><span>{buying.min_invest}–{Number(buying.max_invest).toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-white/60">Disponibili nel fondo</span><span>{(Number(buying.goal) - Number(buying.raised)).toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-white/60">Tuo saldo</span><span>{Number(profile?.balance_available ?? 0).toFixed(2)} USDT</span></div>
              </div>
              <div>
                <Label className="text-[0.65rem] uppercase tracking-wider text-white/60">Importo (USDT)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={buying.min_invest}
                  max={buying.max_invest}
                  className="border-white/15 bg-[#040a24]/60 text-white focus-visible:ring-[#00aeff]"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setBuying(null)}>Annulla</Button>
            <Button
              className="bg-gradient-to-r from-[#00aeff] to-[#0084ff] font-semibold text-[#0a1f5c] hover:opacity-90"
              onClick={() => invest.mutate()}
              disabled={invest.isPending || !amount || !user}
            >
              {invest.isPending ? 'Acquisto…' : 'Conferma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
