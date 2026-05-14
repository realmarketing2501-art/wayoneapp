import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  MessageSquare,
  Share2,
  UserPlus,
  Wallet,
  TrendingUp,
  Gift,
  HelpCircle,
  Copy,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const COMMISSIONS = [
  { level: 'L1', label: 'Diretti', pct: 4, color: 'from-amber-400 to-yellow-500' },
  { level: 'L2', label: '2° linea', pct: 2, color: 'from-emerald-400 to-teal-500' },
  { level: 'L3', label: '3° linea', pct: 1, color: 'from-sky-400 to-indigo-500' },
  { level: 'L4', label: '4° linea', pct: 0.5, color: 'from-fuchsia-400 to-purple-500' },
];

const STEPS = [
  { icon: Share2, title: 'Condividi il link', desc: 'Invia il tuo link referral ai contatti.' },
  { icon: UserPlus, title: 'Si registrano', desc: 'I tuoi referral aprono un account USDT.' },
  { icon: Wallet, title: 'Investono', desc: 'Quando attivano un piano, generano produzione.' },
  { icon: TrendingUp, title: 'Tu guadagni', desc: 'Commissioni automatiche fino a 4 livelli.' },
];

const FAQ = [
  {
    q: 'Quando ricevo le commissioni?',
    a: 'Vengono accreditate automaticamente ogni giorno alle 02:00 UTC sul tuo wallet interno.',
  },
  {
    q: 'Cosa rende un referral "attivo"?',
    a: 'Un referral è considerato attivo dopo il suo primo deposito confermato in USDT.',
  },
  {
    q: 'Le commissioni si sommano alla rendita del piano?',
    a: 'Sì. Le commissioni referral sono indipendenti dalla rendita giornaliera del tuo piano.',
  },
  {
    q: 'Posso cambiare il mio codice referral?',
    a: 'Il codice è univoco e non modificabile per garantire la tracciabilità della rete.',
  },
];

export function ReferralGuide({ url, code }: { url: string; code: string }) {
  const totalPct = useMemo(
    () => COMMISSIONS.reduce((s, c) => s + c.pct, 0),
    [],
  );

  const shareText = `Unisciti a USDT con il mio invito e inizia a guadagnare ogni giorno. Codice: ${code}`;
  const encodedText = encodeURIComponent(`${shareText}\n${url}`);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedText}`,
      className: 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20',
    },
    {
      name: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`,
      className: 'bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20',
    },
    {
      name: 'X',
      icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      className: 'bg-foreground/10 text-foreground hover:bg-foreground/20',
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent('Ti invito su USDT')}&body=${encodedText}`,
      className: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
  ];

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'USDT', text: shareText, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiato negli appunti');
      }
    } catch {
      // utente ha annullato
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Manuale Referral
              </p>
              <p className="font-display text-lg font-bold text-foreground">
                Guadagna fino a {totalPct.toString().replace('.', ',')}% sulla tua rete
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Commissioni automatiche su 4 livelli, ogni giorno.
              </p>
            </div>
            <Gift className="h-10 w-10 shrink-0 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Codice & QR Invito */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Codice e QR invito</p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-stretch">
            <div className="flex shrink-0 items-center justify-center rounded-xl bg-white p-3 ring-1 ring-border">
              <QRCodeSVG
                id="referral-qr-svg"
                value={url}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Codice referral
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-secondary px-3 py-2 font-mono text-sm font-semibold tracking-wider text-foreground">
                    {code}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success('Codice copiato');
                    }}
                    aria-label="Copia codice"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Link invito
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 truncate rounded-lg bg-secondary px-3 py-2 font-mono text-[0.65rem] text-muted-foreground">
                    {url}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast.success('Link copiato');
                    }}
                    aria-label="Copia link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-1 gap-2"
                onClick={() => {
                  const svg = document.getElementById('referral-qr-svg');
                  if (!svg) return;
                  const xml = new XMLSerializer().serializeToString(svg);
                  const blob = new Blob([xml], { type: 'image/svg+xml' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `usdt-referral-${code}.svg`;
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}
              >
                <Download className="h-4 w-4" />
                Scarica QR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            Commissioni per livello
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COMMISSIONS.map((c) => (
              <div
                key={c.level}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <div
                  className={`mx-auto mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${c.color} text-[0.7rem] font-bold text-white`}
                >
                  {c.level}
                </div>
                <p className="text-[0.65rem] text-muted-foreground">{c.label}</p>
                <p className="font-display text-base font-bold text-foreground">
                  {c.pct.toString().replace('.', ',')}%
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">
            Totale rete: <span className="font-semibold text-primary">+{totalPct.toString().replace('.', ',')}%</span> sulla
            produzione giornaliera dei tuoi referral.
          </p>
        </CardContent>
      </Card>

      {/* Come funziona */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Come funziona</p>
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {i + 1}. {s.title}
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condividi rapido */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Condividi ora</p>
            <Badge variant="secondary" className="text-[0.6rem]">
              Codice: {code}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {shareLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-colors ${s.className}`}
              >
                <s.icon className="h-5 w-5" />
                <span className="text-[0.65rem] font-medium">{s.name}</span>
              </a>
            ))}
          </div>
          <Button onClick={nativeShare} className="mt-3 w-full gap-2" variant="outline">
            <Share2 className="h-4 w-4" />
            Condividi con…
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <HelpCircle className="h-4 w-4 text-primary" />
            Domande frequenti
          </p>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <div key={f.q} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-foreground">{f.q}</p>
                <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferralGuide;
