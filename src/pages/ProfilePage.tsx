import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/LevelBadge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Shield, Wallet, Globe, LogOut, ChevronRight, FileCheck, Sun, Moon, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: isAdmin } = useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin');
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: FileCheck, label: 'KYC Verification', desc: 'Verifica la tua identità' },
    { icon: Shield, label: 'Security Center', desc: 'Password, 2FA' },
    { icon: Wallet, label: 'Wallet Collegati', desc: 'Gestisci indirizzi USDT' },
    { icon: Globe, label: 'Lingua', desc: 'Italiano' },
  ];

  return (
    <div className="space-y-6 p-4">
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-foreground">{profile?.username ?? '...'}</h2>
            <LevelBadge level={profile?.level ?? 'PRE'} size="sm" />
            <p className="mt-1 text-xs text-muted-foreground">
              Membro dal {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('it-IT') : '...'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="font-display text-lg font-bold text-primary">{Number(profile?.balance ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Guadagnato</p>
            <p className="font-display text-lg font-bold text-accent">{Number(profile?.total_earned ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
      </div>

      {/* Theme toggle */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <div>
              <p className="text-sm font-medium text-foreground">Tema</p>
              <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Scuro' : 'Chiaro'}</p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {menuItems.map(item => (
          <button key={item.label} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
            <item.icon className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </div>
  );
}
