import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye } from 'lucide-react';
import { UsdtMonogram } from '@/components/UsdtMonogram';
import { lovable } from '@/integrations/lovable';
import { trackAuthEvent } from '@/hooks/useTrackSignup';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') || (typeof window !== 'undefined' ? localStorage.getItem('pending_ref') || '' : '');
  const [isLogin, setIsLogin] = useState(!refFromUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referral, setReferral] = useState(refFromUrl);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Persist referral so it survives OAuth redirect
  if (typeof window !== 'undefined' && refFromUrl) {
    localStorage.setItem('pending_ref', refFromUrl);
  }

  if (user) {
    navigate('/home', { replace: true });
    return null;
  }

  const handleGoogle = async () => {
    setGoogleLoading(true);
    if (referral) localStorage.setItem('pending_ref', referral);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + '/home',
    });
    if (result.error) {
      toast({ title: t('login.googleErrorTitle'), description: result.error.message, variant: 'destructive' });
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return; // browser navigates away
    trackAuthEvent('signup');
    navigate('/home');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: t('login.errorTitle'), description: error.message, variant: 'destructive' });
      } else {
        trackAuthEvent('login');
        navigate('/home');
      }
    } else {
      const { error } = await signUp(email, password, username, referral || undefined);
      if (error) {
        toast({ title: t('login.errorTitle'), description: error.message, variant: 'destructive' });
      } else {
        trackAuthEvent('signup');
        toast({ title: t('login.signupSuccessTitle'), description: t('login.signupSuccessDesc') });
      }
    }
    setLoading(false);
  };

  return (
    <div className="usdt-bg flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
      <div className="absolute left-4 top-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute right-4 top-4">
      </div>

      <div className="mb-6 flex flex-col items-center text-center">
        <UsdtMonogram size={72} letter="U" className="mb-4 usdt-glow-gold" />
        <h1 className="font-display text-3xl font-bold usdt-gold-text">{t('login.brand')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </div>

      <div className="usdt-card-gold w-full max-w-sm p-6">
        <h2 className="mb-4 text-center font-display text-xl font-semibold">
          {isLogin ? t('login.signIn') : t('login.signUp')}
        </h2>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.6 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.6 6.1 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5.1l-6-5c-1.9 1.3-4.3 2.1-6.9 2.1-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5h-1.9V20H24v8h11.3c-.8 2.4-2.4 4.4-4.4 5.9l6 5C40.9 35.4 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          {googleLoading ? t('login.opening') : t('login.continueGoogle')}
        </Button>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{t('login.or')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label className="text-sm">{t('login.username')}</Label>
              <Input placeholder={t('login.usernamePlaceholder')} value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('login.email')}</Label>
            <Input type="email" placeholder={t('login.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t('login.password')}</Label>
            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {!isLogin && (
            <div className="space-y-1.5">
              <Label className="text-sm">{t('login.referralOptional')}</Label>
              <Input placeholder={t('login.referralPlaceholder')} value={referral} onChange={e => setReferral(e.target.value)} />
            </div>
          )}
          <Button className="usdt-btn-gold w-full" type="submit" disabled={loading}>
            {loading ? t('login.loading') : isLogin ? t('login.signIn') : t('login.createAccount')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? t('login.noAccount') : t('login.haveAccount')}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
            {isLogin ? t('login.signUp') : t('login.signIn')}
          </button>
        </p>
      </div>

      <Button
        variant="ghost"
        className="mt-4 gap-2 text-xs text-muted-foreground"
        onClick={() => navigate('/home')}
      >
        <Eye className="h-3.5 w-3.5" /> {t('login.exploreGuest')}
      </Button>
    </div>
  );
}
