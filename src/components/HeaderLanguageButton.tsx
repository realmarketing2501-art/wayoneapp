import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS, type AppLang } from '@/i18n';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const FLAGS: Record<AppLang, string> = {
  it: '🇮🇹',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  zh: '🇨🇳',
};

export default function HeaderLanguageButton() {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGS.includes(i18n.language as AppLang) ? i18n.language : 'it') as AppLang;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t('profile.language')}
        >
          <span className="text-xl leading-none">{FLAGS[current]}</span>
          <span className="text-[0.65rem] font-semibold uppercase">{current}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGS.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className={`flex items-center gap-2 ${lng === current ? 'font-semibold text-primary' : ''}`}
          >
            <span className="text-lg leading-none">{FLAGS[lng]}</span>
            <span>{t(`langNames.${lng}`)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
