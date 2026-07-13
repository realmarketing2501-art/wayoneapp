import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, Sparkles, Users, Award,
  Lock, Unlock, Wallet, Calculator, Calendar, Hash, FileText,
} from 'lucide-react';

export type TxLike = {
  id?: string;
  user_id?: string;
  type: string;
  direction?: 'in' | 'out' | 'internal' | string;
  amount: number | string;
  asset?: string | null;
  status?: string | null;
  description?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  balance_after?: number | string | null;
  created_at?: string | null;
  /** For rows coming from `income_records`: date-only string YYYY-MM-DD */
  date?: string | null;
};

const TYPE_META: Record<string, { label: string; icon: any; color: string; hint: string }> = {
  deposit:            { label: 'Deposito',              icon: ArrowDownLeft, color: 'text-primary',          hint: 'Accredito USDC ricevuto sul tuo conto Way One.' },
  withdrawal:         { label: 'Prelievo',              icon: ArrowUpRight,  color: 'text-destructive',      hint: 'Uscita USDC verso il tuo wallet esterno.' },
  admin_adjustment:   { label: 'Rettifica admin',       icon: Wallet,        color: 'text-amber-400',        hint: 'Accredito/addebito manuale effettuato dall\'amministratore.' },
  interest:           { label: 'Interesse piano',       icon: TrendingUp,    color: 'text-primary',          hint: 'Rendimento giornaliero maturato sul tuo piano attivo.' },
  fund_interest:      { label: 'Interesse fondo',       icon: Sparkles,      color: 'text-way-diamond',      hint: 'Rendimento giornaliero maturato su una quota di Fondo Speciale.' },
  investment_lock:    { label: 'Blocco capitale',       icon: Lock,          color: 'text-muted-foreground', hint: 'Il capitale è stato bloccato per la durata del piano.' },
  investment_unlock:  { label: 'Sblocco capitale',      icon: Unlock,        color: 'text-primary',          hint: 'Il capitale è tornato disponibile alla scadenza del piano.' },
  fund_lock:          { label: 'Blocco fondo',          icon: Lock,          color: 'text-muted-foreground', hint: 'Capitale bloccato dentro il fondo scelto.' },
  fund_unlock:        { label: 'Sblocco fondo',         icon: Unlock,        color: 'text-way-diamond',      hint: 'Capitale sbloccato al termine del fondo.' },
  fund_investment:    { label: 'Investimento fondo',    icon: Sparkles,      color: 'text-way-diamond',      hint: 'Ingresso in una quota di Fondo Speciale.' },
  fund_refund:        { label: 'Rimborso fondo',        icon: Unlock,        color: 'text-primary',          hint: 'Rimborso del capitale dal fondo.' },
  team:               { label: 'Commissione referral',  icon: Users,         color: 'text-accent',           hint: 'Commissione dalla tua rete diretta (L1).' },
  referral_commission:{ label: 'Commissione referral',  icon: Users,         color: 'text-accent',           hint: 'Ricevi l\'1,5% di ogni interesse generato dai tuoi invitati diretti.' },
  bonus:              { label: 'Bonus',                 icon: Award,         color: 'text-amber-400',        hint: 'Bonus una-tantum o accredito straordinario.' },
  level_bonus:        { label: 'Bonus livello',         icon: Award,         color: 'text-amber-400',        hint: 'Bonus erogato al raggiungimento di una nuova qualifica MLM.' },
};

const metaFor = (t: string) => TYPE_META[t] ?? { label: t, icon: Wallet, color: 'text-foreground', hint: 'Movimento generico sul conto.' };

/**
 * Estrae una spiegazione con formula dal campo `description` salvato dai trigger.
 * Le description hanno pattern noti — se non riconosciamo il pattern, mostriamo solo il testo.
 */
function computeBreakdown(tx: TxLike): { formula?: string; note?: string } {
  const amount = Number(tx.amount) || 0;
  const desc = tx.description ?? '';

  // Commissione referral: "1.5% da USERNAME (LABEL: X.YY USDC)"
  const refM = desc.match(/([\d.]+)\s*%\s+da\s+([^\s(]+).*\(([^:]+):\s*([\d.]+)/i);
  if (tx.type === 'referral_commission' || (tx.type === 'team' && refM)) {
    if (refM) {
      const pct = Number(refM[1]);
      const from = refM[2];
      const source = refM[3].trim();
      const base = Number(refM[4]);
      return {
        formula: `${base.toFixed(4)} USDC × ${pct}% = ${amount.toFixed(4)} USDC`,
        note: `L'invitato diretto "${from}" ha maturato ${base.toFixed(4)} USDC di ${source.toLowerCase()}. Ricevi il ${pct}% come commissione referral (livello 1).`,
      };
    }
    return { note: 'Commissione pari all\'1,5% dell\'interesse generato dai tuoi invitati diretti (L1).' };
  }

  // Interesse piano: "Interesse giornaliero NOMEPIANO (R.R%)"
  const intM = desc.match(/interesse giornaliero\s+(.+?)\s*\(([\d.]+)\s*%\)/i);
  if ((tx.type === 'interest' || tx.type === 'fund_interest') && intM) {
    const plan = intM[1].trim();
    const rate = Number(intM[2]);
    const capital = rate > 0 ? amount / (rate / 100) : 0;
    return {
      formula: `${capital.toFixed(2)} USDC (capitale) × ${rate}%/giorno = ${amount.toFixed(4)} USDC`,
      note: `Rendimento giornaliero del piano "${plan}" al tasso di ${rate}% al giorno.`,
    };
  }

  // Bonus livello
  const lvlM = desc.match(/livello\s+(\S+)/i);
  if ((tx.type === 'level_bonus' || tx.type === 'bonus') && lvlM) {
    return { note: `Bonus una-tantum erogato al raggiungimento della qualifica "${lvlM[1]}".` };
  }

  // Deposito: "tx HASH"
  const txM = desc.match(/tx\s+([a-fA-F0-9x]{8,})/);
  if (tx.type === 'deposit' && txM) {
    return { note: `Deposito automatico rilevato on-chain, hash transazione: ${txM[1].slice(0, 16)}…` };
  }

  return {};
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx: TxLike | null;
}

export function TransactionDetailsDialog({ open, onOpenChange, tx }: Props) {
  // Se il record proviene da income_records (ha `date` ma non `description`),
  // cerchiamo la wallet_transactions corrispondente per avere la descrizione completa.
  const needsLookup = !!tx && !tx.description && !!tx.date && !!tx.user_id;
  const { data: enriched } = useQuery({
    queryKey: ['tx_lookup', tx?.user_id, tx?.date, tx?.type, Number(tx?.amount)],
    enabled: open && needsLookup,
    queryFn: async () => {
      if (!tx) return null;
      const from = new Date(tx.date!);
      const to = new Date(from); to.setDate(to.getDate() + 1);
      const typeMap: Record<string, string[]> = {
        team: ['referral_commission', 'team'],
        referral_commission: ['referral_commission', 'team'],
        bonus: ['bonus', 'level_bonus', 'referral_commission'],
        level_bonus: ['level_bonus', 'bonus'],
        interest: ['interest'],
        fund_interest: ['fund_interest'],
      };
      const types = typeMap[tx.type] ?? [tx.type];
      const target = Number(tx.amount);
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', tx.user_id!)
        .in('type', types)
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      if (!data) return null;
      // Match sull'importo (arrotondato a 4 decimali per tollerare differenze)
      const match = data.find(r => Math.abs(Number(r.amount) - target) < 0.0001)
        ?? data.find(r => Math.abs(Number(r.amount) - target) < 0.01);
      return match ?? null;
    },
    staleTime: 60_000,
  });

  const effective: TxLike | null = tx ? { ...tx, ...(enriched ?? {}) } as TxLike : null;
  if (!effective) return null;

  const m = metaFor(effective.type);
  const Icon = m.icon;
  const isOut = effective.direction === 'out';
  const isIn = effective.direction === 'in';
  const amount = Number(effective.amount) || 0;
  const breakdown = computeBreakdown(effective);
  const when = effective.created_at
    ? new Date(effective.created_at).toLocaleString()
    : effective.date ?? '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted ${m.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p>{m.label}</p>
              <p className="text-[0.65rem] font-normal text-muted-foreground">{when}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Importo */}
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Importo</p>
            <p className={`font-display text-2xl font-bold ${isOut ? 'text-destructive' : isIn ? 'text-primary' : 'text-foreground'}`}>
              {isOut ? '-' : isIn ? '+' : ''}{amount.toFixed(4)} {effective.asset ?? 'USDC'}
            </p>
            <div className="mt-1 flex justify-center gap-1">
              {effective.direction && (
                <Badge variant="outline" className="text-[0.55rem]">
                  {effective.direction === 'in' ? 'Entrata' : effective.direction === 'out' ? 'Uscita' : 'Interno'}
                </Badge>
              )}
              {effective.status && effective.status !== 'completed' && (
                <Badge variant="outline" className="text-[0.55rem]">{effective.status}</Badge>
              )}
            </div>
          </div>

          {/* Cos'è */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase text-primary">
              <FileText className="h-3 w-3" /> Cos'è
            </p>
            <p className="text-xs leading-relaxed text-foreground">{m.hint}</p>
          </div>

          {/* Calcolo */}
          {(breakdown.formula || breakdown.note) && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase text-accent">
                <Calculator className="h-3 w-3" /> Come è calcolato
              </p>
              {breakdown.formula && (
                <p className="mb-1 rounded bg-background/60 p-2 font-mono text-[0.7rem] text-foreground">
                  {breakdown.formula}
                </p>
              )}
              {breakdown.note && (
                <p className="text-xs leading-relaxed text-muted-foreground">{breakdown.note}</p>
              )}
            </div>
          )}

          {/* Descrizione grezza */}
          {effective.description && (
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">Descrizione</p>
              <p className="text-xs leading-relaxed text-foreground">{effective.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-[0.65rem]">
            <div className="rounded-md border border-border p-2">
              <p className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" /> Data</p>
              <p className="mt-0.5 font-medium">{when}</p>
            </div>
            {effective.balance_after != null && (
              <div className="rounded-md border border-border p-2">
                <p className="flex items-center gap-1 text-muted-foreground"><Wallet className="h-3 w-3" /> Saldo dopo</p>
                <p className="mt-0.5 font-medium">{Number(effective.balance_after).toFixed(2)} USDC</p>
              </div>
            )}
            {effective.reference_type && (
              <div className="col-span-2 rounded-md border border-border p-2">
                <p className="flex items-center gap-1 text-muted-foreground"><Hash className="h-3 w-3" /> Riferimento</p>
                <p className="mt-0.5 truncate font-mono text-[0.65rem]">{effective.reference_type}{effective.reference_id ? ` · ${effective.reference_id.slice(0, 12)}…` : ''}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
