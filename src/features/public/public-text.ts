import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const PublicContent = createContext<Record<string, string>>({});
export function usePublicText() {
  const content = useContext(PublicContent), { t, i18n } = useTranslation();
  return (key: string, values?: Record<string, string | number>) => {
    if (!(key in content)) return t(key, values);
    return content[key].replace(/{{\s*(\w+)\s*}}/g, (_, name: string) => typeof values?.[name] === 'number' ? new Intl.NumberFormat(i18n.language).format(values[name]) : String(values?.[name] ?? ''));
  };
}
