import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plug, Zap, CheckCircle, XCircle, AlertTriangle,
  Save, TestTube, Eye, EyeOff, RefreshCw, Mail, 
  Wallet, Settings, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Integration = {
  id: string;
  service_key: string;
  service_name: string;
  category: string;
  config: Record<string, string>;
  is_active: boolean;
  status: string;
  last_test_at: string | null;
  last_test_result: string | null;
  last_test_error: string | null;
  notes: string | null;
  updated_at: string;
};

const SENSITIVE_KEYS = ['api_key', 'infura_api_key', 'api_url'];

function maskValue(value: string) {
  if (!value || value.length < 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-[0.6rem]"><CheckCircle className="h-3 w-3 mr-1" />Attivo</Badge>;
    case 'error':
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[0.6rem]"><XCircle className="h-3 w-3 mr-1" />Errore</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground border-muted text-[0.6rem]"><AlertTriangle className="h-3 w-3 mr-1" />Non configurato</Badge>;
  }
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'blockchain': return <Globe className="h-4 w-4" />;
    case 'email': return <Mail className="h-4 w-4" />;
    case 'platform': return <Settings className="h-4 w-4" />;
    default: return <Plug className="h-4 w-4" />;
  }
}

const SERVICE_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'email' | 'select' | 'toggle'; sensitive?: boolean; options?: string[]; placeholder?: string }[]> = {
  tron_trc20: [
    { key: 'api_url', label: 'TRON API URL', type: 'text', sensitive: true, placeholder: 'https://api.trongrid.io' },
    { key: 'api_key', label: 'TRON API Key', type: 'text', sensitive: true, placeholder: 'Chiave TronGrid' },
    { key: 'company_wallet', label: 'Wallet Aziendale TRC-20', type: 'text', placeholder: 'T...' },
  ],
  eth_erc20: [
    { key: 'infura_api_key', label: 'Infura API Key', type: 'text', sensitive: true, placeholder: 'Chiave Infura' },
    { key: 'company_wallet', label: 'Wallet Aziendale ERC-20', type: 'text', placeholder: '0x...' },
    { key: 'network', label: 'Network', type: 'select', options: ['mainnet', 'goerli', 'sepolia'] },
  ],
  sendgrid: [
    { key: 'api_key', label: 'SendGrid API Key', type: 'text', sensitive: true, placeholder: 'SG.xxx' },
    { key: 'email_from', label: 'Email Mittente', type: 'email', placeholder: 'noreply@wayone.com' },
    { key: 'sender_name', label: 'Nome Mittente', type: 'text', placeholder: 'WAY ONE' },
  ],
  platform: [
    { key: 'wallet_trc20_active', label: 'Wallet TRC-20 Attivo', type: 'toggle' },
    { key: 'wallet_erc20_active', label: 'Wallet ERC-20 Attivo', type: 'toggle' },
    { key: 'min_deposit', label: 'Deposito Minimo (USDT)', type: 'text', placeholder: '50' },
    { key: 'min_withdraw', label: 'Prelievo Minimo (USDT)', type: 'text', placeholder: '10' },
    { key: 'fee_fast', label: 'Fee Prelievo Fast (%)', type: 'text', placeholder: '20' },
    { key: 'fee_medium', label: 'Fee Prelievo Medium (%)', type: 'text', placeholder: '10' },
    { key: 'fee_slow', label: 'Fee Prelievo Slow (%)', type: 'text', placeholder: '5' },
    { key: 'maintenance_mode', label: 'Modalità Manutenzione', type: 'toggle' },
  ],
};

function IntegrationCard({ integration }: { integration: Integration }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [formConfig, setFormConfig] = useState<Record<string, string>>({ ...integration.config });
  const [notes, setNotes] = useState(integration.notes || '');

  const fields = SERVICE_FIELDS[integration.service_key] || [];

  const toggleSensitive = (key: string) => setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('api_integrations' as any)
        .update({
          config: formConfig,
          notes: notes || null,
          updated_at: new Date().toISOString(),
          status: Object.values(formConfig).some(v => v && v.length > 0) ? integration.status : 'not_configured',
        } as any)
        .eq('id', integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_integrations'] });
      setEditing(false);
      toast({ title: 'Configurazione salvata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('api_integrations' as any)
        .update({ is_active: !integration.is_active, updated_at: new Date().toISOString() } as any)
        .eq('id', integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_integrations'] });
      toast({ title: integration.is_active ? 'Integrazione disattivata' : 'Integrazione attivata' });
    },
    onError: (e: Error) => toast({ title: 'Errore', description: e.message, variant: 'destructive' }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { service_key: integration.service_key, config: formConfig },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_integrations'] });
      toast({ title: 'Test riuscito', description: data.details || data.message });
    },
    onError: (e: Error) => toast({ title: 'Test fallito', description: e.message, variant: 'destructive' }),
  });

  return (
    <Card className="border-border/50">
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg p-1.5 bg-primary/10 text-primary shrink-0">
              <CategoryIcon category={integration.category} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{integration.service_name}</p>
              <p className="text-[0.6rem] text-muted-foreground">
                Aggiornato: {new Date(integration.updated_at).toLocaleString('it-IT')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={integration.status} />
            <Switch checked={integration.is_active} onCheckedChange={() => toggleActiveMutation.mutate()} />
          </div>
        </div>

        {/* Last test info */}
        {integration.last_test_at && (
          <div className={cn(
            'rounded-md p-2 text-[0.65rem]',
            integration.last_test_result === 'success' ? 'bg-green-600/10 text-green-400' : 'bg-destructive/10 text-destructive'
          )}>
            <p className="font-medium">
              Ultimo test: {new Date(integration.last_test_at).toLocaleString('it-IT')} — {integration.last_test_result === 'success' ? '✓ Successo' : '✗ Fallito'}
            </p>
            {integration.last_test_error && <p className="mt-0.5 opacity-80">{integration.last_test_error}</p>}
          </div>
        )}

        {/* Config fields */}
        {editing && (
          <div className="space-y-2.5 pt-1">
            {fields.map(field => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                {field.type === 'toggle' ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formConfig[field.key] === 'true'}
                      onCheckedChange={(v) => setFormConfig(prev => ({ ...prev, [field.key]: String(v) }))}
                    />
                    <span className="text-xs text-foreground">{formConfig[field.key] === 'true' ? 'Attivo' : 'Disattivo'}</span>
                  </div>
                ) : field.type === 'select' ? (
                  <Select value={formConfig[field.key] || ''} onValueChange={(v) => setFormConfig(prev => ({ ...prev, [field.key]: v }))}>
                    <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Input
                      type={field.sensitive && !showSensitive[field.key] ? 'password' : field.type}
                      placeholder={field.placeholder}
                      value={formConfig[field.key] || ''}
                      onChange={e => setFormConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="text-sm h-9 pr-9"
                    />
                    {field.sensitive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9"
                        onClick={() => toggleSensitive(field.key)}
                      >
                        {showSensitive[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note amministrative</Label>
              <Textarea
                placeholder="Note interne..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* Display masked values when not editing */}
        {!editing && fields.length > 0 && integration.service_key !== 'platform' && (
          <div className="space-y-1">
            {fields.filter(f => f.type !== 'toggle').map(field => (
              <div key={field.key} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{field.label}</span>
                <span className="text-foreground font-mono text-[0.65rem]">
                  {formConfig[field.key]
                    ? (field.sensitive ? maskValue(formConfig[field.key]) : formConfig[field.key])
                    : <span className="text-muted-foreground italic">non impostato</span>
                  }
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Platform config summary when not editing */}
        {!editing && integration.service_key === 'platform' && (
          <div className="grid grid-cols-2 gap-1.5">
            {fields.map(field => (
              <div key={field.key} className="flex justify-between items-center text-xs bg-muted/30 rounded px-2 py-1">
                <span className="text-muted-foreground text-[0.6rem]">{field.label}</span>
                <span className="text-foreground font-medium text-[0.65rem]">
                  {field.type === 'toggle' 
                    ? (formConfig[field.key] === 'true' ? '✓' : '✗')
                    : (formConfig[field.key] || '—')
                  }
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {editing ? (
            <>
              <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="h-3.5 w-3.5" />{saveMutation.isPending ? 'Salvando...' : 'Salva'}
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                {testMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                Test
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditing(false)}>Annulla</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1" onClick={() => setEditing(true)}>
                <Settings className="h-3.5 w-3.5" />Modifica
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                {testMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                Test
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsTab() {
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['admin_integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_integrations' as any)
        .select('*')
        .order('category');
      if (error) throw error;
      return (data || []) as unknown as Integration[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // Summary table
  const summaryRows = integrations.map(i => ({
    name: i.service_name,
    status: i.status,
    active: i.is_active,
    lastUpdate: i.updated_at,
    lastTest: i.last_test_at,
    testResult: i.last_test_result,
  }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Riepilogo Integrazioni</h4>
          </div>
          <div className="space-y-1.5">
            {summaryRows.map(row => (
              <div key={row.name} className="flex items-center justify-between text-xs bg-muted/20 rounded-md px-2.5 py-1.5">
                <span className="text-foreground font-medium truncate min-w-0">{row.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {row.active ? (
                    <span className="text-green-400 text-[0.6rem]">ON</span>
                  ) : (
                    <span className="text-muted-foreground text-[0.6rem]">OFF</span>
                  )}
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Cards */}
      {integrations.map(integration => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}
    </div>
  );
}
