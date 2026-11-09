export interface ResourceSupport {
    discord?: string;
    email?: string;
}

export interface GameCompatibility {
    games?: { supported: string[]; excluded?: string[]; enhancements?: string[] };
}

export interface CatalogueVersion extends GameCompatibility {
    version: string;
    requirements: Record<string, string>;
    download?: { url: string; sha256: string };
}

export interface CatalogueResource {
    id: string;
    slug: string;
    type: 'plugin' | 'theme' | 'game';
    name: string | Record<string, string>;
    description: string | Record<string, string>;
    image?: string | Record<string, string>;
    author: { id: string; name: string; url?: string };
    support?: ResourceSupport;
    repository?: string;
    commercial: { kind: 'free' | 'paid'; price?: { amount: string; currency: string }; url?: string };
    access?: { allowed: boolean; code?: string };
    manual_only: boolean;
    versions: CatalogueVersion[];
    resourceId?: string;
}

export interface PublicCatalogue {
    resources: CatalogueResource[];
    state: 'fresh' | 'stale' | 'unavailable';
    fetchedAt: number | null;
}

export function gameCompatibility(value: object, type: unknown): GameCompatibility | null {
    if (['supported_games', 'excluded_games', 'game_enhancements'].some((key) => Object.hasOwn(value, key))) {
        return null;
    }
    if (type !== 'plugin') {
        return Object.hasOwn(value, 'games') ? null : {};
    }
    const games = (value as Record<string, unknown>).games;
    if (!games || typeof games !== 'object' || Array.isArray(games) || Object.keys(games).some((key) => !['supported', 'excluded', 'enhancements'].includes(key))) {
        return null;
    }
    const { supported, excluded = [], enhancements = [] } = games as Record<string, unknown>;
    const validIds = (list: unknown): list is string[] =>
        Array.isArray(list) && list.length <= 50 && new Set(list).size === list.length &&
        [...list].every((id) => typeof id === 'string' && id === id.trim() && /^[a-z][a-z0-9-]{1,49}$/.test(id));
    const all = Array.isArray(supported) && supported.length === 1 && supported[0] === '*';
    if (
        (!all && (!validIds(supported) || supported.length === 0)) ||
        !validIds(excluded) || !validIds(enhancements) ||
        (!all && excluded.length > 0) ||
        enhancements.some((id) => (!all && !supported.includes(id)) || excluded.includes(id))
    ) {
        return null;
    }
    return { games: { supported, ...(excluded.length ? { excluded } : {}), ...(enhancements.length ? { enhancements } : {}) } };
}

export function validResourceSupport(value: unknown): value is ResourceSupport {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const discord =
        /^https:\/\/(?:discord\.gg\/[A-Za-z0-9_-]{1,100}|discord\.com\/invite\/[A-Za-z0-9_-]{1,100}|discord\.kraftink\.com)\/?$/;
    const email =
        /^[A-Za-z0-9_+-]+(?:\.[A-Za-z0-9_+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
    return Object.entries(value).every(
        ([channel, contact]) =>
            typeof contact === 'string' &&
            contact === contact.trim() &&
            (channel === 'discord'
                ? discord.test(contact)
                : channel === 'email' && contact.length <= 254 && email.test(contact)),
    );
}
