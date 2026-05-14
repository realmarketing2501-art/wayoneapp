import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Users, DollarSign, User, LogIn, Bell, Award, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const publicTabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/invest', icon: TrendingUp, label: 'Invest' },
  { path: '/qualifiche', icon: Award, label: 'Livelli' },
  { path: '/network', icon: Users, label: 'Rete' },
  { path: '/income', icon: DollarSign, label: 'Income' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs = [
    ...publicTabs,
    user
      ? { path: '/profile', icon: User, label: 'Me' }
      : { path: '/login', icon: LogIn, label: 'Accedi' },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col pirate-theme">
      <header className="sticky top-0 z-50 flex items-center justify-between pirate-header px-4 py-3 safe-top">
        <h1 className="pirate-display text-xl font-bold tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
          <Anchor className="h-5 w-5" style={{ color: 'hsl(var(--p-gold-bright))' }} />
          <span style={{ color: 'hsl(var(--p-gold-bright))' }}>WAY</span>
          <span style={{ color: 'hsl(var(--p-cream))' }}> ONE</span>
        </h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <button className="relative rounded-full p-2 transition-colors" style={{ color: 'hsl(var(--p-muted))' }}>
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--p-gold))] animate-pulse-glow" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24" style={{ background: 'hsl(var(--p-ink))' }}>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 pirate-nav safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                data-active={isActive}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs min-w-[3.2rem] pirate-nav-item'
                )}
              >
                <tab.icon className={cn('h-5 w-5 pirate-nav-icon')} />
                <span className="pirate-nav-label text-[0.6rem]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
