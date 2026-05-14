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
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between pirate-header px-4 py-3 safe-top">
        <h1 className="pirate-display text-xl font-bold tracking-tight flex items-center gap-2">
          <Anchor className="h-5 w-5" style={{ color: 'hsl(var(--p-gold-bright))' }} />
          <span style={{ color: 'hsl(var(--p-gold-bright))' }}>WAY</span>
          <span style={{ color: 'hsl(var(--p-cream))' }}> ONE</span>
        </h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <button className="relative rounded-full p-2 transition-colors" style={{ color: 'hsl(var(--p-muted))' }}>
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--p-gold))]" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 pirate-nav safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                data-active={isActive}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors min-w-[3rem] pirate-nav-item',
                  isActive && 'pirate-nav-item-active'
                )}
                style={isActive ? { color: 'hsl(var(--p-gold-bright))', textShadow: '0 0 8px hsl(var(--p-gold) / 0.5)' } : {}}
              >
                <tab.icon className={cn('h-5 w-5')} />
                <span className="font-medium text-[0.65rem]" style={{ fontFamily: "'Cinzel', serif" }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
