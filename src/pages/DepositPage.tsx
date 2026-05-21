import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Wallet, ArrowDownToLine, Clock, Info, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const networks = [
  { id: 'TRC-20', label: 'TRC-20 (Tron)', fee: '~1 USDT', time: '~3 min' },
  { id: 'ERC-20', label: 'ERC-20 (Ethereum)', fee: '~5-15 USDT', time: '~5 min' },
];

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

export default function DepositPage() {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's intents (wallet_address è incluso nel record dell'intent, niente lettura diretta di api_integrations)
  const { data: activeIntents = [], refetch: refetchIntents } = useQuery({
    queryKey: ['deposit-intents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_intents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const pendingIntents = activeIntents.filter((i: any) => i.status === 'pending' && i.network === selectedNetwork.id);
  const lastPending = pendingIntents[0];
  const activeWallet = lastPending?.wallet_address as string | undefined;

  const createIntent = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(amount);
      if (!amt || amt < 50) throw new Error('Importo minimo 50 USD');
      const { error } = await supabase.rpc('create_deposit_intent', {
        p_amount_usd: amt,
        p_network: selectedNetwork.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-intents'] });
      setAmount('');
      toast({ title: 'Deposito avviato', description: 'Invia l\'importo esatto al wallet mostrato sotto. Rilevamento automatico via blockchain.' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const copyAddress = () => {
    if (!activeWallet) return;
    navigator.clipboard.writeText(activeWallet);
    toast({ title: 'Indirizzo copiato!' });
  };

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'In attesa pagamento', variant: 'secondary', icon: Clock },
    matched: { label: 'Confermato', variant: 'default', icon: CheckCircle },
    expired: { label: 'Scaduto', variant: 'outline', icon: AlertTriangle },
    cancelled: { label: 'Annullato', variant: 'destructive', icon: AlertTriangle },
  };

  return (
    <div className="space-y-5 p-4">
      <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Deposita USDT</h2>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Scegli l'importo e avvia il deposito. Il sistema genera in automatico l'importo esatto da inviare e il wallet di destinazione, e accredita appena rileva la transazione.
        </p>
      </div>

      {/* Pending intent: wallet + importo univoco (dati letti dall'intent dell'utente) */}
      {lastPending && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <p className="text-sm font-semibold text-foreground">Deposito in attesa di conferma blockchain</p>
            </div>

            <div className="rounded-lg bg-secondary p-2.5 text-center">
              <p className="text-[0.65rem] text-muted-foreground">Invia ESATTAMENTE</p>
              <p className="text-xl font-bold text-foreground font-mono">{Number(lastPending.amount_usdt).toFixed(2)} USDT</p>
              <p className="text-[0.6rem] text-muted-foreground">su rete {lastPending.network} · scade {new Date(lastPending.expires_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-foreground">Wallet di destinazione</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 overflow-hidden rounded-lg bg-background px-3 py-2 font-mono text-[0.65rem] text-muted-foreground break-all sm:text-xs">
                  {lastPending.wallet_address}
                </div>
                <Button size="icon" variant="outline" onClick={copyAddress} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowQR(!showQR)}>
                {showQR ? 'Nascondi QR' : 'Mostra QR Code'}
              </Button>
              {showQR && activeWallet && (
                <div className="flex justify-center rounded-lg bg-white p-3">
                  <QRCodeSVG value={activeWallet} size={140} />
                </div>
              )}
            </div>
            <p className="text-[0.65rem] text-muted-foreground">
              ⚠️ L'importo deve corrispondere ESATTAMENTE per essere riconosciuto. Il watcher controlla la blockchain ogni 5 minuti.
            </p>
          </CardContent>
        </Card>
      )}

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
            <span className="text-[0.6rem] opacity-70">Fee rete: {n.fee}</span>
          </Button>
        ))}
      </div>

      {/* Amount selection */}
      <Card>
        <CardContent className="p-3.5 space-y-3 sm:p-4">
          <p className="text-sm font-medium text-foreground">Importo deposito (USD)</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((a) => (
              <Button
                key={a}
                variant={amount === String(a) ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setAmount(String(a))}
              >
                ${a.toLocaleString()}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Oppure:</span>
            <Input
              type="number"
              placeholder="Importo personalizzato (min 50)"
              value={PRESET_AMOUNTS.includes(Number(amount)) ? '' : amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirm button — NON dipende dalla lettura di api_integrations */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => createIntent.mutate()}
        disabled={createIntent.isPending || !amount || Number(amount) < 50}
      >
        <ArrowDownToLine className="mr-2 h-4 w-4" />
        {createIntent.isPending ? 'Creazione...' : `Inizia Deposito ${amount ? `$${Number(amount).toLocaleString()}` : ''}`}
      </Button>

      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => refetchIntents()}>
        <RefreshCw className="mr-1.5 h-3 w-3" /> Aggiorna stato depositi
      </Button>

      {activeIntents.length > 0 && (
        <Card>
          <CardContent className="p-3.5 sm:p-4">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">I tuoi depositi</h3>
            <div className="space-y-2.5">
              {activeIntents.map((intent: any) => {
                const sc = statusConfig[intent.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <div key={intent.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground font-mono">
                        {Number(intent.amount_usdt).toFixed(2)} USDT
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground truncate">
                        ${Number(intent.amount_usd).toLocaleString()} · {intent.network} · {new Date(intent.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <Badge variant={sc.variant} className="shrink-0 text-[0.6rem] gap-1">
                      <StatusIcon className="h-2.5 w-2.5" />
                      {sc.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
