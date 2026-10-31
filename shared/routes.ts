import type { Role } from './auth';
import { matchPath } from 'react-router-dom';

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
