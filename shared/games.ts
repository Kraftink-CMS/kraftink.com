import { localeRegistry } from './locales';

export interface BundledGame {
    name: string;
    slug: string;
    icon: string;
    accent?: 'blue' | 'green' | 'orange' | 'teal' | 'violet' | 'gold';
    guide?: string;
}

// Game modules bundled with KraftInk, keyed by their manifest IDs.
export const bundledGames = {
    minecraft: { name: 'Minecraft Java', slug: 'minecraft', icon: 'grid-3x3-gap', accent: 'green', guide: 'kraftlink' },
    minecraftbedrock: {
        name: 'Minecraft Bedrock',
        slug: 'minecraft-bedrock',
        icon: 'box-seam',
        accent: 'teal',
        guide: 'kraftlink',
    },
    hytale: { name: 'Hytale', slug: 'hytale', icon: 'compass', accent: 'violet', guide: 'kraftlink' },
    garrysmod: { name: 'Garry’s Mod', slug: 'gmod', icon: 'joystick', accent: 'blue' },
    rust: { name: 'Rust', slug: 'rust', icon: 'fire', accent: 'orange' },
    fivem: { name: 'FiveM', slug: 'fivem', icon: 'car-front' },
    dayz: { name: 'DayZ', slug: 'dayz', icon: 'backpack', accent: 'green' },
    ark: { name: 'ARK: Survival Evolved', slug: 'ark-survival-evolved', icon: 'sunrise', accent: 'teal' },
    sevendaystodie: { name: '7 Days to Die', slug: '7-days-to-die', icon: 'moon-stars', accent: 'orange' },
    counterstrike2: { name: 'Counter-Strike 2', slug: 'counter-strike-2', icon: 'crosshair', accent: 'gold' },
    teamfortress2: { name: 'Team Fortress 2', slug: 'team-fortress-2', icon: 'flag', accent: 'orange' },
    unturned: { name: 'Unturned', slug: 'unturned', icon: 'tree', accent: 'green' },
    projectzomboid: { name: 'Project Zomboid', slug: 'project-zomboid', icon: 'broadcast' },
    redm: { name: 'RedM', slug: 'redm', icon: 'signpost-split', accent: 'gold' },
    arkascended: {
        name: 'ARK: Survival Ascended',
        slug: 'ark-survival-ascended',
        icon: 'globe-americas',
        accent: 'blue',
    },
    palworld: { name: 'Palworld', slug: 'palworld', icon: 'heart-pulse', accent: 'violet' },
    satisfactory: { name: 'Satisfactory', slug: 'satisfactory', icon: 'gear-wide-connected', accent: 'gold' },
    conanexiles: { name: 'Conan Exiles', slug: 'conan-exiles', icon: 'sun', accent: 'orange' },
} satisfies Record<string, BundledGame>;

export type BundledGameId = keyof typeof bundledGames;
export const bundledGameIds = Object.keys(bundledGames) as BundledGameId[];

export function isBundledGame(game: string): game is BundledGameId {
    return Object.hasOwn(bundledGames, game);
}

function gamePageSlug(locale: string, game: BundledGameId): string {
    const { slug } = bundledGames[game];
    return locale === 'fr' ? `cms-serveur-${slug}` : `${slug}-server-cms`;
}

export function gamePagePath(locale: string, game: BundledGameId): string {
    return `/${locale}/${gamePageSlug(locale, game)}`;
}

export const gamePageRoutes = Object.keys(localeRegistry).flatMap((locale) =>
    bundledGameIds.map((game) => {
        const slug = gamePageSlug(locale, game);
        return { game, slug, pathname: `/${locale}/${slug}` };
    }),
);

export function matchGamePage(pathname: string): BundledGameId | undefined {
    const path = pathname.replace(/\/+$/, '');
    return gamePageRoutes.find((route) => route.pathname === path)?.game;
}

export function unprefixedGamePagePath(pathname: string): string | undefined {
    const slug = pathname.slice(1).replace(/\/+$/, '');
    return gamePageRoutes.find((route) => route.slug === slug)?.pathname;
}
