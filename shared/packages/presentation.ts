export const marketMarkdownMaxBytes = 32 * 1024;
export const marketMarkdownTotalBytes = 128 * 1024;
export const marketMarkdownMaxLocales = 8;
export const marketChangelogMaxBytes = 8 * 1024;
export const marketHistoryLimit = 100;
export const marketAssetMaxCount = 8;
export const marketAssetTotalBytes = 6 * 1024 * 1024;

const marketDirectory = 'resources/market/';
const filePath = /^(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*$/i;

export function marketImagePath(value: string): string | null {
    if (value.length > 256 || !filePath.test(value) || !/\.(?:png|jpe?g|webp|gif|avif)$/i.test(value)) {
        return null;
    }
    return value.startsWith(marketDirectory) ? value : marketDirectory + value;
}

export function marketMarkdownPath(value: string, kind: 'MARKET' | 'CHANGELOG'): boolean {
    return (
        value.length <= 256 &&
        filePath.test(value) &&
        /\.md$/i.test(value) &&
        (value.startsWith(marketDirectory) ||
            new RegExp(`^${kind}(?:\\.[a-zA-Z0-9_-]+)?\\.md$`).test(value) ||
            new RegExp(`^lang/[a-z]{2,3}(?:[-_][a-zA-Z0-9]{2,8})*/${kind.toLowerCase()}\\.md$`).test(value))
    );
}

export function marketIconName(value: string): boolean {
    return value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function marketHttpsUrl(value: string): boolean {
    if (value.length > 2048 || !/^https:\/\/[^\s\\]+$/i.test(value)) {
        return false;
    }
    try {
        const url = new URL(value);
        return Boolean(url.hostname && !url.username && !url.password);
    } catch {
        return false;
    }
}

export function marketAssetLinks(paths: unknown, url: string): Record<string, string> {
    if (!Array.isArray(paths) || paths.length > marketAssetMaxCount) {
        return {};
    }
    return Object.fromEntries(
        paths.flatMap((path, index) =>
            typeof path === 'string' && marketImagePath(path) === path ? [[path, `${url}?asset=${index}`]] : [],
        ),
    );
}
