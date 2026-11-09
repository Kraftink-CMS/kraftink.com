export interface ResourceSupport {
    discord?: string;
    email?: string;
}

export interface GameCompatibility {
    supported_games?: string[];
    excluded_games?: string[];
    game_enhancements?: string[];
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
    const fields: GameCompatibility = {};
    for (const key of ['supported_games', 'excluded_games', 'game_enhancements'] as const) {
        const list = (value as Record<string, unknown>)[key];
        if (list === undefined) {
            continue;
        }
        if (
            type !== 'plugin' ||
            !Array.isArray(list) ||
            list.length > 50 ||
            new Set(list).size !== list.length ||
            [...list].some((id) => typeof id !== 'string' || id !== id.trim() || !/^[a-z][a-z0-9-]{1,49}$/.test(id))
        ) {
            return null;
        }
        if (list.length > 0) {
            fields[key] = list;
        }
    }
    const {
        supported_games: supported = [],
        excluded_games: excluded = [],
        game_enhancements: enhancements = [],
    } = fields;
    if (
        (supported.length && excluded.length) ||
        enhancements.some((id) => (supported.length && !supported.includes(id)) || excluded.includes(id))
    ) {
        return null;
    }
    return fields;
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
