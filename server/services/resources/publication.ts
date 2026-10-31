import type { Env } from '../../types';
import { and, desc, eq } from 'drizzle-orm';
import { database } from '../../database';
import { resources, resourceVersions, type ResourceRow } from '../../models/resources';
import { fail as error } from '../../http';
import { now } from '../../lib/time';
import { sha256 } from '../../security/crypto';
import { ArchiveError, inspectArchive, isNewerVersion, type LocalizedText } from '../../../shared/packages/zip';
import { loadPublicCatalogue } from '../market/catalogue';
import { defaultUploadLimit, effectiveUploadLimit } from '../../upload-limits';
import { cleanupArchives } from './archives';
import { resourceStorage } from './storage';
import { requireSellerReady } from '../commerce/sellers';

export interface ResourceEffects {
    audit(action: string, target: string, details?: Record<string, unknown>): Promise<void>;
    defer(task: Promise<unknown>): void;
}

function fallbackText(value: LocalizedText): string {
    return typeof value === 'string' ? value : value.en || Object.values(value).find(Boolean) || '';
}

async function isAdministrator(env: Env, actorId: string): Promise<boolean> {
    return Boolean(
        await env.DB.prepare(
            "SELECT id FROM users WHERE id = ? AND role = 'admin' AND banned_at IS NULL AND email_verified_at IS NOT NULL",
        )
            .bind(actorId)
            .first(),
    );
}

function limit(value: string | undefined, fallback: number, maximum: number): number {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function storageLimit(env: Env): number {
    return limit(env.MAX_TOTAL_STORAGE_BYTES, 8 * 1024 * 1024 * 1024, 8 * 1024 * 1024 * 1024);
}

export async function ensureStorageAvailable(env: Env, sizeBytes = 1): Promise<void> {
    const usage = await env.DB.prepare(
        "SELECT COALESCE(SUM(size_bytes), 0) AS size_bytes FROM upload_reservations WHERE status != 'released'",
    ).first<{ size_bytes: number }>();
    if (!usage || usage.size_bytes + Math.max(1, sizeBytes) > storageLimit(env)) {
        error(503, 'storage_full');
    }
}

export async function findOwnedResource(env: Env, actorId: string, id: string) {
    const resource = await database(env.DB).select().from(resources).where(eq(resources.id, id)).get();
    if (!resource || resource.author_id !== actorId) {
        error(404, 'resource_not_found');
    }
    return resource;
}
export async function listCreatorResources(env: Env, actorId: string) {
    const resources = await env.DB.prepare(
        `SELECT r.*, v.version AS published_version,
            (SELECT COUNT(*) FROM resource_versions p WHERE p.resource_id = r.id AND p.status = 'pending') AS pending_count
            FROM resources r LEFT JOIN resource_versions v ON v.id = r.approved_version_id
            WHERE r.author_id = ? ORDER BY r.created_at DESC LIMIT 200`,
    )
        .bind(actorId)
        .all();
    return { resources: resources.results };
}
export async function resourceDetails(env: Env, resource: ResourceRow) {
    const versions = await database(env.DB)
        .select()
        .from(resourceVersions)
        .where(eq(resourceVersions.resource_id, resource.id))
        .orderBy(desc(resourceVersions.created_at))
        .limit(100)
        .all();
    return { resource, versions };
}
export async function cancelResourceVersion(
    env: Env,
    resource: ResourceRow,
    versionId: string,
    effects: ResourceEffects,
) {
    const version = await database(env.DB)
        .select()
        .from(resourceVersions)
        .where(and(eq(resourceVersions.id, versionId), eq(resourceVersions.resource_id, resource.id)))
        .get();
    if (!version) {
        error(404, 'version_not_found');
    }
    const time = now();
    const result = await env.DB.batch([
        env.DB.prepare(
            `INSERT OR IGNORE INTO archive_cleanup (archive_key, image_key, created_at)
                SELECT archive_key, image_key, ? FROM resource_versions
                WHERE id = ? AND resource_id = ? AND status = 'pending' AND archive_key IS NOT NULL`,
        ).bind(time, version.id, resource.id),
        env.DB.prepare(
            "UPDATE resource_versions SET status = 'cancelled', reviewed_at = ? WHERE id = ? AND resource_id = ? AND status = 'pending'",
        ).bind(time, version.id, resource.id),
    ]);
    if (!result[1].meta.changes) {
        error(409, 'version_review_closed');
    }
    effects.defer(cleanupArchives(env));
    await effects.audit('resource.version_cancelled', resource.id, { versionId: version.id });
    return { ok: true };
}
export async function reviewResourceVersion(
    env: Env,
    actorId: string,
    id: string,
    input: { action: 'approve' | 'reject'; reason: string },
    effects: ResourceEffects,
) {
    const version = await database(env.DB).select().from(resourceVersions).where(eq(resourceVersions.id, id)).get();
    if (!version || version.status !== 'pending') {
        error(409, 'version_review_closed');
    }
    const resource = await database(env.DB).select().from(resources).where(eq(resources.id, version.resource_id)).get();
    if (!resource || !['draft', 'published'].includes(resource.status)) {
        error(409, 'resource_unavailable');
    }
    if (resource.author_id === actorId && !(await isAdministrator(env, actorId))) {
        error(403, 'review_self_forbidden');
    }
    const operation = crypto.randomUUID();
    const time = now();
    const claim = env.DB.prepare(
        `UPDATE resource_versions SET status = ?, reviewer_id = ?, review_note = ?, review_token = ?, reviewed_at = ?
            WHERE id = ? AND status = 'pending' AND EXISTS (
                SELECT 1 FROM resources r JOIN users u ON u.id = ? WHERE r.id = resource_versions.resource_id
                AND r.status IN ('draft', 'published') AND r.approved_version_id IS ?
                AND u.banned_at IS NULL AND u.email_verified_at IS NOT NULL
                AND (u.role = 'admin' OR (u.role = 'moderator' AND r.author_id != u.id))
            )`,
    ).bind(
        input.action === 'approve' ? 'approved' : 'rejected',
        actorId,
        input.reason,
        operation,
        time,
        version.id,
        actorId,
        resource.approved_version_id,
    );
    const statements = [claim];
    if (input.action === 'approve') {
        if (!version.archive_key || !(await resourceStorage(env).head(version.archive_key))) {
            error(409, 'archive_unavailable');
        }
        const payload = JSON.parse(version.payload_json) as {
            name: LocalizedText;
            description: LocalizedText;
            priceCents: number;
            currency: string;
        };
        if (resource.approved_version_id) {
            statements.push(
                env.DB.prepare(
                    `INSERT OR IGNORE INTO archive_cleanup (archive_key, created_at)
                    SELECT archive_key, ? FROM resource_versions WHERE id = ? AND archive_key IS NOT NULL
                    AND EXISTS (SELECT 1 FROM resource_versions WHERE id = ? AND review_token = ?)`,
                ).bind(time, resource.approved_version_id, version.id, operation),
            );
            statements.push(
                env.DB.prepare(
                    `UPDATE resource_versions SET status = 'superseded' WHERE id = ?
                    AND EXISTS (SELECT 1 FROM resource_versions WHERE id = ? AND review_token = ?)`,
                ).bind(resource.approved_version_id, version.id, operation),
            );
        }
        statements.push(
            env.DB.prepare(
                `UPDATE resources SET status = 'published', approved_version_id = ?, name = ?, description = ?, metadata_json = ?,
                price_cents = ?, currency = ?, updated_at = ? WHERE id = ? AND status IN ('draft', 'published')
                AND EXISTS (SELECT 1 FROM resource_versions WHERE id = ? AND review_token = ?)`,
            ).bind(
                version.id,
                fallbackText(payload.name),
                fallbackText(payload.description),
                JSON.stringify({ name: payload.name, description: payload.description }),
                payload.priceCents,
                payload.currency,
                time,
                resource.id,
                version.id,
                operation,
            ),
        );
    } else if (version.archive_key) {
        statements.push(
            env.DB.prepare(
                `INSERT OR IGNORE INTO archive_cleanup (archive_key, created_at)
                SELECT ?, ? WHERE EXISTS (SELECT 1 FROM resource_versions WHERE id = ? AND review_token = ?)`,
            ).bind(version.archive_key, time, version.id, operation),
        );
    }
    const result = await env.DB.batch(statements);
    if (!result[0].meta.changes) {
        error(409, 'version_review_closed');
    }
    await effects.audit(`resource.version_${input.action === 'approve' ? 'approved' : 'rejected'}`, resource.id, {
        versionId: version.id,
        reason: input.reason,
    });
    effects.defer(cleanupArchives(env));
    return { ok: true };
}

async function approveAdministratorSubmission(env: Env, actorId: string, id: string, effects: ResourceEffects) {
    if (!(await isAdministrator(env, actorId))) {
        return 'pending' as const;
    }
    await reviewResourceVersion(env, actorId, id, { action: 'approve', reason: 'Administrator publication' }, effects);
    return 'approved' as const;
}

export async function submitArchive(
    env: Env,
    actorId: string,
    readArchive: () => Promise<Uint8Array<ArrayBuffer>>,
    priceCents: number,
    existing: ResourceRow | undefined,
    effects: ResourceEffects,
    limitCreation: () => Promise<void>,
) {
    await requireSellerReady(env, actorId);
    const bytes = await readArchive();
    let inspection: ReturnType<typeof inspectArchive>;
    try {
        inspection = inspectArchive(bytes, existing ? { slug: existing.slug, type: existing.type } : undefined);
    } catch (cause) {
        if (cause instanceof ArchiveError) {
            error(400, cause.code);
        }
        throw cause;
    }
    const { manifest, metadata, image } = inspection;
    const digest = await sha256(bytes);
    const payload = {
        name: metadata.name,
        description: metadata.description,
        priceCents: priceCents,
        currency: 'EUR',
    };
    const time = now();
    const totalSize = bytes.byteLength + (image?.bytes.byteLength ?? 0);
    const accountLimit = limit(env.MAX_ACCOUNT_STORAGE_BYTES, 250 * 1024 * 1024, 5 * 1024 * 1024 * 1024);
    const globalLimit = storageLimit(env);
    let resource = existing;
    if (!resource) {
        const catalogue = await loadPublicCatalogue(env);
        if (catalogue.state === 'unavailable') {
            error(503, 'public_catalogue_unavailable');
        }
        if (catalogue.resources.some((entry) => entry.slug === manifest.id)) {
            error(409, 'resource_slug_conflict');
        }
        resource = await database(env.DB).select().from(resources).where(eq(resources.slug, manifest.id)).get();
        if (!resource) {
            await limitCreation();
            await env.DB.prepare(
                `INSERT OR IGNORE INTO resources (id, author_id, slug, type, name, description, metadata_json, price_cents, currency, created_at, updated_at)
                SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'EUR', ?, ?
                WHERE (SELECT COUNT(*) FROM resources WHERE author_id = ?) < 100
                AND COALESCE((SELECT SUM(size_bytes) FROM upload_reservations WHERE user_id = ? AND status != 'released'), 0) + ? <= ?
                AND COALESCE((SELECT SUM(size_bytes) FROM upload_reservations WHERE status != 'released'), 0) + ? <= ?`,
            )
                .bind(
                    crypto.randomUUID(),
                    actorId,
                    manifest.id,
                    manifest.type,
                    fallbackText(metadata.name),
                    fallbackText(metadata.description),
                    JSON.stringify(metadata),
                    priceCents,
                    time,
                    time,
                    actorId,
                    actorId,
                    totalSize,
                    accountLimit,
                    totalSize,
                    globalLimit,
                )
                .run();
            resource = await database(env.DB).select().from(resources).where(eq(resources.slug, manifest.id)).get();
            if (!resource) {
                await ensureStorageAvailable(env, totalSize);
                error(429, 'storage_quota_or_upload_pending');
            }
        }
        if (resource.author_id !== actorId || resource.type !== manifest.type) {
            error(409, 'resource_slug_conflict');
        }
    }
    if (!['draft', 'published'].includes(resource.status)) {
        error(409, 'resource_unavailable');
    }
    const repeated = await database(env.DB)
        .select()
        .from(resourceVersions)
        .where(and(eq(resourceVersions.resource_id, resource.id), eq(resourceVersions.version, manifest.version)))
        .get();
    if (repeated) {
        if (
            repeated.sha256 === digest &&
            repeated.payload_json === JSON.stringify(payload) &&
            ['pending', 'approved', 'superseded'].includes(repeated.status)
        ) {
            const status =
                repeated.status === 'pending'
                    ? await approveAdministratorSubmission(env, actorId, repeated.id, effects)
                    : repeated.status;
            return {
                data: {
                    resource: { id: resource.id },
                    version: {
                        id: repeated.id,
                        version: repeated.version,
                        status,
                        sha256: digest,
                        sizeBytes: repeated.size_bytes,
                    },
                },
                status: 200 as const,
            };
        }
        error(409, 'version_already_submitted');
    }
    const previous = resource.approved_version_id
        ? await database(env.DB)
              .select({ version: resourceVersions.version })
              .from(resourceVersions)
              .where(eq(resourceVersions.id, resource.approved_version_id))
              .get()
        : null;
    if (!isNewerVersion(manifest.version, previous?.version)) {
        error(400, 'version_must_increase');
    }
    const id = crypto.randomUUID();
    const archiveKey = `resources/${resource.id}/${id}.zip`;
    const imageKey = image
        ? `resources/${resource.id}/${id}.${image.mime === 'image/png' ? 'png' : image.mime === 'image/jpeg' ? 'jpg' : 'webp'}`
        : null;
    const reservation = crypto.randomUUID();
    const reserved = await env.DB.prepare(
        `INSERT INTO upload_reservations (id, user_id, resource_id, archive_key, image_key, size_bytes, created_at)
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE COALESCE((SELECT SUM(size_bytes) FROM upload_reservations WHERE user_id = ? AND status != 'released'), 0) + ? <= ?
        AND COALESCE((SELECT SUM(size_bytes) FROM upload_reservations WHERE status != 'released'), 0) + ? <= ?
        AND ? <= COALESCE((SELECT max_upload_bytes FROM users WHERE id = ?), ?)
        AND NOT EXISTS (SELECT 1 FROM upload_reservations WHERE resource_id = ? AND status = 'reserved')
        AND NOT EXISTS (SELECT 1 FROM resource_versions WHERE resource_id = ? AND status = 'pending')`,
    )
        .bind(
            reservation,
            actorId,
            resource.id,
            archiveKey,
            imageKey,
            totalSize,
            time,
            actorId,
            totalSize,
            accountLimit,
            totalSize,
            globalLimit,
            bytes.byteLength,
            actorId,
            defaultUploadLimit(env),
            resource.id,
            resource.id,
        )
        .run();
    if (!reserved.meta.changes) {
        await ensureStorageAvailable(env, totalSize);
        if (bytes.byteLength > (await effectiveUploadLimit(env, actorId))) {
            error(413, 'archive_size');
        }
        error(429, 'storage_quota_or_upload_pending');
    }
    try {
        await resourceStorage(env).put(archiveKey, bytes, {
            httpMetadata: {
                contentType: 'application/zip',
                contentDisposition: `attachment; filename="${resource.slug}-${manifest.version}.zip"`,
            },
            customMetadata: { sha256: digest, versionId: id, resourceId: resource.id },
        });
        if (image && imageKey) {
            await resourceStorage(env).put(imageKey, image.bytes, {
                httpMetadata: { contentType: image.mime },
                customMetadata: { versionId: id, resourceId: resource.id },
            });
        }
        await env.DB.batch([
            env.DB.prepare(
                `INSERT INTO resource_versions (id, resource_id, version, payload_json, manifest_json, archive_key, image_key, image_mime, image_size_bytes, sha256, size_bytes, created_at)
                SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                WHERE EXISTS (SELECT 1 FROM resources WHERE id = ? AND status IN ('draft', 'published') AND approved_version_id IS ?)
                AND EXISTS (SELECT 1 FROM upload_reservations WHERE id = ? AND status = 'reserved')
                AND NOT EXISTS (SELECT 1 FROM archive_cleanup WHERE archive_key = ?)`,
            ).bind(
                id,
                resource.id,
                manifest.version,
                JSON.stringify(payload),
                JSON.stringify(manifest),
                archiveKey,
                imageKey,
                image?.mime ?? null,
                image?.bytes.byteLength ?? 0,
                digest,
                bytes.byteLength,
                time,
                resource.id,
                resource.approved_version_id,
                reservation,
                archiveKey,
            ),
            env.DB.prepare(
                "UPDATE upload_reservations SET status = 'stored' WHERE id = ? AND status = 'reserved' AND EXISTS (SELECT 1 FROM resource_versions WHERE id = ?)",
            ).bind(reservation, id),
        ]);
        if (
            !(await database(env.DB)
                .select({ id: resourceVersions.id })
                .from(resourceVersions)
                .where(eq(resourceVersions.id, id))
                .get())
        ) {
            error(409, 'resource_unavailable');
        }
        await effects.audit('resource.version_submitted', resource.id, {
            versionId: id,
            version: manifest.version,
            sha256: digest,
            size: bytes.byteLength,
        });
        const status = await approveAdministratorSubmission(env, actorId, id, effects);
        return {
            data: {
                resource: { id: resource.id },
                version: {
                    id,
                    version: manifest.version,
                    status,
                    sha256: digest,
                    sizeBytes: bytes.byteLength,
                },
            },
            status: 201 as const,
        };
    } catch (cause) {
        const stored = await database(env.DB)
            .select({ id: resourceVersions.id })
            .from(resourceVersions)
            .where(eq(resourceVersions.id, id))
            .get();
        if (!stored) {
            await env.DB.batch([
                env.DB.prepare(
                    "UPDATE upload_reservations SET status = 'stored' WHERE id = ? AND status = 'reserved'",
                ).bind(reservation),
                env.DB.prepare(
                    'INSERT OR IGNORE INTO archive_cleanup (archive_key, image_key, created_at) VALUES (?, ?, ?)',
                ).bind(archiveKey, imageKey, now()),
            ]);
            effects.defer(cleanupArchives(env));
        }
        throw cause;
    }
}
