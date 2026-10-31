export type ReleaseChannel = 'stable' | 'beta' | 'alpha' | 'prerelease';

export interface InstallationRelease {
    name: string;
    tag: string;
    channel: ReleaseChannel;
    published: number;
    filename: string;
    bytes: number;
    downloadUrl: string;
    checksumUrl: string | null;
    notesUrl: string;
}

export interface ReleaseSource {
    repository: string;
    releasesUrl: string;
}

function record(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function githubReleaseUrl(value: unknown, repository: string, suffix: string[]): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    try {
        const url = new URL(value);
        const parts = url.pathname.replace(/\/$/, '').split('/').slice(1).map(decodeURIComponent);
        const owner = repository.split('/');
        if (
            url.protocol !== 'https:' ||
            url.hostname !== 'github.com' ||
            url.port ||
            url.username ||
            url.password ||
            url.search ||
            url.hash ||
            parts.length !== owner.length + suffix.length ||
            owner.some((part, index) => part.toLowerCase() !== parts[index]?.toLowerCase()) ||
            suffix.some((part, index) => part !== parts[index + owner.length])
        ) {
            return null;
        }
        return url.href;
    } catch {
        return null;
    }
}

export function releaseSource(value: unknown): ReleaseSource {
    const source = record(value);
    const sourceRepository = source?.repository;
    if (typeof sourceRepository !== 'string') {
        throw new Error('service_unavailable');
    }
    let repository: string = sourceRepository;
    if (repository.startsWith('https://github.com/')) {
        const url = new URL(repository);
        if (url.port || url.username || url.password || url.search || url.hash) {
            throw new Error('service_unavailable');
        }
        repository = url.pathname.replace(/^\/|\/$/g, '');
    }
    if (!/^[a-z\d_.-]+\/[a-z\d_.-]+$/i.test(repository)) {
        throw new Error('service_unavailable');
    }
    const releasesUrl = githubReleaseUrl(source?.releasesUrl, repository, ['releases']);
    const releasesApi = new URL(String(source?.releasesApi));
    if (
        !releasesUrl ||
        releasesApi.protocol !== 'https:' ||
        releasesApi.hostname !== 'api.github.com' ||
        releasesApi.port ||
        releasesApi.username ||
        releasesApi.password ||
        releasesApi.search ||
        releasesApi.hash ||
        releasesApi.pathname.toLowerCase() !== `/repos/${repository}/releases`.toLowerCase()
    ) {
        throw new Error('service_unavailable');
    }
    return { repository, releasesUrl };
}

export function installationReleases(payload: unknown, source: ReleaseSource): InstallationRelease[] {
    if (!Array.isArray(payload)) {
        return [];
    }
    const releases: InstallationRelease[] = [];
    const seen = new Set<string>();
    for (const item of payload.slice(0, 1000)) {
        const release = record(item);
        const tag = release?.tag_name;
        const version =
            typeof tag === 'string' && tag.length <= 128
                ? tag.match(/^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/)?.[1]
                : null;
        if (
            !release ||
            release.draft !== false ||
            typeof release.prerelease !== 'boolean' ||
            !version ||
            typeof tag !== 'string' ||
            seen.has(tag) ||
            !Array.isArray(release.assets) ||
            typeof release.published_at !== 'string'
        ) {
            continue;
        }
        const published = Date.parse(release.published_at);
        const notesUrl = githubReleaseUrl(release.html_url, source.repository, ['releases', 'tag', tag]);
        if (!Number.isFinite(published) || !notesUrl) {
            continue;
        }
        const filename = `KraftInk-${version}.zip`;
        let installer: { bytes: number; url: string } | null = null;
        let checksumUrl: string | null = null;
        for (const item of release.assets.slice(0, 1000)) {
            const asset = record(item);
            if (asset?.state !== 'uploaded' || (asset.name !== filename && asset.name !== `${filename}.sha256`)) {
                continue;
            }
            const url = githubReleaseUrl(asset.browser_download_url, source.repository, [
                'releases',
                'download',
                tag,
                String(asset.name),
            ]);
            if (!url) {
                continue;
            }
            if (
                asset.name === filename &&
                typeof asset.size === 'number' &&
                Number.isSafeInteger(asset.size) &&
                asset.size > 0
            ) {
                installer ??= { bytes: asset.size, url };
            } else if (asset.name === `${filename}.sha256`) {
                checksumUrl ??= url;
            }
        }
        if (!installer) {
            continue;
        }
        const prereleaseName = version.match(/-(alpha|beta)(?:[.\-]|$)/i)?.[1]?.toLowerCase();
        const channel: ReleaseChannel = release.prerelease
            ? prereleaseName === 'alpha' || prereleaseName === 'beta'
                ? prereleaseName
                : 'prerelease'
            : 'stable';
        releases.push({
            name:
                typeof release.name === 'string' && release.name.trim()
                    ? release.name.slice(0, 240)
                    : `KraftInk ${version}`,
            tag,
            channel,
            published,
            filename,
            bytes: installer.bytes,
            downloadUrl: installer.url,
            checksumUrl,
            notesUrl,
        });
        seen.add(tag);
    }
    return releases.sort((left, right) => right.published - left.published);
}
