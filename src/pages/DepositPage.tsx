import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Wallet, ArrowDownToLine, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const networks = [
  { id: 'TRC-20', label: 'TRC-20 (Tron)', address: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx', fee: '~1 USDT', time: '~3 min' },
  { id: 'ERC-20', label: 'ERC-20 (Ethereum)', address: '0xYourEthereumWalletAddress', fee: '~5-15 USDT', time: '~5 min' },
];

export default function DepositPage() {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createDeposit = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(amount);
      if (!amt || amt < 50) throw new Error('Importo minimo 50 USDT');
      const { error } = await supabase.from('deposits').insert({
        user_id: user!.id,
        amount: amt,
        network: selectedNetwork.id,
        to_address: selectedNetwork.address,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setAmount('');
      toast({ title: 'Deposito registrato', description: 'Invia USDT all\'indirizzo indicato. Verrà confermato automaticamente.' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedNetwork.address);
    toast({ title: 'Indirizzo copiato!' });
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="font-display text-xl font-bold text-foreground">Deposita USDT</h2>

      {/* Network selector */}
      <div className="grid grid-cols-2 gap-3">
        {networks.map((n) => (
          <Button
            key={n.id}
            variant={selectedNetwork.id === n.id ? 'default' : 'outline'}
            className="h-auto flex-col gap-1 py-3"
            onClick={() => setSelectedNetwork(n)}
          >
            <span className="font-semibold">{n.id}</span>
            <span className="text-xs opacity-70">Fee: {n.fee}</span>
          </Button>
        ))}
      </div>

      {/* Wallet address card */}
      <Card className="border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-foreground">Indirizzo {selectedNetwork.id}</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 overflow-hidden rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground break-all">
              {selectedNetwork.address}
            </div>
            <Button size="icon" variant="outline" onClick={copyAddress}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Nascondi QR' : 'Mostra QR Code'}
          </Button>
          {showQR && (
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG value={selectedNetwork.address} size={160} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount + confirm */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Importo da depositare</p>
          <Input
            type="number"
            placeholder="Min 50 USDT"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Tempo conferma: {selectedNetwork.time}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => createDeposit.mutate()}
            disabled={createDeposit.isPending || !amount}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            {createDeposit.isPending ? 'Registrazione...' : 'Ho effettuato il deposito'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Invia l'importo esatto all'indirizzo sopra, poi clicca il pulsante per registrare il deposito.
          </p>
        </CardContent>
      </Card>

      {/* History */}
      {deposits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-foreground mb-3">Storico Depositi</h3>
            <div className="space-y-3">
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{Number(d.amount).toLocaleString()} USDT</p>
                    <p className="text-xs text-muted-foreground">{d.network} · {new Date(d.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <Badge variant={d.status === 'confirmed' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'}>
                    {d.status === 'confirmed' ? 'Confermato' : d.status === 'pending' ? 'In attesa' : d.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
