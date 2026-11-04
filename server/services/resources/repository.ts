import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { database } from '../../database';
import { users } from '../../models/accounts';
import { fail } from '../../http';
import { sha256 } from '../../security/crypto';
import type { Env } from '../../types';
import { effectiveUploadLimit } from '../../upload-limits';
import {
    ArchiveError,
    inspectArchive,
    type ArchiveInspection,
    type ResourceType,
    type ResourceManifest,
} from '../../../shared/packages/zip';
import {
    maxRepositoryArchiveBytes,
    maxRepositoryExpandedBytes,
    repositoryUrl,
    repositoryVersion,
    type RepositorySource,
} from '../../../shared/packages/repository';

type Json = Record<string, unknown>;
type ExpectedResource = { slug?: string; type?: ResourceType };

export interface RepositoryInspection {
    source: RepositorySource;
    bytes: Uint8Array<ArrayBuffer>;
    inspection: ArchiveInspection;
}

interface ReusableRelease {
    source: RepositorySource;
    sha256: string;
    manifest: ResourceManifest;
}

function object(value: unknown): value is Json {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalJson(value: unknown, depth = 0): string {
    if (depth > 64) {
        fail(400, 'repository_manifest_invalid');
    }
    if (Array.isArray(value)) {
        return `[${value.map((entry) => canonicalJson(entry, depth + 1)).join(',')}]`;
    }
    if (object(value)) {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key], depth + 1)}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
}

async function readBytes(response: Response, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
    const reader = response.body?.getReader();
    if (!reader) {
        fail(503, 'repository_unavailable');
    }
    const declared = response.headers.get('Content-Length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximum)) {
        await reader.cancel();
        fail(413, 'archive_size');
    }
    const buffer = new ArrayBuffer(0, { maxByteLength: maximum });
    let length = 0;
    try {
        while (true) {
            const result = await reader.read();
            if (result.done) {
                break;
            }
            length += result.value.byteLength;
            if (length > maximum) {
                fail(413, 'archive_size');
            }
            buffer.resize(length);
            new Uint8Array(buffer).set(result.value, length - result.value.byteLength);
        }
    } catch (cause) {
        await reader.cancel().catch(() => undefined);
        if (cause instanceof HTTPException) {
            throw cause;
        }
        fail(503, 'repository_unavailable');
    } finally {
        reader.releaseLock();
    }
    if (!length) {
        fail(400, 'repository_invalid');
    }
    return new Uint8Array(buffer.transferToFixedLength(length));
}

async function request(url: string, signal: AbortSignal, env?: Env): Promise<Response> {
    const headers: Record<string, string> = {
        'User-Agent': 'KraftInk',
        Accept: 'application/vnd.github+json',
        'Cache-Control': 'no-cache',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (env?.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && new URL(url).origin === 'https://api.github.com') {
        headers.Authorization = `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`;
    }
    let response: Response;
    try {
        response = await fetch(url, {
            headers,
            credentials: 'omit',
            redirect: 'manual',
            signal,
        });
    } catch {
        fail(503, 'repository_unavailable');
    }
    if (response.status === 403 || response.status === 429 || response.status >= 500) {
        await response.body?.cancel();
        fail(503, 'repository_unavailable');
    }
    return response;
}

async function json(url: string, signal: AbortSignal, maximum = 512 * 1024, env?: Env): Promise<Json> {
    const response = await request(url, signal, env);
    if (response.status !== 200) {
        await response.body?.cancel();
        fail(400, 'repository_public_required');
    }
    const bytes = await readBytes(response, maximum);
    let value: unknown;
    try {
        value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
        fail(400, 'repository_invalid');
    }
    if (!object(value)) {
        fail(400, 'repository_invalid');
    }
    return value;
}

async function publicRepository(env: Env, url: string, signal: AbortSignal, source?: RepositorySource): Promise<Json> {
    const canonical = repositoryUrl(url);
    if (!canonical) {
        fail(400, 'repository_url_invalid');
    }
    const repository = await json(`https://api.github.com/repos/${canonical.slice(19)}`, signal, 512 * 1024, env);
    if (
        !Number.isSafeInteger(repository.id) ||
        repository.private !== false ||
        repository.visibility !== 'public' ||
        repository.disabled !== false ||
        !object(repository.owner) ||
        typeof repository.owner.login !== 'string' ||
        !['User', 'Organization'].includes(String(repository.owner.type)) ||
        typeof repository.html_url !== 'string' ||
        repositoryUrl(repository.html_url)?.toLowerCase() !== canonical.toLowerCase() ||
        repository.owner.login.toLowerCase() !== canonical.split('/')[3].toLowerCase()
    ) {
        fail(400, 'repository_public_required');
    }
    if (
        source &&
        (source.repositoryId !== repository.id || source.owner.toLowerCase() !== repository.owner.login.toLowerCase())
    ) {
        fail(409, 'repository_identity_changed');
    }
    if (
        !object(repository.license) ||
        typeof repository.license.spdx_id !== 'string' ||
        ['NOASSERTION', 'NONE'].includes(repository.license.spdx_id)
    ) {
        fail(400, 'repository_license_required');
    }
    return repository;
}

async function requireOwnership(env: Env, actorId: string, repository: Json, signal: AbortSignal): Promise<void> {
    const actor = await database(env.DB)
        .select({ githubId: users.github_id })
        .from(users)
        .where(eq(users.id, actorId))
        .get();
    if (!actor?.githubId || !/^\d+$/.test(actor.githubId)) {
        fail(403, 'repository_github_required');
    }
    const owner = repository.owner as Json;
    if (owner.type === 'User') {
        if (String(owner.id) !== actor.githubId) {
            fail(403, 'repository_owner_required');
        }
        return;
    }
    const actorGithub = await json(`https://api.github.com/user/${actor.githubId}`, signal, 32768, env);
    if (
        String(actorGithub.id) !== actor.githubId ||
        typeof actorGithub.login !== 'string' ||
        !/^[A-Za-z0-9-]{1,39}$/.test(actorGithub.login)
    ) {
        fail(403, 'repository_owner_required');
    }
    const membership = await request(
        `https://api.github.com/orgs/${owner.login}/public_members/${actorGithub.login}`,
        signal,
        env,
    );
    await membership.body?.cancel();
    if (membership.status !== 204) {
        fail(403, 'repository_organization_required');
    }
}

async function releaseCommit(env: Env, path: string, tag: string, signal: AbortSignal): Promise<string> {
    let reference = await json(
        `https://api.github.com/repos/${path}/git/ref/tags/${encodeURIComponent(tag)}`,
        signal,
        32768,
        env,
    );
    for (let depth = 0; depth < 4; depth += 1) {
        const target = reference.object;
        if (!object(target) || typeof target.sha !== 'string' || !/^[a-f0-9]{40}$/.test(target.sha)) {
            fail(400, 'repository_release_invalid');
        }
        if (target.type === 'commit') {
            return target.sha;
        }
        if (target.type !== 'tag') {
            fail(400, 'repository_release_invalid');
        }
        reference = await json(`https://api.github.com/repos/${path}/git/tags/${target.sha}`, signal, 32768, env);
    }
    fail(400, 'repository_release_invalid');
}

async function archiveBytes(url: string, maximum: number, signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
    let current = url;
    for (let redirects = 0; redirects < 4; redirects += 1) {
        const response = await request(current, signal);
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('Location');
            await response.body?.cancel();
            let target: URL;
            try {
                target = new URL(location ?? '', current);
            } catch {
                fail(400, 'repository_archive_invalid');
            }
            if (
                !location ||
                target.protocol !== 'https:' ||
                target.username ||
                target.password ||
                target.port ||
                target.hash ||
                ![
                    'release-assets.githubusercontent.com',
                    'objects.githubusercontent.com',
                    'github-releases.githubusercontent.com',
                ].includes(target.hostname)
            ) {
                fail(400, 'repository_archive_invalid');
            }
            current = target.href;
            continue;
        }
        if (response.status !== 200) {
            await response.body?.cancel();
            fail(400, 'repository_archive_invalid');
        }
        return readBytes(response, maximum);
    }
    fail(400, 'repository_archive_invalid');
}

async function inspectRelease(
    env: Env,
    repository: Json,
    expected: ExpectedResource,
    maximum: number,
    signal: AbortSignal,
    options: { pinned?: RepositorySource; reusable?: ReusableRelease } = {},
): Promise<RepositoryInspection | null> {
    const canonical = repository.html_url as string;
    const path = canonical.slice(19);
    const endpoint = options.pinned ? `tags/${encodeURIComponent(options.pinned.tag)}` : 'latest';
    const response = await request(`https://api.github.com/repos/${path}/releases/${endpoint}`, signal, env);
    if (response.status === 404) {
        await response.body?.cancel();
        fail(400, 'repository_release_required');
    }
    if (response.status !== 200) {
        await response.body?.cancel();
        fail(400, 'repository_release_invalid');
    }
    let release: Json;
    try {
        const value: unknown = JSON.parse(new TextDecoder().decode(await readBytes(response, 512 * 1024)));
        if (!object(value)) {
            fail(400, 'repository_release_invalid');
        }
        release = value;
    } catch (cause) {
        if (cause instanceof SyntaxError) {
            fail(400, 'repository_release_invalid');
        }
        throw cause;
    }
    const version = repositoryVersion(release.tag_name);
    if (
        !version ||
        release.draft !== false ||
        release.prerelease !== false ||
        !Array.isArray(release.assets) ||
        release.assets.length > 100
    ) {
        fail(400, 'repository_release_invalid');
    }
    const tag = release.tag_name as string;
    const commit = await releaseCommit(env, path, tag, signal);
    if (options.pinned && (options.pinned.tag !== tag || (options.pinned.commit && options.pinned.commit !== commit))) {
        fail(409, 'repository_identity_changed');
    }
    const sourceManifest = await json(
        `https://raw.githubusercontent.com/${path}/${commit}/manifest.json`,
        signal,
        128 * 1024,
    );
    if (
        typeof sourceManifest.id !== 'string' ||
        !/^[a-z][a-z0-9-]{1,49}$/.test(sourceManifest.id) ||
        !['plugin', 'theme', 'game'].includes(String(sourceManifest.type)) ||
        sourceManifest.version !== version ||
        (expected.slug !== undefined && sourceManifest.id !== expected.slug) ||
        (expected.type !== undefined && sourceManifest.type !== expected.type)
    ) {
        fail(400, 'repository_manifest_invalid');
    }
    const zipAssets = release.assets.filter(
        (asset): asset is Json =>
            object(asset) && typeof asset.name === 'string' && /^[A-Za-z0-9_.-]+\.zip$/.test(asset.name),
    );
    const selected =
        zipAssets.find((asset) => asset.name === `${sourceManifest.id}-${version}.zip`) ??
        (zipAssets.length === 1 ? zipAssets[0] : undefined);
    if (
        !selected ||
        selected.state !== 'uploaded' ||
        !Number.isSafeInteger(selected.size) ||
        Number(selected.size) <= 0
    ) {
        fail(400, 'repository_archive_required');
    }
    if (Number(selected.size) > maximum) {
        fail(413, 'archive_size');
    }
    const archiveUrl = `${canonical}/releases/download/${encodeURIComponent(tag)}/${selected.name}`;
    if (selected.browser_download_url !== archiveUrl) {
        fail(400, 'repository_archive_invalid');
    }
    const reusable = options.reusable;
    if (
        reusable &&
        reusable.source.tag === tag &&
        reusable.source.commit === commit &&
        reusable.source.archiveUrl === archiveUrl &&
        reusable.source.assetId !== undefined &&
        reusable.source.assetId === selected.id &&
        reusable.source.assetUpdatedAt !== undefined &&
        reusable.source.assetUpdatedAt === selected.updated_at &&
        reusable.source.assetDigest !== undefined &&
        reusable.source.assetDigest === selected.digest &&
        selected.digest === `sha256:${reusable.sha256}` &&
        canonicalJson(reusable.manifest) === canonicalJson(sourceManifest)
    ) {
        return null;
    }
    const bytes = await archiveBytes(archiveUrl, maximum, signal);
    if (bytes.byteLength !== selected.size) {
        fail(400, 'repository_archive_invalid');
    }
    if (
        selected.digest != null &&
        (typeof selected.digest !== 'string' || selected.digest !== `sha256:${await sha256(bytes)}`)
    ) {
        fail(400, 'repository_archive_invalid');
    }
    let inspection: ArchiveInspection;
    try {
        inspection = inspectArchive(bytes, {
            slug: sourceManifest.id,
            type: sourceManifest.type as ResourceType,
            version,
        });
    } catch (cause) {
        if (cause instanceof ArchiveError) {
            fail(400, cause.code);
        }
        throw cause;
    }
    if (canonicalJson(inspection.manifest) !== canonicalJson(sourceManifest)) {
        fail(400, 'repository_manifest_invalid');
    }
    if (inspection.expandedBytes > maxRepositoryExpandedBytes) {
        fail(400, 'archive_expansion');
    }
    return {
        source: {
            kind: 'github',
            repository: canonical,
            repositoryId: repository.id as number,
            owner: (repository.owner as Json).login as string,
            tag,
            archiveUrl,
            commit,
            ...(Number.isSafeInteger(selected.id) ? { assetId: selected.id as number } : {}),
            ...(typeof selected.updated_at === 'string' ? { assetUpdatedAt: selected.updated_at } : {}),
            ...(typeof selected.digest === 'string' ? { assetDigest: selected.digest } : {}),
        },
        bytes,
        inspection,
    };
}

export async function inspectRepository(
    env: Env,
    actorId: string,
    url: string,
    expected: ExpectedResource = {},
    options: { source?: RepositorySource; maxBytes?: number } = {},
): Promise<RepositoryInspection> {
    const signal = AbortSignal.timeout(30000);
    const repository = await publicRepository(env, url, signal, options.source);
    await requireOwnership(env, actorId, repository, signal);
    const maximum = Math.min(options.maxBytes ?? (await effectiveUploadLimit(env, actorId)), maxRepositoryArchiveBytes);
    const result = await inspectRelease(env, repository, expected, maximum, signal, { pinned: options.source });
    if (!result) {
        fail(400, 'repository_release_invalid');
    }
    return result;
}

export function resolveRepositoryRelease(
    env: Env,
    source: RepositorySource,
    expected?: ExpectedResource,
): Promise<RepositoryInspection>;
export function resolveRepositoryRelease(
    env: Env,
    source: RepositorySource,
    expected: ExpectedResource,
    reusable: ReusableRelease,
): Promise<RepositoryInspection | null>;
export async function resolveRepositoryRelease(
    env: Env,
    source: RepositorySource,
    expected: ExpectedResource = {},
    reusable?: ReusableRelease,
): Promise<RepositoryInspection | null> {
    const signal = AbortSignal.timeout(30000);
    const repository = await publicRepository(env, source.repository, signal, source);
    return inspectRelease(env, repository, expected, maxRepositoryArchiveBytes, signal, { reusable });
}
