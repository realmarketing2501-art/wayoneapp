import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold">
          <span className="text-primary">WAY</span> ONE
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">La piattaforma di investimento crypto</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold text-center">{isLogin ? 'Accedi' : 'Registrati'}</h2>

          {!isLogin && (
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="Il tuo username" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="email@esempio.com" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label>Codice Referral (opzionale)</Label>
              <Input placeholder="WAY1-XXXXX" />
            </div>
          )}

          <Button className="w-full" onClick={() => navigate('/')}>
            {isLogin ? 'Accedi' : 'Crea Account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
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
