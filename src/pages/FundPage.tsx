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
import { useTranslation } from 'react-i18next';

type Fund = {
  id: string; name: string; badge: string; total_return: number; duration: number;
  min_invest: number; max_invest: number; raised: number; goal: number;
  open_date: string; status: string;
};

export default function FundPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [buying, setBuying] = useState<Fund | null>(null);
  const [amount, setAmount] = useState<string>('');
  const localeTag = i18n.language === 'zh' ? 'zh-CN' : i18n.language;

  const { data: funds = [] } = useQuery({
    queryKey: ['special_funds'],
    queryFn: async () => {
      const { data, error } = await supabase.from('special_funds').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Fund[];
    },
  });

  const { data: myFunds = [] } = useQuery({
    queryKey: ['my_fund_investments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fund_investments')
        .select('id, amount, status, daily_rate, duration_days, days_remaining, total_earned, last_payout_at, created_at, completed_at, fund_id, special_funds(name, badge, total_return, duration)')
        .eq('user_id', user!.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const invest = useMutation({
    mutationFn: async () => {
      if (!user || !buying) throw new Error(t('fund.errLoginRequired'));
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
      qc.invalidateQueries({ queryKey: ['my_fund_investments'] });
      toast({ title: t('fund.toastBoughtTitle'), description: t('fund.toastBoughtDesc', { amount, name: buying?.name }) });
      setBuying(null); setAmount('');
    },
    onError: (e: Error) => toast({ title: t('fund.errorTitle'), description: e.message, variant: 'destructive' }),
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
              <p className="text-xs text-muted-foreground">{t('fund.totalReturn')}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{t('fund.daysShort', { n: fund.duration })}</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{t('fund.rangeUsdt', { min: fund.min_invest, max: Number(fund.max_invest).toLocaleString() })}</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Number(fund.raised).toLocaleString()} / {Number(fund.goal).toLocaleString()} USDT</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="mt-1 h-2" />
          </div>
          {fund.status === 'issuing' && <Button className="mt-3 w-full" onClick={() => { setBuying(fund); setAmount(String(fund.min_invest)); }}>{t('fund.buy')}</Button>}
          {fund.status === 'upcoming' && <Button className="mt-3 w-full" variant="secondary" disabled>{t('fund.comingSoon', { date: fund.open_date })}</Button>}
          {fund.status === 'sold_out' && <Button className="mt-3 w-full" variant="secondary" disabled>{t('fund.soldOut')}</Button>}
          {fund.status === 'ended' && <Button className="mt-3 w-full" variant="secondary" disabled>{t('fund.ended')}</Button>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="font-display text-xl font-bold">{t('fund.title')}</h2>

      {myFunds.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold">{t('fund.myFunds')}</h3>
            <div className="space-y-2">
              {myFunds.map((mf) => {
                const sf = mf.special_funds || {};
                const totalDays = mf.duration_days ?? sf.duration ?? 0;
                const elapsed = Math.max(0, totalDays - (mf.days_remaining ?? totalDays));
                const pct = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;
                return (
                  <div key={mf.id} className="rounded-md border p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{sf.name}</p>
                        <p className="text-[0.65rem] text-muted-foreground">
                          {Number(mf.amount).toLocaleString()} USDT · {mf.daily_rate}% /gg · {sf.total_return}% {t('fund.totalReturn')}
                        </p>
                      </div>
                      <Badge variant={mf.status === 'completed' ? 'secondary' : 'default'} className="text-[0.55rem]">
                        {mf.status === 'completed' ? t('fund.statusCompleted') : t('fund.statusActive')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[0.65rem]">
                      <div>
                        <p className="text-muted-foreground">{t('fund.earned')}</p>
                        <p className="font-semibold text-primary">+{Number(mf.total_earned ?? 0).toFixed(2)} USDT</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('fund.days')}</p>
                        <p className="font-semibold">{elapsed}/{totalDays}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('fund.last')}</p>
                        <p className="font-semibold">{mf.last_payout_at ? new Date(mf.last_payout_at).toLocaleDateString(localeTag) : '—'}</p>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="issuing">
        <TabsList className="w-full">
          <TabsTrigger value="issuing" className="flex-1">{t('fund.tabIssuing')}</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">{t('fund.tabUpcoming')}</TabsTrigger>
          <TabsTrigger value="sold_out" className="flex-1">{t('fund.tabSoldOut')}</TabsTrigger>
          <TabsTrigger value="ended" className="flex-1">{t('fund.tabEnded')}</TabsTrigger>
        </TabsList>
        {(['issuing', 'upcoming', 'sold_out', 'ended'] as const).map(status => (
          <TabsContent key={status} value={status} className="space-y-3">
            {funds.filter(f => f.status === status).map(f => <FundCard key={f.id} fund={f} />)}
            {funds.filter(f => f.status === status).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('fund.empty')}</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!buying} onOpenChange={(o) => { if (!o) { setBuying(null); setAmount(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('fund.dialogTitle', { name: buying?.name })}</DialogTitle></DialogHeader>
          {buying && (
            <div className="space-y-3">
              <div className="rounded-md bg-secondary p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fund.dialogReturn')}</span><span className="font-semibold">{t('fund.dialogReturnVal', { pct: buying.total_return, days: buying.duration })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fund.dialogRange')}</span><span>{t('fund.rangeUsdt', { min: buying.min_invest, max: Number(buying.max_invest).toLocaleString() })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fund.dialogAvailable')}</span><span>{(Number(buying.goal) - Number(buying.raised)).toLocaleString()} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('fund.dialogYourBalance')}</span><span>{Number(profile?.balance_available ?? 0).toFixed(2)} USDT</span></div>
              </div>
              <div>
                <Label className="text-xs">{t('fund.dialogAmount')}</Label>
                <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} min={buying.min_invest} max={buying.max_invest} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBuying(null)}>{t('fund.dialogCancel')}</Button>
            <Button onClick={() => invest.mutate()} disabled={invest.isPending || !amount || !user}>
              {invest.isPending ? t('fund.buying') : t('fund.dialogConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
