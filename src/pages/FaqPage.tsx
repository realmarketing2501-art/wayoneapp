import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle, Wallet, TrendingUp, Users, Clock, Shield, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type FaqItem = { q: string; a: string };
type FaqDict = Record<string, { general: FaqItem[]; deposit: FaqItem[]; invest: FaqItem[]; levels: FaqItem[]; network: FaqItem[]; withdraw: FaqItem[]; security: FaqItem[] }>;

const FAQ: FaqDict = {
  it: {
    general: [
      { q: "Cos'è WayOne?", a: "WayOne è una piattaforma di investimento in USDT (Tether) che permette di generare rendite giornaliere su piani a 45 o 90 giorni e di costruire una rete di referral con bonus dedicati." },
      { q: 'In quale valuta si opera?', a: 'Tutti gli importi sono espressi in USDT con rapporto fisso 1:1 USD. Non vengono mai effettuate conversioni in altre valute fiat o crypto.' },
      { q: "Devo registrarmi per usare l'app?", a: 'Puoi navigare le pagine informative senza account. Per depositare, investire e prelevare devi accedere.' },
    ],
    deposit: [
      { q: 'Come deposito USDT?', a: 'Vai in Wallet → Deposita, scegli importo, ottieni un indirizzo TRC-20 con un suffisso univoco. Invia esattamente la cifra mostrata: il sistema riconosce la transazione automaticamente.' },
      { q: 'Quali reti sono supportate?', a: 'Attualmente USDT su rete TRC-20 (Tron).' },
      { q: 'Quanto tempo serve per accreditare?', a: "L'accredito è automatico dopo le conferme di rete (in genere 2-5 minuti)." },
    ],
    invest: [
      { q: 'Come funzionano i piani?', a: 'Scegli un piano da 45 o 90 giorni. Ogni giorno ricevi una rendita percentuale sul saldo disponibile.' },
      { q: 'Quale rendimento ho?', a: 'Il tasso giornaliero dipende dal tuo livello e dalla durata scelta.' },
      { q: 'Quanto posso investire?', a: 'Min/max dipendono dal livello.' },
    ],
    levels: [
      { q: 'Quali sono i livelli?', a: 'Starter, Silver, Gold, Platinum, Diamond, VIP.' },
      { q: 'Come si avanza?', a: 'Soddisfacendo i requisiti di unità dirette e produzione totale di rete.' },
      { q: 'Cosa sono i bonus una-tantum?', a: 'A ogni promozione ricevi un bonus istantaneo.' },
    ],
    network: [
      { q: 'Come invito persone?', a: 'In Rete trovi codice, link e QR.' },
      { q: 'Quanti livelli ci sono?', a: '5 livelli con percentuali dall\'1% al 5%.' },
      { q: 'Quando vengono accreditate?', a: 'Ogni giorno alle 02:00 UTC.' },
    ],
    withdraw: [
      { q: 'Come prelevo?', a: 'In Wallet → Preleva, scegli modalità (Veloce, Media, Lenta) e importo.' },
      { q: 'Commissioni?', a: 'Veloce 24h/20%, Media 48h/10%, Lenta 72h/5%.' },
      { q: 'Importo minimo?', a: "Mostrato direttamente nella schermata di prelievo." },
    ],
    security: [
      { q: 'I miei fondi sono al sicuro?', a: 'Tutte le operazioni sono atomiche con lock DB e RLS isolano i dati per utente.' },
      { q: 'Cambio dispositivo?', a: 'Accedi con le stesse credenziali: i dati seguono il tuo account.' },
      { q: 'Affidabilità accrediti?', a: 'Watcher blockchain con suffisso univoco; importi anomali vanno in revisione manuale.' },
    ],
  },
  en: {
    general: [
      { q: 'What is WayOne?', a: 'WayOne is a USDT (Tether) investment platform that lets you generate daily yields on 45- or 90-day plans and build a referral network with dedicated bonuses.' },
      { q: 'Which currency is used?', a: 'All amounts are in USDT at a fixed 1:1 USD ratio. No fiat or crypto conversions are performed.' },
      { q: 'Do I need to register?', a: 'You can browse info pages without an account. Sign in to deposit, invest and withdraw.' },
    ],
    deposit: [
      { q: 'How do I deposit USDT?', a: 'Go to Wallet → Deposit, choose an amount, get a TRC-20 address with a unique suffix. Send the exact displayed amount: the system credits automatically.' },
      { q: 'Which networks are supported?', a: 'Currently USDT on TRC-20 (Tron).' },
      { q: 'How long does crediting take?', a: 'Automatic after network confirmations (usually 2-5 minutes).' },
    ],
    invest: [
      { q: 'How do plans work?', a: 'Pick a 45- or 90-day plan. You earn a daily percentage on your available balance.' },
      { q: 'What yield do I get?', a: 'The daily rate depends on your level and the chosen duration.' },
      { q: 'How much can I invest?', a: 'Min/max depend on your level.' },
    ],
    levels: [
      { q: 'What are the levels?', a: 'Starter, Silver, Gold, Platinum, Diamond, VIP.' },
      { q: 'How do I level up?', a: 'By meeting direct-unit and total network production requirements.' },
      { q: 'What are one-time bonuses?', a: 'Every promotion grants an instant bonus.' },
    ],
    network: [
      { q: 'How do I invite people?', a: 'In Network you find your code, link and QR.' },
      { q: 'How many network levels?', a: '5 active levels paying from 1% to 5%.' },
      { q: 'When are commissions credited?', a: 'Every day at 02:00 UTC.' },
    ],
    withdraw: [
      { q: 'How do I withdraw?', a: 'In Wallet → Withdraw, choose mode (Fast, Medium, Slow) and amount.' },
      { q: 'Fees?', a: 'Fast 24h/20%, Medium 48h/10%, Slow 72h/5%.' },
      { q: 'Minimum amount?', a: 'Shown directly on the withdraw screen.' },
    ],
    security: [
      { q: 'Are my funds safe?', a: 'All balance ops are atomic with DB locks and RLS isolates each user\'s data.' },
      { q: 'Switching device?', a: 'Sign in with the same credentials: data follows your account.' },
      { q: 'Auto-credit reliability?', a: 'Blockchain watcher with unique suffix; anomalous amounts go to manual review.' },
    ],
  },
  es: {
    general: [
      { q: '¿Qué es WayOne?', a: 'WayOne es una plataforma de inversión en USDT (Tether) que permite generar rendimientos diarios en planes de 45 o 90 días y construir una red de referidos con bonos dedicados.' },
      { q: '¿Qué moneda se usa?', a: 'Todos los importes están en USDT con paridad fija 1:1 con USD. No hay conversiones fiat o cripto.' },
      { q: '¿Debo registrarme?', a: 'Puedes navegar las páginas informativas sin cuenta. Para depositar, invertir y retirar debes iniciar sesión.' },
    ],
    deposit: [
      { q: '¿Cómo depositar USDT?', a: 'Ve a Billetera → Depositar, elige importe, obtén una dirección TRC-20 con sufijo único. Envía el importe exacto mostrado: el sistema acredita automáticamente.' },
      { q: '¿Qué redes se admiten?', a: 'Actualmente USDT en TRC-20 (Tron).' },
      { q: '¿Cuánto tarda el abono?', a: 'Automático tras las confirmaciones (normalmente 2-5 minutos).' },
    ],
    invest: [
      { q: '¿Cómo funcionan los planes?', a: 'Elige un plan de 45 o 90 días. Cada día recibes un porcentaje sobre tu saldo disponible.' },
      { q: '¿Qué rendimiento obtengo?', a: 'La tasa diaria depende de tu nivel y duración.' },
      { q: '¿Cuánto puedo invertir?', a: 'El mín/máx depende del nivel.' },
    ],
    levels: [
      { q: '¿Cuáles son los niveles?', a: 'Starter, Silver, Gold, Platinum, Diamond, VIP.' },
      { q: '¿Cómo subo de nivel?', a: 'Cumpliendo los requisitos de unidades directas y producción total.' },
      { q: '¿Qué son los bonos únicos?', a: 'Cada promoción otorga un bono instantáneo.' },
    ],
    network: [
      { q: '¿Cómo invito personas?', a: 'En Red encuentras código, enlace y QR.' },
      { q: '¿Cuántos niveles?', a: '5 niveles activos del 1% al 5%.' },
      { q: '¿Cuándo se acreditan?', a: 'Cada día a las 02:00 UTC.' },
    ],
    withdraw: [
      { q: '¿Cómo retiro?', a: 'En Billetera → Retirar, elige modalidad (Rápida, Media, Lenta) e importe.' },
      { q: '¿Comisiones?', a: 'Rápida 24h/20%, Media 48h/10%, Lenta 72h/5%.' },
      { q: '¿Importe mínimo?', a: 'Se muestra en la pantalla de retiro.' },
    ],
    security: [
      { q: '¿Mis fondos están seguros?', a: 'Operaciones atómicas con bloqueo de DB y RLS aíslan los datos por usuario.' },
      { q: '¿Cambio de dispositivo?', a: 'Inicia sesión con las mismas credenciales: los datos siguen a tu cuenta.' },
      { q: '¿Fiabilidad de los abonos?', a: 'Watcher blockchain con sufijo único; importes anómalos van a revisión manual.' },
    ],
  },
  fr: {
    general: [
      { q: "Qu'est-ce que WayOne ?", a: "WayOne est une plateforme d'investissement en USDT (Tether) qui permet de générer des rendements quotidiens sur des plans de 45 ou 90 jours et de bâtir un réseau de parrainage avec des bonus dédiés." },
      { q: 'Quelle devise ?', a: 'Tous les montants sont en USDT au ratio fixe 1:1 USD. Aucune conversion fiat ou crypto.' },
      { q: 'Dois-je m\'inscrire ?', a: 'Vous pouvez parcourir les pages informatives sans compte. Pour déposer, investir et retirer, connectez-vous.' },
    ],
    deposit: [
      { q: 'Comment déposer USDT ?', a: 'Allez dans Portefeuille → Déposer, choisissez un montant, obtenez une adresse TRC-20 avec un suffixe unique. Envoyez le montant exact affiché : le système crédite automatiquement.' },
      { q: 'Réseaux supportés ?', a: 'Actuellement USDT sur TRC-20 (Tron).' },
      { q: 'Délai de crédit ?', a: 'Automatique après confirmations réseau (généralement 2-5 minutes).' },
    ],
    invest: [
      { q: 'Comment fonctionnent les plans ?', a: 'Choisissez un plan de 45 ou 90 jours. Vous recevez un pourcentage quotidien sur votre solde disponible.' },
      { q: 'Quel rendement ?', a: 'Le taux quotidien dépend de votre niveau et de la durée choisie.' },
      { q: 'Combien puis-je investir ?', a: 'Min/max dépendent du niveau.' },
    ],
    levels: [
      { q: 'Quels sont les niveaux ?', a: 'Starter, Silver, Gold, Platinum, Diamond, VIP.' },
      { q: 'Comment monter en niveau ?', a: 'En remplissant les exigences d\'unités directes et de production totale du réseau.' },
      { q: 'Bonus uniques ?', a: 'Chaque promotion accorde un bonus instantané.' },
    ],
    network: [
      { q: 'Comment inviter ?', a: 'Dans Réseau vous trouvez code, lien et QR.' },
      { q: 'Combien de niveaux ?', a: '5 niveaux actifs payant de 1% à 5%.' },
      { q: 'Quand sont créditées ?', a: 'Chaque jour à 02:00 UTC.' },
    ],
    withdraw: [
      { q: 'Comment retirer ?', a: 'Dans Portefeuille → Retirer, choisissez mode (Rapide, Moyen, Lent) et montant.' },
      { q: 'Frais ?', a: 'Rapide 24h/20%, Moyen 48h/10%, Lent 72h/5%.' },
      { q: 'Montant minimum ?', a: "Affiché directement sur l'écran de retrait." },
    ],
    security: [
      { q: 'Mes fonds sont-ils sûrs ?', a: 'Toutes les opérations sont atomiques avec verrous DB et RLS isole les données par utilisateur.' },
      { q: 'Changement d\'appareil ?', a: 'Connectez-vous avec les mêmes identifiants : les données suivent votre compte.' },
      { q: 'Fiabilité des crédits auto ?', a: 'Watcher blockchain avec suffixe unique ; montants anormaux passent en révision manuelle.' },
    ],
  },
  zh: {
    general: [
      { q: 'WayOne 是什么？', a: 'WayOne 是一个 USDT（泰达币）投资平台，可在 45 天或 90 天计划中产生每日收益，并通过专属奖金构建推荐网络。' },
      { q: '使用什么货币？', a: '所有金额均以 USDT 计价，与 USD 1:1 固定比率，不进行任何法币或加密货币转换。' },
      { q: '需要注册吗？', a: '可以无账户浏览信息页面。充值、投资和提现需要登录。' },
    ],
    deposit: [
      { q: '如何充值 USDT？', a: '前往 钱包 → 充值，选择金额，获取带有唯一后缀的 TRC-20 地址。发送显示的精确金额：系统自动入账。' },
      { q: '支持哪些网络？', a: '目前为 TRC-20 (Tron) 上的 USDT。' },
      { q: '入账需要多长时间？', a: '网络确认后自动入账（通常 2-5 分钟）。' },
    ],
    invest: [
      { q: '计划如何运作？', a: '选择 45 天或 90 天计划，每天根据可用余额获得百分比收益。' },
      { q: '收益率是多少？', a: '每日比率取决于您的等级和所选期限。' },
      { q: '可以投资多少？', a: '最小/最大取决于您的等级。' },
    ],
    levels: [
      { q: '有哪些等级？', a: 'Starter、Silver、Gold、Platinum、Diamond、VIP。' },
      { q: '如何升级？', a: '满足直接单位和网络总产出的要求。' },
      { q: '一次性奖金是什么？', a: '每次升级都会获得即时奖金。' },
    ],
    network: [
      { q: '如何邀请他人？', a: '在 网络 中可找到您的邀请码、链接和二维码。' },
      { q: '有多少层级？', a: '5 个活跃层级，比例从 1% 到 5%。' },
      { q: '何时入账？', a: '每天 UTC 02:00。' },
    ],
    withdraw: [
      { q: '如何提现？', a: '在 钱包 → 提现，选择模式（快速、中等、慢速）和金额。' },
      { q: '手续费？', a: '快速 24h/20%，中等 48h/10%，慢速 72h/5%。' },
      { q: '最低金额？', a: '直接在提现界面显示。' },
    ],
    security: [
      { q: '我的资金安全吗？', a: '所有余额操作均为原子操作，使用数据库锁，RLS 隔离每个用户的数据。' },
      { q: '换设备怎么办？', a: '使用相同凭据登录：数据跟随您的账户。' },
      { q: '自动入账可靠吗？', a: '区块链监听器带唯一后缀；异常金额进入人工审核。' },
    ],
  },
};

export default function FaqPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lng = (FAQ[i18n.language] ? i18n.language : 'it') as keyof typeof FAQ;
  const data = FAQ[lng];

  const sections = [
    { id: 'general', icon: HelpCircle, title: t('faq.s_general'), items: data.general },
    { id: 'deposit', icon: Wallet, title: t('faq.s_deposit'), items: data.deposit },
    { id: 'invest', icon: TrendingUp, title: t('faq.s_invest'), items: data.invest },
    { id: 'levels', icon: Award, title: t('faq.s_levels'), items: data.levels },
    { id: 'network', icon: Users, title: t('faq.s_network'), items: data.network },
    { id: 'withdraw', icon: Clock, title: t('faq.s_withdraw'), items: data.withdraw },
    { id: 'security', icon: Shield, title: t('faq.s_security'), items: data.security },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold text-foreground">{t('faq.title')}</h1>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">{t('faq.intro')}</p>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.id}>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <section.icon className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold text-foreground">{section.title}</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {section.items.map((item, i) => (
                <AccordionItem key={i} value={`${section.id}-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
