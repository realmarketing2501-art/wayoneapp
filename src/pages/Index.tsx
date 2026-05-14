import { motion } from 'framer-motion';
import { ArrowRight, Anchor, Compass, Ship, Users, Wallet, ChevronRight, Skull, Sailboat, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  { name: 'Mozzo', rate: 'Inizio', icon: Anchor, color: 'from-stone-500 to-stone-400' },
  { name: 'Marinaio', rate: '1%/gg', icon: Sailboat, color: 'from-sky-500 to-sky-300' },
  { name: 'Nostromo', rate: '2%/gg', icon: Ship, color: 'from-amber-700 to-amber-500' },
  { name: 'Capitano', rate: '3%/gg', icon: Compass, color: 'from-amber-300 to-yellow-200' },
  { name: 'Ammiraglio', rate: '5%/gg', icon: Crown, color: 'from-yellow-400 to-orange-300' },
  { name: 'Re dei Mari', rate: '6%/gg', icon: Skull, color: 'from-fuchsia-500 to-purple-400' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
            <Anchor className="h-5 w-5 text-primary" />
            <span className="text-primary">WAY</span>
            <span className="text-foreground"> ONE</span>
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
              Sali a bordo
            </Button>
            <Button size="sm" onClick={() => navigate('/login')}>
              Arruolati
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${portHero})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Compass className="h-3.5 w-3.5" />
              La rotta dei nuovi pirati della finanza
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Salpa verso il
              <br />
              <span className="text-primary">tuo tesoro</span> in USDT
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
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
            <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={() => navigate('/login')}>
              Salpa ora <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => navigate('/home')}>
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
                <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Perché unirsi alla ciurma WAY ONE</h3>
            <p className="mt-2 text-muted-foreground">Una flotta completa per portare in porto il tuo bottino.</p>
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
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-foreground">{f.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranks preview */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Ranghi della ciurma</h3>
            <p className="mt-2 text-muted-foreground">Da Mozzo a Re dei Mari — più cresce la flotta, più ricco è il bottino.</p>
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
                <Card className="overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${r.color}`} />
                  <CardContent className="p-4 text-center">
                    <r.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                    <p className="font-display text-sm font-semibold text-muted-foreground">{r.name}</p>
                    <p className="mt-1 font-display text-3xl font-bold text-foreground">{r.rate}</p>
                    <p className="text-xs text-muted-foreground">rendimento giornaliero</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border py-12 sm:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${fleetSafe})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mx-auto max-w-md">
            <Skull className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Issa le vele oggi
            </h3>
            <p className="mt-3 text-muted-foreground">
              Crea il tuo account, riempi il forziere col primo investimento e parti all'arrembaggio del tuo bottino quotidiano.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2" onClick={() => navigate('/login')}>
                Arruolati nella ciurma <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="font-display text-sm font-semibold flex items-center justify-center gap-1.5">
            <Anchor className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">WAY</span>
            <span className="text-foreground"> ONE</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} WAY ONE. Tutti i mari conquistati.
          </p>
        </div>
      </footer>
    </div>
  );
}
