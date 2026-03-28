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
    <div className="space-y-4 p-4">
      {/* Profile header */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20 sm:h-16 sm:w-16">
            <User className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-foreground truncate sm:text-xl">{profile?.username ?? '...'}</h2>
            <LevelBadge level={profile?.level ?? 'PRE'} size="sm" />
            <p className="mt-1 text-[0.65rem] text-muted-foreground sm:text-xs">
              Membro dal {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('it-IT') : '...'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 text-center sm:p-4">
            <p className="text-[0.65rem] text-muted-foreground sm:text-xs">Disponibile</p>
            <p className="font-display text-base font-bold text-primary sm:text-lg">{Number(profile?.balance ?? 0).toLocaleString()}</p>
            <p className="text-[0.6rem] text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center sm:p-4">
            <p className="text-[0.65rem] text-muted-foreground sm:text-xs">Guadagnato</p>
            <p className="font-display text-base font-bold text-accent sm:text-lg">{Number(profile?.total_earned ?? 0).toLocaleString()}</p>
            <p className="text-[0.6rem] text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
      </div>

      {/* Theme toggle */}
      <Card>
        <CardContent className="flex items-center justify-between p-3.5 sm:p-4">
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

      {/* Menu items */}
      <div className="space-y-1.5">
        {menuItems.map(item => (
          <button key={item.label} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/30 active:scale-[0.98]">
            <item.icon className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Admin link */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3.5 transition-colors hover:border-primary/60 active:scale-[0.98]"
        >
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Admin Panel</p>
            <p className="text-xs text-muted-foreground">Gestione piattaforma</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </div>
  );
}
