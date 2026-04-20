import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { useLevels } from '@/hooks/useLevels';
import { useReferralTree, ReferralNode } from '@/hooks/useReferralTree';
import { computeProgress } from '@/lib/calculations';
import { Copy, QrCode, Users, DollarSign, Award, ChevronRight, ChevronDown, CircleDot, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getLevelLabel, getLevelColorClass } from '@/lib/levels';
import type { LevelName } from '@/lib/levels';

function TreeNode({ node, depth = 0 }: { node: ReferralNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const levelColor = getLevelColorClass(node.level as LevelName);
  const levelLabel = getLevelLabel(node.level as LevelName);
  const joinDate = new Date(node.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-border pl-3' : ''}>
      <div
        className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <CircleDot className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{node.username}</span>
            <Badge variant="outline" className={`text-[0.6rem] px-1.5 py-0 ${levelColor} border-current`}>
              {levelLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {node.has_confirmed_deposit ? (
              <span className="flex items-center gap-1 text-[0.6rem] text-green-500">
                <CheckCircle2 className="h-3 w-3" /> Attivo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[0.6rem] text-amber-500">
                <Clock className="h-3 w-3" /> In attesa deposito
              </span>
            )}
            <span className="text-[0.6rem] text-muted-foreground">· {joinDate}</span>
            {node.direct_referrals > 0 && (
              <span className="text-[0.6rem] text-muted-foreground">· {node.direct_referrals} ref</span>
            )}
          </div>
        </div>
      </div>

      {open && hasChildren && (
        <div className="mt-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NetworkPage() {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { data: tree, isLoading: treeLoading } = useReferralTree();
  const { data: levels = [] } = useLevels();

  const referralCode = profile?.referral_code ?? '...';
  const baseUrl = window.location.hostname.includes('preview')
    ? 'https://wayoneapp.lovable.app'
    : window.location.origin;
  const referralUrl = `${baseUrl}/login?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: 'Link copiato!', description: 'Il tuo link referral è stato copiato.' });
  };

  const userLevel = (profile?.level ?? 'gamma') as LevelName;
  const units = profile?.units ?? 0;
  const production = Number(profile?.production ?? 0);
  const progress = computeProgress(levels, userLevel, units, production);

  const stats = [
    { icon: Users, label: 'Unità (referral attivi)', value: units },
    { icon: DollarSign, label: 'Produzione rete', value: `${production.toLocaleString()} USDT` },
    { icon: Users, label: 'Referral Diretti', value: profile?.direct_referrals ?? 0 },
    { icon: Award, label: 'Bonus livello', value: `${progress?.current.bonus_valore ?? 0} USDT` },
  ];

  return (
    <div className="space-y-5 p-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
              <s.icon className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
              <div className="min-w-0">
                <p className="text-[0.65rem] text-muted-foreground sm:text-xs">{s.label}</p>
                <p className="font-display text-sm font-bold text-foreground truncate sm:text-base">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress verso prossimo livello */}
      {progress && progress.next && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Avanzamento qualifica</p>
                <p className="font-display text-base font-bold text-foreground">
                  {progress.current.name} → {progress.next.name}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
                <TrendingUp className="h-3 w-3 mr-1" />
                {progress.overallPct.toFixed(0)}%
              </Badge>
            </div>

            {/* Units bar */}
            <div>
              <div className="flex items-center justify-between text-[0.7rem] mb-1">
                <span className="text-muted-foreground">Unità (referral attivi)</span>
                <span className="font-medium text-foreground">
                  {units} / {progress.next.unita_richieste}
                  {progress.unitsMissing > 0 && (
                    <span className="text-muted-foreground ml-1">(-{progress.unitsMissing})</span>
                  )}
                </span>
              </div>
              <Progress value={progress.unitsPct} className="h-1.5" />
            </div>

            {/* Production bar */}
            <div>
              <div className="flex items-center justify-between text-[0.7rem] mb-1">
                <span className="text-muted-foreground">Produzione rete</span>
                <span className="font-medium text-foreground">
                  {production.toLocaleString()} / {Number(progress.next.produzione_richiesta).toLocaleString()} USDT
                  {progress.productionMissing > 0 && (
                    <span className="text-muted-foreground ml-1">(-{progress.productionMissing.toLocaleString()})</span>
                  )}
                </span>
              </div>
              <Progress value={progress.productionPct} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground">Il tuo Link Referral</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 overflow-hidden rounded-lg bg-secondary px-3 py-2 font-mono text-[0.65rem] text-muted-foreground break-all sm:text-xs">
              {referralUrl}
            </div>
            <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0"><Copy className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => setShowQR(!showQR)} className="shrink-0"><QrCode className="h-4 w-4" /></Button>
          </div>
          {showQR && (
            <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG value={referralUrl} size={140} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Tree */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Il tuo Albero Referral
          </p>
          {treeLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Caricamento...</p>
          ) : !tree || tree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun referral ancora. Condividi il tuo link per far crescere la rete!
            </p>
          ) : (
            <div className="space-y-1">
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
