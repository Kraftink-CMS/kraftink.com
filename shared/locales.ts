export interface LocaleDefinition {
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
}

export const fallbackLocale = 'en';
export const localeRegistry: Record<string, LocaleDefinition> = {
    fr: { name: 'French', nativeName: 'Français', direction: 'ltr' },
    en: { name: 'English', nativeName: 'English', direction: 'ltr' },
};

export function isLocale(value: unknown): value is string {
    return typeof value === 'string' && Object.hasOwn(localeRegistry, value);
}

export function matchLocale(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim().replaceAll('_', '-').toLowerCase();
    return (
        Object.keys(localeRegistry).find((code) => code.toLowerCase() === normalized) ??
        Object.keys(localeRegistry).find((code) => code.toLowerCase() === normalized.split('-')[0]) ??
        null
    );
}

export function resolveLocale(value: string): string {
    return matchLocale(value) ?? fallbackLocale;
}

export function selectLocale(values: readonly string[]): string {
    for (const value of values) {
        const locale = matchLocale(value);
        if (locale !== null) {
            return locale;
        }
    }
    return fallbackLocale;
}

export function localizedPathname(pathname: string, preferred: string): string {
    const requested = pathname.split('/')[1] ?? '';
    const locale = matchLocale(requested);
    const suffix = pathname.slice(requested.length + 1);
    if (locale !== null || (suffix.split('/').some(Boolean) && /^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/i.test(requested))) {
        return `/${locale ?? fallbackLocale}${suffix}`;
    }
    return `/${resolveLocale(preferred)}${pathname === '/' ? '' : pathname}`;
}
