import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/LevelBadge';
import { useProfile } from '@/hooks/useProfile';
import { getLevelColorClass } from '@/lib/levels';
import { Copy, QrCode, Users, DollarSign, Award } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';

export default function NetworkPage() {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const { data: profile } = useProfile();

  const referralCode = profile?.referral_code ?? '...';
  const referralUrl = `https://wayone.io/ref/${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: 'Link copiato!', description: 'Il tuo link referral è stato copiato.' });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Referral Diretti', value: profile?.direct_referrals ?? 0 },
          { icon: Users, label: 'Rete Totale', value: profile?.total_network ?? 0 },
          { icon: DollarSign, label: 'Volume Rete', value: `${Number(profile?.network_volume ?? 0).toLocaleString()} USDT` },
          { icon: Award, label: 'Bonus Rete', value: '0 USDT' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground">Il tuo Link Referral</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 overflow-hidden rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
              {referralUrl}
            </div>
            <Button size="icon" variant="outline" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => setShowQR(!showQR)}><QrCode className="h-4 w-4" /></Button>
          </div>
          {showQR && (
            <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG value={referralUrl} size={160} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">La visualizzazione dell'albero MLM sarà disponibile quando avrai referral nella tua rete.</p>
        </CardContent>
      </Card>
    </div>
  );
}
