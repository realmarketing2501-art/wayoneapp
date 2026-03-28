import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Wallet, ArrowDownToLine, Clock, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const networks = [
  { id: 'TRC-20', label: 'TRC-20 (Tron)', address: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx', fee: '~1 USDT', time: '~3 min' },
  { id: 'ERC-20', label: 'ERC-20 (Ethereum)', address: '0xYourEthereumWalletAddress', fee: '~5-15 USDT', time: '~5 min' },
];

export default function DepositPage() {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
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
        tx_hash: txHash || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setAmount('');
      setTxHash('');
      toast({ title: 'Richiesta depositata', description: 'Il tuo deposito sarà verificato e confermato dal sistema.' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedNetwork.address);
    toast({ title: 'Indirizzo copiato!' });
  };

  return (
    <div className="space-y-5 p-4">
      <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Deposita USDT</h2>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Invia USDT all'indirizzo indicato, inserisci l'importo e il TxHash. Il deposito sarà confermato dopo verifica.
        </p>
      </div>

      {/* Network selector */}
      <div className="grid grid-cols-2 gap-2">
        {networks.map((n) => (
          <Button
            key={n.id}
            variant={selectedNetwork.id === n.id ? 'default' : 'outline'}
            className="h-auto flex-col gap-1 py-2.5"
            onClick={() => setSelectedNetwork(n)}
          >
            <span className="text-sm font-semibold">{n.id}</span>
            <span className="text-[0.6rem] opacity-70">Fee: {n.fee}</span>
          </Button>
        ))}
      </div>

      {/* Wallet address */}
      <Card className="border-primary/30">
        <CardContent className="p-3.5 space-y-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Indirizzo {selectedNetwork.id}</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 overflow-hidden rounded-lg bg-secondary px-3 py-2 font-mono text-[0.65rem] text-muted-foreground break-all sm:text-xs">
              {selectedNetwork.address}
            </div>
            <Button size="icon" variant="outline" onClick={copyAddress} className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Nascondi QR' : 'Mostra QR Code'}
          </Button>
          {showQR && (
            <div className="flex justify-center rounded-lg bg-white p-3">
              <QRCodeSVG value={selectedNetwork.address} size={140} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount + TxHash + confirm */}
      <Card>
        <CardContent className="p-3.5 space-y-3 sm:p-4">
          <p className="text-sm font-medium text-foreground">Dettagli deposito</p>
          <Input
            type="number"
            placeholder="Importo (min 50 USDT)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder="TxHash (opzionale)"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
          />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Tempo conferma: {selectedNetwork.time}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => createDeposit.mutate()}
            disabled={createDeposit.isPending || !amount}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            {createDeposit.isPending ? 'Registrazione...' : 'Registra Deposito'}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {deposits.length > 0 && (
        <Card>
          <CardContent className="p-3.5 sm:p-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">Storico Depositi</h3>
            <div className="space-y-2.5">
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{Number(d.amount).toLocaleString()} USDT</p>
                    <p className="text-[0.65rem] text-muted-foreground truncate">{d.network} · {new Date(d.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <Badge variant={d.status === 'confirmed' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'} className="shrink-0 text-[0.6rem]">
                    {d.status === 'confirmed' ? 'Confermato' : d.status === 'pending' ? 'In attesa' : d.status === 'rejected' ? 'Rifiutato' : d.status}
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
