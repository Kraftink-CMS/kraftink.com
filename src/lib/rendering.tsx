import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CatalogueResource } from '../../shared/catalogue';
import { fallbackLocale } from '../../shared/locales';
import type { Guide } from './documentation';

export interface PublicPageData {
    locale: string;
    origin?: string;
    guides?: Guide[];
    catalogue?: { resources: CatalogueResource[]; state: string };
    sources?: unknown;
    releases?: unknown;
}

const PublicPageContext = createContext<{
    data: PublicPageData;
    update: (values: Partial<PublicPageData>) => void;
}>({ data: { locale: fallbackLocale }, update: () => undefined });

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
    return useContext(PublicPageContext);
}
