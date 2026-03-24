import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Users, DollarSign, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/invest', icon: TrendingUp, label: 'Invest' },
  { path: '/network', icon: Users, label: 'Rete' },
  { path: '/income', icon: DollarSign, label: 'Income' },
  { path: '/profile', icon: User, label: 'Me' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="font-display text-xl font-bold tracking-tight">
          <span className="text-primary">WAY</span>
          <span className="text-foreground"> ONE</span>
        </h1>
        <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_hsl(145,100%,45%)]')} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
