import { motion } from 'framer-motion';
import { Award, Download, ExternalLink, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CERT_IMG = '/certifications/wayone-financial-dealer-license.jpg';
const CERT_PDF = '/certifications/wayone-financial-dealer-license.pdf';

export default function CertificationsPage() {
  return (
    <div className="space-y-5 p-4">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="usdt-card-gold relative overflow-hidden p-5"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Trasparenza e conformità
            </p>
            <h1 className="font-display mt-1 text-xl font-bold usdt-gold-text">
              Certificazioni WAYONE
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Documenti ufficiali, licenze e attestati che regolano l'operatività della piattaforma.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Certificate card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-primary/30">
          <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-primary/5 via-background to-primary/10 sm:aspect-[16/10]">
            <img
              src={CERT_IMG}
              alt="WAYONE — Financial Dealer License"
              className="absolute inset-0 h-full w-full object-contain p-3"
              loading="lazy"
            />
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 gap-1 bg-emerald-500/15 text-emerald-500 backdrop-blur"
            >
              <CheckCircle2 className="h-3 w-3" /> Verificato
            </Badge>
          </div>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">
                  Financial Dealer License
                </p>
                <p className="text-[0.7rem] text-muted-foreground">
                  Saint Vincent and the Grenadines — SVG FSA
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-card/40 p-3">
              <Info label="Entità" value="Way One Std" />
              <Info label="Registrazione" value="09310 FSA" />
              <Info label="N° licenza" value="U.FrB 5001018" />
              <Info label="Stato" value="Attiva" valueClass="text-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button asChild className="usdt-btn-gold h-10 gap-2">
                <a href={CERT_PDF} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" /> Apri PDF
                </a>
              </Button>
              <Button asChild variant="outline" className="h-10 gap-2">
                <a href={CERT_PDF} download="WAYONE_Financial_Dealer_License.pdf">
                  <Download className="h-4 w-4" /> Scarica
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Compliance highlights */}
      <section className="usdt-card p-4 space-y-3">
        <h2 className="font-display text-sm font-bold">Conformità operativa</h2>
        <div className="space-y-2.5">
          <Bullet
            title="Custodia USDT 1:1"
            desc="Ogni saldo utente è coperto in USDT con rapporto 1:1, tracciato su ledger interno append-only."
          />
          <Bullet
            title="Sicurezza dei movimenti"
            desc="Tutte le operazioni finanziarie passano da RPC server-side con lock atomici, per evitare doppie esecuzioni."
          />
          <Bullet
            title="Tracciabilità on-chain"
            desc="Depositi e prelievi USDT (TRC-20 / ERC-20) sono verificabili tramite TXID sulla blockchain."
          />
        </div>
      </section>

      <p className="text-center text-[0.65rem] text-muted-foreground">
        Per richieste di verifica documentale scrivi a{' '}
        <a href="mailto:compliance@wayone.xyz" className="text-primary underline">
          compliance@wayone.xyz
        </a>
      </p>
    </div>
  );
}

function Info({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-display text-xs font-bold text-foreground ${valueClass}`}>{value}</p>
    </div>
  );
}

function Bullet({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-2.5">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
