import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_LANGS, type AppLang } from '@/i18n';

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGS.includes(i18n.language as AppLang) ? i18n.language : 'it') as AppLang;

  return (
    <div className="flex items-center gap-3">
      {!compact && <Globe className="h-5 w-5 text-primary" />}
      <Select value={current} onValueChange={(v) => i18n.changeLanguage(v)}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGS.map((lng) => (
            <SelectItem key={lng} value={lng}>
              {t(`langNames.${lng}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
