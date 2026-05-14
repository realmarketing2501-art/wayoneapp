import { useState, useEffect } from 'react';
import { Download, Share, Plus, Bell, Zap, WifiOff, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UsdtMonogram } from './UsdtMonogram';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa_install_prompt_dismissed_at';
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 3; // 3 giorni

const benefits = [
  { icon: Zap, label: 'Avvio istantaneo' },
  { icon: Bell, label: 'Notifiche push' },
  { icon: WifiOff, label: 'Funziona offline' },
  { icon: Smartphone, label: 'Esperienza nativa' },
];

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (isInIframe) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // @ts-ignore
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

    let timer: number | undefined;
    if (iOS) timer = window.setTimeout(() => setOpen(true), 3000);

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
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-primary/20 p-0 shadow-2xl shadow-primary/20">
        {/* Hero with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-transparent px-6 pb-4 pt-8">
          {/* decorative blurred glows */}
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card/60 px-2 py-1 text-[0.6rem] font-medium text-primary backdrop-blur">
            <Sparkles className="h-3 w-3" /> NEW
          </div>

          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 animate-pulse-glow rounded-3xl bg-primary/40 blur-xl" />
              <div className="relative rounded-3xl bg-card p-3 shadow-lg ring-1 ring-primary/30">
                <UsdtMonogram size={56} letter="U" />
              </div>
            </div>
            <DialogTitle className="font-display text-xl font-bold tracking-tight">
              Installa l'app WAY ONE
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              Aggiungila alla tua home in pochi secondi.<br />
              Accesso più veloce, sicuro e sempre con te.
            </DialogDescription>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 gap-2 px-6">
          {benefits.map((b) => (
            <div key={b.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 p-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <b.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[0.7rem] font-medium text-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Action area */}
        <div className="space-y-3 px-6 pb-5 pt-4">
          {isIOS ? (
            <div className="space-y-2.5 rounded-xl border border-border bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Smartphone className="h-3.5 w-3.5 text-primary" /> Su iPhone / iPad
              </p>
              <Step n="1" text="Tocca" iconAfter={<Share className="inline h-3.5 w-3.5 text-primary" />} suffix=" nella barra di Safari" />
              <Step n="2" text="Scegli" iconAfter={<Plus className="inline h-3.5 w-3.5 text-primary" />} suffix=" Aggiungi alla schermata Home" />
              <Step n="3" text="Conferma con Aggiungi e l'icona apparirà sulla home" />
            </div>
          ) : (
            <Button
              size="lg"
              className="h-12 w-full gap-2 bg-gradient-to-r from-primary to-primary/80 text-base font-semibold shadow-lg shadow-primary/30 hover:opacity-95"
              onClick={handleInstall}
              disabled={!deferredPrompt}
            >
              <Download className="h-4 w-4" />
              Installa ora — Gratis
            </Button>
          )}

          <button
            onClick={handleClose}
            className="block w-full text-center text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            Forse più tardi
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, text, iconAfter, suffix }: { n: string; text: string; iconAfter?: React.ReactNode; suffix?: string }) {
  return (
    <div className="flex items-start gap-2 text-[0.7rem] leading-relaxed text-muted-foreground">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[0.55rem] font-bold text-primary">{n}</span>
      <p className="flex-1">{text}{iconAfter && <> {iconAfter}</>}{suffix}</p>
    </div>
  );
}
