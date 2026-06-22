import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Sparkles, CheckCircle2, Info } from 'lucide-react';

export default function QualifichePage() {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Come funziona il referral</h2>
        <p className="text-sm text-muted-foreground mt-1">Semplice, trasparente, senza qualifiche o livelli da raggiungere.</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-display text-lg font-bold text-foreground">1.5% sui guadagni dei tuoi diretti</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Per ogni persona che si iscrive con il <span className="font-semibold text-foreground">tuo link referral</span>,
            ricevi automaticamente il <span className="font-semibold text-primary">1.5%</span> di ogni guadagno che lei matura
            dai suoi investimenti e dai suoi Fondi Speciali.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> Esempio pratico
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>👤 Inviti <span className="font-semibold text-foreground">Marco</span> con il tuo link.</p>
            <p>💰 Marco investe 1.000 USDT in un piano che rende 2 USDT al giorno.</p>
            <p>✨ Ogni giorno tu ricevi automaticamente <span className="font-semibold text-primary">0.03 USDT</span> (1.5% di 2 USDT) accreditati sul tuo saldo disponibile.</p>
            <p>📈 Finché Marco continua a guadagnare, tu continui a ricevere la commissione.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Le regole in chiaro
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Guadagni solo dai tuoi <span className="font-semibold text-foreground">diretti L1</span> (le persone che inviti personalmente).</li>
            <li>Nessun limite al numero di diretti che puoi avere.</li>
            <li>Se i tuoi diretti a loro volta portano altre persone, <span className="font-semibold text-foreground">tu non guadagni</span> da quelle: saranno loro a riceverne il 1.5%.</li>
            <li>La commissione è automatica e immediata: appena il tuo diretto riceve l'interesse giornaliero, il 1.5% arriva sul tuo wallet.</li>
            <li>Non serve raggiungere alcun livello o qualifica: <span className="font-semibold text-foreground">funziona da subito</span>, dal primo referral.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Dove vedi le tue commissioni
          </p>
          <p className="text-sm text-muted-foreground">
            Tutte le commissioni referral compaiono nella pagina <span className="font-semibold text-foreground">Entrate</span> con
            etichetta <span className="font-semibold text-accent">"Referral 1.5%"</span> e nel <span className="font-semibold text-foreground">Report unificato</span>
            sotto la categoria Network.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>Vai nella pagina <span className="font-semibold text-foreground">Network</span> per copiare il tuo link, vedere i tuoi diretti e quanto hai guadagnato da ciascuno.</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
