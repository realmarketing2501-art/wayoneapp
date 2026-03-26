import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, DollarSign, TrendingUp, ArrowUpDown,
  CheckCircle, XCircle, Search, Shield, Bell
} from 'lucide-react';

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-bold text-foreground">{value}</p>
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
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + Number(w.net), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

  const levelDist = profiles.reduce((acc, p) => {
    acc[p.level] = (acc[p.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KPICard icon={Users} label="Utenti Totali" value={String(profiles.length)} color="bg-blue-600" />
        <KPICard icon={DollarSign} label="Volume Depositi" value={`${totalDeposited.toLocaleString()} USDT`} color="bg-green-600" />
        <KPICard icon={TrendingUp} label="Saldo Totale" value={`${totalBalance.toLocaleString()} USDT`} color="bg-purple-600" />
        <KPICard icon={ArrowUpDown} label="Prelievi Pendenti" value={String(pendingWithdrawals)} color="bg-amber-600" />
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Distribuzione Livelli</h3>
          <div className="space-y-2">
            {Object.entries(levelDist).map(([level, count]) => (
              <div key={level} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{level}</span>
                <Badge variant="secondary">{count}</Badge>
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca utente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium text-foreground text-sm">{p.username}</p>
                <p className="text-xs text-muted-foreground">{p.referral_code} · {new Date(p.created_at).toLocaleDateString('it-IT')}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{p.level}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{Number(p.balance).toLocaleString()} USDT</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WithdrawalsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['admin_withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Note: approve/reject requires admin RLS policies or edge function
  // For now this is UI-only showing the queue

  return (
    <div className="space-y-2">
      {withdrawals.map(w => (
        <Card key={w.id}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{Number(w.amount).toLocaleString()} USDT</p>
                <p className="text-xs text-muted-foreground">{w.type} · {w.wallet_address.slice(0, 10)}... · {new Date(w.created_at).toLocaleDateString('it-IT')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={w.status === 'completed' ? 'default' : w.status === 'pending' ? 'secondary' : 'destructive'}>
                  {w.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {withdrawals.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nessun prelievo</p>}
    </div>
  );
}

function DepositsTab() {
  const { data: deposits = [] } = useQuery({
    queryKey: ['admin_deposits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-2">
      {deposits.map(d => (
        <Card key={d.id}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{Number(d.amount).toLocaleString()} USDT</p>
                <p className="text-xs text-muted-foreground">{d.network} · {new Date(d.created_at).toLocaleDateString('it-IT')}</p>
              </div>
              <Badge variant={d.status === 'confirmed' ? 'default' : 'secondary'}>{d.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
      {deposits.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nessun deposito</p>}
    </div>
  );
}

function NotificationsTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['admin_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Sending notifications requires admin INSERT policy or edge function
  // UI ready for when backend supports it

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-medium text-foreground text-sm">Nuova Notifica</p>
          <Input placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Messaggio..." value={message} onChange={e => setMessage(e.target.value)} />
          <Button className="w-full" disabled={!title || !message}>
            <Bell className="mr-2 h-4 w-4" />
            Invia Notifica
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {notifications.map(n => (
          <Card key={n.id}>
            <CardContent className="p-3">
              <p className="font-medium text-foreground text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin');
      if (error) throw error;
      return data.length > 0;
    },
    enabled: !!user,
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
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
        <h2 className="font-display text-xl font-bold text-foreground">Admin Panel</h2>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="dashboard">KPI</TabsTrigger>
          <TabsTrigger value="users">Utenti</TabsTrigger>
          <TabsTrigger value="withdrawals">Prelievi</TabsTrigger>
          <TabsTrigger value="deposits">Depositi</TabsTrigger>
          <TabsTrigger value="notifications">Notifiche</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsTab /></TabsContent>
        <TabsContent value="deposits"><DepositsTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
