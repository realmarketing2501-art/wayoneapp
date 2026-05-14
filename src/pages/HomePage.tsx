import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowDownToLine, TrendingUp, Users, Bell, Clock, ChevronRight,
  ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useLevel } from '@/hooks/useLevels';
import { getLevelLabel, type LevelName } from '@/lib/levels';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UsdtMonogram } from '@/components/UsdtMonogram';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

const quickActions = [
  { icon: TrendingUp, label: 'Investi', path: '/invest' },
  { icon: Users, label: 'Referral', path: '/network' },
  { icon: Wallet, label: 'Wallet', path: '/fund' },
  { icon: Bell, label: 'Notifiche', path: '/income' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const countdown = useCountdown();
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const { t } = useTranslation();

  const quickActions = [
    { icon: TrendingUp, label: t('nav.invest'), path: '/invest' },
    { icon: Users, label: t('nav.referral'), path: '/network' },
    { icon: Wallet, label: t('nav.wallet'), path: '/fund' },
    { icon: Bell, label: t('home.notifications'), path: '/income' },
  ];

  const level = (profile?.level ?? 'gamma') as LevelName;
  const levelInfo = useLevel(level);
  const balance = Number(profile?.balance ?? 0);
  const totalEarned = Number(profile?.total_earned ?? 0);
  const indicativeRate = Number(levelInfo?.giornaliero_45 ?? 0);
  const dailyEarning = balance * (indicativeRate / 100);

  const { data: activeInvestment } = useQuery({
    queryKey: ['active_investment', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: recentTx = [] } = useQuery({
    queryKey: ['recent_tx', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading && user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Guest landing card
  if (!user) {
    return (
      <div className="space-y-6 p-4">
        <div className="usdt-card-gold relative overflow-hidden p-8 text-center">
          <UsdtMonogram size={88} letter="U" className="mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold usdt-gold-text">{t('home.welcome')}</h1>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {t('home.tagline')}
          </p>
          <div className="mt-6 space-y-2">
            <Button className="usdt-btn-gold w-full" size="lg" onClick={() => navigate('/login')}>
              {t('home.register')}
            </Button>
            <Button className="usdt-btn-ghost w-full" size="lg" onClick={() => navigate('/login')}>
              {t('home.signIn')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Hero saldo */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="usdt-card-gold relative overflow-hidden p-5"
      >
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('home.balanceUsdt')}</p>
            <p className="font-display mt-1 text-4xl font-bold usdt-gold-text">
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ≈ ${balance.toLocaleString()} USD
            </p>
          </div>
          <UsdtMonogram size={56} letter="U" />
        </div>

        <div className="usdt-divider my-4" />

        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{t('home.earned')}</p>
            <p className="font-display mt-0.5 text-base font-bold text-foreground">
              +{totalEarned.toFixed(2)} <span className="text-xs text-muted-foreground">USDT</span>
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{t('home.level')}</p>
            <p className="font-display mt-0.5 text-base font-bold usdt-gold-text">
              {getLevelLabel(level)}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Quick actions */}
      <section className="grid grid-cols-4 gap-2">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="usdt-card flex flex-col items-center gap-1.5 p-3 transition-all active:scale-95 hover:border-primary/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <a.icon className="h-4 w-4" />
            </div>
            <span className="text-[0.65rem] font-medium text-foreground">{a.label}</span>
          </button>
        ))}
      </section>

      {/* Panoramica */}
      <section className="usdt-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">{t('home.overview')}</h2>
          <button
            onClick={() => navigate('/income')}
            className="flex items-center gap-0.5 text-xs text-primary"
          >
            {t('common.details')} <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2.5">
          <RowItem
            icon={<TrendingUp className="h-4 w-4" />}
            label={t('home.dailyReturn')}
            value={`${indicativeRate.toFixed(2)}%`}
            sub={t('home.dailyReturnSub', { amount: dailyEarning.toFixed(2) })}
          />
          <RowItem
            icon={<Wallet className="h-4 w-4" />}
            label={t('home.activePlan')}
            value={activeInvestment?.plan_name ?? t('common.none')}
            sub={
              activeInvestment
                ? `${Number(activeInvestment.amount).toFixed(0)} USDT · ${activeInvestment.duration_days}d`
                : t('home.startInvesting')
            }
          />
          <RowItem
            icon={<Clock className="h-4 w-4" />}
            label={t('home.nextCredit')}
            value={countdown}
            sub={t('home.nextCreditSub')}
          />
        </div>
      </section>

      {/* Azioni deposito/prelievo */}
      <section className="grid grid-cols-2 gap-3">
        <Button
          className="usdt-btn-gold h-12 gap-2"
          onClick={() => navigate('/deposit')}
        >
          <ArrowDownToLine className="h-4 w-4" /> {t('home.deposit')}
        </Button>
        <Button
          className="usdt-btn-ghost h-12 gap-2"
          onClick={() => navigate('/withdraw')}
        >
          <ArrowUpRight className="h-4 w-4" /> {t('home.withdraw')}
        </Button>
      </section>

      {/* Cronologia movimenti */}
      <section className="usdt-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">{t('home.txHistory')}</h2>
          <button
            onClick={() => navigate('/fund')}
            className="flex items-center gap-0.5 text-xs text-primary"
          >
            {t('common.all')} <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {recentTx.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('home.noTx')}</p>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx: any) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RowItem({
  icon, label, value, sub,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[0.65rem] text-muted-foreground/80">{sub}</p>}
      </div>
      <p className="font-display text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function TxRow({ tx }: { tx: any }) {
  const isIn = tx.direction === 'in';
  const date = new Date(tx.created_at).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short',
  });
  const time = new Date(tx.created_at).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  });
  const labelMap: Record<string, string> = {
    deposit: 'Deposito',
    withdraw: 'Prelievo',
    investment: 'Investimento',
    interest: 'Rendimento giornaliero',
    bonus: 'Bonus rete',
    referral: 'Referral bonus',
  };
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}
        >
          {isIn ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">{labelMap[tx.type] ?? tx.type}</p>
          <p className="text-[0.6rem] text-muted-foreground">{date} · {time}</p>
        </div>
      </div>
      <p className={`font-display text-sm font-bold ${isIn ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isIn ? '+' : '-'}{Number(tx.amount).toFixed(2)} USDT
      </p>
    </div>
  );
}
