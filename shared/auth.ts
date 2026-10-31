export type Role = 'creator' | 'moderator' | 'admin';

const roleLevels: Record<Role, number> = { creator: 1, moderator: 2, admin: 3 };

export function hasRole(user: Pick<User, 'role'> | null | undefined, required: Role): boolean {
    return Boolean(user?.role && roleLevels[user.role] >= roleLevels[required]);
}

export interface OAuthProvider {
    id: 'github';
    name: string;
}

export interface SessionData {
    user: User | null;
    csrfToken: string | null;
    oauthProviders: OAuthProvider[];
    turnstileSiteKey: string | null;
}

export interface User {
    id: string;
    email: string;
    username: string;
    role: Role | null;
    emailVerified: boolean;
    banned: boolean;
    twoFactorEnabled: boolean;
    hasPassword: boolean;
    githubLinked: boolean;
}

export interface Session {
    id: string;
    userId: string;
    csrfToken: string;
    expiresAt: number;
    remember: boolean;
}
