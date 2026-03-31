import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, DollarSign, TrendingUp, ArrowUpDown,
  CheckCircle, XCircle, Search, Shield, Bell,
  Settings, Wallet, Eye, Plug
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IntegrationsTab from '@/components/admin/IntegrationsTab';

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className={cn('rounded-lg p-2', color)}>
          <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.65rem] text-muted-foreground sm:text-xs">{label}</p>
          <p className="font-display text-sm font-bold text-foreground truncate sm:text-lg">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardTab() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['admin_withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('withdrawals').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['admin_deposits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deposits').select('*');
      if (error) throw error;
      return data;
    },
  });

  const totalBalance = profiles.reduce((s, p) => s + Number(p.balance), 0);
  const totalDeposited = deposits.filter(d => d.status === 'confirmed').reduce((s, d) => s + Number(d.amount), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
  const pendingDeposits = deposits.filter(d => d.status === 'pending').length;

  const levelDist = profiles.reduce((acc, p) => {
    acc[p.level] = (acc[p.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <KPICard icon={Users} label="Utenti" value={String(profiles.length)} color="bg-blue-600" />
        <KPICard icon={DollarSign} label="Depositi" value={`${totalDeposited.toLocaleString()}`} color="bg-green-600" />
        <KPICard icon={TrendingUp} label="Saldo Tot." value={`${totalBalance.toLocaleString()}`} color="bg-purple-600" />
        <KPICard icon={ArrowUpDown} label="Pendenti" value={`${pendingDeposits}D / ${pendingWithdrawals}W`} color="bg-amber-600" />
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Distribuzione Livelli</h3>
          <div className="space-y-1.5">
            {Object.entries(levelDist).map(([level, count]) => (
              <div key={level} className="flex justify-between text-sm">
                <span className="text-muted-foreground text-xs">{level}</span>
                <Badge variant="secondary" className="text-[0.6rem]">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState('');

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = profiles.filter(p =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca utente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filtered.map(p => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{p.username}</p>
                <p className="text-[0.6rem] text-muted-foreground">{p.referral_code} · {new Date(p.created_at).toLocaleDateString('it-IT')}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="outline" className="text-[0.6rem]">{p.level}</Badge>
                <p className="text-[0.6rem] text-muted-foreground mt-0.5">{Number(p.balance).toLocaleString()} USDT</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DepositsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: deposits = [] } = useQuery({
    queryKey: ['admin_deposits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const deposit = deposits.find(d => d.id === depositId);
      if (!deposit) throw new Error('Deposito non trovato');

      // Update deposit status
      const { error: depError } = await supabase.from('deposits').update({ 
        status: 'confirmed', 
        confirmed_at: new Date().toISOString(),
        reviewed_by: user!.id
      }).eq('id', depositId);
      if (depError) throw depError;

      // Update user balance
      const { data: profile, error: profError } = await supabase.from('profiles').select('balance, balance_available').eq('user_id', deposit.user_id).single();
      if (profError) throw profError;

      const newBalance = Number(profile.balance) + Number(deposit.amount);
      const newAvailable = Number(profile.balance_available) + Number(deposit.amount);

      const { error: updateError } = await supabase.from('profiles').update({ 
        balance: newBalance,
        balance_available: newAvailable,
        has_confirmed_deposit: true
      }).eq('user_id', deposit.user_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_deposits'] });
      toast({ title: 'Deposito confermato', description: 'Saldo utente aggiornato.' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const { error } = await supabase.from('deposits').update({ 
        status: 'rejected',
        reviewed_by: user!.id
      }).eq('id', depositId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_deposits'] });
      toast({ title: 'Deposito rifiutato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const pending = deposits.filter(d => d.status === 'pending');
  const processed = deposits.filter(d => d.status !== 'pending');

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">In attesa ({pending.length})</h4>
          <div className="space-y-2">
            {pending.map(d => (
              <Card key={d.id} className="border-amber-500/30">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{Number(d.amount).toLocaleString()} USDT</p>
                      <p className="text-[0.6rem] text-muted-foreground">{d.network} · {new Date(d.created_at).toLocaleDateString('it-IT')}</p>
                      {d.tx_hash && <p className="text-[0.6rem] text-muted-foreground truncate">TxHash: {d.tx_hash}</p>}
                    </div>
                    <Badge variant="secondary" className="text-[0.6rem] shrink-0">Pending</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => approveMutation.mutate(d.id)} disabled={approveMutation.isPending}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approva
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs gap-1" onClick={() => rejectMutation.mutate(d.id)} disabled={rejectMutation.isPending}>
                      <XCircle className="h-3.5 w-3.5" /> Rifiuta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Processati</h4>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {processed.map(d => (
            <Card key={d.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{Number(d.amount).toLocaleString()} USDT</p>
                    <p className="text-[0.6rem] text-muted-foreground">{d.network} · {new Date(d.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <Badge variant={d.status === 'confirmed' ? 'default' : 'destructive'} className="text-[0.6rem] shrink-0">{d.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {processed.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nessun deposito processato</p>}
        </div>
      </div>
    </div>
  );
}

function WithdrawalsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['admin_withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (withdrawalId: string) => {
      const w = withdrawals.find(x => x.id === withdrawalId);
      if (!w) throw new Error('Prelievo non trovato');

      const { error } = await supabase.from('withdrawals').update({ 
        status: 'completed',
        reviewed_by: user!.id
      }).eq('id', withdrawalId);
      if (error) throw error;

      // Deduct balance
      const { data: profile, error: profError } = await supabase.from('profiles').select('balance, balance_available').eq('user_id', w.user_id).single();
      if (profError) throw profError;

      const newBalance = Math.max(0, Number(profile.balance) - Number(w.amount));
      const newAvailable = Math.max(0, Number(profile.balance_available) - Number(w.amount));

      const { error: updateError } = await supabase.from('profiles').update({ 
        balance: newBalance,
        balance_available: newAvailable
      }).eq('user_id', w.user_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_withdrawals'] });
      toast({ title: 'Prelievo approvato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (withdrawalId: string) => {
      const { error } = await supabase.from('withdrawals').update({ 
        status: 'rejected',
        reviewed_by: user!.id
      }).eq('id', withdrawalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_withdrawals'] });
      toast({ title: 'Prelievo rifiutato' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const pending = withdrawals.filter(w => w.status === 'pending');
  const processed = withdrawals.filter(w => w.status !== 'pending');

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">In attesa ({pending.length})</h4>
          <div className="space-y-2">
            {pending.map(w => (
              <Card key={w.id} className="border-amber-500/30">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{Number(w.amount).toLocaleString()} USDT</p>
                      <p className="text-[0.6rem] text-muted-foreground">Netto: {Number(w.net).toFixed(2)} · Fee: {Number(w.fee).toFixed(2)}</p>
                      <p className="text-[0.6rem] text-muted-foreground truncate">{w.wallet_address}</p>
                    </div>
                    <Badge variant="secondary" className="text-[0.6rem] shrink-0">{w.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => approveMutation.mutate(w.id)} disabled={approveMutation.isPending}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approva
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs gap-1" onClick={() => rejectMutation.mutate(w.id)} disabled={rejectMutation.isPending}>
                      <XCircle className="h-3.5 w-3.5" /> Rifiuta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Processati</h4>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {processed.map(w => (
            <Card key={w.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{Number(w.amount).toLocaleString()} USDT</p>
                    <p className="text-[0.6rem] text-muted-foreground">{w.type} · {new Date(w.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <Badge variant={w.status === 'completed' ? 'default' : 'destructive'} className="text-[0.6rem] shrink-0">{w.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {processed.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nessun prelievo processato</p>}
        </div>
      </div>
    </div>
  );
}

function WalletSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['admin_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_settings').select('*');
      if (error) throw error;
      return data;
    },
  });

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

  const [formData, setFormData] = useState<Record<string, string>>({});
  
  const getVal = (key: string) => formData[key] ?? getSetting(key);
  const setVal = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(formData)) {
        const existing = settings.find(s => s.key === key);
        if (existing) {
          const { error } = await supabase.from('admin_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
      setFormData({});
      toast({ title: 'Impostazioni salvate' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const settingsFields = [
    { key: 'company_wallet_trc20', label: 'Wallet Aziendale TRC-20', placeholder: 'T...' },
    { key: 'company_wallet_erc20', label: 'Wallet Aziendale ERC-20', placeholder: '0x...' },
    { key: 'min_deposit_usdt', label: 'Deposito Minimo (USDT)', placeholder: '50' },
    { key: 'min_withdraw_usdt', label: 'Prelievo Minimo (USDT)', placeholder: '10' },
    { key: 'withdraw_fee_pct', label: 'Fee Prelievo (%)', placeholder: '5' },
    { key: 'min_confirmations', label: 'Conferme Minime Blockchain', placeholder: '6' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3.5 space-y-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Configurazione Wallet & Pagamenti</h4>
          </div>

          {settingsFields.map(f => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Input
                placeholder={f.placeholder}
                value={getVal(f.key)}
                onChange={e => setVal(f.key, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}

          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || Object.keys(formData).length === 0}>
            {saveMutation.isPending ? 'Salvando...' : 'Salva Impostazioni'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notifications = [] } = useQuery({
    queryKey: ['admin_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').insert({
        title,
        message,
        created_by: user!.id,
        type: 'info',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_notifications'] });
      setTitle('');
      setMessage('');
      toast({ title: 'Notifica inviata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3.5 space-y-3 sm:p-4">
          <p className="font-medium text-foreground text-sm">Nuova Notifica</p>
          <Input placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Messaggio..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
          <Button className="w-full" disabled={!title || !message || sendMutation.isPending} onClick={() => sendMutation.mutate()}>
            <Bell className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? 'Invio...' : 'Invia Notifica'}
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {notifications.map(n => (
          <Card key={n.id}>
            <CardContent className="p-3">
              <p className="font-medium text-foreground text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              <p className="text-[0.6rem] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('it-IT')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LedgerTab() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['admin_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-2 max-h-[70vh] overflow-y-auto">
      {transactions.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nessuna transazione nel ledger</p>}
      {transactions.map(t => (
        <Card key={t.id}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t.type}</p>
                <p className="text-[0.6rem] text-muted-foreground">{new Date(t.created_at).toLocaleString('it-IT')}</p>
                {t.description && <p className="text-[0.6rem] text-muted-foreground truncate">{t.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className={cn('text-sm font-semibold', t.direction === 'credit' ? 'text-primary' : 'text-destructive')}>
                  {t.direction === 'credit' ? '+' : '-'}{Number(t.amount).toFixed(2)}
                </p>
                <Badge variant="outline" className="text-[0.5rem]">{t.asset}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin');
      if (error) throw error;
      return data.length > 0;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96 p-4">
        <Card>
          <CardContent className="p-6 text-center sm:p-8">
            <Shield className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold text-foreground">Accesso Negato</h2>
            <p className="text-sm text-muted-foreground mt-2">Non hai i permessi per accedere al pannello admin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Admin Panel</h2>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full overflow-x-auto flex">
          <TabsTrigger value="dashboard" className="text-xs flex-1 min-w-0">KPI</TabsTrigger>
          <TabsTrigger value="deposits" className="text-xs flex-1 min-w-0">Depositi</TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-xs flex-1 min-w-0">Prelievi</TabsTrigger>
          <TabsTrigger value="users" className="text-xs flex-1 min-w-0">Utenti</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs flex-1 min-w-0">Wallet</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs flex-1 min-w-0">Ledger</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs flex-1 min-w-0">Notifiche</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="deposits"><DepositsTab /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="settings"><WalletSettingsTab /></TabsContent>
        <TabsContent value="ledger"><LedgerTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
