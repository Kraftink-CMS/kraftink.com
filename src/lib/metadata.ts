import { fallbackLocale, localeRegistry } from '../../shared/locales';
import { localized } from './i18n';
import {
    accountCopy,
    commonMessages,
    legalMessages,
    publicMessages,
    siteMessages,
    statisticsMessages,
    workspace,
} from './translations';
import type { PublicPageData } from './rendering';

export interface PageMetadata {
    title: string;
    description: string;
    canonical: string;
    alternates: Array<{ locale: string; href: string }>;
    indexable: boolean;
    render: boolean;
    status: 200 | 404 | 503;
}

export function localizedPagePath(locale: string, relative: string): string {
    return `/${locale}${relative ? `/${relative}` : ''}`;
}

function readable(value: string): string {
    return value.replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim();
}

export function pageMetadata(
    pathname: string,
    search: string,
    locale: string,
    data: PublicPageData,
    origin: string,
): PageMetadata {
    const site = siteMessages[locale] ?? siteMessages[fallbackLocale];
    const common = commonMessages[locale] ?? commonMessages[fallbackLocale];
    const account = accountCopy[locale] ?? accountCopy[fallbackLocale];
    const legal = legalMessages[locale] ?? legalMessages[fallbackLocale];
    const text = publicMessages[locale] ?? publicMessages[fallbackLocale];
    const panel = workspace[locale] ?? workspace[fallbackLocale];
    const statistics = statisticsMessages[locale] ?? statisticsMessages[fallbackLocale];
    const relative = pathname.split('/').slice(2).join('/').replace(/\/+$/, '');
    const pages: Record<string, { title: string; description: string; public: boolean }> = {
        '': { title: site.tagline, description: site.description, public: true },
        features: { title: site.nav[0][0], description: site.fullFeatures.lead, public: true },
        about: { title: site.footer.about, description: site.about.description, public: true },
        downloads: { title: site.downloads.pageTitle, description: site.downloads.lead, public: true },
        market: { title: common.market, description: text.marketText, public: true },
        terms: { title: legal.terms.title, description: legal.terms.lead, public: true },
        privacy: { title: legal.privacy.title, description: legal.privacy.lead, public: true },
        login: { title: account.login, description: account.loginDescription, public: false },
        register: { title: account.register, description: account.registerDescription, public: false },
        'forgot-password': { title: account.forgot, description: account.forgotDescription, public: false },
        'reset-password': { title: account.reset, description: account.resetDescription, public: false },
        'verify-email': { title: account.verify, description: account.verifyDescription, public: false },
        account: { title: account.account, description: account.accountDescription, public: false },
        creator: { title: panel.creatorTitle, description: panel.creatorDescription, public: false },
        moderation: { title: panel.moderationTitle, description: site.description, public: false },
        'admin/users': { title: common.users, description: site.description, public: false },
        'admin/statistics': { title: statistics.title, description: statistics.description, public: false },
        'admin/announcements': { title: common.announcements, description: site.description, public: false },
        'checkout/success': { title: text.verified, description: site.description, public: false },
    };
    const page = pages[relative];
    let title = page?.title ?? text.notFound;
    let description = page?.description ?? text.notFoundText;
    let indexable = page?.public ?? false;
    let render = page?.public ?? true;
    let status: PageMetadata['status'] = page ? 200 : 404;
    let canonicalLocale = locale;
    let canonicalRelative = relative;
    let languages = Object.keys(localeRegistry);
    if (relative === 'documentation' || relative.startsWith('documentation/')) {
        let slug = 'index';
        try {
            slug = relative === 'documentation' ? 'index' : decodeURIComponent(relative.slice(14));
        } catch {
            slug = '';
        }
        const guides = data.locale === locale ? data.guides : undefined;
        const guide = guides?.find((entry) => entry.slug === slug);
        title = guide?.title ?? text.docsTitle;
        description = guide?.description ?? text.docsIntro;
        indexable = Boolean(guide && !guide.hidden);
        render = true;
        status = guide ? 200 : guides ? 404 : 503;
        canonicalLocale = guide?.contentLocale ?? locale;
        languages = guide?.availableLocales ?? languages;
        canonicalRelative = `documentation${slug === 'index' ? '' : `/${slug.split('/').map(encodeURIComponent).join('/')}`}`;
    } else if (relative === 'market/resource' || relative.startsWith('market/resource/')) {
        let id = '';
        try {
            id =
                relative === 'market/resource'
                    ? (new URLSearchParams(search).get('resource') ?? new URLSearchParams(search).get('id') ?? '')
                    : decodeURIComponent(relative.slice(16));
        } catch {
            id = '';
        }
        const resource = data.catalogue?.resources.find((entry) => entry.resourceId === id || entry.id === id);
        title = resource ? localized(resource.name, locale) : common.resource;
        description = resource ? localized(resource.description, locale) : text.marketText;
        indexable = Boolean(resource);
        render = true;
        status = resource ? 200 : data.catalogue?.state === 'fresh' ? 404 : 503;
        canonicalRelative = resource
            ? `market/resource/${encodeURIComponent(resource.resourceId ?? resource.id)}`
            : relative;
    }
    if (
        relative === 'market' &&
        (!data.catalogue || (data.catalogue.state === 'unavailable' && data.catalogue.resources.length === 0))
    ) {
        status = 503;
    }
    const canonical = new URL(localizedPagePath(canonicalLocale, canonicalRelative), origin).href;
    return {
        title: `${readable(title)} - ${site.siteName}`,
        description: [...readable(description)].slice(0, 200).join(''),
        canonical,
        alternates: indexable
            ? languages.map((code) => ({
                  locale: code,
                  href: new URL(localizedPagePath(code, canonicalRelative), origin).href,
              }))
            : [],
        indexable,
        render,
        status,
    };
}
