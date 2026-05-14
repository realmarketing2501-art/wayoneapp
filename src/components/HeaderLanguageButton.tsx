import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { SUPPORTED_LANGS, type AppLang } from '@/i18n';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const FLAGS: Record<AppLang, string> = {
  it: '🇮🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', zh: '🇨🇳',
};

export default function HeaderLanguageButton() {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGS.includes(i18n.language as AppLang) ? i18n.language : 'it') as AppLang;

  const handleChange = (lng: AppLang) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('app_lang', lng); } catch { /* ignore */ }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card/60 px-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 active:scale-95"
          aria-label={t('profile.language')}
        >
          <span className="text-base leading-none">{FLAGS[current]}</span>
          <span className="uppercase tracking-wide">{current}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[11rem] p-1.5">
        {SUPPORTED_LANGS.map((lng) => {
          const active = lng === current;
          return (
            <DropdownMenuItem
              key={lng}
              onSelect={() => handleChange(lng)}
              className={`flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm ${
                active ? 'bg-primary/15 font-semibold text-primary' : 'text-foreground'
              }`}
            >
              <span className="text-lg leading-none">{FLAGS[lng]}</span>
              <span className="flex-1">{t(`langNames.${lng}`)}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
