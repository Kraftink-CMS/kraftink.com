import type { Role } from './auth';

export const protectedPages = {
    'account': null,
    'creator': 'creator',
    'moderation': 'moderator',
    'admin/users': 'admin',
    'admin/statistics': 'admin',
    'admin/announcements': 'admin',
    'checkout/success': null,
} as const satisfies Record<string, Role | null>;
