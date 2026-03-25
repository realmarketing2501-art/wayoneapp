import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap, Clock, Turtle } from 'lucide-react';
import { cn } from '@/lib/utils';

const withdrawTypes = [
  { key: 'fast' as const, label: 'Veloce', time: '24h', fee: 20, icon: Zap, color: 'text-accent' },
  { key: 'medium' as const, label: 'Medio', time: '48h', fee: 10, icon: Clock, color: 'text-primary' },
  { key: 'slow' as const, label: 'Lento', time: '72h', fee: 5, icon: Turtle, color: 'text-way-sapphire' },
];

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [type, setType] = useState<'fast' | 'medium' | 'slow'>('medium');
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selected = withdrawTypes.find(t => t.key === type)!;
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * selected.fee / 100;
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
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user!.id,
        amount: numAmount,
        fee,
        net,
        wallet_address: wallet,
        type,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      toast({ title: 'Prelievo richiesto', description: `${net.toFixed(2)} USDT verranno inviati a ${wallet}` });
      setAmount('');
      setWallet('');
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6 p-4">
      <h2 className="font-display text-xl font-bold">Prelievo</h2>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Saldo disponibile</p>
            <p className="font-display text-2xl font-bold text-primary">{balance.toLocaleString()} USDT</p>
          </div>

          <div className="space-y-2">
            <Label>Importo (USDT)</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Indirizzo Wallet (USDT TRC-20)</Label>
            <Input placeholder="T..." value={wallet} onChange={e => setWallet(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tipo di Prelievo</Label>
            <div className="grid grid-cols-3 gap-2">
              {withdrawTypes.map(t => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors',
                    type === t.key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                  )}
                >
                  <t.icon className={cn('h-5 w-5', t.color)} />
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.time} • {t.fee}% fee</span>
                </button>
              ))}
            </div>
          </div>

          {numAmount > 0 && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Importo</span><span>{numAmount.toFixed(2)} USDT</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fee ({selected.fee}%)</span><span className="text-destructive">-{fee.toFixed(2)} USDT</span></div>
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Netto</span><span className="text-primary">{net.toFixed(2)} USDT</span></div>
            </div>
          )}

          <Button className="w-full" disabled={numAmount <= 0 || !wallet || withdrawMutation.isPending} onClick={() => withdrawMutation.mutate()}>
            {withdrawMutation.isPending ? 'Elaborazione...' : 'Conferma Prelievo'}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Storico Prelievi</h3>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Netto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessun prelievo</TableCell></TableRow>
                ) : withdrawals.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{w.amount} USDT</TableCell>
                    <TableCell className="text-primary">{w.net} USDT</TableCell>
                    <TableCell className="text-xs capitalize">{w.type === 'fast' ? 'Veloce' : w.type === 'medium' ? 'Medio' : 'Lento'}</TableCell>
                    <TableCell>
                      <Badge variant={w.status === 'completed' ? 'default' : w.status === 'pending' ? 'secondary' : 'destructive'}>
                        {w.status === 'completed' ? 'Completato' : w.status === 'pending' ? 'In attesa' : 'Fallito'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
