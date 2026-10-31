import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AppEnv, Session } from '../types';
import { fail, requestLocale, sessionCookieName, type AppContext } from '../http';
import { localeCookieName, selectLocale } from '../../shared/locales';
import type { SessionData } from '../../shared/auth';
import { availableOAuthProviders } from '../services/identity/authentication';
import { now } from '../lib/time';
import { constantTimeEqual, sha256 } from '../security/crypto';
import { findSession, loadUser } from '../services/identity/sessions';
import { database } from '../database';
import { users } from '../models';
import { eq } from 'drizzle-orm';

export async function resolveSession(c: AppContext): Promise<void> {
    if (c.env.ENVIRONMENT === 'production' && new URL(c.env.APP_ORIGIN).protocol !== 'https:') {
        fail(503, 'secure_origin_required');
    }
    c.set('user', null);
    c.set('session', null);
    const token = getCookie(c, sessionCookieName(c));
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
        const session = await findSession(c.env, await sha256(token), now());
        if (session) {
            const user = await loadUser(c.env, session.user_id);
            const factor = user?.twoFactorEnabled
                ? await database(c.env.DB)
                      .select({ revision: users.two_factor_revision })
                      .from(users)
                      .where(eq(users.id, user.id))
                      .get()
                : null;
            if (
                user &&
                !user.banned &&
                (!user.twoFactorEnabled || (factor?.revision && factor.revision === session.two_factor_revision))
            ) {
                c.set('user', user);
                c.set('session', {
                    id: session.id,
                    userId: session.user_id,
                    csrfToken: session.csrf_token,
                    expiresAt: session.expires_at,
                    remember: Boolean(session.remember),
                } as Session);
            }
        }
    }
}

export function sessionData(c: AppContext): SessionData {
    return {
        user: c.get('user'),
        csrfToken: c.get('session')?.csrfToken ?? null,
        oauthProviders: availableOAuthProviders(c.env),
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY ?? null,
        preferredLocale: selectLocale([c.get('user')?.locale, getCookie(c, localeCookieName), requestLocale(c)]),
    };
}

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
    await resolveSession(c);
    if (
        !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) &&
        !['/api/stripe/webhook', '/api/internal/market/refresh'].includes(c.req.path)
    ) {
        const origin = c.req.header('Origin');
        if (origin !== new URL(c.env.APP_ORIGIN).origin || c.req.header('Sec-Fetch-Site') === 'cross-site') {
            fail(403, 'origin_invalid');
        }
        const session = c.get('session');
        if (session && !constantTimeEqual(c.req.header('X-CSRF-Token') ?? '', session.csrfToken)) {
            fail(403, 'csrf_invalid');
        }
    }
    c.header('Cache-Control', 'no-store');
    await next();
};
