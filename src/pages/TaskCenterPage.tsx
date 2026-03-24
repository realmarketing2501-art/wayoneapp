import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockTasks } from '@/data/mockData';
import { CheckCircle2, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TaskCenterPage() {
  const dailyTasks = mockTasks.filter(t => t.type === 'daily');
  const weeklyTasks = mockTasks.filter(t => t.type === 'weekly');

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Task Center</h2>
        <Badge variant="outline" className="gap-1"><Gift className="h-3.5 w-3.5" /> Bonus USDT</Badge>
      </div>

      {/* Daily */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Giornaliere</h3>
        <div className="space-y-2">
          {dailyTasks.map(task => (
            <Card key={task.id} className={cn(task.completed && 'opacity-60')}>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className={cn('h-5 w-5', task.completed ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <Progress value={task.progress / task.total * 100} className="mt-2 h-1.5" />
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-primary">+{task.reward}</p>
                  <p className="text-xs text-muted-foreground">USDT</p>
                </div>
                {!task.completed && <Button size="sm">Vai</Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Settimanali</h3>
        <div className="space-y-2">
          {weeklyTasks.map(task => (
            <Card key={task.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className={cn('h-5 w-5', task.completed ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={task.progress / task.total * 100} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{task.progress}/{task.total}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-accent">+{task.reward}</p>
                  <p className="text-xs text-muted-foreground">USDT</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
