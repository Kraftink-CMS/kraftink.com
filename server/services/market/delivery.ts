import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { database } from '../../database';
import { fail } from '../../http';
import { siteLicenses, users } from '../../models/accounts';
import { entitlements, orders } from '../../models/commerce';
import { resources, resourceVersions } from '../../models/resources';
import { maxPreviewBytes } from '../../../shared/packages/raster';
import { sha256 } from '../../security/crypto';
import { ipMatchesPolicy } from '../../../shared/ip';
import type { Env } from '../../types';
import { resourceStorage } from '../resources/storage';

export async function resolveSiteLicense(
    env: Env,
    authorization: string | undefined,
    ip: string,
): Promise<{ userId: string | null; invalid: boolean }> {
    if (!authorization) {
        return { userId: null, invalid: false };
    }
    const match = /^Bearer ([A-Za-z0-9._~-]{16,512})$/.exec(authorization);
    if (!match) {
        return { userId: null, invalid: true };
    }
    const row = await database(env.DB)
        .select({
            user_id: siteLicenses.user_id,
            allowed_ips_json: siteLicenses.allowed_ips_json,
            ip_policy: siteLicenses.ip_policy,
            allowed_networks_json: siteLicenses.allowed_networks_json,
            ip_limit: siteLicenses.ip_limit,
        })
        .from(siteLicenses)
        .innerJoin(users, eq(users.id, siteLicenses.user_id))
        .where(
            and(
                eq(siteLicenses.key_hash, await sha256(match[1])),
                isNull(siteLicenses.revoked_at),
                isNull(users.banned_at),
                isNotNull(users.email_verified_at),
            ),
        )
        .get();
    let allowedIps: unknown = [];
    let allowedNetworks: unknown = [];
    try {
        allowedIps = row ? JSON.parse(row.allowed_ips_json) : [];
        allowedNetworks = row ? JSON.parse(row.allowed_networks_json) : [];
    } catch {
        return { userId: null, invalid: true };
    }
    if (!row || !ipMatchesPolicy(ip, { ipPolicy: row.ip_policy, allowedIps, allowedNetworks, ipLimit: row.ip_limit })) {
        return { userId: null, invalid: true };
    }
    return { userId: row.user_id, invalid: false };
}

async function purchasedArchive(env: Env, userId: string, resourceId: string, version?: string): Promise<Response> {
    const resource = await database(env.DB)
        .select({
            slug: resources.slug,
            version: resourceVersions.version,
            archive_key: resourceVersions.archive_key,
            sha256: resourceVersions.sha256,
        })
        .from(resources)
        .innerJoin(resourceVersions, eq(resourceVersions.id, resources.approved_version_id))
        .innerJoin(entitlements, eq(entitlements.resource_id, resources.id))
        .innerJoin(orders, eq(orders.id, entitlements.order_id))
        .innerJoin(users, eq(users.id, entitlements.user_id))
        .where(
            and(
                eq(resources.id, resourceId),
                eq(entitlements.user_id, userId),
                eq(entitlements.status, 'active'),
                eq(orders.status, 'paid'),
                inArray(resources.status, ['published', 'withdrawn']),
                eq(resourceVersions.status, 'approved'),
                isNull(users.banned_at),
            ),
        )
        .get();
    if (!resource || !resource.archive_key || (version !== undefined && resource.version !== version)) {
        fail(403, 'resource_denied');
    }
    const archive = await resourceStorage(env).get(resource.archive_key);
    if (!archive) {
        fail(503, 'archive_unavailable');
    }
    return new Response(archive.body, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Length': String(archive.size),
            'Content-Disposition': `attachment; filename="${resource.slug}-${resource.version}.zip"`,
            'Cache-Control': 'private, no-store',
            'CDN-Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-KraftInk-SHA256': resource.sha256,
        },
    });
}

export async function downloadResource(
    env: Env,
    userId: string,
    author: string,
    slug: string,
    version: string,
): Promise<Response> {
    const resource = await database(env.DB)
        .select({ id: resources.id })
        .from(resources)
        .where(
            and(
                eq(resources.author_id, author.startsWith('creator-') ? author.slice(8) : ''),
                eq(resources.slug, slug),
            ),
        )
        .get();
    if (!resource) {
        fail(403, 'resource_denied');
    }
    return purchasedArchive(env, userId, resource.id, version);
}

export async function resourceImage(env: Env, resourceId: string, versionId: string): Promise<Response> {
    const resource = await database(env.DB)
        .select({ image_key: resourceVersions.image_key, image_mime: resourceVersions.image_mime })
        .from(resources)
        .innerJoin(resourceVersions, eq(resourceVersions.id, resources.approved_version_id))
        .innerJoin(users, eq(users.id, resources.author_id))
        .where(
            and(
                eq(resources.id, resourceId),
                eq(resourceVersions.id, versionId),
                eq(resources.status, 'published'),
                eq(resourceVersions.status, 'approved'),
                isNull(users.banned_at),
            ),
        )
        .get();
    if (!resource?.image_key || !['image/png', 'image/jpeg', 'image/webp'].includes(resource.image_mime ?? '')) {
        fail(404, 'image_not_found');
    }
    const image = await resourceStorage(env).get(resource.image_key);
    if (!image || image.size > maxPreviewBytes) {
        fail(404, 'image_not_found');
    }
    return new Response(image.body, {
        headers: {
            'Content-Type': resource.image_mime!,
            'Content-Length': String(image.size),
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=300',
            'CDN-Cache-Control': 'no-store',
        },
    });
}
