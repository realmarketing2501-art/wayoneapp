import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useReferralTree, ReferralNode } from '@/hooks/useReferralTree';
import { Copy, QrCode, Users, DollarSign, CheckCircle2, Clock, Sparkles, LogIn } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import ReferralGuide from '@/components/ReferralGuide';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function NetworkPage() {
  const { t, i18n } = useTranslation();
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: tree, isLoading: treeLoading } = useReferralTree();
  const localeTag = i18n.language === 'zh' ? 'zh-CN' : i18n.language;

  // Total referral commissions earned by current user (all-time, from ledger)
  const { data: commissionTotal = 0 } = useQuery({
    queryKey: ['referral_commissions_total', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'referral_commission')
        .eq('status', 'completed');
      if (error) return 0;
      return (data ?? []).reduce((s, r) => s + Number(r.amount || 0), 0);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="p-4">
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <Users className="h-10 w-10 text-primary mx-auto" />
            <div>
              <p className="font-display text-lg font-bold text-foreground">{t('network.loginRequiredTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('network.loginRequiredDesc')}</p>
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

  // L1 directs only
  const directs: ReferralNode[] = tree ?? [];
  const activeDirects = directs.filter((d) => d.has_confirmed_deposit).length;

  // Walk full downline to count total people invited (info only)
  let totalNetwork = 0;
  const walk = (nodes: ReferralNode[]) => { for (const n of nodes) { totalNetwork++; if (n.children?.length) walk(n.children); } };
  if (tree) walk(tree);

  return (
    <div className="space-y-5 p-4">
      {/* Hero rule */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-display text-base font-bold text-foreground">Guadagni 1.5% sui tuoi diretti</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Su ogni interesse (piani + fondi) generato dai tuoi referral L1. Nessuna qualifica, nessun livello da raggiungere.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card>
          <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
            <Users className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <div className="min-w-0">
              <p className="text-[0.65rem] text-muted-foreground sm:text-xs">Diretti L1</p>
              <p className="font-display text-sm font-bold text-foreground sm:text-base">{directs.length}</p>
              <p className="text-[0.6rem] text-green-500">{activeDirects} attivi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
            <DollarSign className="h-4 w-4 shrink-0 text-accent sm:h-5 sm:w-5" />
            <div className="min-w-0">
              <p className="text-[0.65rem] text-muted-foreground sm:text-xs">Commissioni totali</p>
              <p className="font-display text-sm font-bold text-foreground sm:text-base">{commissionTotal.toFixed(2)} USDT</p>
              <p className="text-[0.6rem] text-muted-foreground">Da inizio attività</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral link */}
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

      {/* Direct L1 list */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> I tuoi diretti L1
            </p>
            {totalNetwork > directs.length && (
              <Badge variant="secondary" className="text-[0.6rem]">Rete totale: {totalNetwork}</Badge>
            )}
          </div>

          {treeLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('common.loading')}</p>
          ) : directs.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">Nessun referral diretto ancora.</p>
              <p className="text-xs text-muted-foreground">Condividi il tuo link per iniziare a guadagnare l'1.5%.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {directs.map((d) => {
                const joinDate = new Date(d.created_at).toLocaleDateString(localeTag, { day: '2-digit', month: 'short', year: 'numeric' });
                const subCount = d.children?.length ?? 0;
                return (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.username}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {d.has_confirmed_deposit ? (
                          <span className="flex items-center gap-1 text-[0.6rem] text-green-500">
                            <CheckCircle2 className="h-3 w-3" /> Attivo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[0.6rem] text-amber-500">
                            <Clock className="h-3 w-3" /> In attesa di deposito
                          </span>
                        )}
                        <span className="text-[0.6rem] text-muted-foreground">· iscritto {joinDate}</span>
                        {subCount > 0 && (
                          <span className="text-[0.6rem] text-muted-foreground">· ha invitato {subCount}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[0.6rem] border-primary/30 text-primary">
                      1.5%
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {directs.length > 0 && (
            <p className="text-[0.65rem] text-muted-foreground mt-3 pt-3 border-t border-border">
              Guadagni l'1.5% su ogni interesse generato da questi diretti. Se loro invitano altre persone, sarà loro a guadagnarne il 1.5%, non tu.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
