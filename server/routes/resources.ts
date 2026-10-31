import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { hasRole } from '../../shared/auth';
import type { AppEnv } from '../types';
import type { ResourceRow } from '../models/resources';
import { audit, requireRole, requireSensitive } from '../security/authorization';
import { fail as error, jsonBody, requestBody } from '../http';
import { rateLimit } from '../security/abuse';
import { effectiveUploadLimit } from '../upload-limits';
import {
    findOwnedResource,
    listCreatorResources,
    resourceDetails,
    cancelResourceVersion,
    submitArchive,
    reviewResourceVersion,
    ensureStorageAvailable,
    type ResourceEffects,
} from '../services/resources/publication';
import {
    listResourceReviews,
    resourceReview,
    listModeratedResources,
    reviewArchive,
    reviewImage,
    withdrawResource,
} from '../services/resources/moderation';

const routes = new Hono<AppEnv>();

function listing(c: Context<AppEnv>): { time: number | null; id: string; query: string } {
    const before = c.req.query('before');
    const query = (c.req.query('q') ?? '').trim();
    if (query.length > 100 || /[\u0000-\u001f\u007f]/.test(query)) {
        error(400, 'invalid_input');
    }
    if (!before) {
        return { time: null, id: '', query };
    }
    const match = /^(\d{1,11})\.([0-9a-f-]{36})$/i.exec(before);
    if (!match || !z.string().uuid().safeParse(match[2]).success) {
        error(400, 'invalid_cursor');
    }
    return { time: Number(match[1]), id: match[2], query };
}

function creator(c: Context<AppEnv>) {
    const user = requireRole(c, 'creator');
    if (!user.emailVerified) {
        error(403, 'email_verification_required');
    }
    return user;
}

function effects(c: Context<AppEnv>): ResourceEffects {
    return {
        audit: (action, target, details) => audit(c, action, target, details),
        defer: (task) => c.executionCtx.waitUntil(task),
    };
}

async function ownedResource(c: Context<AppEnv>): Promise<ResourceRow> {
    return findOwnedResource(c.env, creator(c).id, c.req.param('id')!);
}

async function upload(c: Context<AppEnv>, existing?: ResourceRow): Promise<Response> {
    const user = creator(c);
    await rateLimit(c, 'resource.upload', 10, 3600, user.id);
    if (existing && !['draft', 'published'].includes(existing.status)) error(409, 'resource_unavailable');
    const uploadLimit = await effectiveUploadLimit(c.env, user.id);
    const contentType = c.req.header('Content-Type') ?? '';
    if (contentType.split(';', 1)[0].trim().toLowerCase() !== 'application/zip' || new URL(c.req.url).search)
        error(400, 'invalid_upload');
    const length = c.req.header('Content-Length');
    if (length && (!/^\d+$/.test(length) || Number(length) > uploadLimit)) error(413, 'archive_size');
    const price = c.req.header('X-Resource-Price');
    if (
        typeof price !== 'string' ||
        !/^\d{1,7}$/.test(price) ||
        !z.number().int().min(50).max(1000000).safeParse(Number(price)).success
    )
        error(400, 'invalid_resource');
    const readArchive = async () => {
        await ensureStorageAvailable(c.env, length ? Number(length) : 1);
        const bytes = await requestBody(c, uploadLimit);
        if (bytes.byteLength === 0) error(413, 'archive_size');
        return bytes;
    };
    const result = await submitArchive(c.env, user.id, readArchive, Number(price), existing, effects(c), () =>
        rateLimit(c, 'resource.create', 20, 86400, user.id),
    );
    return c.json(result.data, result.status);
}

routes.get('/creator/resources', async (c) => c.json(await listCreatorResources(c.env, creator(c).id)));
routes.post('/creator/resources', (c) => upload(c));
routes.get('/creator/resources/:id', async (c) => c.json(await resourceDetails(c.env, await ownedResource(c))));
routes.patch('/creator/resources/:id', async (c) => {
    await ownedResource(c);
    return error(409, 'resource_review_required');
});
routes.post('/creator/resources/:id/versions', async (c) => upload(c, await ownedResource(c)));
routes.delete('/creator/resources/:id/versions/:versionId', async (c) =>
    c.json(await cancelResourceVersion(c.env, await ownedResource(c), c.req.param('versionId'), effects(c))),
);
routes.get('/moderation/reviews', async (c) => {
    requireRole(c, 'moderator');
    return c.json(await listResourceReviews(c.env, listing(c)));
});
routes.get('/moderation/reviews/:id', async (c) => {
    requireRole(c, 'moderator');
    return c.json(await resourceReview(c.env, c.req.param('id')));
});
routes.get('/moderation/resources', async (c) => {
    requireRole(c, 'moderator');
    return c.json(await listModeratedResources(c.env, listing(c)));
});
routes.get('/moderation/versions/:id/archive', async (c) => {
    requireRole(c, 'moderator');
    return reviewArchive(c.env, c.req.param('id'), effects(c));
});
routes.get('/moderation/versions/:id/image', async (c) => {
    requireRole(c, 'moderator');
    return reviewImage(c.env, c.req.param('id'));
});
routes.patch('/moderation/reviews/:id', async (c) => {
    const user = requireRole(c, 'moderator');
    await requireSensitive(c, 'moderation.review');
    const parsed = z
        .object({ action: z.enum(['approve', 'reject']), reason: z.string().trim().min(3).max(2000) })
        .safeParse(await jsonBody(c));
    if (!parsed.success) error(400, 'review_reason_required');
    return c.json(await reviewResourceVersion(c.env, user.id, c.req.param('id'), parsed.data, effects(c)));
});
routes.delete('/moderation/resources/:id', async (c) => {
    const user = requireRole(c, 'moderator');
    const parsed = z
        .object({ force: z.boolean().default(false), reason: z.string().trim().min(3).max(1000) })
        .safeParse(await jsonBody(c));
    if (!parsed.success) error(400, 'review_reason_required');
    if (parsed.data.force) {
        if (!hasRole(user, 'admin')) error(403, 'admin_required');
        await requireSensitive(c, 'admin.resource-revoke');
    }
    return c.json(await withdrawResource(c.env, user.id, c.req.param('id'), parsed.data, effects(c)));
});

export default routes;
