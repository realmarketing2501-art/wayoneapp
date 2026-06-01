// Landing page translations (Index.tsx). Separated to keep main locale files small.

const it = {
  header: { signin: 'Accedi', signup: 'Registrati' },
  hero: {
    tag: 'La piattaforma di investimento USDT',
    title_a: 'Investi', title_b: 'in modo', title_c: 'intelligente in', title_d: 'USDT',
    sub: 'Costruisci il tuo futuro con piani chiari, rendimenti trasparenti e una rete referral semplice da gestire.',
    cta_register: 'Registrati ora', cta_simulate: 'Simula investimento', cta_explore: "Esplora l'app",
  },
  stats: { operative: 'Operativo', plans: 'Piani' },
  screens: {
    title_a: "Interfaccia dell'app", title_b: 'e', title_c: 'schermate principali',
    sub: "USDT è progettata per offrire un'esperienza semplice, trasparente e orientata al controllo della propria attività.",
    items: [
      { title: 'Landing', desc: 'Una panoramica chiara dei punti di forza della piattaforma.' },
      { title: 'Dashboard', desc: 'Saldo, piani attivi e cronologia sempre a portata di mano.' },
      { title: 'Investimenti', desc: 'Selezione del piano semplice e immediata.' },
    ],
  },
  features: {
    title_a: 'Caratteristiche', title_b: 'UX',
    items: [
      { title: 'Mobile-first', desc: 'Esperienza ottimizzata per ogni dispositivo.' },
      { title: 'Dashboard real-time', desc: 'Dati aggiornati in tempo reale per decisioni rapide.' },
      { title: 'Piani chiari', desc: 'Informazioni trasparenti su durata e rendimenti.' },
      { title: 'Referral semplificato', desc: 'Condivisione immediata e tracciamento intuitivo.' },
      { title: 'Notifiche puntuali', desc: 'Avvisi su accrediti, scadenze e bonus.' },
      { title: 'Sicurezza', desc: 'Operazioni atomiche e isolamento dati per utente.' },
    ],
  },
  flow: {
    title_a: 'Come', title_b: 'funziona',
    items: [
      { title: 'Registrati', desc: 'Crea il tuo account in pochi secondi.' },
      { title: 'Deposita', desc: 'USDT TRC-20 con accredito automatico.' },
      { title: 'Investi', desc: 'Scegli il piano in base al tuo livello.' },
      { title: 'Preleva', desc: 'Capitale e profitti rilasciati a scadenza.' },
    ],
  },
  plans: {
    title_a: 'Piani di', title_b: 'investimento',
    sub: 'Cinque piani a durata fissa con rendimento giornaliero. Capitale e profitti rilasciati a scadenza.',
    popular: 'Popolare', days: 'giorni', daily_sub: 'al giorno', min: 'Min', max: 'Max',
    note: 'Profitti calcolati ogni 24h. Multi-piano illimitati. Reinvestimento automatico opzionale.',
    unlimited: 'Illimitato',
  },
  referral: {
    tag: 'Sistema referral',
    title_a: 'Rete a', title_b: '4 livelli',
    sub: "Commissioni accreditate istantaneamente all'attivazione di ogni piano nella tua rete.",
    on1000: 'su 1.000 USDT',
    total: 'Totale cumulativo 4 livelli', total_suffix: 'su ogni deposito della tua rete',
    levels: [
      { label: 'Diretto invitato' },
      { label: 'Invitato del tuo L1' },
      { label: 'Invitato del tuo L2' },
      { label: 'Invitato del tuo L3' },
    ],
  },
  bonuses: {
    title_a: 'Bonus &', title_b: 'Milestone',
    sub: 'Premi per ogni traguardo della crescita della rete.',
    items: [
      { title: 'Primo referral',    when: '1° invitato che investe',          reward: '5 USDT' },
      { title: 'Super reclutatore', when: '10 referral diretti attivi',       reward: '75 USDT' },
      { title: 'Diamond recruiter', when: '50 referral diretti attivi',       reward: '500 USDT' },
      { title: 'Volume 500+',       when: 'Investimento personale > 500',     reward: '15 USDT' },
      { title: 'Volume 2.000+',     when: 'Investimento personale > 2.000',   reward: '75 USDT' },
      { title: 'Volume 5.000+',     when: 'Investimento personale > 5.000',   reward: '250 USDT' },
    ],
  },
  ranks: {
    title_a: 'Rank', title_b: 'VIP',
    sub: 'Più cresce la tua rete (L1+L2), più aumenta il bonus giornaliero su tutti i piani.',
    volume_label: 'Volume rete',
    items: [
      { name: 'Standard', volume: '< 5.000 USDT',   bonus: 'Nessuno',       extra: '—' },
      { name: 'Gold',     volume: '> 5.000 USDT',   bonus: '+0,5%/giorno',  extra: 'Badge + supporto prioritario' },
      { name: 'Platinum', volume: '> 20.000 USDT',  bonus: '+0,75%/giorno', extra: 'Badge + fee prelievo 0' },
      { name: 'Diamond',  volume: '> 100.000 USDT', bonus: '+1,0%/giorno',  extra: 'Badge + account manager' },
    ],
  },
  cta: {
    title_a: 'Inizia oggi con', title_b: 'USDT',
    sub: 'Crea il tuo account, deposita i primi USDT e attiva il tuo piano in pochi minuti.',
    btn: 'Crea account',
  },
  footer: { rights: 'Tutti i diritti riservati.' },
  phone: {
    welcome: 'Benvenuto in USDT', tagline: 'Investi in modo intelligente.\nCostruisci il tuo futuro.',
    register: 'Registrati', signin: 'Accedi',
    balance: 'Saldo USDT', overview: 'Panoramica',
    yield_label: 'Rendimento', plan_label: 'Piano attivo', exp_label: 'Scadenza', exp_value: 'G. 60',
    choose_plan: 'Scegli il tuo piano', confirm: 'Conferma piano', days_short: 'gg', per_day: '/ giorno',
    quick: ['Investi', 'Referral', 'Stats', 'Alert'],
  },
};

const en: typeof it = {
  header: { signin: 'Sign in', signup: 'Sign up' },
  hero: {
    tag: 'The USDT investment platform',
    title_a: 'Invest', title_b: 'smart', title_c: 'in', title_d: 'USDT',
    sub: 'Build your future with clear plans, transparent yields and a simple referral network.',
    cta_register: 'Sign up now', cta_simulate: 'Simulate investment', cta_explore: 'Explore the app',
  },
  stats: { operative: 'Operational', plans: 'Plans' },
  screens: {
    title_a: 'App interface', title_b: 'and', title_c: 'main screens',
    sub: 'USDT is designed to deliver a simple, transparent experience focused on control of your activity.',
    items: [
      { title: 'Landing', desc: 'A clear overview of the platform highlights.' },
      { title: 'Dashboard', desc: 'Balance, active plans and history at your fingertips.' },
      { title: 'Investments', desc: 'Simple and immediate plan selection.' },
    ],
  },
  features: {
    title_a: 'UX', title_b: 'features',
    items: [
      { title: 'Mobile-first', desc: 'Optimized experience on every device.' },
      { title: 'Real-time dashboard', desc: 'Live data for fast decisions.' },
      { title: 'Clear plans', desc: 'Transparent info on duration and yields.' },
      { title: 'Easy referral', desc: 'Instant sharing and intuitive tracking.' },
      { title: 'Timely notifications', desc: 'Alerts for credits, expirations and bonuses.' },
      { title: 'Security', desc: 'Atomic operations and per-user data isolation.' },
    ],
  },
  flow: {
    title_a: 'How it', title_b: 'works',
    items: [
      { title: 'Sign up', desc: 'Create your account in seconds.' },
      { title: 'Deposit', desc: 'USDT TRC-20 with auto-credit.' },
      { title: 'Invest', desc: 'Pick a plan based on your level.' },
      { title: 'Withdraw', desc: 'Capital and profits released at maturity.' },
    ],
  },
  plans: {
    title_a: 'Investment', title_b: 'plans',
    sub: 'Five fixed-duration plans with daily yield. Capital and profits released at maturity.',
    popular: 'Popular', days: 'days', daily_sub: 'per day', min: 'Min', max: 'Max',
    note: 'Profits calculated every 24h. Unlimited multi-plans. Optional auto-reinvest.',
    unlimited: 'Unlimited',
  },
  referral: {
    tag: 'Referral system',
    title_a: '4-level', title_b: 'network',
    sub: 'Commissions credited instantly when any plan in your network is activated.',
    on1000: 'on 1,000 USDT',
    total: '4-level cumulative total', total_suffix: 'on every deposit in your network',
    levels: [
      { label: 'Direct invitee' },
      { label: 'Invitee of your L1' },
      { label: 'Invitee of your L2' },
      { label: 'Invitee of your L3' },
    ],
  },
  bonuses: {
    title_a: 'Bonuses &', title_b: 'Milestones',
    sub: 'Rewards for every milestone in your network growth.',
    items: [
      { title: 'First referral',     when: '1st invitee who invests',         reward: '5 USDT' },
      { title: 'Super recruiter',    when: '10 active direct referrals',      reward: '75 USDT' },
      { title: 'Diamond recruiter',  when: '50 active direct referrals',      reward: '500 USDT' },
      { title: 'Volume 500+',        when: 'Personal investment > 500',       reward: '15 USDT' },
      { title: 'Volume 2,000+',      when: 'Personal investment > 2,000',     reward: '75 USDT' },
      { title: 'Volume 5,000+',      when: 'Personal investment > 5,000',     reward: '250 USDT' },
    ],
  },
  ranks: {
    title_a: 'VIP', title_b: 'ranks',
    sub: 'The bigger your network (L1+L2), the higher the daily bonus on every plan.',
    volume_label: 'Network volume',
    items: [
      { name: 'Standard', volume: '< 5,000 USDT',   bonus: 'None',          extra: '—' },
      { name: 'Gold',     volume: '> 5,000 USDT',   bonus: '+0.5%/day',     extra: 'Badge + priority support' },
      { name: 'Platinum', volume: '> 20,000 USDT',  bonus: '+0.75%/day',    extra: 'Badge + 0 withdraw fee' },
      { name: 'Diamond',  volume: '> 100,000 USDT', bonus: '+1.0%/day',     extra: 'Badge + account manager' },
    ],
  },
  cta: {
    title_a: 'Start today with', title_b: 'USDT',
    sub: 'Create your account, deposit your first USDT and activate your plan in minutes.',
    btn: 'Create account',
  },
  footer: { rights: 'All rights reserved.' },
  phone: {
    welcome: 'Welcome to USDT', tagline: 'Invest smart.\nBuild your future.',
    register: 'Sign up', signin: 'Sign in',
    balance: 'USDT Balance', overview: 'Overview',
    yield_label: 'Yield', plan_label: 'Active plan', exp_label: 'Expires', exp_value: 'D. 60',
    choose_plan: 'Pick your plan', confirm: 'Confirm plan', days_short: 'd', per_day: '/ day',
    quick: ['Invest', 'Referral', 'Stats', 'Alert'],
  },
};

const es: typeof it = {
  header: { signin: 'Entrar', signup: 'Regístrate' },
  hero: {
    tag: 'La plataforma de inversión en USDT',
    title_a: 'Invierte', title_b: 'de forma', title_c: 'inteligente en', title_d: 'USDT',
    sub: 'Construye tu futuro con planes claros, rendimientos transparentes y una red de referidos sencilla.',
    cta_register: 'Regístrate ahora', cta_simulate: 'Simular inversión', cta_explore: 'Explorar la app',
  },
  stats: { operative: 'Operativa', plans: 'Planes' },
  screens: {
    title_a: 'Interfaz de la app', title_b: 'y', title_c: 'pantallas principales',
    sub: 'USDT está diseñada para una experiencia simple y transparente, centrada en el control de tu actividad.',
    items: [
      { title: 'Landing', desc: 'Visión clara de los puntos fuertes de la plataforma.' },
      { title: 'Panel', desc: 'Saldo, planes activos e historial al alcance.' },
      { title: 'Inversiones', desc: 'Selección de plan simple e inmediata.' },
    ],
  },
  features: {
    title_a: 'Características', title_b: 'UX',
    items: [
      { title: 'Mobile-first', desc: 'Experiencia optimizada en cualquier dispositivo.' },
      { title: 'Panel en tiempo real', desc: 'Datos actualizados para decisiones rápidas.' },
      { title: 'Planes claros', desc: 'Información transparente sobre duración y rendimiento.' },
      { title: 'Referidos sencillos', desc: 'Compartir inmediato y seguimiento intuitivo.' },
      { title: 'Notificaciones puntuales', desc: 'Avisos de abonos, vencimientos y bonos.' },
      { title: 'Seguridad', desc: 'Operaciones atómicas y aislamiento de datos por usuario.' },
    ],
  },
  flow: {
    title_a: 'Cómo', title_b: 'funciona',
    items: [
      { title: 'Regístrate', desc: 'Crea tu cuenta en segundos.' },
      { title: 'Deposita', desc: 'USDT TRC-20 con abono automático.' },
      { title: 'Invierte', desc: 'Elige el plan según tu nivel.' },
      { title: 'Retira', desc: 'Capital y beneficios liberados al vencimiento.' },
    ],
  },
  plans: {
    title_a: 'Planes de', title_b: 'inversión',
    sub: 'Cinco planes de duración fija con rendimiento diario. Capital y beneficios al vencimiento.',
    popular: 'Popular', days: 'días', daily_sub: 'al día', min: 'Mín', max: 'Máx',
    note: 'Beneficios calculados cada 24h. Multi-plan ilimitados. Reinversión automática opcional.',
    unlimited: 'Ilimitado',
  },
  referral: {
    tag: 'Sistema de referidos',
    title_a: 'Red de', title_b: '4 niveles',
    sub: 'Comisiones acreditadas al instante con cada activación de plan en tu red.',
    on1000: 'sobre 1.000 USDT',
    total: 'Total acumulado 4 niveles', total_suffix: 'sobre cada depósito de tu red',
    levels: [
      { label: 'Invitado directo' },
      { label: 'Invitado de tu L1' },
      { label: 'Invitado de tu L2' },
      { label: 'Invitado de tu L3' },
    ],
  },
  bonuses: {
    title_a: 'Bonos y', title_b: 'Hitos',
    sub: 'Premios por cada hito del crecimiento de tu red.',
    items: [
      { title: 'Primer referido',     when: '1er invitado que invierte',        reward: '5 USDT' },
      { title: 'Super reclutador',    when: '10 referidos directos activos',    reward: '75 USDT' },
      { title: 'Diamond recruiter',   when: '50 referidos directos activos',    reward: '500 USDT' },
      { title: 'Volumen 500+',        when: 'Inversión personal > 500',         reward: '15 USDT' },
      { title: 'Volumen 2.000+',      when: 'Inversión personal > 2.000',       reward: '75 USDT' },
      { title: 'Volumen 5.000+',      when: 'Inversión personal > 5.000',       reward: '250 USDT' },
    ],
  },
  ranks: {
    title_a: 'Rango', title_b: 'VIP',
    sub: 'Cuanto más crece tu red (L1+L2), mayor es el bono diario en todos los planes.',
    volume_label: 'Volumen de red',
    items: [
      { name: 'Standard', volume: '< 5.000 USDT',   bonus: 'Ninguno',       extra: '—' },
      { name: 'Gold',     volume: '> 5.000 USDT',   bonus: '+0,5%/día',     extra: 'Insignia + soporte prioritario' },
      { name: 'Platinum', volume: '> 20.000 USDT',  bonus: '+0,75%/día',    extra: 'Insignia + comisión retiro 0' },
      { name: 'Diamond',  volume: '> 100.000 USDT', bonus: '+1,0%/día',     extra: 'Insignia + account manager' },
    ],
  },
  cta: {
    title_a: 'Empieza hoy con', title_b: 'USDT',
    sub: 'Crea tu cuenta, deposita tus primeros USDT y activa tu plan en minutos.',
    btn: 'Crear cuenta',
  },
  footer: { rights: 'Todos los derechos reservados.' },
  phone: {
    welcome: 'Bienvenido a USDT', tagline: 'Invierte inteligente.\nConstruye tu futuro.',
    register: 'Regístrate', signin: 'Entrar',
    balance: 'Saldo USDT', overview: 'Resumen',
    yield_label: 'Rendimiento', plan_label: 'Plan activo', exp_label: 'Vence', exp_value: 'D. 60',
    choose_plan: 'Elige tu plan', confirm: 'Confirmar plan', days_short: 'd', per_day: '/ día',
    quick: ['Invertir', 'Referidos', 'Stats', 'Alertas'],
  },
};

const fr: typeof it = {
  header: { signin: 'Connexion', signup: "S'inscrire" },
  hero: {
    tag: "La plateforme d'investissement USDT",
    title_a: 'Investissez', title_b: 'de façon', title_c: 'intelligente en', title_d: 'USDT',
    sub: 'Construisez votre avenir avec des plans clairs, des rendements transparents et un réseau de parrainage simple.',
    cta_register: "S'inscrire", cta_simulate: 'Simuler un investissement', cta_explore: "Explorer l'app",
  },
  stats: { operative: 'Opérationnel', plans: 'Plans' },
  screens: {
    title_a: "Interface de l'app", title_b: 'et', title_c: 'écrans principaux',
    sub: "USDT offre une expérience simple et transparente, axée sur le contrôle de votre activité.",
    items: [
      { title: 'Accueil', desc: 'Aperçu clair des atouts de la plateforme.' },
      { title: 'Tableau de bord', desc: 'Solde, plans actifs et historique à portée.' },
      { title: 'Investissements', desc: 'Sélection de plan simple et immédiate.' },
    ],
  },
  features: {
    title_a: 'Caractéristiques', title_b: 'UX',
    items: [
      { title: 'Mobile-first', desc: 'Expérience optimisée sur tout appareil.' },
      { title: 'Tableau temps réel', desc: 'Données live pour des décisions rapides.' },
      { title: 'Plans clairs', desc: 'Infos transparentes sur durée et rendements.' },
      { title: 'Parrainage simplifié', desc: 'Partage instantané et suivi intuitif.' },
      { title: 'Notifications', desc: 'Alertes crédits, échéances et bonus.' },
      { title: 'Sécurité', desc: 'Opérations atomiques et isolation par utilisateur.' },
    ],
  },
  flow: {
    title_a: 'Comment ça', title_b: 'marche',
    items: [
      { title: "S'inscrire", desc: 'Créez votre compte en quelques secondes.' },
      { title: 'Déposer', desc: 'USDT TRC-20 avec crédit automatique.' },
      { title: 'Investir', desc: 'Choisissez le plan selon votre niveau.' },
      { title: 'Retirer', desc: 'Capital et profits libérés à échéance.' },
    ],
  },
  plans: {
    title_a: "Plans d'", title_b: 'investissement',
    sub: 'Cinq plans à durée fixe avec rendement quotidien. Capital et profits libérés à échéance.',
    popular: 'Populaire', days: 'jours', daily_sub: 'par jour', min: 'Min', max: 'Max',
    note: 'Profits calculés toutes les 24h. Multi-plans illimités. Réinvestissement auto en option.',
    unlimited: 'Illimité',
  },
  referral: {
    tag: 'Système de parrainage',
    title_a: 'Réseau à', title_b: '4 niveaux',
    sub: "Commissions créditées immédiatement à chaque activation de plan dans votre réseau.",
    on1000: 'sur 1 000 USDT',
    total: 'Total cumulé 4 niveaux', total_suffix: 'sur chaque dépôt de votre réseau',
    levels: [
      { label: 'Filleul direct' },
      { label: 'Filleul de votre L1' },
      { label: 'Filleul de votre L2' },
      { label: 'Filleul de votre L3' },
    ],
  },
  bonuses: {
    title_a: 'Bonus &', title_b: 'Paliers',
    sub: 'Récompenses pour chaque palier de croissance du réseau.',
    items: [
      { title: 'Premier parrainage', when: '1er filleul qui investit',           reward: '5 USDT' },
      { title: 'Super recruteur',    when: '10 filleuls directs actifs',         reward: '75 USDT' },
      { title: 'Diamond recruiter',  when: '50 filleuls directs actifs',         reward: '500 USDT' },
      { title: 'Volume 500+',        when: 'Investissement personnel > 500',     reward: '15 USDT' },
      { title: 'Volume 2 000+',      when: 'Investissement personnel > 2 000',   reward: '75 USDT' },
      { title: 'Volume 5 000+',      when: 'Investissement personnel > 5 000',   reward: '250 USDT' },
    ],
  },
  ranks: {
    title_a: 'Rangs', title_b: 'VIP',
    sub: 'Plus votre réseau (L1+L2) grandit, plus le bonus quotidien augmente sur tous les plans.',
    volume_label: 'Volume réseau',
    items: [
      { name: 'Standard', volume: '< 5 000 USDT',   bonus: 'Aucun',         extra: '—' },
      { name: 'Gold',     volume: '> 5 000 USDT',   bonus: '+0,5%/jour',    extra: 'Badge + support prioritaire' },
      { name: 'Platinum', volume: '> 20 000 USDT',  bonus: '+0,75%/jour',   extra: 'Badge + frais retrait 0' },
      { name: 'Diamond',  volume: '> 100 000 USDT', bonus: '+1,0%/jour',    extra: 'Badge + account manager' },
    ],
  },
  cta: {
    title_a: "Commencez aujourd'hui avec", title_b: 'USDT',
    sub: 'Créez votre compte, déposez vos premiers USDT et activez votre plan en quelques minutes.',
    btn: 'Créer un compte',
  },
  footer: { rights: 'Tous droits réservés.' },
  phone: {
    welcome: 'Bienvenue sur USDT', tagline: 'Investissez intelligemment.\nConstruisez votre avenir.',
    register: "S'inscrire", signin: 'Connexion',
    balance: 'Solde USDT', overview: 'Aperçu',
    yield_label: 'Rendement', plan_label: 'Plan actif', exp_label: 'Échéance', exp_value: 'J. 60',
    choose_plan: 'Choisissez votre plan', confirm: 'Confirmer le plan', days_short: 'j', per_day: '/ jour',
    quick: ['Investir', 'Parrainage', 'Stats', 'Alerte'],
  },
};

const zh: typeof it = {
  header: { signin: '登录', signup: '注册' },
  hero: {
    tag: 'USDT 投资平台',
    title_a: '智慧', title_b: '投资', title_c: '于', title_d: 'USDT',
    sub: '通过清晰的计划、透明的收益和简单的推荐网络构建你的未来。',
    cta_register: '立即注册', cta_simulate: '模拟投资', cta_explore: '探索应用',
  },
  stats: { operative: '运行中', plans: '计划' },
  screens: {
    title_a: '应用界面', title_b: '与', title_c: '主要画面',
    sub: 'USDT 致力于提供简洁透明的体验，让您完全掌控自己的活动。',
    items: [
      { title: '首页', desc: '清晰展示平台亮点。' },
      { title: '仪表板', desc: '余额、活跃计划和历史一目了然。' },
      { title: '投资', desc: '简单直观的计划选择。' },
    ],
  },
  features: {
    title_a: 'UX', title_b: '特性',
    items: [
      { title: '移动优先', desc: '在每台设备上都体验优秀。' },
      { title: '实时面板', desc: '即时数据助您快速决策。' },
      { title: '清晰计划', desc: '关于期限和收益的透明信息。' },
      { title: '便捷推荐', desc: '即时分享与直观追踪。' },
      { title: '及时通知', desc: '到账、到期和奖金提醒。' },
      { title: '安全', desc: '原子操作与用户级数据隔离。' },
    ],
  },
  flow: {
    title_a: '运作', title_b: '方式',
    items: [
      { title: '注册', desc: '几秒钟创建账户。' },
      { title: '充值', desc: 'USDT TRC-20 自动入账。' },
      { title: '投资', desc: '根据您的等级选择计划。' },
      { title: '提现', desc: '到期释放本金和利润。' },
    ],
  },
  plans: {
    title_a: '投资', title_b: '计划',
    sub: '五个固定期限计划，每日收益。到期释放本金和利润。',
    popular: '热门', days: '天', daily_sub: '每天', min: '最低', max: '最高',
    note: '每 24 小时计算收益。多计划无限制。可选自动复投。',
    unlimited: '无限',
  },
  referral: {
    tag: '推荐系统',
    title_a: '4 级', title_b: '网络',
    sub: '网络中任何计划激活时即时入账佣金。',
    on1000: '基于 1,000 USDT',
    total: '4 级累计总比', total_suffix: '于网络中每笔充值',
    levels: [
      { label: '直接邀请' },
      { label: '您 L1 的邀请' },
      { label: '您 L2 的邀请' },
      { label: '您 L3 的邀请' },
    ],
  },
  bonuses: {
    title_a: '奖金与', title_b: '里程碑',
    sub: '网络成长每个阶段的奖励。',
    items: [
      { title: '首位推荐',     when: '第 1 位投资的邀请',         reward: '5 USDT' },
      { title: '超级推荐人',   when: '10 位活跃直接推荐',         reward: '75 USDT' },
      { title: '钻石推荐人',   when: '50 位活跃直接推荐',         reward: '500 USDT' },
      { title: '体量 500+',    when: '个人投资 > 500',            reward: '15 USDT' },
      { title: '体量 2,000+',  when: '个人投资 > 2,000',          reward: '75 USDT' },
      { title: '体量 5,000+',  when: '个人投资 > 5,000',          reward: '250 USDT' },
    ],
  },
  ranks: {
    title_a: 'VIP', title_b: '等级',
    sub: '您的网络（L1+L2）越大，所有计划的每日奖金越高。',
    volume_label: '网络体量',
    items: [
      { name: 'Standard', volume: '< 5,000 USDT',   bonus: '无',          extra: '—' },
      { name: 'Gold',     volume: '> 5,000 USDT',   bonus: '+0.5%/天',    extra: '徽章 + 优先支持' },
      { name: 'Platinum', volume: '> 20,000 USDT',  bonus: '+0.75%/天',   extra: '徽章 + 提现 0 手续费' },
      { name: 'Diamond',  volume: '> 100,000 USDT', bonus: '+1.0%/天',    extra: '徽章 + 客户经理' },
    ],
  },
  cta: {
    title_a: '今天就开始使用', title_b: 'USDT',
    sub: '创建账户，充值首笔 USDT，几分钟内激活您的计划。',
    btn: '创建账户',
  },
  footer: { rights: '版权所有。' },
  phone: {
    welcome: '欢迎使用 USDT', tagline: '智慧投资。\n建设你的未来。',
    register: '注册', signin: '登录',
    balance: 'USDT 余额', overview: '概览',
    yield_label: '收益', plan_label: '活跃计划', exp_label: '到期', exp_value: 'D. 60',
    choose_plan: '选择您的计划', confirm: '确认计划', days_short: '天', per_day: '/ 天',
    quick: ['投资', '推荐', '统计', '提醒'],
  },
};

export const landing = { it, en, es, fr, zh };
