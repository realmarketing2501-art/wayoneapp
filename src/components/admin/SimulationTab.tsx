import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Eye, Settings, TrendingUp, Coins, Sparkles, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

type WithdrawalMode = {
  key: string;
  label: string;
  hours: number;
  fee_pct: number;
  active?: boolean;
};

export default function SimulationTab() {
  const { data: plans = [] } = useQuery({
    queryKey: ['admin_sim_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('id, name, daily_return, duration_days, duration, min_invest, max_invest, status')
        .order('min_invest', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: withdrawalCfg } = useQuery({
    queryKey: ['admin_sim_withdrawal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'withdrawal_config')
        .maybeSingle();
      if (error) throw error;
      try {
        return JSON.parse(data?.value ?? '[]') as WithdrawalMode[];
      } catch {
        return [] as WithdrawalMode[];
      }
    },
  });

  const activePlans = plans.filter((p) => p.status === 'active');
  const activeModes = (withdrawalCfg ?? []).filter((m) => m.active !== false);

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          La pagina pubblica <code>/simulator</code> è uno strumento di stima:
          <strong> non scrive dati reali</strong>, non crea investimenti, non modifica saldi.
          Usa i dati configurati qui sotto. Tutte le modifiche si propagano entro 60 secondi.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href="/simulator" target="_blank" rel="noreferrer">
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Apri /simulator
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>

      {/* Piani usati nel simulatore */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Piani mostrati nel simulatore</h3>
            </div>
            <Badge variant="secondary" className="text-[0.6rem]">
              {activePlans.length} attivi / {plans.length}
            </Badge>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            Solo i piani con stato <code>active</code> sono mostrati. Modifica nella tab{' '}
            <strong>Piani</strong>.
          </p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-md border p-2 text-xs ${
                  p.status === 'active' ? 'border-border' : 'border-dashed opacity-50'
                }`}
              >
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    {p.duration_days ?? p.duration} gg · {Number(p.daily_return)}%/gg · min{' '}
                    {Number(p.min_invest)} · max {p.max_invest ? Number(p.max_invest) : '∞'}
                  </div>
                </div>
                <Badge
                  variant={p.status === 'active' ? 'default' : 'outline'}
                  className="text-[0.55rem]"
                >
                  {p.status}
                </Badge>
              </div>
            ))}
            {plans.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                Nessun piano configurato. Il simulator mostrerà un messaggio "Nessun piano attivo".
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee prelievi usate nel simulatore */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Modalità prelievo nel simulatore</h3>
            </div>
            <Badge variant="secondary" className="text-[0.6rem]">{activeModes.length} attive</Badge>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            Configurate in <code>admin_settings.withdrawal_config</code>. Le fee qui mostrate
            sono le stesse usate dal sistema reale (RPC <code>create_withdrawal</code>).
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(withdrawalCfg ?? []).map((m) => (
              <div
                key={m.key}
                className={`rounded-md border p-2 text-xs ${
                  m.active === false ? 'border-dashed opacity-50' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{m.label}</span>
                  <Badge variant="outline" className="text-[0.55rem]">{m.hours}h</Badge>
                </div>
                <div className="mt-1 text-[0.7rem]">
                  Fee <span className="font-bold text-primary">{m.fee_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cose fisse per design */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Valori fissi per design</h3>
          </div>
          <ul className="text-[0.7rem] text-muted-foreground space-y-1 list-disc pl-4">
            <li>
              Disclaimer "non costituisce garanzia di rendimento" — fisso per compliance.
            </li>
            <li>
              Range slider importi e quick-buttons (100/500/1000/5000) — fissi per UX.
            </li>
            <li>
              Formula di calcolo: <code>importo × daily% × giorni</code> (lineare, coerente con
              l'engine reale).
            </li>
            <li>
              Bonus MLM, livelli e referral <strong>non</strong> sono inclusi nella simulazione
              (mostra solo il rendimento base del piano).
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Dove configurare cosa</h3>
          </div>
          <ul className="text-[0.7rem] text-muted-foreground space-y-1">
            <li>• <strong>Nomi, durate, %, min/max piani</strong> → tab <em>Piani</em></li>
            <li>• <strong>Fee prelievo Fast/Medium/Slow</strong> → <code>admin_settings.withdrawal_config</code></li>
            <li>• <strong>Livelli MLM e bonus</strong> → tab <em>Compensi</em></li>
            <li>• <strong>Fondi speciali</strong> → tab <em>Fondi</em> (non mostrati nel simulator base)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
