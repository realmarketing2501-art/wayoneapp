import { useState, useEffect } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa_install_prompt_dismissed_at';
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Skip in iframe (Lovable preview) and if already installed
    const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (isInIframe) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // @ts-ignore - iOS Safari standalone flag
    if ((window.navigator as any).standalone) return;

    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS doesn't fire beforeinstallprompt — show after small delay
    let timer: number | undefined;
    if (iOS) {
      timer = window.setTimeout(() => setOpen(true), 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Download className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center">Scarica l'app WAY ONE</DialogTitle>
          <DialogDescription className="text-center">
            Installa l'app sulla tua home per accedere più velocemente, ricevere notifiche e usarla anche offline.
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-3 rounded-xl bg-secondary/50 p-3 text-sm">
            <p className="font-semibold text-foreground">Su iPhone / iPad:</p>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="font-bold text-primary">1.</span>
              <p className="flex-1">
                Tocca il pulsante <Share className="inline h-4 w-4 align-text-bottom text-primary" /> Condividi nella barra di Safari.
              </p>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="font-bold text-primary">2.</span>
              <p className="flex-1">
                Scegli <Plus className="inline h-4 w-4 align-text-bottom text-primary" /> "Aggiungi alla schermata Home".
              </p>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="font-bold text-primary">3.</span>
              <p className="flex-1">Conferma con "Aggiungi". L'icona apparirà sulla tua home.</p>
            </div>
          </div>
        ) : (
          <Button size="lg" className="w-full gap-2" onClick={handleInstall} disabled={!deferredPrompt}>
            <Download className="h-4 w-4" />
            Installa ora
          </Button>
        )}

        <button
          onClick={handleClose}
          className="mx-auto text-xs text-muted-foreground hover:text-foreground"
        >
          Più tardi
        </button>
      </DialogContent>
    </Dialog>
  );
}
