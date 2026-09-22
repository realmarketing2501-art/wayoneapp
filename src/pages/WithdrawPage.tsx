import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useWithdrawalConfig } from '@/hooks/useCompensationConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap, Clock, Turtle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const iconMap: Record<string, typeof Zap> = { fast: Zap, medium: Clock, slow: Turtle };
const colorMap: Record<string, string> = { fast: 'text-accent', medium: 'text-primary', slow: 'text-way-sapphire' };

export default function WithdrawPage() {
  const { t, i18n } = useTranslation();
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [type, setType] = useState('medium');
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: withdrawalTypes = [] } = useWithdrawalConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activeTypes = withdrawalTypes.filter(t => t.active);
  const selected = activeTypes.find(t => t.key === type) || activeTypes[0];
  const numAmount = parseFloat(amount) || 0;
  const feePct = selected?.fee_pct ?? 10;
  const fee = numAmount * feePct / 100;
  const net = numAmount - fee;
  const balance = Number(profile?.balance_available ?? 0);
  const localeTag = i18n.language === 'zh' ? 'zh-CN' : i18n.language;

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('withdrawals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (numAmount > balance) throw new Error(t('withdraw.errInsufficient'));
      if (numAmount <= 0) throw new Error(t('withdraw.errInvalidAmount'));
      if (!wallet.trim()) throw new Error(t('withdraw.errWalletRequired'));
      const { error } = await supabase.rpc('create_withdrawal', {
        p_amount: numAmount,
        p_wallet_address: wallet.trim(),
        p_type: selected?.key ?? 'medium',
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast({ title: t('withdraw.toastRequestedTitle'), description: t('withdraw.toastRequestedDesc', { amount: net.toFixed(2) }) });
      setAmount('');
      setWallet('');
    },
    onError: (e: Error) => toast({ title: t('withdraw.errorTitle'), description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-5 p-4">
      <h2 className="font-display text-lg font-bold sm:text-xl">{t('withdraw.title')}</h2>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {t('withdraw.info')}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground sm:text-sm">{t('withdraw.availableBalance')}</p>
            <p className="font-display text-2xl font-bold text-primary">{balance.toLocaleString()} USDT</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">{t('withdraw.amountLabel')}</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">{t('withdraw.walletLabel')}</Label>
            <Input placeholder="T..." value={wallet} onChange={e => setWallet(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">{t('withdraw.typeLabel')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {activeTypes.map(wt => {
                const Icon = iconMap[wt.key] || Clock;
                const color = colorMap[wt.key] || 'text-primary';
                return (
                  <button
                    key={wt.key}
                    onClick={() => setType(wt.key)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-colors',
                      type === wt.key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', color)} />
                    <span className="text-xs font-medium text-foreground">{wt.label}</span>
                    <span className="text-[0.6rem] text-muted-foreground">{t('withdraw.typeHours', { hours: wt.hours, fee: wt.fee_pct })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {numAmount > 0 && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('withdraw.amount')}</span><span>{numAmount.toFixed(2)} USDT</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('withdraw.feeLine', { pct: feePct })}</span><span className="text-destructive">-{fee.toFixed(2)} USDT</span></div>
              <div className="mt-1 flex justify-between border-t border-border pt-1 text-sm font-semibold"><span>{t('withdraw.net')}</span><span className="text-primary">{net.toFixed(2)} USDT</span></div>
            </div>
          )}

          <Button className="w-full" disabled={numAmount <= 0 || !wallet || withdrawMutation.isPending} onClick={() => withdrawMutation.mutate()}>
            {withdrawMutation.isPending ? t('withdraw.processing') : t('withdraw.confirm')}
          </Button>
        </CardContent>
      </Card>

      {withdrawals.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-sm font-semibold sm:text-base">{t('withdraw.history')}</h3>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <Card key={w.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{Number(w.amount).toLocaleString()} USDT</p>
                      <p className="text-[0.65rem] text-muted-foreground truncate">
                        {t('withdraw.historyMeta', { type: w.type, net: Number(w.net).toFixed(2), date: new Date(w.created_at).toLocaleDateString(localeTag) })}
                      </p>
                    </div>
                    <Badge variant={w.status === 'completed' ? 'default' : w.status === 'pending' ? 'secondary' : 'destructive'} className="shrink-0 text-[0.6rem]">
                      {w.status === 'completed' ? t('withdraw.statusCompleted') : w.status === 'pending' ? t('withdraw.statusPending') : t('withdraw.statusRejected')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
