import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  // Don't show if installed, dismissed, no prompt available, or in iframe
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  if (isInstalled || dismissed || !deferredPrompt || isInIframe) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-lg animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card p-4 shadow-lg shadow-primary/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Installa WAY ONE</p>
          <p className="text-xs text-muted-foreground">Aggiungi l'app alla home per un accesso rapido</p>
        </div>
        <Button size="sm" onClick={handleInstall} className="shrink-0">
          Installa
        </Button>
        <button onClick={() => setDismissed(true)} className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
