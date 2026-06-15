import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/LevelBadge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Shield, Wallet, Globe, LogOut, ChevronRight, FileCheck, Sun, Moon, ShieldCheck, HelpCircle, Award } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const menuItems: Array<{ icon: any; label: string; desc: string; path: string | null; soon?: boolean }> = [
    { icon: FileCheck, label: t('profile.kyc'), desc: t('profile.kycDesc'), path: null, soon: true },
    { icon: Shield, label: t('profile.security'), desc: t('profile.securityDesc'), path: '/security' },
    { icon: Wallet, label: t('profile.wallets'), desc: t('profile.walletsDesc'), path: null, soon: true },
    { icon: Award, label: t('profile.levels'), desc: t('profile.levelsDesc'), path: '/qualifiche' },
    { icon: ShieldCheck, label: 'Certificazioni', desc: 'Licenze e documenti ufficiali WAYONE', path: '/certifications' },
    { icon: HelpCircle, label: t('profile.faq'), desc: t('profile.faqDesc'), path: '/faq' },
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
            <LevelBadge level={profile?.level ?? 'gamma'} size="sm" />
            <p className="mt-1 text-[0.65rem] text-muted-foreground sm:text-xs">
              {t('profile.memberSince')} {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '...'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 text-center sm:p-4">
            <p className="text-[0.65rem] text-muted-foreground sm:text-xs">{t('profile.available')}</p>
            <p className="font-display text-base font-bold text-primary sm:text-lg">{Number(profile?.balance ?? 0).toLocaleString()}</p>
            <p className="text-[0.6rem] text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center sm:p-4">
            <p className="text-[0.65rem] text-muted-foreground sm:text-xs">{t('profile.earned')}</p>
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
              <p className="text-sm font-medium text-foreground">{t('profile.theme')}</p>
              <p className="text-xs text-muted-foreground">{theme === 'dark' ? t('profile.dark') : t('profile.light')}</p>
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </CardContent>
      </Card>

      {/* Language selector */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="mb-2 flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('profile.language')}</p>
              <p className="text-xs text-muted-foreground">{t('profile.languageDesc')}</p>
            </div>
          </div>
          <LanguageSelector compact />
        </CardContent>
      </Card>

      {/* Menu items */}
      <div className="space-y-1.5">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => {
              if (item.path) navigate(item.path);
              else if (item.soon) toast.info('Funzione in arrivo', { description: `${item.label} sarà disponibile a breve.` });
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/30 active:scale-[0.98]"
          >
            <item.icon className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            {item.soon && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-medium text-muted-foreground">Presto</span>
            )}
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
            <p className="text-sm font-medium text-foreground">{t('profile.admin')}</p>
            <p className="text-xs text-muted-foreground">{t('profile.adminDesc')}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> {t('profile.logout')}
      </Button>
    </div>
  );
}
