import { valid } from 'semver';

export const maxRepositoryArchiveBytes = 50 * 1024 * 1024;
export const maxRepositoryExpandedBytes = 100 * 1024 * 1024;

export interface RepositorySource {
    kind: 'github';
    repository: string;
    repositoryId: number;
    owner: string;
    tag: string;
    archiveUrl: string;
    commit?: string;
    assetId?: number;
    assetUpdatedAt?: string;
    assetDigest?: string;
}

export function repositoryUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 250) {
        return null;
    }
    const match =
        /^https:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/([A-Za-z0-9_.-]{1,100})\/?$/i.exec(
            value.trim(),
        );
    if (!match || ['.', '..'].includes(match[2])) {
        return null;
    }
    const name = match[2].replace(/\.git$/i, '');
    return name && !['.', '..'].includes(name) ? `https://github.com/${match[1]}/${name}` : null;
}

export function repositoryVersion(tag: unknown): string | null {
    if (typeof tag !== 'string' || tag.length > 101) {
        return null;
    }
    const version = tag.replace(/^v/, '');
    return valid(version) === version && !version.includes('-') ? version : null;
}

export function parseRepositorySource(payload: unknown): RepositorySource | null {
    let value = payload;
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            return null;
        }
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const candidate = 'source' in value ? value.source : value;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        return null;
    }
    const source = candidate as Record<string, unknown>;
    const repository = repositoryUrl(source.repository);
    if (
        source.kind !== 'github' ||
        !repository ||
        repository !== source.repository ||
        typeof source.repositoryId !== 'number' ||
        !Number.isSafeInteger(source.repositoryId) ||
        source.repositoryId <= 0 ||
        typeof source.owner !== 'string' ||
        source.owner.toLowerCase() !== repository.split('/')[3].toLowerCase() ||
        !repositoryVersion(source.tag) ||
        typeof source.archiveUrl !== 'string' ||
        source.archiveUrl.length > 2048 ||
        !source.archiveUrl.startsWith(`${repository}/releases/download/${encodeURIComponent(String(source.tag))}/`) ||
        !/^[A-Za-z0-9_.-]+\.zip$/.test(
            source.archiveUrl.slice(
                `${repository}/releases/download/${encodeURIComponent(String(source.tag))}/`.length,
            ),
        ) ||
        (source.commit !== undefined && (typeof source.commit !== 'string' || !/^[a-f0-9]{40}$/.test(source.commit))) ||
        (source.assetId !== undefined &&
            (typeof source.assetId !== 'number' || !Number.isSafeInteger(source.assetId) || source.assetId <= 0)) ||
        (source.assetUpdatedAt !== undefined &&
            (typeof source.assetUpdatedAt !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(source.assetUpdatedAt))) ||
        (source.assetDigest !== undefined &&
            (typeof source.assetDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(source.assetDigest)))
    ) {
        return null;
    }
    return {
        kind: 'github',
        repository,
        repositoryId: source.repositoryId,
        owner: source.owner,
        tag: source.tag as string,
        archiveUrl: source.archiveUrl,
        ...(source.commit ? { commit: source.commit as string } : {}),
        ...(source.assetId ? { assetId: source.assetId as number } : {}),
        ...(source.assetUpdatedAt ? { assetUpdatedAt: source.assetUpdatedAt as string } : {}),
        ...(source.assetDigest ? { assetDigest: source.assetDigest as string } : {}),
    };
}
