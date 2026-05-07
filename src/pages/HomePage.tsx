import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownToLine, ClipboardList, UserPlus, ChevronRight, Clock, FileText, HelpCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LevelBadge } from '@/components/LevelBadge';
import { useProfile } from '@/hooks/useProfile';
import { useLevel } from '@/hooks/useLevels';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const banners = [
  { title: 'Guadagna fino al 6% al giorno', subtitle: 'Costruisci la tua rete. Fai crescere il tuo capitale.' },
  { title: 'Ecosistema WAY ONE', subtitle: 'Il futuro degli investimenti decentralizzati.' },
  { title: 'Invita e guadagna di più', subtitle: 'Sblocca livelli superiori con il tuo team.' },
];

const quickActions = [
  { icon: Wallet, label: 'Deposita', path: '/deposit', color: 'text-primary' },
  { icon: ArrowDownToLine, label: 'Preleva', path: '/withdraw', color: 'text-accent' },
  { icon: ClipboardList, label: 'Task', path: '/tasks', color: 'text-way-sapphire' },
  { icon: UserPlus, label: 'Invita', path: '/network', color: 'text-way-diamond' },
];

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

export default function HomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const navigate = useNavigate();
  const countdown = useCountdown();
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();

  const level = profile?.level ?? 'gamma';
  const levelInfo = useLevel(level);
  const balance = Number(profile?.balance ?? 0);
  const totalEarned = Number(profile?.total_earned ?? 0);
  // Rendita giornaliera del piano del livello: settimanale/7, fallback ai vecchi piani 45gg
  const indicativeRate = levelInfo?.settimanale != null
    ? Number(levelInfo.settimanale) / 7
    : Number(levelInfo?.giornaliero_45 ?? 0);
  const dailyEarning = balance * (indicativeRate / 100);

  useEffect(() => {
    const id = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, []);

  if (isLoading && user) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-5 p-4">
      {/* Banner */}
      <motion.div
        key={bannerIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glow-green rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-5"
      >
        <h2 className="font-display text-lg font-bold text-primary sm:text-xl">{banners[bannerIdx].title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{banners[bannerIdx].subtitle}</p>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <a.icon className={`h-4 w-4 ${a.color}`} />
            </div>
            <span className="text-[0.65rem] font-medium text-foreground sm:text-xs">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Balance card */}
      {user && (
        <Card className="glow-green border-primary/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground sm:text-sm">Saldo Disponibile</p>
                <p className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  {balance.toLocaleString()} <span className="text-base text-muted-foreground sm:text-lg">USDT</span>
                </p>
              </div>
              <LevelBadge level={level} size="sm" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-[0.65rem] text-muted-foreground sm:text-xs">Rendimento Giornaliero</p>
                <p className="font-display text-base font-semibold text-primary sm:text-lg">+{dailyEarning.toFixed(2)} USDT</p>
                <p className="text-[0.6rem] text-primary/70 sm:text-xs">stima al {indicativeRate}%/giorno</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-[0.65rem] text-muted-foreground sm:text-xs">Prossimo Accredito</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  <p className="font-display text-base font-semibold text-accent sm:text-lg">{countdown}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {user && (
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[0.65rem] text-muted-foreground">Guadagnato</p>
              <p className="font-display text-base font-bold text-primary sm:text-lg">{totalEarned.toFixed(2)}</p>
              <p className="text-[0.6rem] text-muted-foreground">USDT</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[0.65rem] text-muted-foreground">Referral</p>
              <p className="font-display text-base font-bold text-foreground sm:text-lg">{profile?.direct_referrals ?? 0}</p>
              <p className="text-[0.6rem] text-muted-foreground">diretti</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[0.65rem] text-muted-foreground">Rete</p>
              <p className="font-display text-base font-bold text-foreground sm:text-lg">{profile?.total_network ?? 0}</p>
              <p className="text-[0.6rem] text-muted-foreground">totale</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Not logged in CTA */}
      {!user && (
        <Card className="border-primary/20">
          <CardContent className="p-5 text-center">
            <h3 className="font-display text-lg font-bold text-foreground">Inizia a guadagnare</h3>
            <p className="mt-2 text-sm text-muted-foreground">Registrati per accedere al tuo wallet, depositi e investimenti.</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Registrati ora <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Academy */}
      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-foreground sm:text-lg">Academy</h3>
        <div className="space-y-2">
          {[
            { icon: FileText, label: 'White Paper', desc: 'Scarica il documento ufficiale' },
            { icon: PlayCircle, label: 'Tutorial', desc: 'Guida per principianti' },
            { icon: HelpCircle, label: 'FAQ', desc: 'Domande frequenti' },
          ].map((item) => (
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
      </div>
    </div>
  );
}
