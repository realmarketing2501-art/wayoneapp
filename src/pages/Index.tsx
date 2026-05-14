import { motion } from 'framer-motion';
import { ArrowRight, Anchor, Compass, Ship, Users, Wallet, ChevronRight, Skull, Sailboat, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import portHero from '@/assets/wayone-port-hero.jpg';
import fleetSafe from '@/assets/wayone-fleet-safe.jpg';

const features = [
  {
    icon: Compass,
    title: 'Rotta Giornaliera',
    desc: 'Rendimenti quotidiani fino al 6% — la tua bussola punta sempre al guadagno.',
  },
  {
    icon: Users,
    title: 'Ciurma & Referral',
    desc: 'Recluta la tua ciurma, sali di rango e incassa bonus team a ogni arrembaggio.',
  },
  {
    icon: Anchor,
    title: 'Porto Sicuro',
    desc: 'Wallet interno con ledger verificabile: ogni doblone è tracciato e protetto.',
  },
  {
    icon: Wallet,
    title: 'Forziere USDT',
    desc: 'Deposita via TRC-20 o ERC-20. Imbarchi rapidi, gestione trasparente.',
  },
];

const ranks = [
  { name: 'Mozzo', rate: 'Inizio', icon: Anchor },
  { name: 'Marinaio', rate: '1%/gg', icon: Sailboat },
  { name: 'Nostromo', rate: '2%/gg', icon: Ship },
  { name: 'Capitano', rate: '3%/gg', icon: Compass },
  { name: 'Ammiraglio', rate: '5%/gg', icon: Crown },
  { name: 'Re dei Mari', rate: '6%/gg', icon: Skull },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pirate-theme">
      {/* Header */}
      <header className="sticky top-0 z-50 pirate-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="pirate-display text-xl flex items-center gap-2">
            <Anchor className="h-5 w-5" style={{ color: 'hsl(var(--p-gold-bright))' }} />
            <span style={{ color: 'hsl(var(--p-gold-bright))' }}>WAY</span>
            <span style={{ color: 'hsl(var(--p-cream))' }}> ONE</span>
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" className="pirate-btn-ghost" onClick={() => navigate('/login')}>
              Sali a bordo
            </Button>
            <Button size="sm" className="pirate-btn-gold" onClick={() => navigate('/login')}>
              Arruolati
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${portHero})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--p-deep))]/60 via-[hsl(var(--p-ink))]/80 to-[hsl(var(--p-ink))]" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[hsl(var(--p-gold))]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full pirate-chip px-4 py-1.5 text-xs font-medium" style={{ color: 'hsl(var(--p-gold-bright))' }}>
              <Compass className="h-3.5 w-3.5" />
              La rotta dei nuovi pirati della finanza
            </div>
            <h2 className="pirate-display text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ color: 'hsl(var(--p-cream))' }}>
              Salpa verso il
              <br />
              <span className="pirate-gold-text">tuo tesoro</span> in USDT
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base sm:text-lg" style={{ color: 'hsl(var(--p-muted))' }}>
              Naviga rendimenti fino al 6% al giorno, recluta la tua ciurma e scala i ranghi —
              da Mozzo a Re dei Mari — con WAY ONE.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" className="w-full gap-2 sm:w-auto pirate-btn-gold" onClick={() => navigate('/login')}>
              Salpa ora <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" className="w-full gap-2 sm:w-auto pirate-btn-ghost" onClick={() => navigate('/home')}>
              Esplora la flotta <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4 sm:max-w-lg"
          >
            {[
              { value: '6%', label: 'Bottino max/gg' },
              { value: '6', label: 'Ranghi' },
              { value: '24/7', label: 'In navigazione' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="pirate-display text-2xl font-bold sm:text-3xl pirate-gold-text">{s.value}</p>
                <p className="text-xs" style={{ color: 'hsl(var(--p-muted))' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="pirate-divider" />

      {/* Features */}
      <section className="py-12 sm:py-20" style={{ background: 'hsl(var(--p-deep) / 0.4)' }}>
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h3 className="pirate-display text-2xl font-bold sm:text-3xl" style={{ color: 'hsl(var(--p-cream))' }}>Perché unirsi alla ciurma WAY ONE</h3>
            <p className="mt-2" style={{ color: 'hsl(var(--p-muted))' }}>Una flotta completa per portare in porto il tuo bottino.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="pirate-card p-5 flex gap-4 h-full transition-all hover:border-[hsl(var(--p-gold))]/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'hsl(var(--p-gold) / 0.15)' }}>
                    <f.icon className="h-5 w-5" style={{ color: 'hsl(var(--p-gold-bright))' }} />
                  </div>
                  <div>
                    <h4 className="pirate-display font-semibold" style={{ color: 'hsl(var(--p-cream))' }}>{f.title}</h4>
                    <p className="mt-1 text-sm" style={{ color: 'hsl(var(--p-muted))' }}>{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="pirate-divider" />

      {/* Ranks preview */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h3 className="pirate-display text-2xl font-bold sm:text-3xl" style={{ color: 'hsl(var(--p-cream))' }}>Ranghi della ciurma</h3>
            <p className="mt-2" style={{ color: 'hsl(var(--p-muted))' }}>Da Mozzo a Re dei Mari — più cresce la flotta, più ricco è il bottino.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ranks.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="pirate-card-ornate p-4 text-center pirate-corner-ornament relative overflow-hidden">
                  <div className="h-1 w-16 mx-auto mb-3 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--p-gold)), transparent)' }} />
                  <r.icon className="mx-auto mb-2 h-6 w-6" style={{ color: 'hsl(var(--p-gold-bright))' }} />
                  <p className="pirate-display text-sm font-semibold" style={{ color: 'hsl(var(--p-muted))' }}>{r.name}</p>
                  <p className="mt-1 pirate-display text-3xl font-bold" style={{ color: 'hsl(var(--p-cream))' }}>{r.rate}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--p-muted))' }}>rendimento giornaliero</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="pirate-divider" />

      {/* CTA */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${fleetSafe})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--p-ink))] via-[hsl(var(--p-deep))]/90 to-[hsl(var(--p-deep))]/70" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mx-auto max-w-md">
            <Skull className="mx-auto mb-4 h-8 w-8" style={{ color: 'hsl(var(--p-gold-bright))' }} />
            <h3 className="pirate-display text-2xl font-bold sm:text-3xl" style={{ color: 'hsl(var(--p-cream))' }}>
              Issa le vele oggi
            </h3>
            <p className="mt-3" style={{ color: 'hsl(var(--p-muted))' }}>
              Crea il tuo account, riempi il forziere col primo investimento e parti all'arrembaggio del tuo bottino quotidiano.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 pirate-btn-gold" onClick={() => navigate('/login')}>
                Arruolati nella ciurma <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'hsl(var(--p-gold-deep) / 0.4)', background: 'hsl(var(--p-deep) / 0.6)' }}>
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="pirate-display text-sm font-semibold flex items-center justify-center gap-1.5">
            <Anchor className="h-3.5 w-3.5" style={{ color: 'hsl(var(--p-gold-bright))' }} />
            <span style={{ color: 'hsl(var(--p-gold-bright))' }}>WAY</span>
            <span style={{ color: 'hsl(var(--p-cream))' }}> ONE</span>
          </p>
          <p className="mt-2 text-xs" style={{ color: 'hsl(var(--p-muted))' }}>
            © {new Date().getFullYear()} WAY ONE. Tutti i mari conquistati.
          </p>
        </div>
      </footer>
    </div>
  );
}
