export const discordUrl = 'https://discord.kraftink.com';

export function externalLinkRel(href: string | undefined): string {
    const safe = 'noopener noreferrer';
    if (!href) {
        return safe;
    }
    let url: URL;
    try {
        url = new URL(href, 'https://kraftink.com');
    } catch {
        return `${safe} nofollow`;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return safe;
    }
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const owned = hostname === 'kraftink.com' || hostname.endsWith('.kraftink.com');
    const github =
        hostname === 'github.com' ||
        hostname.endsWith('.github.com') ||
        hostname === 'githubusercontent.com' ||
        hostname.endsWith('.githubusercontent.com');
    return (owned && hostname !== 'discord.kraftink.com') || github ? safe : `${safe} nofollow`;
}
