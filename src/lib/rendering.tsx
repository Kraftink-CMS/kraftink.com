import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CatalogueResource } from '../../shared/catalogue';
import type { Guide } from './documentation';
import type { SessionData } from '../../shared/auth';

export interface PublicPageData {
    locale: string;
    origin: string;
    guides?: Guide[];
    catalogue?: { resources: CatalogueResource[]; state: string };
    catalogueIdentity?: string;
    sources?: unknown;
    releases?: unknown;
}

export interface PageData extends PublicPageData {
    session: SessionData;
}

const PublicPageContext = createContext<{
    data: PublicPageData;
    update: (values: Partial<PublicPageData>) => void;
} | null>(null);

export function PublicPageProvider({ initial, children }: { initial: PublicPageData; children: ReactNode }) {
    const [data, setData] = useState(initial);
    const update = useCallback((values: Partial<PublicPageData>) => {
        setData((current) => ({
            ...current,
            ...(values.locale && values.locale !== current.locale ? { guides: undefined } : {}),
            ...values,
        }));
    }, []);
    const value = useMemo(() => ({ data, update }), [data, update]);
    return <PublicPageContext.Provider value={value}>{children}</PublicPageContext.Provider>;
}

export function usePublicPageData() {
    const context = useContext(PublicPageContext);
    if (!context) {
        throw new Error('PublicPageProvider required');
    }
    return context;
}
