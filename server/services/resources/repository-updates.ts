import { HTTPException } from 'hono/http-exception';
import type { CatalogueHistoryEntry } from '../../../shared/catalogue';
import { requirements } from '../../../shared/compatibility';
import { marketChangelogMaxBytes, marketHistoryLimit } from '../../../shared/packages/presentation';
import { ArchiveError, isNewerVersion, type ResourceManifest } from '../../../shared/packages/zip';
import { parseRepositorySource, repositoryVersion, type RepositorySource } from '../../../shared/packages/repository';
import { sha256 } from '../../security/crypto';
import { now } from '../../lib/time';
import type { ResourceVersionRow } from '../../models/resources';
import type { MetadataCacheRow } from '../../models/infrastructure';
import type { Env } from '../../types';
import { loadRepositoryHistory, resolveRepositoryRelease } from './repository';

export interface RepositoryRelease {
    source: RepositorySource;
    version: string;
    requirements: Record<string, string>;
    sha256: string;
    sizeBytes: number;
    manifest: ResourceManifest;
    history?: CatalogueHistoryEntry[];
    unavailable?: boolean;
}

function cacheKey(resourceId: string, versionId: string): string {
    return `repository:${resourceId}:${versionId}`;
}

export function cachedRepositoryRelease(
    row: Pick<MetadataCacheRow, 'payload_json' | 'fetched_at'> | null,
    source: RepositorySource,
    includeUnavailable = false,
): RepositoryRelease | null {
    if (!row?.payload_json || (!includeUnavailable && (!row.fetched_at || row.fetched_at < now() - 14400))) {
        return null;
    }
    let value: RepositoryRelease;
    try {
        value = JSON.parse(row.payload_json) as RepositoryRelease;
    } catch {
        return null;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const candidate = parseRepositorySource(JSON.stringify({ source: value.source }));
    if (
        !candidate ||
        candidate.repositoryId !== source.repositoryId ||
        candidate.repository.toLowerCase() !== source.repository.toLowerCase() ||
        candidate.owner.toLowerCase() !== source.owner.toLowerCase() ||
        typeof value.version !== 'string' ||
        repositoryVersion(candidate.tag) !== value.version ||
        (!includeUnavailable && value.unavailable === true) ||
        !value.manifest ||
        value.manifest.version !== value.version ||
        !requirements(value.requirements) ||
        !/^[a-f0-9]{64}$/.test(value.sha256) ||
        !Number.isSafeInteger(value.sizeBytes) ||
        value.sizeBytes <= 0
    ) {
        return null;
    }
    const encoder = new TextEncoder();
    const history =
        Array.isArray(value.history) &&
        value.history.length <= marketHistoryLimit &&
        value.history.every(
            (entry) =>
                entry &&
                typeof entry.version === 'string' &&
                repositoryVersion(entry.version) === entry.version &&
                !isNewerVersion(entry.version, value.version) &&
                (entry.changelog === undefined ||
                    (typeof entry.changelog === 'string' &&
                        encoder.encode(entry.changelog).byteLength <= marketChangelogMaxBytes)),
        )
            ? value.history
            : undefined;
    return { ...value, source: candidate, history };
}

export async function seedRepositoryRelease(env: Env, resourceId: string, version: ResourceVersionRow): Promise<void> {
    const source = parseRepositorySource(version.payload_json);
    if (!source) {
        return;
    }
    const manifest = JSON.parse(version.manifest_json) as ResourceManifest;
    const release: RepositoryRelease = {
        source,
        version: version.version,
        requirements: manifest.requires as Record<string, string>,
        sha256: version.sha256,
        sizeBytes: version.size_bytes,
        manifest,
    };
    const timestamp = now();
    await env.DB.prepare(
        `INSERT INTO metadata_cache (key, payload_json, fetched_at, retry_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO NOTHING`,
    )
        .bind(cacheKey(resourceId, version.id), JSON.stringify(release), timestamp, timestamp + 3600)
        .run();
}

export async function repositoryRelease(
    env: Env,
    resourceId: string,
    versionId: string,
    source: RepositorySource,
    includeUnavailable = false,
): Promise<RepositoryRelease | null> {
    const row = await env.DB.prepare('SELECT * FROM metadata_cache WHERE key = ?')
        .bind(cacheKey(resourceId, versionId))
        .first<MetadataCacheRow>();
    return cachedRepositoryRelease(row, source, includeUnavailable);
}

export async function refreshRepositoryResources(env: Env): Promise<void> {
    const timestamp = now();
    const versions = await env.DB.prepare(
        `SELECT v.*, r.slug, r.type FROM resource_versions v
        JOIN resources r ON r.approved_version_id = v.id JOIN users u ON u.id = r.author_id
        LEFT JOIN metadata_cache m ON m.key = 'repository:' || r.id || ':' || v.id
        WHERE v.status = 'approved' AND r.status IN ('published', 'withdrawn') AND u.banned_at IS NULL
        AND json_extract(v.payload_json, '$.source.kind') = 'github' AND COALESCE(m.retry_at, 0) <= ?
        ORDER BY COALESCE(m.retry_at, 0), r.id LIMIT 50`,
    )
        .bind(timestamp)
        .all<ResourceVersionRow & { slug: string; type: 'plugin' | 'theme' | 'game' }>();
    for (const version of versions.results) {
        if (now() - timestamp >= 60) {
            break;
        }
        const source = parseRepositorySource(version.payload_json);
        if (!source) {
            continue;
        }
        const key = cacheKey(version.resource_id, version.id);
        const claimedAt = now();
        const lock = await env.DB.prepare(
            `INSERT INTO metadata_cache (key, retry_at) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET retry_at = excluded.retry_at WHERE metadata_cache.retry_at <= ?
            RETURNING *`,
        )
            .bind(key, claimedAt + 300, claimedAt)
            .first<MetadataCacheRow>();
        if (!lock) {
            continue;
        }
        const previous = cachedRepositoryRelease(lock, source, true);
        try {
            const baseline = previous ?? {
                source,
                sha256: version.sha256,
                manifest: JSON.parse(version.manifest_json) as ResourceManifest,
            };
            const result = await resolveRepositoryRelease(
                env,
                source,
                { slug: version.slug, type: version.type },
                baseline,
            );
            let release: RepositoryRelease;
            if (result) {
                const digest = await sha256(result.bytes);
                const previousVersion = previous?.version ?? version.version;
                const currentVersion = result.inspection.manifest.version;
                if (currentVersion !== previousVersion && !isNewerVersion(currentVersion, previousVersion)) {
                    throw new ArchiveError('version_must_increase');
                }
                if (currentVersion === previousVersion && digest !== (previous?.sha256 ?? version.sha256)) {
                    throw new ArchiveError('repository_release_changed');
                }
                release = {
                    source: result.source,
                    version: currentVersion,
                    requirements: result.inspection.manifest.requires as Record<string, string>,
                    sha256: digest,
                    sizeBytes: result.bytes.byteLength,
                    manifest: result.inspection.manifest,
                };
            } else {
                release = {
                    ...baseline,
                    version: baseline.manifest.version,
                    requirements: baseline.manifest.requires as Record<string, string>,
                    sizeBytes: previous?.sizeBytes ?? version.size_bytes,
                    unavailable: false,
                };
            }
            release.history = previous?.history;
            if (release.history?.[0]?.version !== release.version) {
                release.history =
                    (await loadRepositoryHistory(env, release.source, version.slug, result?.changelog)) ??
                    release.history;
            }
            await env.DB.prepare(
                `UPDATE metadata_cache SET payload_json = ?, fetched_at = ?, retry_at = ?
                WHERE key = ? AND retry_at = ?`,
            )
                .bind(JSON.stringify(release), now(), now() + 3600, key, lock.retry_at)
                .run();
        } catch (cause) {
            if (!(cause instanceof HTTPException) && !(cause instanceof ArchiveError)) {
                throw cause;
            }
            const baseline = previous ?? {
                source,
                version: version.version,
                sha256: version.sha256,
                manifest: JSON.parse(version.manifest_json) as ResourceManifest,
                sizeBytes: version.size_bytes,
                requirements: (JSON.parse(version.manifest_json) as ResourceManifest).requires,
            };
            await env.DB.prepare(
                `UPDATE metadata_cache SET payload_json = ?, retry_at = ?
                WHERE key = ? AND retry_at = ?`,
            )
                .bind(JSON.stringify({ ...baseline, unavailable: true }), now() + 600, key, lock.retry_at)
                .run();
        }
    }
}
