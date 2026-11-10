import type { Role } from './auth';
import type { CatalogueResource } from './catalogue';
import { matchPath } from 'react-router-dom';

const legacyResourcePath = 'market/resource';
const officialMarketAuthor = 'kraftink-cms';
const resourcePages = (['plugin', 'theme', 'game'] as const).map((type) => ({
    type,
    path: `market/${type}s/:author?/:slug`,
}));
const resourceSegment = /^[a-z][a-z0-9-]{1,49}$/;

export const marketResourceRoutes = [...resourcePages.map(({ path }) => path), `${legacyResourcePath}/*`];

export interface MarketResourceRoute {
    id?: string;
    type?: CatalogueResource['type'];
}

export function matchMarketResourceRoute(relative: string, search: string): MarketResourceRoute | null {
    relative = relative.replace(/\/+$/, '');
    if (relative === legacyResourcePath) {
        const query = new URLSearchParams(search);
        return { id: query.get('resource') ?? query.get('id') ?? undefined };
    }
    if (relative.startsWith(`${legacyResourcePath}/`)) {
        try {
            return { id: decodeURIComponent(relative.slice(legacyResourcePath.length + 1)) };
        } catch {
            return {};
        }
    }
    for (const { path, type } of resourcePages) {
        const params = matchPath({ path, caseSensitive: true }, `/${relative}`)?.params;
        if (
            params?.slug &&
            resourceSegment.test(params.slug) &&
            (!params.author || resourceSegment.test(params.author))
        ) {
            return { id: `${params.author ?? officialMarketAuthor}/${params.slug}`, type };
        }
    }
    return null;
}

export function findMarketResource(resources: CatalogueResource[] | undefined, route: MarketResourceRoute) {
    return route.id
        ? resources?.find(
              (resource) =>
                  (!route.type || resource.type === route.type) &&
                  (resource.id === route.id || resource.resourceId === route.id),
          )
        : undefined;
}

export function marketResourcePath(resource: Pick<CatalogueResource, 'author' | 'slug' | 'type'>): string {
    const author = resource.author.id === officialMarketAuthor ? '' : `${resource.author.id}/`;
    return `/market/${resource.type}s/${author}${resource.slug}`;
}

export function marketResourceRedirect(pathname: string, canonical: string, search: string): string | null {
    if (pathname === canonical) {
        return null;
    }
    if (pathname.replace(/\/+$/, '').endsWith(`/${legacyResourcePath}`)) {
        const query = new URLSearchParams(search);
        query.delete('resource');
        query.delete('id');
        search = query.size ? `?${query}` : '';
    }
    return canonical + search;
}

export const accountTabs = ['purchases', 'orders', 'site', 'profile'] as const;
export const creatorTabs = ['resources', 'payments', 'sales'] as const;
export const moderationTabs = ['reviews', 'resources'] as const;

export type PrivatePage =
    | 'account'
    | 'creator'
    | 'moderation'
    | 'admin/users'
    | 'admin/statistics'
    | 'admin/announcements'
    | 'checkout/success';

interface ProtectedPage {
    path: string;
    page: PrivatePage;
    role: Role | null;
    tabs?: readonly string[];
}

export const protectedPages: ProtectedPage[] = [
    { path: 'creator/resources/:resourceId', page: 'creator', role: 'creator' },
    { path: 'moderation/reviews/:reviewId', page: 'moderation', role: 'moderator' },
    { path: 'admin/announcements/:announcementId', page: 'admin/announcements', role: 'admin' },
    { path: 'account/:tab?', page: 'account', role: null, tabs: accountTabs },
    { path: 'creator/:tab?', page: 'creator', role: 'creator', tabs: creatorTabs },
    { path: 'moderation/:tab?', page: 'moderation', role: 'moderator', tabs: moderationTabs },
    { path: 'admin/users', page: 'admin/users', role: 'admin' },
    { path: 'admin/statistics', page: 'admin/statistics', role: 'admin' },
    { path: 'admin/announcements', page: 'admin/announcements', role: 'admin' },
    { path: 'checkout/success', page: 'checkout/success', role: null },
];

export function matchProtectedPage(relative: string): ProtectedPage | null {
    for (const page of protectedPages) {
        const match = matchPath(page.path, `/${relative}`);
        if (match && (!page.tabs || !match.params.tab || page.tabs.includes(match.params.tab))) {
            return page;
        }
    }
    return null;
}
