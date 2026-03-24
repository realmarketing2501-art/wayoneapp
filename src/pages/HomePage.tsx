import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownToLine, ClipboardList, UserPlus, ChevronRight, Clock, FileText, HelpCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LevelBadge } from '@/components/LevelBadge';
import { mockUser } from '@/data/mockData';
import { getLevelInfo } from '@/lib/levels';
import { useNavigate } from 'react-router-dom';

const banners = [
  { title: 'Earn up to 6% Daily', subtitle: 'Build your network. Grow your wealth.' },
  { title: 'WAY ONE Ecosystem', subtitle: 'The future of decentralized investing.' },
  { title: 'Invite & Earn More', subtitle: 'Unlock higher tiers with your team.' },
];

const quickActions = [
  { icon: Wallet, label: 'Deposit', path: '/invest', color: 'text-primary' },
  { icon: ArrowDownToLine, label: 'Withdraw', path: '/withdraw', color: 'text-accent' },
  { icon: ClipboardList, label: 'Tasks', path: '/tasks', color: 'text-way-sapphire' },
  { icon: UserPlus, label: 'Invite', path: '/network', color: 'text-way-diamond' },
];

function useCountdown(target: string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);
  return timeLeft;
}

export default function HomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const navigate = useNavigate();
  const countdown = useCountdown(mockUser.nextPayout);
  const levelInfo = getLevelInfo(mockUser.level);

  useEffect(() => {
    const id = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6 p-4">
      {/* Banner */}
      <motion.div
        key={bannerIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glow-green rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-6"
      >
        <h2 className="font-display text-xl font-bold text-primary">{banners[bannerIdx].title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{banners[bannerIdx].subtitle}</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <span className="text-xs font-medium text-foreground">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Balance Card */}
      <Card className="glow-green border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Totale</p>
              <p className="font-display text-3xl font-bold text-foreground">{mockUser.balance.toLocaleString()} <span className="text-lg text-muted-foreground">USDT</span></p>
            </div>
            <LevelBadge level={mockUser.level} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Rendimento Giornaliero</p>
              <p className="font-display text-lg font-semibold text-primary">+{mockUser.dailyEarning} USDT</p>
              <p className="text-xs text-primary/70">{levelInfo.dailyReturn}%/giorno</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Prossimo Accredito</p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" />
                <p className="font-display text-lg font-semibold text-accent">{countdown}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Guadagnato</p>
            <p className="font-display text-lg font-bold text-primary">{mockUser.totalEarned}</p>
            <p className="text-xs text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Referral</p>
            <p className="font-display text-lg font-bold text-foreground">{mockUser.directReferrals}</p>
            <p className="text-xs text-muted-foreground">diretti</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Rete</p>
            <p className="font-display text-lg font-bold text-foreground">{mockUser.totalNetwork}</p>
            <p className="text-xs text-muted-foreground">totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Academy */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Academy</h3>
        <div className="space-y-2">
          {[
            { icon: FileText, label: 'White Paper', desc: 'Scarica il documento ufficiale' },
            { icon: PlayCircle, label: 'Tutorial', desc: 'Guida per principianti' },
            { icon: HelpCircle, label: 'FAQ', desc: 'Domande frequenti' },
          ].map((item) => (
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
      </div>
    </div>
  );
}
