import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') || '';
  const [isLogin, setIsLogin] = useState(!refFromUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referral, setReferral] = useState(refFromUrl);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  if (user) {
    navigate('/home', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      } else {
        navigate('/home');
      }
    } else {
      const { error } = await signUp(email, password, username, referral || undefined);
      if (error) {
        toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Registrazione completata!', description: 'Controlla la tua email per confermare l\'account.' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold">
          <span className="text-primary">WAY</span> <span className="text-foreground">ONE</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">La piattaforma di investimento crypto</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-center mb-4 sm:text-xl">{isLogin ? 'Accedi' : 'Registrati'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-sm">Username</Label>
                <Input placeholder="Il tuo username" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input type="email" placeholder="email@esempio.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-sm">Codice Referral (opzionale)</Label>
                <Input placeholder="WAY1-XXXXX" value={referral} onChange={e => setReferral(e.target.value)} />
              </div>
            )}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Crea Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? 'Non hai un account?' : 'Hai già un account?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
              {isLogin ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
