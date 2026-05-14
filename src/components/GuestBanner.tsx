import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function GuestBanner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const { t } = useTranslation();

  if (loading || user || hidden) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/10 px-4 py-2.5">
      <div className="mx-auto flex max-w-lg items-center gap-2 text-xs">
        <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="flex-1 text-foreground/90">
          {t('guest.banner')}{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-semibold usdt-gold-text underline-offset-2 hover:underline"
          >
            {t('guest.cta')}
          </button>{' '}
          {t('guest.desc')}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setHidden(true)}
          aria-label={t('common.close')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

