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
import ReferralGuide from '@/components/ReferralGuide';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TreeNode({ node, depth = 0, localeTag }: { node: ReferralNode; depth?: number; localeTag: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const levelColor = getLevelColorClass(node.level as LevelName);
  const levelLabel = getLevelLabel(node.level as LevelName);
  const joinDate = new Date(node.created_at).toLocaleDateString(localeTag, { day: '2-digit', month: 'short', year: 'numeric' });

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
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {node.has_confirmed_deposit ? (
              <span className="flex items-center gap-1 text-[0.6rem] text-green-500">
                <CheckCircle2 className="h-3 w-3" /> {t('network.nodeActive')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[0.6rem] text-amber-500">
                <Clock className="h-3 w-3" /> {t('network.nodePending')}
              </span>
            )}
            <span className="text-[0.6rem] text-muted-foreground">· {joinDate}</span>
            {node.direct_referrals > 0 && (
              <span className="text-[0.6rem] text-muted-foreground">· {t('network.nodeRefShort', { n: node.direct_referrals })}</span>
            )}
            {node.referred_by_username && (
              <span className="text-[0.6rem] text-muted-foreground">· invitato da <span className="font-medium text-foreground/80">{node.referred_by_username}</span></span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[0.6rem] px-1.5 py-0 border-primary/30 text-primary">
              {node.active_investments} {node.active_investments === 1 ? 'investimento' : 'investimenti'}
            </Badge>
            <span className="text-[0.6rem] text-muted-foreground">
              Capitale: <span className="font-medium text-foreground">{node.total_invested.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
            </span>
            <span className="text-[0.6rem] text-muted-foreground">
              Guadagni: <span className="font-medium text-green-500">+{node.total_earned.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
            </span>
          </div>
        </div>
      </div>

      {open && hasChildren && (
        <div className="mt-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} localeTag={localeTag} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NetworkPage() {
  const { t, i18n } = useTranslation();
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: tree, isLoading: treeLoading } = useReferralTree();
  const { data: levels = [] } = useLevels();
  const localeTag = i18n.language === 'zh' ? 'zh-CN' : i18n.language;

  if (!user) {
    return (
      <div className="p-4">
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <Users className="h-10 w-10 text-primary mx-auto" />
            <div>
              <p className="font-display text-lg font-bold text-foreground">{t('network.loginRequiredTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('network.loginRequiredDesc')}
              </p>
            </div>
            <Button className="usdt-btn-gold w-full" onClick={() => navigate('/login')}>
              <LogIn className="h-4 w-4 mr-2" /> {t('network.loginCta')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const referralCode = profile?.referral_code ?? '...';
  const referralUrl = `https://wayone.xyz/login?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: t('network.linkCopiedTitle'), description: t('network.linkCopiedDesc') });
  };

  const userLevel = (profile?.level ?? 'gamma') as LevelName;
  const units = profile?.units ?? 0;
  const production = Number(profile?.production ?? 0);
  const progress = computeProgress(levels, userLevel, units, production);

  // Compute per-level counts (entire downline) from the tree
  const levelCounts: Record<number, { total: number; active: number }> = {};
  let totalNetwork = 0;
  let totalActiveNetwork = 0;
  const walk = (nodes: ReferralNode[], depth: number) => {
    for (const n of nodes) {
      levelCounts[depth] = levelCounts[depth] ?? { total: 0, active: 0 };
      levelCounts[depth].total += 1;
      totalNetwork += 1;
      if (n.has_confirmed_deposit) {
        levelCounts[depth].active += 1;
        totalActiveNetwork += 1;
      }
      if (n.children?.length) walk(n.children, depth + 1);
    }
  };
  if (tree) walk(tree, 1);
  const maxDepth = Math.max(1, ...Object.keys(levelCounts).map(Number));

  const stats = [
    { icon: Users, label: 'Unità qualificanti (L1 attivi)', value: units },
    { icon: DollarSign, label: t('network.statProduction'), value: `${production.toLocaleString()} USDT` },
    { icon: Users, label: t('network.statDirectReferrals'), value: profile?.direct_referrals ?? 0 },
    { icon: Award, label: t('network.statLevelBonus'), value: `${progress?.current.bonus_valore ?? 0} USDT` },
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

      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Rete per livello
            </p>
            <Badge variant="secondary" className="text-[0.65rem]">
              Totale {totalActiveNetwork}/{totalNetwork} attivi
            </Badge>
          </div>
          <p className="text-[0.7rem] text-muted-foreground -mt-1">
            Le commissioni referral vengono pagate fino al L4. Solo i diretti (L1) con investimento attivo contano come "Unità qualificanti" per la promozione di livello.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: Math.max(4, maxDepth) }, (_, i) => i + 1).map((d) => {
              const c = levelCounts[d] ?? { total: 0, active: 0 };
              return (
                <div key={d} className="rounded-lg bg-secondary/60 p-2 text-center">
                  <p className="text-[0.6rem] text-muted-foreground">L{d}</p>
                  <p className="font-display text-base font-bold text-foreground leading-tight">{c.total}</p>
                  <p className="text-[0.6rem] text-green-500">{c.active} attivi</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>



      {progress && progress.next && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t('network.progressTitle')}</p>
                <p className="font-display text-base font-bold text-foreground">
                  {progress.current.name} → {progress.next.name}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
                <TrendingUp className="h-3 w-3 mr-1" />
                {progress.overallPct.toFixed(0)}%
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between text-[0.7rem] mb-1">
                <span className="text-muted-foreground">{t('network.statUnits')}</span>
                <span className="font-medium text-foreground">
                  {units} / {progress.next.unita_richieste}
                  {progress.unitsMissing > 0 && (
                    <span className="text-muted-foreground ml-1">(-{progress.unitsMissing})</span>
                  )}
                </span>
              </div>
              <Progress value={progress.unitsPct} className="h-1.5" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[0.7rem] mb-1">
                <span className="text-muted-foreground">{t('network.statProduction')}</span>
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
          <p className="text-sm font-medium text-foreground">{t('network.yourReferralLink')}</p>
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

      <ReferralGuide url={referralUrl} code={referralCode} />

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t('network.yourTree')}
          </p>
          {treeLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('common.loading')}</p>
          ) : !tree || tree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('network.noReferrals')}
            </p>
          ) : (
            <div className="space-y-1">
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} localeTag={localeTag} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
