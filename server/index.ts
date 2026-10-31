import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv, Env } from './types';
import { authMiddleware } from './middleware/authentication';
import { responseHeaders } from './middleware/headers';
import { cleanupExpiredRecords } from './jobs/cleanup';
import { cleanupArchives } from './services/resources/archives';
import { expireBannedCheckouts } from './services/commerce/checkout';
import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import twoFactorRoutes from './routes/two-factor';
import resourceRoutes from './routes/resources';
import commerceRoutes from './routes/commerce';
import marketRoutes from './routes/market';
import announcementRoutes from './routes/announcements';
import { assetPath, renderPage, robots, sitemap } from './rendering';

export const app = new Hono<AppEnv>();

app.use('/api/*', responseHeaders);
app.use('/api/*', authMiddleware);
app.route('/api', authRoutes);
app.route('/api', accountRoutes);
app.route('/api', twoFactorRoutes);
app.route('/api', resourceRoutes);
app.route('/api', commerceRoutes);
app.route('/api', marketRoutes);
app.route('/api', announcementRoutes);

app.get('/robots.txt', (c) => robots(c.env));
app.get('/sitemap.xml', (c) => sitemap(c.env));
app.get('*', (c) => {
    const url = new URL(c.req.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        return c.notFound();
    }
    if (url.pathname !== '/index.html' && assetPath(url.pathname)) {
        return c.env.ASSETS.fetch(
            new Request(new URL(`${url.pathname}${url.search}`, c.env.APP_ORIGIN), {
                method: c.req.method,
                headers: { Accept: c.req.header('Accept') ?? '*/*', 'Accept-Encoding': 'identity' },
            }),
        );
    }
    return renderPage(c);
});

app.notFound((c) => c.json({ error: { code: 'not_found' } }, 404));
app.onError((error, c) => {
    if (error instanceof HTTPException) {
        const response = error.getResponse();
        if (response.headers.get('Content-Type')?.includes('application/json')) {
            return response;
        }
        return c.json(
            { error: { code: /^[a-z][a-z0-9_]+$/.test(error.message) ? error.message : 'request_failed' } },
            error.status,
        );
    }
    return c.json({ error: { code: 'service_unavailable' } }, 503);
});

export default {
    fetch: app.fetch,
    async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(cleanupArchives(env));
        ctx.waitUntil(expireBannedCheckouts(env));
        ctx.waitUntil(cleanupExpiredRecords(env));
    },
};
