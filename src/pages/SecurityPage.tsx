import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function SecurityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      toast.error('La nuova password deve avere almeno 8 caratteri');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Le password non coincidono');
      return;
    }
    if (!user?.email) {
      toast.error('Email utente non disponibile');
      return;
    }

    setLoading(true);
    try {
      // Verifica password attuale con un re-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      });
      if (signInError) {
        toast.error('Password attuale errata');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password aggiornata con successo');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Errore imprevisto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Indietro
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Centro Sicurezza</h1>
          <p className="text-xs text-muted-foreground">Gestisci password e protezione account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-primary" /> Cambia password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Password attuale</Label>
              <Input
                id="current"
                type="password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">Nuova password</Label>
              <Input
                id="new"
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Minimo 8 caratteri</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Conferma nuova password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Lock className="h-4 w-4" />
              {loading ? 'Aggiornamento...' : 'Aggiorna password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground">Autenticazione a due fattori (2FA)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Funzione in arrivo — riceverai una notifica quando sarà disponibile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
