import { fallbackLocale, localeRegistry } from '../../shared/locales';

const modules = import.meta.glob('../lang/*/*.ts', { eager: true }) as Record<string, { default: unknown }>;

function merge(fallback: unknown, translation: unknown): unknown {
    if (
        translation === undefined ||
        translation === null ||
        (typeof translation === 'string' && translation.trim() === '')
    ) {
        return fallback;
    }
    if (Array.isArray(fallback)) {
        if (!Array.isArray(translation)) {
            return fallback;
        }
        return Array.from({ length: Math.max(fallback.length, translation.length) }, (_, index) =>
            merge(fallback[index], translation[index]),
        );
    }
    if (fallback && typeof fallback === 'object') {
        if (typeof translation !== 'object' || Array.isArray(translation)) {
            return fallback;
        }
        const result: Record<string, unknown> = { ...fallback };
        for (const [key, value] of Object.entries(translation)) {
            result[key] = merge((fallback as Record<string, unknown>)[key], value);
        }
        return result;
    }
    if (fallback !== undefined && typeof fallback !== typeof translation) {
        return fallback;
    }
    return translation;
}

export function loadNamespace<T>(namespace: string): Record<string, T> {
    const fallback = modules[`../lang/${fallbackLocale}/${namespace}.ts`]?.default;
    if (!fallback) {
        throw new Error(`Missing fallback translation namespace: ${namespace}`);
    }
    return Object.fromEntries(
        Object.keys(localeRegistry).map((locale) => [
            locale,
            merge(fallback, modules[`../lang/${locale}/${namespace}.ts`]?.default) as T,
        ]),
    );
}

type CommonCopy = Omit<typeof import('../lang/en/common').default, 'errors'> & { errors: Record<string, string> };
export type AccountCopy = typeof import('../lang/en/account').default;
export type WorkspaceCopy = typeof import('../lang/en/workspace').default;
export type SiteCopy = typeof import('../lang/en/site').default;

type PublicCopy = typeof import('../lang/en/public').default;
type AnnouncementCopy = typeof import('../lang/en/announcements').default;
type LegalCopy = typeof import('../lang/en/legal').default;
type TwoFactorCopy = typeof import('../lang/en/two-factor').default;
type StatisticsCopy = typeof import('../lang/en/statistics').default;

export const commonMessages = loadNamespace<CommonCopy>('common');
export const accountCopy = loadNamespace<AccountCopy>('account');
export const publicMessages = loadNamespace<PublicCopy>('public');
export const workspace = loadNamespace<WorkspaceCopy>('workspace');
export const announcementMessages = loadNamespace<AnnouncementCopy>('announcements');
export const siteMessages = loadNamespace<SiteCopy>('site');
export const legalMessages = loadNamespace<LegalCopy>('legal');
export const twoFactorMessages = loadNamespace<TwoFactorCopy>('two-factor');
export const statisticsMessages = loadNamespace<StatisticsCopy>('statistics');
