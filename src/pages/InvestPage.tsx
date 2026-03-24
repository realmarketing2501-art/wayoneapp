import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { LevelBadge } from '@/components/LevelBadge';
import { mockUser, mockPlans, mockActiveInvestments } from '@/data/mockData';
import { getLevelInfo } from '@/lib/levels';
import { Lock, TrendingUp, Clock } from 'lucide-react';

export default function InvestPage() {
  const levelInfo = getLevelInfo(mockUser.level);

  return (
    <div className="space-y-6 p-4">
      {/* Current Level */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Il tuo livello</p>
            <p className="font-display text-xl font-bold text-foreground">{levelInfo.label}</p>
            <p className="text-sm text-primary">{levelInfo.dailyReturn}% rendimento giornaliero</p>
          </div>
          <LevelBadge level={mockUser.level} size="lg" />
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Piani di Investimento</h3>
        <div className="space-y-3">
          {mockPlans.map((plan) => (
            <Card key={plan.id} className={plan.status === 'locked' ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-semibold text-foreground">{plan.name}</h4>
                      {plan.status === 'locked' && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {plan.duration}gg</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {plan.dailyReturn}%/giorno</span>
                    </div>
                  </div>
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                    {plan.status === 'active' ? 'Attivo' : plan.status === 'locked' ? 'Bloccato' : 'Inattivo'}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{plan.minInvest}–{plan.maxInvest.toLocaleString()} USDT</span>
                    <span>{Math.round(plan.poolFilled / plan.poolTotal * 100)}% pool</span>
                  </div>
                  <Progress value={plan.poolFilled / plan.poolTotal * 100} className="mt-1 h-2" />
                </div>
                <Button className="mt-3 w-full" disabled={plan.status !== 'active'}>
                  {plan.status === 'locked' ? `Richiede ${plan.minLevel}` : 'Investi Ora'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Investments */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">I Miei Investimenti</h3>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Piano</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Giorni</TableHead>
                  <TableHead>Guadagno</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActiveInvestments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell>{inv.planName}</TableCell>
                    <TableCell>{inv.amount} USDT</TableCell>
                    <TableCell>{inv.daysRemaining > 0 ? `${inv.daysRemaining} restanti` : 'Completato'}</TableCell>
                    <TableCell className="text-primary">+{inv.earned}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'active' ? 'default' : 'secondary'}>
                        {inv.status === 'active' ? 'Attivo' : inv.status === 'completed' ? 'Completato' : 'In attesa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
