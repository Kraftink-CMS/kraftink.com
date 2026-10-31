import type { Env } from '../../types';
import { eq } from 'drizzle-orm';
import { database } from '../../database';
import { resources, resourceVersions, type ResourceVersionRow } from '../../models/resources';
import { fail as error } from '../../http';
import { now } from '../../lib/time';
import { fromBase64Url } from '../../security/crypto';
import { cleanupArchives } from './archives';
import type { ResourceEffects } from './publication';
import { resourceStorage } from './storage';

export interface ReviewListing {
    time: number | null;
    id: string;
    query: string;
}
export async function listResourceReviews(env: Env, cursor: ReviewListing) {
    const reviews = await env.DB.prepare(
        `SELECT v.*, r.slug, r.type, r.name AS current_name, r.author_id,
            u.username AS author_name FROM resource_versions v JOIN resources r ON r.id = v.resource_id
            JOIN users u ON u.id = r.author_id WHERE v.status = 'pending'
            AND (? IS NULL OR v.created_at < ? OR (v.created_at = ? AND v.id < ?))
            AND (? = '' OR instr(lower(json_extract(v.payload_json, '$.name') || ' ' || r.slug || ' ' || u.username), lower(?)) > 0)
            ORDER BY v.created_at DESC, v.id DESC LIMIT 51`,
    )
        .bind(cursor.time, cursor.time, cursor.time, cursor.id, cursor.query, cursor.query)
        .all<{ id: string; created_at: number }>();
    const items = reviews.results.slice(0, 50);
    const last = items.at(-1);
    return {
        reviews: items,
        nextCursor: reviews.results.length > 50 && last ? `${last.created_at}.${last.id}` : null,
    };
}
export async function listModeratedResources(env: Env, cursor: ReviewListing) {
    const resources = await env.DB.prepare(
        `SELECT r.*, u.username AS author_name, v.version AS published_version
            FROM resources r JOIN users u ON u.id = r.author_id LEFT JOIN resource_versions v ON v.id = r.approved_version_id
            WHERE (? IS NULL OR r.updated_at < ? OR (r.updated_at = ? AND r.id < ?))
            AND (? = '' OR instr(lower(r.name || ' ' || r.slug || ' ' || u.username), lower(?)) > 0)
            ORDER BY r.updated_at DESC, r.id DESC LIMIT 51`,
    )
        .bind(cursor.time, cursor.time, cursor.time, cursor.id, cursor.query, cursor.query)
        .all<{ id: string; updated_at: number }>();
    const items = resources.results.slice(0, 50);
    const last = items.at(-1);
    return {
        resources: items,
        nextCursor: resources.results.length > 50 && last ? `${last.updated_at}.${last.id}` : null,
    };
}
export async function reviewArchive(env: Env, id: string, effects: ResourceEffects) {
    const version = await env.DB.prepare(
        'SELECT v.*, r.slug FROM resource_versions v JOIN resources r ON r.id = v.resource_id WHERE v.id = ?',
    )
        .bind(id)
        .first<ResourceVersionRow & { slug: string }>();
    if (!version?.archive_key) {
        error(404, 'archive_unavailable');
    }
    const object = await resourceStorage(env).get(version.archive_key);
    if (!object) {
        error(404, 'archive_unavailable');
    }
    await effects.audit('moderation.archive_downloaded', version.resource_id, { versionId: version.id });
    return new Response(object.body, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${version.slug}-${version.version}.zip"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
export async function reviewImage(env: Env, id: string) {
    const version = await database(env.DB)
        .select({ image_key: resourceVersions.image_key, image_mime: resourceVersions.image_mime })
        .from(resourceVersions)
        .where(eq(resourceVersions.id, id))
        .get();
    if (!version?.image_key || !['image/png', 'image/jpeg', 'image/webp'].includes(version.image_mime ?? '')) {
        error(404, 'image_unavailable');
    }
    const image = await resourceStorage(env).get(version.image_key);
    if (!image) {
        error(404, 'image_unavailable');
    }
    return new Response(image.body, {
        headers: {
            'Content-Type': version.image_mime!,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'",
        },
    });
}
export async function withdrawResource(
    env: Env,
    actorId: string,
    id: string,
    input: { force: boolean; reason: string },
    effects: ResourceEffects,
) {
    if (input.force) {
        if (!env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY) {
            error(503, 'revocation_signing_unavailable');
        }
        try {
            await crypto.subtle.importKey(
                'pkcs8',
                new Uint8Array(fromBase64Url(env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY)),
                { name: 'Ed25519' },
                false,
                ['sign'],
            );
        } catch {
            error(503, 'revocation_signing_unavailable');
        }
    }
    const resource = await database(env.DB).select().from(resources).where(eq(resources.id, id)).get();
    if (!resource) {
        error(404, 'resource_not_found');
    }
    const time = now();
    const status = input.force ? 'revoked' : 'withdrawn';
    const statements = [
        env.DB.prepare(
            "UPDATE resources SET status = ?, deleted_at = ?, updated_at = ? WHERE id = ? AND status != 'revoked'",
        ).bind(status, time, time, resource.id),
        env.DB.prepare(
            `INSERT OR IGNORE INTO archive_cleanup (archive_key, created_at)
                SELECT archive_key, ? FROM resource_versions WHERE resource_id = ? AND status = 'pending' AND archive_key IS NOT NULL`,
        ).bind(time, resource.id),
        env.DB.prepare(
            "UPDATE resource_versions SET status = 'cancelled', reviewer_id = ?, review_note = ?, reviewed_at = ? WHERE resource_id = ? AND status = 'pending'",
        ).bind(actorId, input.reason, time, resource.id),
    ];
    if (input.force) {
        statements.push(
            env.DB.prepare(
                `INSERT OR IGNORE INTO market_revocations (resource_id, slug, type, versions_json, reason, created_at)
                VALUES (?, ?, ?, '["*"]', ?, ?)`,
            ).bind(resource.id, resource.slug, resource.type, input.reason, time),
        );
        statements.push(env.DB.prepare('UPDATE market_state SET sequence = sequence + 1 WHERE id = 1'));
        statements.push(
            env.DB.prepare(
                `INSERT OR IGNORE INTO archive_cleanup (archive_key, created_at)
                SELECT archive_key, ? FROM resource_versions WHERE resource_id = ? AND archive_key IS NOT NULL`,
            ).bind(time, resource.id),
        );
        statements.push(
            env.DB.prepare(
                "UPDATE resource_versions SET status = 'superseded' WHERE resource_id = ? AND status = 'approved'",
            ).bind(resource.id),
        );
    }
    await env.DB.batch(statements);
    await effects.audit(input.force ? 'resource.security_revoked' : 'resource.withdrawn', resource.id, {
        reason: input.reason,
    });
    effects.defer(cleanupArchives(env));
    return { ok: true, status };
}
