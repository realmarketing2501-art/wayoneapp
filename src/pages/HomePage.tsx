import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowDownToLine, ClipboardList, UserPlus, ChevronRight, Clock,
  Anchor, Compass, Ship, Users, Crown, Coins, Skull, Map as MapIcon, Sword,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useLevel, useLevels } from '@/hooks/useLevels';
import { getLevelLabel, getPirateRank, type LevelName } from '@/lib/levels';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import portHero from '@/assets/wayone-port-hero.jpg';
import fleetSafe from '@/assets/wayone-fleet-safe.jpg';
import fleetRisk from '@/assets/wayone-fleet-risk.jpg';

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
  { icon: Wallet, label: 'Deposita', path: '/deposit' },
  { icon: ArrowDownToLine, label: 'Preleva', path: '/withdraw' },
  { icon: ClipboardList, label: 'Missioni', path: '/tasks' },
  { icon: UserPlus, label: 'Recluta', path: '/network' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const countdown = useCountdown();
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();

  const level = profile?.level ?? 'gamma';
  const levelInfo = useLevel(level);
  const { data: allLevels = [] } = useLevels();
  const operationalLevels = allLevels.filter(l =>
    ['bronze', 'silver', 'silver_elite', 'gold', 'gold_elite', 'oro_vip'].includes(l.id),
  );
  const balance = Number(profile?.balance ?? 0);
  const totalEarned = Number(profile?.total_earned ?? 0);
  const indicativeRate = levelInfo?.settimanale != null
    ? Number(levelInfo.settimanale) / 7
    : Number(levelInfo?.giornaliero_45 ?? 0);
  const dailyEarning = balance * (indicativeRate / 100);

  const levelOrder = operationalLevels.findIndex(l => l.id === level) + 1;
  const levelTitle = levelOrder > 0 ? `Livello ${levelOrder}` : 'Mozzo';
  const captainName = profile?.username ?? 'Capitano';

  if (isLoading && user) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>;
  }

  return (
    <div className="pirate-theme -mx-px min-h-screen">
      {/* ========= HERO ========= */}
      <section className="relative overflow-hidden">
        <img
          src={portHero}
          alt="Way One — porto al tramonto"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black" />

        <div className="relative px-4 pt-6 pb-10">
          {/* Top bar: avatar + resources */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative h-14 w-14 rounded-full border-2 border-amber-500/80 bg-black/60 shadow-lg">
                <div className="flex h-full w-full items-center justify-center">
                  <Skull className="h-7 w-7 text-amber-400" />
                </div>
              </div>
              <div className="rounded-md border border-amber-700/50 bg-black/60 px-2 py-1 text-[0.65rem] backdrop-blur-sm">
                <div className="pirate-display text-amber-300">{levelTitle}</div>
                <div className="text-amber-100/80">Porto di Itaca</div>
              </div>
            </div>

            <div className="space-y-1 rounded-md border border-amber-700/40 bg-black/70 p-1.5 backdrop-blur-sm">
              <ResourceChip icon={<Coins className="h-3 w-3" />} value={balance.toLocaleString()} color="text-amber-300" />
              <ResourceChip icon={<div className="h-3 w-3 rotate-45 bg-sky-300" />} value={profile?.direct_referrals ?? 0} color="text-sky-200" />
              <ResourceChip icon={<div className="h-3 w-3 rounded-full bg-rose-400" />} value={profile?.total_network ?? 0} color="text-rose-200" />
            </div>
          </div>

          {/* Title plate */}
          <div className="mt-8 text-center">
            <div className="pirate-display text-3xl font-black tracking-[0.2em] text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-4xl">
              WAY <span className="text-amber-400">⚓</span> ONE
            </div>
            <div className="mt-1 inline-block border-y border-amber-500/60 px-4 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-amber-200">
              {levelTitle} · La nostra flotta cresce
            </div>
          </div>

          {/* Achievement banner */}
          <div className="relative mt-6">
            <div className="pirate-card-ornate p-4 text-center">
              <p className="pirate-display text-base font-bold text-amber-300">
                {user ? 'NUOVO TRAGUARDO RAGGIUNTO!' : 'BENVENUTO A BORDO'}
              </p>
              <p className="mt-2 font-serif text-sm leading-snug text-amber-50/90">
                {user
                  ? <>Grazie all'impegno dei tuoi marinai, la flotta si espande<br />e i guadagni aumentano.</>
                  : <>Arruolati nell'equipaggio di Way One e<br />salpa verso la tua fortuna.</>}
              </p>
              {user && (
                <p className="mt-2 font-serif text-sm text-amber-100/90">
                  Il capitano premia l'equipaggio con{' '}
                  <span className="pirate-gold-text font-bold">+{dailyEarning.toFixed(2)} USDT</span> al giorno
                </p>
              )}
            </div>
          </div>

          {/* Invite badge floating */}
          {user && (
            <button
              onClick={() => navigate('/network')}
              className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-amber-500/60 bg-black/60 px-4 py-1.5 text-xs text-amber-200 backdrop-blur-sm"
            >
              <UserPlus className="h-3.5 w-3.5" /> Invita marinai
            </button>
          )}
        </div>
      </section>

      {/* ========= STATS FLOTTA ========= */}
      <section className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <StatBlock
            icon={<Users className="h-5 w-5 text-amber-300" />}
            label="LA TUA FLOTTA"
            value={profile?.total_network ?? 0}
            unit="MARINAI"
            tagline="Insieme siamo più forti!"
          />
          <StatBlock
            icon={<Coins className="h-5 w-5 text-amber-300" />}
            label="BOTTINO TOTALE"
            value={totalEarned.toFixed(0)}
            unit="USDT"
            tagline="Per il tuo impegno e dedizione!"
          />
        </div>
      </section>

      {/* ========= AZIONI RAPIDE ========= */}
      {user && (
        <section className="px-4 pt-4">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="pirate-card flex flex-col items-center gap-1.5 p-3 transition-transform active:scale-95"
              >
                <a.icon className="h-5 w-5 text-amber-300" />
                <span className="pirate-display text-[0.6rem] text-amber-100">{a.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========= COFFRE: SALDO + COUNTDOWN ========= */}
      {user && (
        <section className="px-4 pt-4">
          <div className="pirate-card pirate-corner-ornament p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-amber-200/70">Forziere disponibile</p>
                <p className="pirate-display mt-1 text-2xl font-bold text-amber-200">
                  {balance.toLocaleString()} <span className="text-sm text-amber-300/70">USDT</span>
                </p>
              </div>
              <Anchor className="h-10 w-10 text-amber-500/40" />
            </div>
            <div className="my-3 pirate-divider" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[0.6rem] uppercase tracking-wider text-amber-200/60">Bottino giornaliero</p>
                <p className="pirate-display text-lg font-bold text-amber-300">+{dailyEarning.toFixed(2)}</p>
                <p className="text-[0.6rem] text-amber-100/60">stima al {indicativeRate.toFixed(2)}%/g</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-wider text-amber-200/60">Prossimo accredito</p>
                <p className="pirate-display flex items-center gap-1 text-lg font-bold text-amber-300">
                  <Clock className="h-4 w-4" /> {countdown}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========= SCEGLI IL TUO VIAGGIO ========= */}
      <section className="px-4 pt-6">
        <div className="text-center">
          <div className="pirate-display text-base font-bold text-amber-300">SCEGLI IL TUO VIAGGIO</div>
          <div className="mx-auto mt-1 h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <VoyageCard
            image={fleetSafe}
            label="VIAGGIO DA"
            duration="45 GIORNI"
            risk="Basso"
            riskColor="text-emerald-400"
            estimate="2.800"
            cta="ROTTA SICURA"
            onClick={() => navigate('/invest')}
          />
          <VoyageCard
            image={fleetRisk}
            label="VIAGGIO DA"
            duration="90 GIORNI"
            risk="Medio"
            riskColor="text-rose-400"
            estimate="4.200"
            cta="ROTTA REDDITIZIA"
            onClick={() => navigate('/invest')}
          />
        </div>

        {/* footer ribbon */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniInfo
            icon={<Sword className="h-4 w-4 text-amber-300" />}
            title="PAGA MARINAI"
            text="1.000 USDT al giorno per ogni marinaio a bordo."
          />
          <MiniInfo
            icon={<Coins className="h-4 w-4 text-amber-300" />}
            title={`GUADAGNO ${levelTitle.toUpperCase()}`}
            text="Bonus fisso per il capitano"
            highlight={`+${Number(levelInfo?.bonus_valore ?? 0).toLocaleString()}`}
          />
          <MiniInfo
            icon={<Compass className="h-4 w-4 text-amber-300" />}
            title="OBIETTIVO"
            text="Espandi la flotta, raggiungi nuovi porti e aumenta i tuoi profitti!"
          />
        </div>
      </section>

      {/* ========= LIVELLI WAY ONE — CARTA NAUTICA ========= */}
      <section className="px-4 pt-6">
        <div className="text-center">
          <div className="pirate-display text-base font-bold text-amber-300 flex items-center justify-center gap-2">
            <MapIcon className="h-4 w-4" /> ROTTE & QUALIFICHE
          </div>
          <div className="mx-auto mt-1 h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {operationalLevels.map((l, idx) => {
            const isCurrent = l.id === level;
            return (
              <div
                key={l.id}
                className={`pirate-card relative p-3 ${isCurrent ? 'ring-1 ring-amber-400' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-amber-400 bg-amber-500 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-black">
                    Attuale
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-amber-400" />
                  <div className="pirate-display text-[0.7rem] font-bold text-amber-200">
                    Liv. {idx + 1} — {getLevelLabel(l.id as LevelName).split(' ')[0]}
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="pirate-display text-xl font-bold text-amber-300">
                    {Number(l.settimanale ?? 0)}%
                  </span>
                  <span className="text-[0.55rem] text-amber-100/70">/sett · {l.durata_giorni}gg</span>
                </div>
                <div className="my-2 pirate-divider" />
                <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                  <div>
                    <p className="text-amber-100/60">Min</p>
                    <p className="font-semibold text-amber-100">{Number(l.investimento_min ?? 0)} U</p>
                  </div>
                  <div>
                    <p className="text-amber-100/60">Marinai</p>
                    <p className="font-semibold text-amber-100">{l.unita_richieste ?? '—'}</p>
                  </div>
                </div>
                <div className="mt-2 rounded border border-amber-700/40 bg-black/40 px-2 py-1.5 text-center">
                  <p className="text-[0.5rem] uppercase tracking-wider text-amber-100/60">Bonus capitano</p>
                  <p className="pirate-display text-xs font-bold text-amber-300">
                    +{Number(l.bonus_valore).toLocaleString()} USDT
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========= LEGEND BANNER ========= */}
      <section className="px-4 pt-6">
        <div className="pirate-card-ornate p-4 text-center">
          <Compass className="mx-auto mb-1 h-6 w-6 text-amber-400" />
          <p className="pirate-display text-sm font-bold text-amber-300">LA TUA LEGGENDA CONTINUA!</p>
          <p className="mt-1 font-serif text-xs italic text-amber-100/70">
            "Ogni viaggio ci rende più forti."
          </p>
        </div>
      </section>

      {/* CTA non loggato */}
      {!user && (
        <section className="px-4 pt-4 pb-4">
          <button
            onClick={() => navigate('/login')}
            className="pirate-btn-gold flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm"
          >
            ARRUOLATI ORA <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* spacer per bottom nav */}
      <div className="h-8" />
    </div>
  );
}

/* ---------- subcomponents ---------- */

function ResourceChip({ icon, value, color }: { icon: React.ReactNode; value: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded border border-amber-700/30 bg-black/40 px-1.5 py-0.5 text-[0.65rem]">
      {icon}
      <span className={`pirate-display font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatBlock({
  icon, label, value, unit, tagline,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; unit: string; tagline: string }) {
  return (
    <div className="pirate-card p-3 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className="pirate-display text-[0.6rem] font-bold tracking-widest text-amber-200">{label}</span>
      </div>
      <p className="pirate-display mt-1 text-xl font-bold text-amber-300">
        {value} <span className="text-[0.65rem] text-amber-100/70">{unit}</span>
      </p>
      <p className="mt-0.5 font-serif text-[0.6rem] italic text-amber-100/60">{tagline}</p>
    </div>
  );
}

function VoyageCard({
  image, label, duration, risk, riskColor, estimate, cta, onClick,
}: {
  image: string; label: string; duration: string; risk: string; riskColor: string;
  estimate: string; cta: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="pirate-card overflow-hidden p-0 text-left transition-transform active:scale-[0.98]">
      <div className="relative h-20 overflow-hidden">
        <img src={image} alt={duration} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute bottom-1 left-2">
          <p className="text-[0.55rem] uppercase tracking-wider text-amber-100/80">{label}</p>
          <p className="pirate-display text-base font-bold text-amber-200 leading-tight">{duration}</p>
        </div>
      </div>
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1 text-[0.6rem]">
          <Clock className="h-3 w-3 text-amber-300" />
          <span className="text-amber-100/70">Durata:</span>
          <span className="text-amber-100">{duration.replace('GIORNI', 'gg')}</span>
        </div>
        <div className="flex items-center gap-1 text-[0.6rem]">
          <Skull className="h-3 w-3 text-amber-300" />
          <span className="text-amber-100/70">Rischio:</span>
          <span className={riskColor}>{risk}</span>
        </div>
        <div className="text-[0.6rem]">
          <p className="text-amber-100/70">Guadagno stimato:</p>
          <p className="pirate-display text-base font-bold text-amber-300">{estimate}</p>
        </div>
        <div className="mt-1 rounded border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-center">
          <span className="pirate-display text-[0.6rem] font-bold text-amber-300">{cta}</span>
        </div>
      </div>
    </button>
  );
}

function MiniInfo({
  icon, title, text, highlight,
}: { icon: React.ReactNode; title: string; text: string; highlight?: string }) {
  return (
    <div className="pirate-card p-2 text-center">
      <div className="flex items-center justify-center">{icon}</div>
      <p className="pirate-display mt-1 text-[0.55rem] font-bold text-amber-200">{title}</p>
      <p className="mt-0.5 font-serif text-[0.55rem] leading-tight text-amber-100/70">{text}</p>
      {highlight && <p className="pirate-display mt-1 text-xs font-bold text-emerald-300">{highlight}</p>}
    </div>
  );
}
