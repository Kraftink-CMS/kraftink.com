export interface CatalogueVersion {
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
