import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/LevelBadge';
import { mockUser } from '@/data/mockData';
import { User, Shield, Wallet, Globe, LogOut, ChevronRight, FileCheck } from 'lucide-react';

const menuItems = [
  { icon: FileCheck, label: 'KYC Verification', desc: 'Verifica la tua identità' },
  { icon: Shield, label: 'Security Center', desc: 'Password, 2FA' },
  { icon: Wallet, label: 'Wallet Collegati', desc: 'Gestisci indirizzi USDT' },
  { icon: Globe, label: 'Lingua', desc: 'Italiano' },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6 p-4">
      {/* Profile Card */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-foreground">{mockUser.username}</h2>
            <LevelBadge level={mockUser.level} size="sm" />
            <p className="mt-1 text-xs text-muted-foreground">Membro dal 15 Gen 2026</p>
          </div>
        </CardContent>
      </Card>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="font-display text-lg font-bold text-primary">{mockUser.balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Guadagnato</p>
            <p className="font-display text-lg font-bold text-accent">{mockUser.totalEarned.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">USDT</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map(item => (
          <button key={item.label} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
            <item.icon className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Button variant="destructive" className="w-full gap-2">
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </div>
  );
}
