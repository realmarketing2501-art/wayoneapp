import { motion } from 'framer-motion';
import { ArrowRight, Shield, TrendingUp, Users, Wallet, Zap, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: TrendingUp,
    title: 'Rendimenti Giornalieri',
    desc: 'Fino al 6% al giorno con piani di investimento flessibili e trasparenti.',
  },
  {
    icon: Users,
    title: 'Network & Referral',
    desc: 'Costruisci la tua rete, sblocca livelli superiori e guadagna bonus team.',
  },
  {
    icon: Shield,
    title: 'Sicurezza Totale',
    desc: 'Wallet interno con ledger verificabile. Ogni transazione è tracciata e protetta.',
  },
  {
    icon: Wallet,
    title: 'Depositi USDT',
    desc: 'Deposita via TRC-20 o ERC-20. Conferma rapida, gestione trasparente.',
  },
];

const levels = [
  { name: 'Bronze', rate: '1%/sett', color: 'from-amber-700 to-amber-600' },
  { name: 'Silver', rate: '2%/sett', color: 'from-gray-400 to-gray-300' },
  { name: 'Silver Elite', rate: '3%/sett', color: 'from-slate-300 to-slate-100' },
  { name: 'Gold', rate: '4%/sett', color: 'from-yellow-500 to-amber-400' },
  { name: 'Gold Elite', rate: '5%/sett', color: 'from-yellow-400 to-orange-300' },
  { name: 'Oro VIP', rate: '8%/sett', color: 'from-purple-500 to-violet-400' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold tracking-tight">
            <span className="text-primary">WAY</span>
            <span className="text-foreground"> ONE</span>
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
              Accedi
            </Button>
            <Button size="sm" onClick={() => navigate('/login')}>
              Registrati
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Piattaforma di investimento crypto
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Investi in modo
              <br />
              <span className="text-primary">intelligente</span> e sicuro
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Rendimenti giornalieri fino al 6%. Costruisci la tua rete, sblocca livelli superiori 
              e fai crescere il tuo capitale con WAY ONE.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={() => navigate('/login')}>
              Registrati ora <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => navigate('/home')}>
              Esplora la piattaforma <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4 sm:max-w-lg"
          >
            {[
              { value: '6%', label: 'Max giornaliero' },
              { value: '7', label: 'Livelli' },
              { value: '24/7', label: 'Accesso' },
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
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Perché scegliere WAY ONE</h3>
            <p className="mt-2 text-muted-foreground">Una piattaforma completa per far crescere il tuo capitale.</p>
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

      {/* Levels preview */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Livelli e rendimenti</h3>
            <p className="mt-2 text-muted-foreground">Più cresce la tua rete, più alti sono i tuoi rendimenti.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map((l, i) => (
              <motion.div
                key={l.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${l.color}`} />
                  <CardContent className="p-4 text-center">
                    <p className="font-display text-sm font-semibold text-muted-foreground">{l.name}</p>
                    <p className="mt-1 font-display text-3xl font-bold text-foreground">{l.rate}</p>
                    <p className="text-xs text-muted-foreground">al giorno</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/50 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mx-auto max-w-md">
            <Star className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Inizia oggi
            </h3>
            <p className="mt-3 text-muted-foreground">
              Crea il tuo account, deposita il tuo primo investimento e inizia a guadagnare ogni giorno.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2" onClick={() => navigate('/login')}>
                Crea il tuo account <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="font-display text-sm font-semibold">
            <span className="text-primary">WAY</span>
            <span className="text-foreground"> ONE</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} WAY ONE. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
}
