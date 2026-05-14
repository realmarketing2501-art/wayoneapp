import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Users, Wallet, User, LogIn, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeaderLanguageButton from './HeaderLanguageButton';
import { useAuth } from '@/contexts/AuthContext';
import { UsdtMonogram } from './UsdtMonogram';
import GuestBanner from './GuestBanner';
import CryptoTicker from './CryptoTicker';
import { useAutoTrackSession } from '@/hooks/useTrackSignup';
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  useAutoTrackSession();

  const publicTabs = [
    { path: '/home', icon: Home, label: t('nav.home') },
    { path: '/fund', icon: Wallet, label: t('nav.wallet') },
    { path: '/invest', icon: TrendingUp, label: t('nav.invest') },
    { path: '/network', icon: Users, label: t('nav.referral') },
  ];

  const tabs = [
    ...publicTabs,
    user
      ? { path: '/profile', icon: User, label: t('nav.profile') }
      : { path: '/login', icon: LogIn, label: t('nav.login') },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col usdt-bg">
      <header className="sticky top-0 z-50 usdt-header safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5"
          >
            <UsdtMonogram size={32} letter="U" />
            <span className="font-display text-xl font-bold tracking-wide usdt-gold-text">
              USDT
            </span>
          </button>
          <div className="flex items-center gap-1">
            <HeaderLanguageButton />
            {user && (
              <button
                onClick={() => navigate('/income')}
                className="relative rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t('home.notifications')}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>
            )}
          </div>
        </div>
        <CryptoTicker />
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <GuestBanner />
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 usdt-nav safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                data-active={isActive}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 px-2 py-2 usdt-nav-item',
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[0.65rem] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
