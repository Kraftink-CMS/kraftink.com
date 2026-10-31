import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { effectiveUploadLimit } from '../upload-limits';
import { fail, jsonBody, requestIp } from '../http';
import { rateLimit } from '../security/abuse';
import {
    cachedMetadata,
    CatalogueCapacityError,
    mergedCatalogue,
    refreshPublicCatalogue,
    serializeCmsCatalogue,
    signedRevocations,
} from '../services/market/catalogue';
import { resourceImage, resolveSiteLicense, downloadResource } from '../services/market/delivery';
import { availableOAuthProviders } from '../services/identity/authentication';
import { constantTimeEqual } from '../security/crypto';

const routes = new Hono<AppEnv>();

routes.post('/internal/market/refresh', async (c) => {
    const secret = c.env.KRAFTINK_SITE_CACHE_SECRET;
    if (!secret) {
        fail(503, 'cache_refresh_unavailable');
    }
    const authorization = c.req.header('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || !constantTimeEqual(authorization.slice(7), secret)) {
        fail(401, 'authentication_required');
    }
    const body = await jsonBody(c, 256);
    if (Object.keys(body).length !== 1 || typeof body.commit !== 'string' || !/^[a-f0-9]{40}$/.test(body.commit)) {
        fail(422, 'invalid_commit');
    }
    await refreshPublicCatalogue(c.env, body.commit);
    return c.json({ ok: true, commit: body.commit });
});

routes.get('/config', async (c) =>
    c.json({
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY ?? null,
        oauthProviders: availableOAuthProviders(c.env),
        maxUploadBytes: await effectiveUploadLimit(c.env, c.get('user')?.id),
    }),
);

routes.get('/market/catalogue', async (c) => {
    await rateLimit(c, 'market.catalogue', 120, 60);
    const license = await resolveSiteLicense(c.env, c.req.header('Authorization'), requestIp(c));
    const catalogue = await mergedCatalogue(c.env, license.userId, true);
    c.header('Cache-Control', 'private, no-store');
    c.header('CDN-Cache-Control', 'no-store');
    c.header('Vary', 'Authorization, Cookie');
    try {
        const json = serializeCmsCatalogue(
            catalogue.resources,
            {
                scope: license.userId ? 'private' : 'public',
                ...(license.invalid ? { code: 'site_access_invalid' } : {}),
            },
            c.env.APP_ORIGIN,
        );
        return c.body(json, 200, { 'Content-Type': 'application/json; charset=UTF-8' });
    } catch (error) {
        if (error instanceof CatalogueCapacityError) {
            return c.json({ error: { code: 'catalogue_capacity' } }, 503);
        }
        throw error;
    }
});

routes.get('/catalogue', async (c) => {
    await rateLimit(c, 'market.browse', 120, 60);
    const catalogue = await mergedCatalogue(c.env, c.get('user')?.id ?? null);
    return c.json({ schema_version: 1, ...catalogue });
});

routes.get('/market/resources/:id/images/:versionId', async (c) => {
    await rateLimit(c, 'market.image', 120, 60);
    return resourceImage(c.env, c.req.param('id'), c.req.param('versionId'));
});

routes.get('/metadata', async (c) => {
    await rateLimit(c, 'market.metadata', 60, 60);
    const key = c.req.query('source');
    if (key !== 'releases' && key !== 'catalogue') {
        fail(400, 'invalid_metadata_source');
    }
    const metadata = await cachedMetadata(c.env, key);
    return c.json({ data: metadata.data, state: metadata.state });
});

routes.get('/market/resources/:author/:slug/versions/:version/download', async (c) => {
    await rateLimit(c, 'market.download', 30, 60);
    const license = await resolveSiteLicense(c.env, c.req.header('Authorization'), requestIp(c));
    if (!license.userId) {
        fail(403, 'site_access_invalid');
    }
    return downloadResource(c.env, license.userId, c.req.param('author'), c.req.param('slug'), c.req.param('version'));
});

routes.get('/market/revocations', async (c) => {
    await rateLimit(c, 'market.revocations', 120, 60);
    try {
        const feed = await signedRevocations(c.env);
        c.header('Cache-Control', 'no-store');
        return c.json(feed);
    } catch {
        fail(503, 'revocation_signing_unavailable');
    }
});

export default routes;
