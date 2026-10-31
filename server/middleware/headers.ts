import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

export const responseHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
    if (c.env.ENVIRONMENT === 'production' && new URL(c.env.APP_ORIGIN).protocol !== 'https:') {
        return c.json({ error: { code: 'configuration_invalid' } }, 503);
    }
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
    c.header('Cache-Control', 'private, no-store');
    c.header('CDN-Cache-Control', 'no-store');
    await next();
};
