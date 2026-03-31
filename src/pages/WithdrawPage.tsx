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

const iconMap: Record<string, typeof Zap> = { fast: Zap, medium: Clock, slow: Turtle };
const colorMap: Record<string, string> = { fast: 'text-accent', medium: 'text-primary', slow: 'text-way-sapphire' };

export default function WithdrawPage() {
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
  const balance = Number(profile?.balance ?? 0);

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
      if (numAmount > balance) throw new Error('Saldo insufficiente');
      if (numAmount <= 0) throw new Error('Importo non valido');
      if (!wallet.trim()) throw new Error('Inserisci un indirizzo wallet');
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user!.id,
        amount: numAmount,
        fee,
        net,
        wallet_address: wallet,
        type: selected?.key ?? 'medium',
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast({ title: 'Prelievo richiesto', description: `La richiesta di ${net.toFixed(2)} USDT è in attesa di approvazione.` });
      setAmount('');
      setWallet('');
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-5 p-4">
      <h2 className="font-display text-lg font-bold sm:text-xl">Prelievo</h2>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground">
          I prelievi vengono processati dopo approvazione. Il saldo verrà aggiornato alla conferma.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground sm:text-sm">Saldo disponibile</p>
            <p className="font-display text-2xl font-bold text-primary">{balance.toLocaleString()} USDT</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Importo (USDT)</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Indirizzo Wallet (USDT TRC-20)</Label>
            <Input placeholder="T..." value={wallet} onChange={e => setWallet(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Tipo di Prelievo</Label>
            <div className="grid grid-cols-3 gap-2">
              {activeTypes.map(t => {
                const Icon = iconMap[t.key] || Clock;
                const color = colorMap[t.key] || 'text-primary';
                return (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-colors',
                      type === t.key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', color)} />
                    <span className="text-xs font-medium text-foreground">{t.label}</span>
                    <span className="text-[0.6rem] text-muted-foreground">{t.hours}h · {t.fee_pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {numAmount > 0 && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Importo</span><span>{numAmount.toFixed(2)} USDT</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Fee ({feePct}%)</span><span className="text-destructive">-{fee.toFixed(2)} USDT</span></div>
              <div className="mt-1 flex justify-between border-t border-border pt-1 text-sm font-semibold"><span>Netto</span><span className="text-primary">{net.toFixed(2)} USDT</span></div>
            </div>
          )}

          <Button className="w-full" disabled={numAmount <= 0 || !wallet || withdrawMutation.isPending} onClick={() => withdrawMutation.mutate()}>
            {withdrawMutation.isPending ? 'Elaborazione...' : 'Conferma Prelievo'}
          </Button>
        </CardContent>
      </Card>

      {withdrawals.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-sm font-semibold sm:text-base">Storico Prelievi</h3>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <Card key={w.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{Number(w.amount).toLocaleString()} USDT</p>
                      <p className="text-[0.65rem] text-muted-foreground truncate">
                        {w.type} · Netto: {Number(w.net).toFixed(2)} · {new Date(w.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <Badge variant={w.status === 'completed' ? 'default' : w.status === 'pending' ? 'secondary' : 'destructive'} className="shrink-0 text-[0.6rem]">
                      {w.status === 'completed' ? 'Completato' : w.status === 'pending' ? 'In attesa' : 'Rifiutato'}
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
