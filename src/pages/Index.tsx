import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Wallet, Users, BarChart3, Bell, ShieldCheck, Smartphone, FileText, Share2, ChevronRight, UserPlus, ArrowDownToLine, Eye, Send, Crown, Star, Network, Layers, Calculator, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UsdtMonogram } from '@/components/UsdtMonogram';
import HeaderLanguageButton from '@/components/HeaderLanguageButton';
import CryptoTicker from '@/components/CryptoTicker';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const featureIcons = [Smartphone, BarChart3, FileText, Share2, Bell, ShieldCheck];
const flowIcons = [UserPlus, Wallet, TrendingUp, ArrowDownToLine];
const bonusIcons = [Users, Star, Crown, Wallet, Wallet, Wallet];

// Nessun fallback statico: se non ci sono piani attivi mostriamo un empty-state.

const referralLevels = [
  { level: 'L1', pct: '4%',   on1000: '+40 USDT' },
  { level: 'L2', pct: '2%',   on1000: '+20 USDT' },
  { level: 'L3', pct: '1%',   on1000: '+10 USDT' },
  { level: 'L4', pct: '0,5%', on1000: '+5 USDT' },
];

type Item = { title: string; desc: string };
type BonusItem = { title: string; when: string; reward: string };
type RankItem = { name: string; volume: string; bonus: string; extra: string };
type LevelLabel = { label: string };

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = t('landing.features.items', { returnObjects: true }) as Item[];
  const flow = t('landing.flow.items', { returnObjects: true }) as Item[];
  const screens = t('landing.screens.items', { returnObjects: true }) as Item[];
  const bonuses = t('landing.bonuses.items', { returnObjects: true }) as BonusItem[];
  const ranks = t('landing.ranks.items', { returnObjects: true }) as RankItem[];
  const refLabels = t('landing.referral.levels', { returnObjects: true }) as LevelLabel[];

  // Piani dinamici dal pannello admin (tabella investment_plans)
  const { data: dbPlans } = useQuery({
    queryKey: ['landing_investment_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('id,name,status,duration,duration_days,daily_return,min_invest,max_invest')
        .eq('status', 'active')
        .order('min_invest', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const plans = useMemo<PhonePlan[]>(() => {
    if (!dbPlans || dbPlans.length === 0) return [];
    const fmt = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 2 });
    const mid = Math.floor(dbPlans.length / 2);
    return dbPlans.map((p, i) => {
      const days = p.duration_days ?? p.duration ?? 0;
      const daily = Number(p.daily_return ?? 0);
      const roi = daily * days;
      const max = p.max_invest && Number(p.max_invest) >= 1_000_000 ? '__UNLIMITED__' : fmt(Number(p.max_invest ?? 0));
      return {
        name: p.name,
        days,
        daily: `${fmt(daily)}%`,
        roi: `+${fmt(roi)}%`,
        min: Number(p.min_invest ?? 0),
        max,
        popular: i === mid,
      };
    });
  }, [dbPlans]);

  const hasPlans = plans.length > 0;


  return (
    <div className="min-h-screen usdt-bg">
      <header className="sticky top-0 z-50 usdt-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <UsdtMonogram size={36} letter="U" />
            <span className="font-display text-2xl font-bold usdt-gold-text">USDT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HeaderLanguageButton />
            <Button size="sm" className="usdt-btn-ghost px-2.5" onClick={() => navigate('/login')}>
              {t('landing.header.signin')}
            </Button>
            <Button size="sm" className="usdt-btn-gold px-2.5" onClick={() => navigate('/login')}>
              {t('landing.header.signup')}
            </Button>
          </div>
        </div>
        <CryptoTicker />
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/10 blur-[140px]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pt-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('landing.hero.tag')}
            </div>

            <UsdtMonogram size={120} letter="U" className="mx-auto mb-6 usdt-glow-gold" />

            <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
              <span className="usdt-gold-text">{t('landing.hero.title_a')}</span>{' '}
              <span className="text-foreground">{t('landing.hero.title_b')}</span>
              <br />
              <span className="text-foreground">{t('landing.hero.title_c')} </span>
              <span className="usdt-gold-text">{t('landing.hero.title_d')}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base sm:text-lg text-muted-foreground">
              {t('landing.hero.sub')}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full gap-2 sm:w-auto usdt-btn-gold" onClick={() => navigate('/login')}>
              {t('landing.hero.cta_register')} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" className="w-full gap-2 sm:w-auto usdt-btn-ghost" onClick={() => navigate('/simulator')}>
              {t('landing.hero.cta_simulate')} <Calculator className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="ghost" className="w-full gap-2 sm:w-auto" onClick={() => navigate('/home')}>
              {t('landing.hero.cta_explore')} <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4 sm:max-w-lg">
            {[
              { value: '24/7', label: t('landing.stats.operative') },
              { value: '4', label: t('landing.stats.plans') },
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
              {t('landing.screens.title_a')}<br />
              {t('landing.screens.title_b')} <span className="usdt-gold-text">{t('landing.screens.title_c')}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              {t('landing.screens.sub')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {screens.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <PhoneFrame index={i} plans={plans} />
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
            {t('landing.features.title_a')} <span className="usdt-gold-text">{t('landing.features.title_b')}</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = featureIcons[i] ?? Smartphone;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="usdt-card p-5 flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="usdt-divider mx-auto max-w-6xl" />

      {/* Flusso */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            {t('landing.flow.title_a')} <span className="usdt-gold-text">{t('landing.flow.title_b')}</span>
          </h2>
          <div className="mt-12 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
            {flow.map((step, i) => {
              const Icon = flowIcons[i] ?? UserPlus;
              return (
                <div key={step.title} className="flex items-center gap-3 lg:flex-1 lg:flex-col lg:gap-2">
                  <div className="flex flex-1 items-center gap-3 lg:flex-col lg:text-center">
                    <div className="usdt-coin flex h-14 w-14 items-center justify-center text-primary-foreground">
                      <Icon className="h-6 w-6" />
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Piani investimento */}
      <div className="usdt-divider mx-auto max-w-6xl" />
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              {t('landing.plans.title_a')} <span className="usdt-gold-text">{t('landing.plans.title_b')}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              {t('landing.plans.sub')}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {plans.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className={`relative rounded-2xl p-5 ${p.popular ? 'usdt-card-gold border-2 border-primary' : 'usdt-card'}`}>
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-primary-foreground">
                    {t('landing.plans.popular')}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold usdt-gold-text">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.days} {t('landing.plans.days')}</p>
                <div className="mt-4">
                  <p className="font-display text-3xl font-bold text-foreground">{p.daily}</p>
                  <p className="text-[0.7rem] text-muted-foreground">{t('landing.plans.daily_sub')}</p>
                </div>
                <div className="mt-3 inline-flex rounded-full bg-primary/15 px-2.5 py-0.5 text-[0.7rem] font-bold text-primary">
                  ROI {p.roi}
                </div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>{t('landing.plans.min')}: <span className="text-foreground">{p.min} USDT</span></p>
                  <p>{t('landing.plans.max')}: <span className="text-foreground">{p.max === '__UNLIMITED__' ? t('landing.plans.unlimited') : `${p.max} USDT`}</span></p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-[0.7rem] text-muted-foreground">
            {t('landing.plans.note')}
          </p>
        </div>
      </section>

      {/* Referral 4 livelli */}
      <div className="usdt-divider mx-auto max-w-6xl" />
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Network className="h-3.5 w-3.5" /> {t('landing.referral.tag')}
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              {t('landing.referral.title_a')} <span className="usdt-gold-text">{t('landing.referral.title_b')}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              {t('landing.referral.sub')}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {referralLevels.map((r, i) => (
              <motion.div key={r.level} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="usdt-card p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-sm font-bold text-foreground">{r.level}</p>
                <p className="text-xs text-muted-foreground">{refLabels[i]?.label}</p>
                <p className="mt-3 font-display text-3xl font-bold usdt-gold-text">{r.pct}</p>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">{t('landing.referral.on1000')}: <span className="text-primary font-semibold">{r.on1000}</span></p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('landing.referral.total')}: <span className="font-display text-lg font-bold usdt-gold-text">7,5%</span> {t('landing.referral.total_suffix')}
            </p>
          </div>
        </div>
      </section>

      {/* Bonus & Milestone */}
      <div className="usdt-divider mx-auto max-w-6xl" />
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            {t('landing.bonuses.title_a')} <span className="usdt-gold-text">{t('landing.bonuses.title_b')}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
            {t('landing.bonuses.sub')}
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bonuses.map((b, i) => {
              const Icon = bonusIcons[i] ?? Star;
              return (
                <motion.div key={b.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="usdt-card flex flex-col p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-foreground">{b.title}</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{b.when}</p>
                  <p className="mt-3 font-display text-lg font-bold usdt-gold-text">{b.reward}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rank VIP */}
      <div className="usdt-divider mx-auto max-w-6xl" />
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            {t('landing.ranks.title_a')} <span className="usdt-gold-text">{t('landing.ranks.title_b')}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
            {t('landing.ranks.sub')}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ranks.map((r, i) => (
              <motion.div key={r.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-5 ${i === 3 ? 'usdt-card-gold border-2 border-primary' : 'usdt-card'}`}>
                <div className="flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${i === 0 ? 'text-muted-foreground' : 'text-primary'}`} />
                  <h3 className="font-display text-lg font-bold text-foreground">{r.name}</h3>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t('landing.ranks.volume_label')}: <span className="text-foreground">{r.volume}</span></p>
                <p className="mt-4 font-display text-xl font-bold usdt-gold-text">{r.bonus}</p>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">{r.extra}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Licenza e conformità */}
      <div className="usdt-divider mx-auto max-w-6xl" />
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Award className="h-3.5 w-3.5" /> Licenza FSA
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Trasparenza e <span className="usdt-gold-text">conformità</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              WAYONE opera con licenza Financial Dealer rilasciata dalle autorità di Saint Vincent and the Grenadines. Verifica i nostri documenti ufficiali.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 mx-auto max-w-xl rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">Financial Dealer License</h3>
            <p className="mt-1 text-sm text-muted-foreground">SVG FSA — Way One Std</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Registrazione</p>
                <p className="font-display text-sm font-bold text-foreground">09310 FSA</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Stato</p>
                <p className="font-display text-sm font-bold text-emerald-500">Attiva</p>
              </div>
            </div>
            <Button size="lg" className="mt-5 gap-2 usdt-btn-gold" onClick={() => navigate('/certifications')}>
              Verifica certificazione <ExternalLink className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-x-0 top-0 mx-auto h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <UsdtMonogram size={72} letter="U" className="mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t('landing.cta.title_a')} <span className="usdt-gold-text">{t('landing.cta.title_b')}</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t('landing.cta.sub')}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 usdt-btn-gold" onClick={() => navigate('/login')}>
              {t('landing.cta.btn')} <ArrowRight className="h-4 w-4" />
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
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <button onClick={() => navigate('/certifications')} className="hover:text-primary hover:underline">
              Certificazioni
            </button>
            <span className="text-border">|</span>
            <button onClick={() => navigate('/faq')} className="hover:text-primary hover:underline">
              FAQ
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} USDT. {t('landing.footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Phone mockup ---------- */
type PhonePlan = { name: string; days: number; daily: string; roi: string; min: number; max: string; popular?: boolean };

function PhoneFrame({ index, plans }: { index: number; plans: PhonePlan[] }) {
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="relative aspect-[9/19] rounded-[2rem] border-2 border-primary/30 bg-gradient-to-b from-[hsl(var(--u-card))] to-[hsl(var(--u-bg))] p-2 shadow-2xl">
        <div className="absolute left-1/2 top-1.5 z-10 h-3 w-16 -translate-x-1/2 rounded-full bg-black/80" />
        <div className="h-full w-full overflow-hidden rounded-[1.6rem] bg-[hsl(var(--u-bg))] p-3 pt-6">
          {index === 0 && <PhoneLanding />}
          {index === 1 && <PhoneDashboard plans={plans} />}
          {index === 2 && <PhoneInvest plans={plans} />}
        </div>
      </div>
    </div>
  );
}


function PhoneLanding() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <UsdtMonogram size={56} letter="U" />
      <p className="font-display text-sm font-bold usdt-gold-text">{t('landing.phone.welcome')}</p>
      <p className="text-[0.55rem] text-muted-foreground whitespace-pre-line">
        {t('landing.phone.tagline')}
      </p>
      <div className="mt-2 w-full space-y-1.5">
        <div className="usdt-btn-gold rounded-md py-1.5 text-[0.6rem]">{t('landing.phone.register')}</div>
        <div className="usdt-btn-ghost rounded-md py-1.5 text-[0.6rem]">{t('landing.phone.signin')}</div>
      </div>
    </div>
  );
}

function PhoneDashboard({ plans }: { plans: PhonePlan[] }) {
  const { t } = useTranslation();
  const quick = t('landing.phone.quick', { returnObjects: true }) as string[];
  const featured = plans.find((p) => p.popular) ?? plans[Math.floor(plans.length / 2)] ?? plans[0];
  return (
    <div className="space-y-2">
      <div className="usdt-card-gold flex items-center justify-between p-2">
        <div>
          <p className="text-[0.5rem] text-muted-foreground">{t('landing.phone.balance')}</p>
          <p className="font-display text-sm font-bold usdt-gold-text">3.867,5</p>
        </div>
        <UsdtMonogram size={24} letter="U" />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {quick.map((q) => (
          <div key={q} className="rounded-lg border border-primary/20 bg-card/40 py-1 text-center text-[0.45rem]">
            {q}
          </div>
        ))}
      </div>
      <div className="space-y-1 rounded-lg border border-primary/15 p-1.5">
        <p className="text-[0.5rem] font-bold text-foreground">{t('landing.phone.overview')}</p>
        {[
          [t('landing.phone.yield_label'), featured?.daily ?? '—'],
          [t('landing.phone.plan_label'), featured?.name ?? '—'],
          [t('landing.phone.exp_label'), t('landing.phone.exp_value')],
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

function PhoneInvest({ plans }: { plans: PhonePlan[] }) {
  const { t } = useTranslation();
  const d = t('landing.phone.days_short');
  // Mostra max 4 piani reali; evidenzia il "popular" (o il secondo)
  const phonePlans = plans.slice(0, 4);
  const popularIdx = phonePlans.findIndex((p) => p.popular);
  const highlightIdx = popularIdx >= 0 ? popularIdx : Math.min(1, phonePlans.length - 1);
  return (
    <div className="space-y-2">
      <p className="text-center font-display text-[0.6rem] font-bold text-foreground">{t('landing.phone.choose_plan')}</p>
      {phonePlans.map((p, i) => (
        <div key={p.name}
          className={`flex items-center justify-between rounded-lg border p-1.5 ${i === highlightIdx ? 'border-primary bg-primary/10' : 'border-primary/15'}`}>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rotate-45 rounded-sm bg-primary/60" />
            <span className="text-[0.55rem] font-semibold">{p.name}</span>
          </div>
          <div className="text-right text-[0.5rem]">
            <p className="text-muted-foreground">{p.days} {d}</p>
            <p className="font-bold text-primary">{p.daily} {t('landing.phone.per_day')}</p>
          </div>
        </div>
      ))}
      <div className="usdt-btn-gold rounded-md py-1 text-center text-[0.55rem]">{t('landing.phone.confirm')}</div>
    </div>
  );
}

// Suppress unused import warnings for icons referenced indirectly
void Send; void Eye;

