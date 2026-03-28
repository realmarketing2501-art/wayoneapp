import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { Copy, QrCode, Users, DollarSign, Award } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';

export default function NetworkPage() {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const { data: profile } = useProfile();

  const referralCode = profile?.referral_code ?? '...';
  const referralUrl = `https://wayono.lovable.app/login?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: 'Link copiato!', description: 'Il tuo link referral è stato copiato.' });
  };

  const stats = [
    { icon: Users, label: 'Referral Diretti', value: profile?.direct_referrals ?? 0 },
    { icon: Users, label: 'Rete Totale', value: profile?.total_network ?? 0 },
    { icon: DollarSign, label: 'Volume Rete', value: `${Number(profile?.network_volume ?? 0).toLocaleString()} USDT` },
    { icon: Award, label: 'Bonus Rete', value: '0 USDT' },
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

      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">La visualizzazione dell'albero sarà disponibile quando avrai referral nella tua rete.</p>
        </CardContent>
      </Card>
    </div>
  );
}
