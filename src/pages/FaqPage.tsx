import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle, Wallet, TrendingUp, Users, Clock, Shield, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type FaqItem = { q: string; a: string };
type FaqSection = { id: string; title: string; icon: React.ComponentType<{ className?: string }>; items: FaqItem[] };

const sections: FaqSection[] = [
  {
    id: 'general',
    title: 'Generale',
    icon: HelpCircle,
    items: [
      { q: 'Cos\'è WayOne?', a: 'WayOne è una piattaforma di investimento in USDT (Tether) che permette di generare rendite giornaliere su piani a 45 o 90 giorni e di costruire una rete di referral con bonus dedicati.' },
      { q: 'In quale valuta si opera?', a: 'Tutti gli importi sono espressi in USDT con rapporto fisso 1:1 USD. Non vengono mai effettuate conversioni in altre valute fiat o crypto.' },
      { q: 'Devo registrarmi per usare l\'app?', a: 'Puoi navigare le pagine informative (Home, Investi, Rete, Income, Qualifiche) senza account. Per depositare, investire e prelevare devi accedere.' },
    ],
  },
  {
    id: 'deposit',
    title: 'Depositi',
    icon: Wallet,
    items: [
      { q: 'Come deposito USDT?', a: 'Vai in Wallet → Deposita, scegli importo, ottieni un indirizzo TRC-20 con un suffisso univoco. Invia esattamente la cifra mostrata: il sistema riconosce automaticamente la transazione on-chain entro pochi minuti.' },
      { q: 'Quali reti sono supportate?', a: 'Attualmente USDT su rete TRC-20 (Tron). Altre reti potranno essere abilitate in futuro.' },
      { q: 'Quanto tempo serve per accreditare?', a: 'L\'accredito è automatico dopo le conferme di rete (in genere 2-5 minuti su TRC-20). Se invii un importo non corrispondente al suffisso, finisce in revisione manuale.' },
    ],
  },
  {
    id: 'invest',
    title: 'Investimenti',
    icon: TrendingUp,
    items: [
      { q: 'Come funzionano i piani?', a: 'Scegli un piano da 45 o 90 giorni. Ogni giorno ricevi una rendita percentuale sull\'importo investito, accreditata sul saldo disponibile. A fine durata, il capitale può essere rilasciato secondo le regole del piano.' },
      { q: 'Quale rendimento ho?', a: 'Il tasso giornaliero dipende dal tuo livello (Starter, Silver, Gold, Platinum, Diamond, VIP) e dalla durata scelta. Più alto è il livello, maggiore è la percentuale.' },
      { q: 'Quanto posso investire?', a: 'Gli importi minimo e massimo dipendono dal livello. I livelli base hanno limiti contenuti, mentre i livelli avanzati sbloccano range più ampi.' },
    ],
  },
  {
    id: 'levels',
    title: 'Livelli e Qualifiche',
    icon: Award,
    items: [
      { q: 'Quali sono i livelli?', a: 'Starter (entry), Silver, Gold, Platinum, Diamond, VIP. Ogni livello sblocca rendimenti più alti, limiti maggiori e bonus rete.' },
      { q: 'Come si avanza di livello?', a: 'Avanzi soddisfacendo i requisiti di unità dirette attive e produzione totale di rete. La promozione è automatica al raggiungimento dei target.' },
      { q: 'Cosa sono i bonus una-tantum?', a: 'A ogni promozione di livello ricevi un bonus istantaneo accreditato sul saldo, oltre al miglioramento dei tassi giornalieri.' },
    ],
  },
  {
    id: 'network',
    title: 'Rete e Referral',
    icon: Users,
    items: [
      { q: 'Come invito persone?', a: 'In Rete trovi il tuo codice univoco, il link e il QR. Condividili: chi si registra con il tuo codice diventa tuo referral diretto.' },
      { q: 'Quanti livelli di rete ci sono?', a: '5 livelli attivi con percentuali dinamiche dall\'1% al 5% sui rendimenti generati dalla downline, in base al tuo livello.' },
      { q: 'Quando vengono accreditate le commissioni?', a: 'Le commissioni di rete vengono calcolate ogni giorno alle 02:00 UTC insieme ai rendimenti, e accreditate sul saldo disponibile.' },
    ],
  },
  {
    id: 'withdraw',
    title: 'Prelievi',
    icon: Clock,
    items: [
      { q: 'Come prelevo?', a: 'Vai in Wallet → Preleva, scegli la modalità (Veloce, Media, Lenta) e l\'importo. La richiesta viene processata secondo i tempi e le fee della modalità scelta.' },
      { q: 'Quali sono le commissioni?', a: 'Veloce: 24h con 20% fee. Media: 48h con 10% fee. Lenta: 72h con 5% fee. Le percentuali sono configurabili dall\'amministrazione.' },
      { q: 'Importo minimo di prelievo?', a: 'L\'importo minimo viene mostrato direttamente nella schermata di prelievo e dipende dalle impostazioni correnti della piattaforma.' },
    ],
  },
  {
    id: 'security',
    title: 'Sicurezza',
    icon: Shield,
    items: [
      { q: 'I miei fondi sono al sicuro?', a: 'Tutte le operazioni di saldo e investimento sono atomiche con lock a livello di database. Le RLS proteggono i dati: ogni utente vede solo i propri.' },
      { q: 'Cosa succede se cambio dispositivo?', a: 'Accedi con le stesse credenziali: i tuoi dati, saldo e rete sono legati al tuo account, non al dispositivo.' },
      { q: 'Posso fidarmi degli accrediti automatici?', a: 'Sì: i depositi vengono riconosciuti tramite il watcher blockchain (TronGrid) con suffisso univoco. In caso di importo non corrispondente, la transazione resta in needs_review per controllo manuale.' },
    ],
  },
];

export default function FaqPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Indietro">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold text-foreground">Domande frequenti</h1>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Risposte rapide alle domande più comuni su WayOne. Se non trovi quello che cerchi, contatta il supporto dal Profilo.
          </p>
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
