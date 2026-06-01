import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle, Wallet, TrendingUp, Users, Clock, Shield, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type FaqItem = { q: string; a: string };
type FaqDict = Record<string, { general: FaqItem[]; deposit: FaqItem[]; invest: FaqItem[]; levels: FaqItem[]; network: FaqItem[]; withdraw: FaqItem[]; security: FaqItem[] }>;

// Le risposte sono generiche per restare coerenti con qualsiasi configurazione
// impostata dall'admin (piani, livelli, fee, bonus, durate, minimi).
// I valori numerici esatti sono mostrati dinamicamente nelle relative schermate
// (Investimenti, Livelli, Rete, Wallet → Preleva/Deposita, Simulatore).
const FAQ: FaqDict = {
  it: {
    general: [
      { q: "Cos'è WayOne?", a: "WayOne è una piattaforma di investimento in USDT (Tether) che permette di generare rendite giornaliere su piani configurati dall'amministrazione e di costruire una rete di referral con bonus dedicati." },
      { q: 'In quale valuta si opera?', a: 'Tutti gli importi sono espressi in USDT con rapporto fisso 1:1 USD. Non vengono mai effettuate conversioni in altre valute fiat o crypto.' },
      { q: "Devo registrarmi per usare l'app?", a: 'Puoi navigare le pagine informative e il simulatore senza account. Per depositare, investire e prelevare devi accedere.' },
    ],
    deposit: [
      { q: "Qual è il deposito minimo?", a: "L'importo minimo è indicato nella schermata Wallet → Deposita ed è aggiornato in tempo reale." },
      { q: 'Come deposito USDT?', a: 'Vai in Wallet → Deposita, scegli l\'importo, ottieni un indirizzo TRC-20 con un suffisso univoco. Invia esattamente la cifra mostrata: il sistema riconosce la transazione automaticamente.' },
      { q: 'Quali reti sono supportate?', a: 'Attualmente USDT su rete TRC-20 (Tron).' },
      { q: "Quanto tempo serve per accreditare?", a: "L'accredito è automatico dopo le conferme di rete (in genere pochi minuti)." },
    ],
    invest: [
      { q: 'Come funzionano i piani?', a: 'Scegli un piano tra quelli attivi: ognuno ha durata, rendita giornaliera, minimo e massimo definiti. I dettagli aggiornati sono in Investimenti e nel Simulatore.' },
      { q: 'Quale rendimento ho?', a: 'Il tasso giornaliero dipende dal piano scelto e dal tuo livello. Trovi i valori correnti nella scheda di ogni piano.' },
      { q: 'Quanto posso investire?', a: 'Minimo e massimo dipendono dal piano e dal livello e sono mostrati nella schermata di investimento.' },
    ],
    levels: [
      { q: 'Quali sono i livelli?', a: 'I livelli attivi e i relativi requisiti sono visibili nella pagina Qualifiche, sempre allineati alla configurazione corrente.' },
      { q: 'Come si avanza?', a: 'Soddisfacendo i requisiti di unità dirette e produzione totale di rete del livello successivo, mostrati nel tuo profilo.' },
      { q: 'Cosa sono i bonus una-tantum?', a: "A ogni promozione di livello puoi ricevere un bonus istantaneo. Sono previsti anche bonus referral per traguardi raggiunti: importi e soglie sono mostrati nella pagina Rete." },
    ],
    network: [
      { q: 'Come invito persone?', a: 'In Rete trovi codice, link e QR personali.' },
      { q: "Come funzionano le commissioni di rete?", a: "Ricevi commissioni sui livelli attivi della tua rete. Le percentuali correnti sono visibili nella pagina Rete." },
      { q: "Quando vengono accreditate?", a: "Vengono calcolate e accreditate automaticamente una volta al giorno." },
    ],
    withdraw: [
      { q: 'Come prelevo?', a: 'In Wallet → Preleva, scegli la modalità e l\'importo.' },
      { q: "Commissioni e tempi?", a: "Sono disponibili più modalità con tempi e fee diversi: i valori correnti sono mostrati direttamente nella schermata di prelievo." },
      { q: 'Importo minimo?', a: "Mostrato direttamente nella schermata di prelievo." },
    ],
    security: [
      { q: 'I miei fondi sono al sicuro?', a: 'Tutte le operazioni sono atomiche con lock DB e le policy di sicurezza isolano i dati per utente.' },
      { q: 'Cambio dispositivo?', a: 'Accedi con le stesse credenziali: i dati seguono il tuo account.' },
      { q: 'Affidabilità accrediti?', a: 'Watcher blockchain con suffisso univoco; importi anomali vanno in revisione manuale.' },
    ],
  },
  en: {
    general: [
      { q: 'What is WayOne?', a: 'WayOne is a USDT (Tether) investment platform that lets you earn daily yields on admin-configured plans and build a referral network with dedicated bonuses.' },
      { q: 'Which currency is used?', a: 'All amounts are in USDT at a fixed 1:1 USD ratio. No fiat or crypto conversions are performed.' },
      { q: 'Do I need to register?', a: 'You can browse info pages and the simulator without an account. Sign in to deposit, invest and withdraw.' },
    ],
    deposit: [
      { q: 'What is the minimum deposit?', a: 'The minimum amount is shown in Wallet → Deposit and is always up to date.' },
      { q: 'How do I deposit USDT?', a: 'Go to Wallet → Deposit, choose an amount, get a TRC-20 address with a unique suffix. Send the exact displayed amount: the system credits automatically.' },
      { q: 'Which networks are supported?', a: 'Currently USDT on TRC-20 (Tron).' },
      { q: 'How long does crediting take?', a: 'Automatic after network confirmations (usually a few minutes).' },
    ],
    invest: [
      { q: 'How do plans work?', a: 'Pick one of the active plans: each has duration, daily yield, min and max. Current details are in Invest and in the Simulator.' },
      { q: 'What yield do I get?', a: 'The daily rate depends on the chosen plan and on your level. Current values appear on each plan card.' },
      { q: 'How much can I invest?', a: 'Min and max depend on plan and level and are shown on the invest screen.' },
    ],
    levels: [
      { q: 'What are the levels?', a: 'Active levels and their requirements are shown on the Ranks page, always aligned with the current configuration.' },
      { q: 'How do I level up?', a: 'By meeting the direct-unit and total network production requirements of the next level, shown in your profile.' },
      { q: 'What are one-time bonuses?', a: 'Each level promotion may grant an instant bonus. Referral milestone bonuses are also available: amounts and thresholds are shown on the Network page.' },
    ],
    network: [
      { q: 'How do I invite people?', a: 'In Network you find your personal code, link and QR.' },
      { q: 'How do network commissions work?', a: 'You earn commissions on the active levels of your network. Current percentages are shown on the Network page.' },
      { q: 'When are they credited?', a: 'They are calculated and credited automatically once a day.' },
    ],
    withdraw: [
      { q: 'How do I withdraw?', a: 'In Wallet → Withdraw, choose mode and amount.' },
      { q: 'Fees and times?', a: 'Multiple modes are available with different times and fees: current values are shown directly on the withdraw screen.' },
      { q: 'Minimum amount?', a: 'Shown directly on the withdraw screen.' },
    ],
    security: [
      { q: 'Are my funds safe?', a: 'All balance ops are atomic with DB locks and security policies isolate each user\'s data.' },
      { q: 'Switching device?', a: 'Sign in with the same credentials: data follows your account.' },
      { q: 'Auto-credit reliability?', a: 'Blockchain watcher with unique suffix; anomalous amounts go to manual review.' },
    ],
  },
  es: {
    general: [
      { q: '¿Qué es WayOne?', a: 'WayOne es una plataforma de inversión en USDT (Tether) que permite generar rendimientos diarios en planes configurados por la administración y construir una red de referidos con bonos dedicados.' },
      { q: '¿Qué moneda se usa?', a: 'Todos los importes están en USDT con paridad fija 1:1 con USD. No hay conversiones fiat o cripto.' },
      { q: '¿Debo registrarme?', a: 'Puedes navegar las páginas informativas y el simulador sin cuenta. Para depositar, invertir y retirar debes iniciar sesión.' },
    ],
    deposit: [
      { q: '¿Cuál es el depósito mínimo?', a: 'El importe mínimo se muestra en Billetera → Depositar y está siempre actualizado.' },
      { q: '¿Cómo depositar USDT?', a: 'Ve a Billetera → Depositar, elige importe, obtén una dirección TRC-20 con sufijo único. Envía el importe exacto mostrado: el sistema acredita automáticamente.' },
      { q: '¿Qué redes se admiten?', a: 'Actualmente USDT en TRC-20 (Tron).' },
      { q: '¿Cuánto tarda el abono?', a: 'Automático tras las confirmaciones (normalmente pocos minutos).' },
    ],
    invest: [
      { q: '¿Cómo funcionan los planes?', a: 'Elige uno de los planes activos: cada uno tiene duración, rendimiento diario, mínimo y máximo. Los detalles actualizados están en Invertir y en el Simulador.' },
      { q: '¿Qué rendimiento obtengo?', a: 'La tasa diaria depende del plan elegido y de tu nivel. Los valores actuales aparecen en la ficha de cada plan.' },
      { q: '¿Cuánto puedo invertir?', a: 'El mín/máx depende del plan y del nivel y se muestra en la pantalla de inversión.' },
    ],
    levels: [
      { q: '¿Cuáles son los niveles?', a: 'Los niveles activos y sus requisitos se ven en la página Cualificaciones, siempre alineados con la configuración actual.' },
      { q: '¿Cómo subo de nivel?', a: 'Cumpliendo los requisitos de unidades directas y producción total del nivel siguiente, mostrados en tu perfil.' },
      { q: '¿Qué son los bonos únicos?', a: 'Cada promoción de nivel puede otorgar un bono instantáneo. También hay bonos por hitos de referidos: importes y umbrales en la página Red.' },
    ],
    network: [
      { q: '¿Cómo invito personas?', a: 'En Red encuentras código, enlace y QR personales.' },
      { q: '¿Cómo funcionan las comisiones de red?', a: 'Recibes comisiones en los niveles activos de tu red. Los porcentajes actuales se muestran en la página Red.' },
      { q: '¿Cuándo se acreditan?', a: 'Se calculan y acreditan automáticamente una vez al día.' },
    ],
    withdraw: [
      { q: '¿Cómo retiro?', a: 'En Billetera → Retirar, elige modalidad e importe.' },
      { q: '¿Comisiones y tiempos?', a: 'Hay varias modalidades con tiempos y comisiones distintas: los valores actuales se muestran en la pantalla de retiro.' },
      { q: '¿Importe mínimo?', a: 'Se muestra en la pantalla de retiro.' },
    ],
    security: [
      { q: '¿Mis fondos están seguros?', a: 'Operaciones atómicas con bloqueo de DB y políticas de seguridad aíslan los datos por usuario.' },
      { q: '¿Cambio de dispositivo?', a: 'Inicia sesión con las mismas credenciales: los datos siguen a tu cuenta.' },
      { q: '¿Fiabilidad de los abonos?', a: 'Watcher blockchain con sufijo único; importes anómalos van a revisión manual.' },
    ],
  },
  fr: {
    general: [
      { q: "Qu'est-ce que WayOne ?", a: "WayOne est une plateforme d'investissement en USDT (Tether) qui permet de générer des rendements quotidiens sur des plans configurés par l'administration et de bâtir un réseau de parrainage avec des bonus dédiés." },
      { q: 'Quelle devise ?', a: 'Tous les montants sont en USDT au ratio fixe 1:1 USD. Aucune conversion fiat ou crypto.' },
      { q: "Dois-je m'inscrire ?", a: 'Vous pouvez parcourir les pages informatives et le simulateur sans compte. Pour déposer, investir et retirer, connectez-vous.' },
    ],
    deposit: [
      { q: 'Quel est le dépôt minimum ?', a: 'Le montant minimum est affiché dans Portefeuille → Déposer et toujours à jour.' },
      { q: 'Comment déposer USDT ?', a: 'Allez dans Portefeuille → Déposer, choisissez un montant, obtenez une adresse TRC-20 avec un suffixe unique. Envoyez le montant exact affiché : le système crédite automatiquement.' },
      { q: 'Réseaux supportés ?', a: 'Actuellement USDT sur TRC-20 (Tron).' },
      { q: 'Délai de crédit ?', a: 'Automatique après confirmations réseau (généralement quelques minutes).' },
    ],
    invest: [
      { q: 'Comment fonctionnent les plans ?', a: 'Choisissez un plan actif : chacun a sa durée, son rendement quotidien, son min et son max. Les détails à jour sont dans Investir et dans le Simulateur.' },
      { q: 'Quel rendement ?', a: 'Le taux quotidien dépend du plan choisi et de votre niveau. Les valeurs actuelles apparaissent sur la fiche de chaque plan.' },
      { q: 'Combien puis-je investir ?', a: "Min et max dépendent du plan et du niveau et sont affichés sur l'écran d'investissement." },
    ],
    levels: [
      { q: 'Quels sont les niveaux ?', a: 'Les niveaux actifs et leurs exigences sont visibles sur la page Qualifications, toujours alignés sur la configuration actuelle.' },
      { q: 'Comment monter en niveau ?', a: "En remplissant les exigences d'unités directes et de production totale du niveau suivant, indiquées dans votre profil." },
      { q: 'Bonus uniques ?', a: 'Chaque promotion de niveau peut accorder un bonus instantané. Des bonus de parrainage par paliers existent aussi : montants et seuils sur la page Réseau.' },
    ],
    network: [
      { q: 'Comment inviter ?', a: 'Dans Réseau vous trouvez code, lien et QR personnels.' },
      { q: 'Comment fonctionnent les commissions ?', a: 'Vous percevez des commissions sur les niveaux actifs de votre réseau. Les pourcentages actuels sont affichés sur la page Réseau.' },
      { q: 'Quand sont créditées ?', a: 'Elles sont calculées et créditées automatiquement une fois par jour.' },
    ],
    withdraw: [
      { q: 'Comment retirer ?', a: 'Dans Portefeuille → Retirer, choisissez mode et montant.' },
      { q: 'Frais et délais ?', a: "Plusieurs modes sont disponibles avec délais et frais différents : les valeurs actuelles sont affichées sur l'écran de retrait." },
      { q: 'Montant minimum ?', a: "Affiché directement sur l'écran de retrait." },
    ],
    security: [
      { q: 'Mes fonds sont-ils sûrs ?', a: 'Toutes les opérations sont atomiques avec verrous DB et les politiques de sécurité isolent les données par utilisateur.' },
      { q: "Changement d'appareil ?", a: 'Connectez-vous avec les mêmes identifiants : les données suivent votre compte.' },
      { q: 'Fiabilité des crédits auto ?', a: 'Watcher blockchain avec suffixe unique ; montants anormaux passent en révision manuelle.' },
    ],
  },
  zh: {
    general: [
      { q: 'WayOne 是什么？', a: 'WayOne 是一个 USDT（泰达币）投资平台，可在管理员配置的计划中产生每日收益，并通过专属奖金构建推荐网络。' },
      { q: '使用什么货币？', a: '所有金额均以 USDT 计价，与 USD 1:1 固定比率，不进行任何法币或加密货币转换。' },
      { q: '需要注册吗？', a: '可以无账户浏览信息页面和模拟器。充值、投资和提现需要登录。' },
    ],
    deposit: [
      { q: '最低充值金额是多少？', a: '最低金额显示在 钱包 → 充值 页面，始终保持最新。' },
      { q: '如何充值 USDT？', a: '前往 钱包 → 充值，选择金额，获取带有唯一后缀的 TRC-20 地址。发送显示的精确金额：系统自动入账。' },
      { q: '支持哪些网络？', a: '目前为 TRC-20 (Tron) 上的 USDT。' },
      { q: '入账需要多长时间？', a: '网络确认后自动入账（通常几分钟）。' },
    ],
    invest: [
      { q: '计划如何运作？', a: '从已激活的计划中选择一个：每个都有期限、每日收益、最小和最大金额。最新详情见 投资 页面和 模拟器。' },
      { q: '收益率是多少？', a: '每日比率取决于所选计划和您的等级。当前数值显示在每个计划卡上。' },
      { q: '可以投资多少？', a: '最小/最大取决于计划和等级，会在投资界面显示。' },
    ],
    levels: [
      { q: '有哪些等级？', a: '活跃等级及其要求显示在 资格 页面，始终与当前配置保持一致。' },
      { q: '如何升级？', a: '满足下一个等级所需的直接单位数和网络总产出，详情见您的个人资料。' },
      { q: '一次性奖金是什么？', a: '每次等级晋升都可能获得即时奖金。还有推荐里程碑奖金：金额和门槛显示在 网络 页面。' },
    ],
    network: [
      { q: '如何邀请他人？', a: '在 网络 中可找到您的邀请码、链接和二维码。' },
      { q: '网络佣金如何计算？', a: '您可在网络的活跃层级中获得佣金。当前百分比显示在 网络 页面。' },
      { q: '何时入账？', a: '每天自动计算并入账一次。' },
    ],
    withdraw: [
      { q: '如何提现？', a: '在 钱包 → 提现，选择模式和金额。' },
      { q: '手续费和时间？', a: '有多种模式，时间和费用各不相同：当前数值在提现界面显示。' },
      { q: '最低金额？', a: '直接在提现界面显示。' },
    ],
    security: [
      { q: '我的资金安全吗？', a: '所有余额操作均为原子操作，使用数据库锁，安全策略隔离每个用户的数据。' },
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
