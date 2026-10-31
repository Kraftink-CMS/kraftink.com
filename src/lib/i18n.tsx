import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { fallbackLocale, localizedPathname } from '../../shared/locales';
import { siteMessages, type SiteCopy } from './translations';

export type Locale = string;

const LocaleContext = createContext<{ locale: Locale; preferred: Locale; path: (to: string) => string }>({
    locale: fallbackLocale,
    preferred: fallbackLocale,
    path: (to) => `/${fallbackLocale}${to === '/' ? '' : to.startsWith('/') ? to : `/${to}`}`,
});

export function LocaleProvider({ preferred, children }: { preferred: Locale; children: ReactNode }): ReactNode {
    const location = useLocation();
    const locale = localizedPathname(location.pathname, preferred).split('/')[1];
    const path = useCallback(
        (to: string) => `/${locale}${to === '/' ? '' : to.startsWith('/') ? to : `/${to}`}`,
        [locale],
    );
    return <LocaleContext.Provider value={{ locale, preferred, path }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    return useContext(LocaleContext);
}

export function localized(value: string | Record<string, string> | undefined, locale: Locale): string {
    if (typeof value === 'string') {
        return value;
    }
    const translations = Object.fromEntries(
        Object.entries(value ?? {}).map(([language, text]) => [language.replaceAll('_', '-').toLowerCase(), text]),
    );
    const language = locale.replaceAll('_', '-').toLowerCase();
    return (
        translations[language] ||
        translations[language.split('-')[0]] ||
        translations[fallbackLocale] ||
        Object.values(value ?? {}).find(Boolean) ||
        ''
    );
}

export function useSiteCopy(): SiteCopy {
    const { locale } = useLocale();
    return siteMessages[locale] ?? siteMessages[fallbackLocale];
}
