import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/LevelBadge';
import { mockUser, mockNetworkTree, type NetworkNode } from '@/data/mockData';
import { getLevelColorClass } from '@/lib/levels';
import { Copy, QrCode, ChevronDown, ChevronRight, Users, DollarSign, Award } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function TreeNode({ node, depth = 0 }: { node: NetworkNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={cn('ml-4', depth === 0 && 'ml-0')}>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors',
          hasChildren && 'cursor-pointer hover:border-primary/30',
          !node.active && 'opacity-50'
        )}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : <div className="w-4" />}
        <div className={cn('h-2 w-2 rounded-full', node.active ? 'bg-primary' : 'bg-muted-foreground')} />
        <span className={cn('font-medium', getLevelColorClass(node.level))}>{node.username}</span>
        <LevelBadge level={node.level} size="sm" showIcon={false} />
        <span className="ml-auto text-xs text-muted-foreground">{node.joinDate}</span>
      </button>
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 border-l border-border/50 pl-2">
          {node.children!.map((child) => (
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
  const referralUrl = `https://wayone.io/ref/${mockUser.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast({ title: 'Link copiato!', description: 'Il tuo link referral è stato copiato.' });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Referral Diretti', value: mockUser.directReferrals },
          { icon: Users, label: 'Rete Totale', value: mockUser.totalNetwork },
          { icon: DollarSign, label: 'Volume Rete', value: `${mockUser.networkVolume.toLocaleString()} USDT` },
          { icon: Award, label: 'Bonus Rete', value: '540 USDT' },
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

      {/* Referral Link */}
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
            <div className="mt-4 flex justify-center rounded-lg bg-foreground p-4">
              <QRCodeSVG value={referralUrl} size={160} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tree */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Albero della Rete</h3>
        <div className="space-y-1">
          <TreeNode node={mockNetworkTree} />
        </div>
      </div>
    </div>
  );
}
