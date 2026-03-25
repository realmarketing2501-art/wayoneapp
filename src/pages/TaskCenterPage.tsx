import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TaskCenterPage() {
  const { user } = useAuth();

  const { data: templates = [] } = useQuery({
    queryKey: ['task_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_templates').select('*').eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: userTasks = [] } = useQuery({
    queryKey: ['user_tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_tasks').select('*').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getProgress = (taskId: string) => {
    const ut = userTasks.find(t => t.task_id === taskId);
    return { progress: ut?.progress ?? 0, completed: ut?.completed ?? false };
  };

  const dailyTasks = templates.filter(t => t.type === 'daily');
  const weeklyTasks = templates.filter(t => t.type === 'weekly');

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Task Center</h2>
        <Badge variant="outline" className="gap-1"><Gift className="h-3.5 w-3.5" /> Bonus USDT</Badge>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Giornaliere</h3>
        <div className="space-y-2">
          {dailyTasks.map(task => {
            const { progress, completed } = getProgress(task.id);
            return (
              <Card key={task.id} className={cn(completed && 'opacity-60')}>
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle2 className={cn('h-5 w-5', completed ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    <Progress value={progress / task.total * 100} className="mt-2 h-1.5" />
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-primary">+{Number(task.reward).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">USDT</p>
                  </div>
                  {!completed && <Button size="sm">Vai</Button>}
                </CardContent>
              </Card>
            );
          })}
          {dailyTasks.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nessuna task disponibile</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Settimanali</h3>
        <div className="space-y-2">
          {weeklyTasks.map(task => {
            const { progress, completed } = getProgress(task.id);
            return (
              <Card key={task.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle2 className={cn('h-5 w-5', completed ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={progress / task.total * 100} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{progress}/{task.total}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-accent">+{Number(task.reward).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">USDT</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {weeklyTasks.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nessuna task disponibile</p>}
        </div>
      </div>
    </div>
  );
}
