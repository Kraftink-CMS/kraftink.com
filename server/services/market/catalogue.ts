import { and, asc, eq, exists, inArray, isNull, or } from 'drizzle-orm';
import { normalizedVersion, requirements } from '../../../shared/compatibility';
import type { CatalogueResource, PublicCatalogue } from '../../../shared/catalogue';
import { database } from '../../database';
import { users } from '../../models/accounts';
import { entitlements, orders } from '../../models/commerce';
import { metadataCache, type MetadataCacheRow } from '../../models/infrastructure';
import { marketRevocations, marketState, resources, resourceVersions } from '../../models/resources';
import { signDocument } from '../../security/crypto';
import { now } from '../../lib/time';
import { fail } from '../../http';
import type { Env } from '../../types';

const slugPattern = /^[a-z][a-z0-9-]{1,49}$/;
export const CMS_CATALOGUE_MAX_RESOURCES = 1000;
export const CMS_CATALOGUE_MAX_BYTES = 2 * 1024 * 1024;

function object(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unicode(value: string): boolean {
    return !/[\uD800-\uDFFF]/u.test(value);
}

function validJsonStrings(value: unknown, depth = 0): boolean {
    if (depth > 64) {
        return false;
    }
    if (typeof value === 'string') {
        return unicode(value);
    }
    if (Array.isArray(value)) {
        return value.every((entry) => validJsonStrings(entry, depth + 1));
    }
    return (
        !object(value) ||
        Object.entries(value).every(([key, entry]) => unicode(key) && validJsonStrings(entry, depth + 1))
    );
}

function https(value: unknown): value is string {
    if (
        typeof value !== 'string' ||
        !unicode(value) ||
        /[^\x21-\x7e]/.test(value) ||
        /[\x00-\x20\x7f\\"'<>`?#]/.test(value) ||
        !/^https:\/\/(?:\[[^\]]+\]|[^/:?#]+)(?:\/|$)/i.test(value)
    ) {
        return false;
    }
    try {
        const url = new URL(value);
        const authority = /^https:\/\/([^/]+)(?:\/|$)/i.exec(value)?.[1] ?? '';
        const hostname = authority.replace(/\.$/, '');
        const validHost = authority.startsWith('[')
            ? /^\[[0-9a-f:.]+\]$/i.test(authority)
            : hostname.length <= 253 &&
              hostname.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
        return validHost && url.protocol === 'https:' && !url.username && !url.password && !url.port;
    } catch {
        return false;
    }
}

function localized(value: unknown, maximum: number): boolean {
    if (typeof value === 'string') {
        return unicode(value) && value.trim().length > 0 && [...value].length <= maximum;
    }
    return (
        object(value) &&
        Object.keys(value).length > 0 &&
        Object.keys(value).length <= 100 &&
        Object.entries(value).every(
            ([locale, text]) =>
                locale.length <= 35 &&
                /^[a-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/.test(locale) &&
                typeof text === 'string' &&
                unicode(text) &&
                text.trim().length > 0 &&
                [...text].length <= maximum,
        )
    );
}

function archiveUrl(value: unknown, trustedEndpoint?: string): value is string {
    if (!https(value)) {
        return false;
    }
    const url = new URL(value);
    if (trustedEndpoint && url.hostname === new URL(trustedEndpoint).hostname) {
        return true;
    }
    return (
        (url.hostname === 'github.com' &&
            (/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/releases\/download\/[^/]+\/[^/]+\.zip$/.test(url.pathname) ||
                /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/archive\/refs\/(?:tags|heads)\/.+\.zip$/.test(url.pathname))) ||
        (url.hostname === 'codeload.github.com' &&
            /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/zip\/refs\/(?:tags|heads)\/[^?]+$/.test(url.pathname))
    );
}

export function validatePublicCatalogue(value: unknown, trustedEndpoint?: string): CatalogueResource[] {
    if (
        !object(value) ||
        !validJsonStrings(value) ||
        value.schema_version !== 1 ||
        !Array.isArray(value.resources) ||
        value.resources.length > CMS_CATALOGUE_MAX_RESOURCES
    ) {
        throw new Error('Invalid public catalogue');
    }
    const ids = new Set<string>();
    return value.resources.map((candidate: unknown) => {
        if (
            !object(candidate) ||
            typeof candidate.id !== 'string' ||
            typeof candidate.slug !== 'string' ||
            !slugPattern.test(candidate.slug) ||
            typeof candidate.type !== 'string' ||
            !['plugin', 'theme', 'game'].includes(candidate.type) ||
            !object(candidate.author) ||
            typeof candidate.author.id !== 'string' ||
            !slugPattern.test(candidate.author.id) ||
            candidate.id !== `${candidate.author.id}/${candidate.slug}` ||
            typeof candidate.author.name !== 'string' ||
            !candidate.author.name.trim() ||
            candidate.author.name.length > 120 ||
            !localized(candidate.name, 120) ||
            !localized(candidate.description, 1000) ||
            !object(candidate.commercial) ||
            typeof candidate.commercial.kind !== 'string' ||
            !['free', 'paid'].includes(candidate.commercial.kind) ||
            !Array.isArray(candidate.versions) ||
            candidate.versions.length === 0 ||
            candidate.versions.length > 100 ||
            ids.has(candidate.id)
        ) {
            throw new Error('Invalid public resource');
        }
        ids.add(candidate.id);
        const resource = {
            ...candidate,
            manual_only: candidate.manual_only ?? candidate.commercial.kind === 'paid',
        } as unknown as CatalogueResource;
        if (typeof resource.manual_only !== 'boolean') {
            throw new Error('Invalid resource distribution mode');
        }
        if (
            'access' in candidate &&
            (!object(candidate.access) ||
                typeof candidate.access.allowed !== 'boolean' ||
                ('code' in candidate.access &&
                    (typeof candidate.access.code !== 'string' ||
                        !/^[a-z][a-z0-9_]{0,79}$/.test(candidate.access.code))))
        ) {
            throw new Error('Invalid public resource access');
        }
        if (
            'image' in candidate &&
            (!localized(candidate.image, 2048) ||
                (typeof candidate.image === 'string'
                    ? [candidate.image]
                    : Object.values(candidate.image as object)
                ).some((image) => !https(image)))
        ) {
            throw new Error('Invalid public image');
        }
        if (
            'price' in candidate.commercial &&
            (!object(candidate.commercial.price) ||
                typeof candidate.commercial.price.amount !== 'string' ||
                !/^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,6})?$/.test(candidate.commercial.price.amount) ||
                typeof candidate.commercial.price.currency !== 'string' ||
                !/^[A-Z]{3}$/.test(candidate.commercial.price.currency))
        ) {
            throw new Error('Invalid public price');
        }
        const versions = new Set<string>();
        for (const version of resource.versions) {
            const normalized = object(version) ? normalizedVersion(version.version) : null;
            if (!normalized || versions.has(normalized) || !requirements(version.requirements)) {
                throw new Error('Invalid public resource version');
            }
            versions.add(normalized);
            if ((!resource.manual_only && resource.access?.allowed !== false) || version.download != null) {
                if (
                    !object(version.download) ||
                    !archiveUrl(version.download.url, trustedEndpoint) ||
                    typeof version.download.sha256 !== 'string' ||
                    !/^[a-f0-9]{64}$/i.test(version.download.sha256)
                ) {
                    throw new Error('Invalid public archive');
                }
            }
        }
        if (
            (resource.repository != null &&
                (!https(resource.repository) ||
                    new URL(resource.repository).hostname !== 'github.com' ||
                    !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(new URL(resource.repository).pathname))) ||
            (resource.author.url != null && !https(resource.author.url)) ||
            (resource.commercial.url != null && !https(resource.commercial.url))
        ) {
            throw new Error('Invalid public link');
        }
        if (resource.repository != null) {
            resource.repository = new URL(resource.repository).href.replace(/\/$/, '');
        }
        return resource;
    });
}

export class CatalogueCapacityError extends Error {}

export function serializeCmsCatalogue(
    resources: CatalogueResource[],
    access: { scope: 'public' | 'private'; code?: string },
    endpoint: string,
): string {
    if (resources.length > CMS_CATALOGUE_MAX_RESOURCES) {
        throw new CatalogueCapacityError('CMS catalogue resource limit exceeded');
    }
    const document = { schema_version: 1, resources, access };
    validatePublicCatalogue(document, endpoint);
    const json = JSON.stringify(document);
    if (new TextEncoder().encode(json).byteLength > CMS_CATALOGUE_MAX_BYTES) {
        throw new CatalogueCapacityError('CMS catalogue byte limit exceeded');
    }
    return json;
}

async function boundedJson(response: Response, maximum = CMS_CATALOGUE_MAX_BYTES): Promise<unknown> {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Missing catalogue body');
    }
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
        const result = await reader.read();
        if (result.done) {
            break;
        }
        length += result.value.length;
        if (length > maximum) {
            await reader.cancel();
            throw new Error('Metadata too large');
        }
        chunks.push(result.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
}

function metadataValue(key: 'catalogue' | 'releases', value: unknown, endpoint?: string): unknown {
    if (key === 'catalogue') {
        validatePublicCatalogue(value, endpoint);
    } else if (!Array.isArray(value)) {
        throw new Error('Invalid releases');
    }
    return value;
}

export interface MetadataOptions {
    persistMetadata?: boolean;
    signal?: AbortSignal;
}

async function githubJson(
    env: Env,
    url: string,
    maximum = CMS_CATALOGUE_MAX_BYTES,
    signal?: AbortSignal,
): Promise<unknown> {
    const headers: Record<string, string> = {
        'User-Agent': 'KraftInk',
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
    };
    if (new URL(url).origin === 'https://api.github.com' && env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
        headers.Authorization = `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`;
    }
    const response = await fetch(url, {
        headers,
        credentials: 'omit',
        redirect: 'manual',
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
    });
    if (!response.ok) {
        throw new Error('GitHub metadata unavailable');
    }
    return boundedJson(response, maximum);
}

async function storeMetadata(
    env: Env,
    key: 'catalogue' | 'releases',
    expected: MetadataCacheRow | undefined,
    payload: string,
    timestamp: number,
): Promise<boolean> {
    const statement = expected
        ? env.DB.prepare(
              'UPDATE metadata_cache SET payload_json = ?, fetched_at = ?, retry_at = ? WHERE key = ? AND payload_json IS ? AND fetched_at IS ? AND retry_at = ? RETURNING key',
          ).bind(
              payload,
              timestamp,
              timestamp + 1800,
              key,
              expected.payload_json,
              expected.fetched_at,
              expected.retry_at,
          )
        : env.DB.prepare(
              'INSERT INTO metadata_cache (key, payload_json, fetched_at, retry_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO NOTHING RETURNING key',
          ).bind(key, payload, timestamp, timestamp + 1800);
    return Boolean(await statement.first());
}

function cachedPayload(
    entry: MetadataCacheRow | undefined,
    key: 'catalogue' | 'releases',
    url: string | undefined,
): unknown {
    if (entry?.payload_json) {
        try {
            if (new TextEncoder().encode(entry.payload_json).byteLength > CMS_CATALOGUE_MAX_BYTES) {
                throw new Error('Cached metadata too large');
            }
            return metadataValue(key, JSON.parse(entry.payload_json), url);
        } catch {
            return null;
        }
    }
    return null;
}

async function currentMetadata(
    env: Env,
    key: 'catalogue' | 'releases',
    url: string | undefined,
): Promise<{ data: unknown; state: PublicCatalogue['state']; fetchedAt: number | null }> {
    const entry = await database(env.DB).select().from(metadataCache).where(eq(metadataCache.key, key)).get();
    const data = cachedPayload(entry, key, url);
    return {
        data,
        state: data === null ? 'unavailable' : entry?.fetched_at && entry.fetched_at > now() - 1800 ? 'fresh' : 'stale',
        fetchedAt: data === null ? null : (entry?.fetched_at ?? null),
    };
}

export async function refreshPublicCatalogue(env: Env, commit: string): Promise<void> {
    const configured = env.GITHUB_CATALOGUE_URL;
    if (!configured || !https(configured)) {
        fail(503, 'catalogue_source_unavailable');
    }
    const source = new URL(configured);
    const parts = /^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/(.+)$/.exec(source.pathname);
    if (source.hostname !== 'raw.githubusercontent.com' || !parts) {
        fail(503, 'catalogue_source_unavailable');
    }
    const [, owner, repository, branch, path] = parts;
    const entry = await database(env.DB).select().from(metadataCache).where(eq(metadataCache.key, 'catalogue')).get();
    let head: unknown;
    try {
        head = await githubJson(
            env,
            `https://api.github.com/repos/${owner}/${repository}/git/ref/heads/${branch}`,
            16384,
        );
    } catch {
        fail(503, 'catalogue_upstream_unavailable');
    }
    if (
        !object(head) ||
        !object(head.object) ||
        typeof head.object.sha !== 'string' ||
        !/^[a-f0-9]{40}$/.test(head.object.sha)
    ) {
        fail(503, 'catalogue_upstream_invalid');
    }
    if (head.object.sha !== commit) {
        fail(409, 'catalogue_commit_outdated');
    }
    let data: unknown;
    try {
        data = metadataValue(
            'catalogue',
            await githubJson(env, `https://raw.githubusercontent.com/${owner}/${repository}/${commit}/${path}`),
            configured,
        );
    } catch {
        fail(503, 'catalogue_refresh_failed');
    }
    const payload = JSON.stringify(data);
    const timestamp = now();
    if (entry?.payload_json === payload && entry.fetched_at && entry.fetched_at > timestamp - 1800) {
        const current = await database(env.DB)
            .select()
            .from(metadataCache)
            .where(eq(metadataCache.key, 'catalogue'))
            .get();
        if (current?.payload_json !== payload) {
            fail(503, 'catalogue_refresh_conflict');
        }
        return;
    }
    if (!(await storeMetadata(env, 'catalogue', entry, payload, timestamp))) {
        fail(503, 'catalogue_refresh_conflict');
    }
}

export async function cachedMetadata(
    env: Env,
    key: 'catalogue' | 'releases',
    options: MetadataOptions = {},
): Promise<{ data: unknown; state: PublicCatalogue['state']; fetchedAt: number | null }> {
    const url = key === 'catalogue' ? env.GITHUB_CATALOGUE_URL : env.GITHUB_RELEASES_URL;
    const db = database(env.DB);
    const entry = await db.select().from(metadataCache).where(eq(metadataCache.key, key)).get();
    const timestamp = now();
    const previous = cachedPayload(entry, key, url);
    const corrupt = Boolean(entry?.payload_json) && previous === null;
    if (corrupt && entry && options.persistMetadata !== false) {
        await db
            .update(metadataCache)
            .set({ payload_json: null, fetched_at: null, retry_at: timestamp })
            .where(
                and(
                    eq(metadataCache.key, key),
                    eq(metadataCache.payload_json, entry.payload_json!),
                    entry.fetched_at === null
                        ? isNull(metadataCache.fetched_at)
                        : eq(metadataCache.fetched_at, entry.fetched_at),
                    eq(metadataCache.retry_at, entry.retry_at),
                ),
            )
            .run();
    }
    const fallback = (): { data: unknown; state: PublicCatalogue['state']; fetchedAt: number | null } => ({
        data: previous,
        state: previous === null ? 'unavailable' : 'stale',
        fetchedAt: previous === null ? null : (entry?.fetched_at ?? null),
    });
    if (previous !== null && entry?.fetched_at && entry.fetched_at > timestamp - 1800) {
        return { data: previous, state: 'fresh', fetchedAt: entry.fetched_at };
    }
    if (!url || (!corrupt && entry && entry.retry_at > timestamp)) {
        return fallback();
    }
    try {
        if (!https(url) || !['raw.githubusercontent.com', 'api.github.com'].includes(new URL(url).hostname)) {
            return fallback();
        }
    } catch {
        return fallback();
    }
    const lock =
        options.persistMetadata === false
            ? true
            : await env.DB.prepare(
                  'INSERT INTO metadata_cache (key, retry_at) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET retry_at = excluded.retry_at WHERE metadata_cache.retry_at <= ? RETURNING key, payload_json, fetched_at, retry_at',
              )
                  .bind(key, timestamp + 300, timestamp)
                  .first<MetadataCacheRow>();
    if (!lock) {
        return currentMetadata(env, key, url);
    }
    let data: unknown;
    try {
        data = metadataValue(key, await githubJson(env, url, CMS_CATALOGUE_MAX_BYTES, options.signal), url);
    } catch {
        return options.persistMetadata === false ? fallback() : currentMetadata(env, key, url);
    }
    if (lock !== true && !(await storeMetadata(env, key, lock, JSON.stringify(data), timestamp))) {
        return currentMetadata(env, key, url);
    }
    return { data, state: 'fresh', fetchedAt: timestamp };
}

export async function loadPublicCatalogue(env: Env, options: MetadataOptions = {}): Promise<PublicCatalogue> {
    const result = await cachedMetadata(env, 'catalogue', options);
    return {
        resources: result.data ? validatePublicCatalogue(result.data, env.GITHUB_CATALOGUE_URL) : [],
        state: result.state,
        fetchedAt: result.fetchedAt,
    };
}

async function entitlementIds(env: Env, userId: string | null): Promise<Set<string>> {
    if (!userId) {
        return new Set();
    }
    const result = await database(env.DB)
        .select({ resource_id: entitlements.resource_id })
        .from(entitlements)
        .innerJoin(orders, eq(orders.id, entitlements.order_id))
        .where(and(eq(entitlements.user_id, userId), eq(entitlements.status, 'active'), eq(orders.status, 'paid')))
        .all();
    return new Set(result.map((row) => row.resource_id));
}

export async function mergedCatalogue(
    env: Env,
    userId: string | null,
    forCms = false,
    options: MetadataOptions = {},
): Promise<{ resources: CatalogueResource[]; state: string }> {
    const db = database(env.DB);
    const purchase = db
        .select({ id: entitlements.resource_id })
        .from(entitlements)
        .innerJoin(orders, eq(orders.id, entitlements.order_id))
        .where(
            and(
                eq(entitlements.resource_id, resources.id),
                eq(entitlements.user_id, userId ?? ''),
                eq(entitlements.status, 'active'),
                eq(orders.status, 'paid'),
            ),
        );
    const [github, owned, premium] = await Promise.all([
        loadPublicCatalogue(env, options),
        entitlementIds(env, userId),
        db
            .select({
                id: resources.id,
                author_id: resources.author_id,
                author_name: users.username,
                author_banned: users.banned_at,
                slug: resources.slug,
                type: resources.type,
                name: resources.name,
                description: resources.description,
                metadata_json: resources.metadata_json,
                price_cents: resources.price_cents,
                currency: resources.currency,
                status: resources.status,
                version_id: resourceVersions.id,
                version: resourceVersions.version,
                manifest_json: resourceVersions.manifest_json,
                sha256: resourceVersions.sha256,
                archive_key: resourceVersions.archive_key,
                image_key: resourceVersions.image_key,
            })
            .from(resources)
            .innerJoin(users, eq(users.id, resources.author_id))
            .innerJoin(resourceVersions, eq(resourceVersions.id, resources.approved_version_id))
            .where(
                and(
                    inArray(resources.status, ['published', 'withdrawn']),
                    eq(resourceVersions.status, 'approved'),
                    or(and(eq(resources.status, 'published'), isNull(users.banned_at)), exists(purchase)),
                ),
            )
            .orderBy(asc(resources.name))
            .limit(forCms ? CMS_CATALOGUE_MAX_RESOURCES + 1 : 1000)
            .all(),
    ]);
    const freeSlugs = new Set(github.resources.map((resource) => resource.slug));
    const mergedResources = [...github.resources];
    const origin = env.APP_ORIGIN.replace(/\/$/, '');
    for (const resource of premium) {
        const purchased = owned.has(resource.id);
        if (
            freeSlugs.has(resource.slug) ||
            ((resource.status === 'withdrawn' || resource.author_banned !== null) && !purchased)
        ) {
            continue;
        }
        const author = `creator-${resource.author_id}`;
        const manifest = JSON.parse(resource.manifest_json) as { requires: Record<string, string> };
        const metadata = JSON.parse(resource.metadata_json) as {
            name?: CatalogueResource['name'];
            description?: CatalogueResource['description'];
        };
        const version = {
            version: resource.version,
            requirements: manifest.requires,
            ...(forCms && purchased && resource.archive_key
                ? {
                      download: {
                          url: `${origin}/api/market/resources/${author}/${resource.slug}/versions/${resource.version}/download`,
                          sha256: resource.sha256,
                      },
                  }
                : {}),
        };
        mergedResources.push({
            id: `${author}/${resource.slug}`,
            resourceId: resource.id,
            slug: resource.slug,
            type: resource.type,
            name: metadata.name ?? resource.name,
            description: metadata.description ?? resource.description,
            ...(resource.image_key
                ? { image: `${origin}/api/market/resources/${resource.id}/images/${resource.version_id}` }
                : {}),
            author: { id: author, name: resource.author_name },
            commercial: {
                kind: 'paid',
                price: { amount: (resource.price_cents / 100).toFixed(2), currency: resource.currency },
                url: `${origin}/market/resource/${resource.id}`,
            },
            access: { allowed: purchased, ...(purchased ? {} : { code: 'purchase_required' }) },
            manual_only: false,
            versions: [version],
        });
    }
    return { resources: mergedResources, state: github.state };
}

export async function signedRevocations(env: Env): Promise<{ payload: string; signature: string }> {
    if (!env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY) {
        throw new Error('Revocation signing unavailable');
    }
    const db = database(env.DB);
    const [state, entries] = await db.batch([
        db.select({ sequence: marketState.sequence }).from(marketState).where(eq(marketState.id, 1)),
        db
            .select({
                author_id: resources.author_id,
                slug: marketRevocations.slug,
                type: marketRevocations.type,
                versions_json: marketRevocations.versions_json,
                reason: marketRevocations.reason,
                created_at: marketRevocations.created_at,
            })
            .from(marketRevocations)
            .innerJoin(resources, eq(resources.id, marketRevocations.resource_id))
            .orderBy(asc(marketRevocations.created_at), asc(marketRevocations.resource_id)),
    ]);
    return signDocument(
        {
            schema_version: 1,
            sequence: Number(state[0]?.sequence ?? 0),
            issued_at: entries.reduce((maximum, row) => Math.max(maximum, row.created_at), 0),
            revocations: entries.map((row) => ({
                id: `creator-${row.author_id}/${row.slug}`,
                slug: row.slug,
                type: row.type,
                versions: JSON.parse(row.versions_json),
                reason: row.reason,
            })),
        },
        env.KRAFTINK_SITE_SIGNING_PRIVATE_KEY,
    );
}
