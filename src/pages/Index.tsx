import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Wallet, Users, BarChart3, Bell, ShieldCheck, Smartphone, FileText, Share2, ChevronRight, UserPlus, ArrowDownToLine, Eye, Send, Gift, Crown, Award, Star, Network, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UsdtMonogram } from '@/components/UsdtMonogram';

const features = [
  { icon: Smartphone, title: 'Mobile-first', desc: 'Esperienza ottimizzata per ogni dispositivo.' },
  { icon: BarChart3, title: 'Dashboard real-time', desc: 'Dati aggiornati in tempo reale per decisioni rapide.' },
  { icon: FileText, title: 'Piani chiari', desc: 'Informazioni trasparenti su durata e rendimenti.' },
  { icon: Share2, title: 'Referral semplificato', desc: 'Condivisione immediata e tracciamento intuitivo.' },
  { icon: Bell, title: 'Notifiche intelligenti', desc: 'Alert personalizzati per ogni evento importante.' },
  { icon: ShieldCheck, title: 'Sicurezza e controllo', desc: 'Protezione dei fondi e gestione in piena sicurezza.' },
];

const flow = [
  { icon: UserPlus, title: 'Registrati', desc: 'Crea il tuo account in pochi secondi.' },
  { icon: Wallet, title: 'Deposita', desc: 'Aggiungi fondi in modo sicuro e veloce.' },
  { icon: Eye, title: 'Monitora', desc: 'Segui rendimenti e stato del tuo piano.' },
  { icon: Send, title: 'Condividi', desc: 'Invita nuovi utenti e guadagna di più.' },
  { icon: ArrowDownToLine, title: 'Preleva', desc: 'Richiedi il prelievo e ricevi i tuoi fondi.' },
];

const screens = [
  {
    title: 'Landing & Onboarding',
    desc: 'Accesso rapido e onboarding semplice e guidato.',
  },
  {
    title: 'Dashboard',
    desc: 'Panoramica completa di saldo, rendimenti e stato del piano.',
  },
  {
    title: 'Investi',
    desc: 'Selezione del piano con dettagli chiari su durata e rendimento.',
  },
];

// Piani investimento — percentuali dimezzate (-50%) rispetto al modello originale
const plans = [
  { name: 'Starter',  days: 30, daily: '0,40%', roi: '+12%',     min: '20 USDT', max: '500 USDT' },
  { name: 'Silver',   days: 45, daily: '0,50%', roi: '+22,5%',   min: '20 USDT', max: '2.000 USDT' },
  { name: 'Gold',     days: 60, daily: '0,60%', roi: '+36%',     min: '20 USDT', max: '5.000 USDT', popular: true },
  { name: 'Platinum', days: 75, daily: '0,75%', roi: '+56,25%',  min: '20 USDT', max: '10.000 USDT' },
  { name: 'Diamond',  days: 90, daily: '0,90%', roi: '+81%',     min: '20 USDT', max: 'Illimitato' },
];

// Referral 4 livelli — commissioni dimezzate (totale 7,5%)
const referralLevels = [
  { level: 'L1', label: 'Invitato diretto',     pct: '4%',   on1000: '+40 USDT' },
  { level: 'L2', label: 'Invitato del tuo L1',  pct: '2%',   on1000: '+20 USDT' },
  { level: 'L3', label: 'Invitato del tuo L2',  pct: '1%',   on1000: '+10 USDT' },
  { level: 'L4', label: 'Invitato del tuo L3',  pct: '0,5%', on1000: '+5 USDT' },
];

// Bonus & milestone — importi dimezzati
const bonuses = [
  { icon: Gift,   title: 'Benvenuto',         when: 'Registrazione completata',         reward: '50 USDT' },
  { icon: Users,  title: 'Primo referral',    when: '1° invitato che investe',          reward: '25 USDT' },
  { icon: Star,   title: 'Super reclutatore', when: '10 referral diretti attivi',       reward: '250 USDT' },
  { icon: Crown,  title: 'Diamond recruiter', when: '50 referral diretti attivi',       reward: '1.500 USDT' },
  { icon: Award,  title: 'Fedeltà mensile',   when: 'Account attivo ogni 30 giorni',    reward: '12,5 USDT' },
  { icon: Wallet, title: 'Volume 500+',       when: 'Investimento personale > 500',     reward: '15 USDT' },
  { icon: Wallet, title: 'Volume 2.000+',     when: 'Investimento personale > 2.000',   reward: '75 USDT' },
  { icon: Wallet, title: 'Volume 5.000+',     when: 'Investimento personale > 5.000',   reward: '250 USDT' },
];

// Rank VIP — bonus %/giorno dimezzati
const ranks = [
  { name: 'Standard', volume: '< 5.000 USDT',     bonus: 'Nessuno',      extra: '—' },
  { name: 'Gold',     volume: '> 5.000 USDT',     bonus: '+0,5%/giorno', extra: 'Badge + supporto prioritario' },
  { name: 'Platinum', volume: '> 20.000 USDT',    bonus: '+0,75%/giorno',extra: 'Badge + fee prelievo 0' },
  { name: 'Diamond',  volume: '> 100.000 USDT',   bonus: '+1,0%/giorno', extra: 'Badge + account manager' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen usdt-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 usdt-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <UsdtMonogram size={36} letter="U" />
            <span className="font-display text-2xl font-bold usdt-gold-text">USDT</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" className="usdt-btn-ghost" onClick={() => navigate('/login')}>
              Accedi
            </Button>
            <Button size="sm" className="usdt-btn-gold" onClick={() => navigate('/login')}>
              Registrati
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/10 blur-[140px]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              La piattaforma di investimento USDT
            </div>

            <UsdtMonogram size={120} letter="U" className="mx-auto mb-6 usdt-glow-gold" />

            <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
              <span className="usdt-gold-text">Investi</span>{' '}
              <span className="text-foreground">in modo</span>
              <br />
              <span className="text-foreground">intelligente in </span>
              <span className="usdt-gold-text">USDT</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base sm:text-lg text-muted-foreground">
              Costruisci il tuo futuro con piani chiari, rendimenti trasparenti e una rete referral semplice da gestire.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" className="w-full gap-2 sm:w-auto usdt-btn-gold" onClick={() => navigate('/login')}>
              Registrati ora <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" className="w-full gap-2 sm:w-auto usdt-btn-ghost" onClick={() => navigate('/home')}>
              Esplora l'app <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4 sm:max-w-lg"
          >
            {[
              { value: '24/7', label: 'Operativo' },
              { value: '4', label: 'Piani' },
              { value: '1:1', label: 'USD ↔ USDT' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold usdt-gold-text">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="usdt-divider mx-auto max-w-6xl" />

      {/* Schermate principali */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Interfaccia dell'app<br />e <span className="usdt-gold-text">schermate principali</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              USDT è progettata per offrire un'esperienza semplice, trasparente e orientata al controllo della propria attività.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {screens.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <PhoneFrame index={i} />
                <div className="mt-4 text-center">
                  <h3 className="font-display text-xl font-bold usdt-gold-text">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="usdt-divider mx-auto max-w-6xl" />

      {/* Caratteristiche UX */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            Caratteristiche <span className="usdt-gold-text">UX</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="usdt-card p-5 flex gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="usdt-divider mx-auto max-w-6xl" />

      {/* Flusso */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            Come <span className="usdt-gold-text">funziona</span>
          </h2>
          <div className="mt-12 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
            {flow.map((step, i) => (
              <div key={step.title} className="flex items-center gap-3 lg:flex-1 lg:flex-col lg:gap-2">
                <div className="flex flex-1 items-center gap-3 lg:flex-col lg:text-center">
                  <div className="usdt-coin flex h-14 w-14 items-center justify-center text-primary-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="lg:mt-2">
                    <p className="font-display font-bold text-foreground">{step.title}</p>
                    <p className="mt-0.5 max-w-[12rem] text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <ArrowRight className="h-5 w-5 shrink-0 text-primary/60 lg:rotate-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-x-0 top-0 mx-auto h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <UsdtMonogram size={72} letter="U" className="mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Inizia oggi con <span className="usdt-gold-text">USDT</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Crea il tuo account, deposita i primi USDT e attiva il tuo piano in pochi minuti.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 usdt-btn-gold" onClick={() => navigate('/login')}>
              Crea account <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/15 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <UsdtMonogram size={24} letter="U" />
            <span className="font-display text-lg font-bold usdt-gold-text">USDT</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} USDT. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Phone mockup ---------- */
function PhoneFrame({ index }: { index: number }) {
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="relative aspect-[9/19] rounded-[2rem] border-2 border-primary/30 bg-gradient-to-b from-[hsl(var(--u-card))] to-[hsl(var(--u-bg))] p-2 shadow-2xl">
        <div className="absolute left-1/2 top-1.5 z-10 h-3 w-16 -translate-x-1/2 rounded-full bg-black/80" />
        <div className="h-full w-full overflow-hidden rounded-[1.6rem] bg-[hsl(var(--u-bg))] p-3 pt-6">
          {index === 0 && <PhoneLanding />}
          {index === 1 && <PhoneDashboard />}
          {index === 2 && <PhoneInvest />}
        </div>
      </div>
    </div>
  );
}

function PhoneLanding() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <UsdtMonogram size={56} letter="U" />
      <p className="font-display text-sm font-bold usdt-gold-text">Benvenuto in USDT</p>
      <p className="text-[0.55rem] text-muted-foreground">
        Investi in modo intelligente.<br />Costruisci il tuo futuro.
      </p>
      <div className="mt-2 w-full space-y-1.5">
        <div className="usdt-btn-gold rounded-md py-1.5 text-[0.6rem]">Registrati</div>
        <div className="usdt-btn-ghost rounded-md py-1.5 text-[0.6rem]">Accedi</div>
      </div>
    </div>
  );
}

function PhoneDashboard() {
  return (
    <div className="space-y-2">
      <div className="usdt-card-gold flex items-center justify-between p-2">
        <div>
          <p className="text-[0.5rem] text-muted-foreground">Saldo USDT</p>
          <p className="font-display text-sm font-bold usdt-gold-text">3.867,5</p>
        </div>
        <UsdtMonogram size={24} letter="U" />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {['Investi', 'Referral', 'Stats', 'Alert'].map((q) => (
          <div key={q} className="rounded-lg border border-primary/20 bg-card/40 py-1 text-center text-[0.45rem]">
            {q}
          </div>
        ))}
      </div>
      <div className="space-y-1 rounded-lg border border-primary/15 p-1.5">
        <p className="text-[0.5rem] font-bold text-foreground">Panoramica</p>
        {[
          ['Rendimento', '1,2%'],
          ['Piano attivo', 'Gold'],
          ['Scadenza', 'G. 60'],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between text-[0.5rem]">
            <span className="text-muted-foreground">{l}</span>
            <span className="font-bold text-primary">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneInvest() {
  const plans = [
    ['Silver', '45 gg', '1,0%'],
    ['Gold', '90 gg', '1,5%'],
    ['Platinum', '90 gg', '2,0%'],
    ['Diamond', '90 gg', '2,5%'],
  ];
  return (
    <div className="space-y-2">
      <p className="text-center font-display text-[0.6rem] font-bold text-foreground">Scegli il tuo piano</p>
      {plans.map(([n, d, r], i) => (
        <div
          key={n}
          className={`flex items-center justify-between rounded-lg border p-1.5 ${
            i === 1 ? 'border-primary bg-primary/10' : 'border-primary/15'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rotate-45 rounded-sm bg-primary/60" />
            <span className="text-[0.55rem] font-semibold">{n}</span>
          </div>
          <div className="text-right text-[0.5rem]">
            <p className="text-muted-foreground">{d}</p>
            <p className="font-bold text-primary">{r} / giorno</p>
          </div>
        </div>
      ))}
      <div className="usdt-btn-gold rounded-md py-1 text-center text-[0.55rem]">Conferma piano</div>
    </div>
  );
}
