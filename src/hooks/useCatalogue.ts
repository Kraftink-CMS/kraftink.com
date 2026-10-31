import { useEffect, useState } from 'react';
import type { CatalogueResource } from '../../shared/catalogue';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { usePublicPageData } from '../lib/rendering';

export function useCatalogue() {
    const { user } = useSession();
    const { data: initial, update } = usePublicPageData();
    const identity = user?.id ?? 'public';
    const [result, setResult] = useState<{
        identity: string;
        data: { resources: CatalogueResource[]; state: string } | null;
        error: unknown;
    } | null>(() => (initial.catalogue ? { identity: 'public', data: initial.catalogue, error: null } : null));
    useEffect(() => {
        const controller = new AbortController();
        setResult((current) => ({ identity, data: current?.identity === identity ? current.data : null, error: null }));
        api<{ resources: CatalogueResource[]; state: string }>('/api/catalogue', { signal: controller.signal })
            .then((data) => {
                if (!controller.signal.aborted) {
                    setResult({ identity, data, error: null });
                    if (identity === 'public') {
                        update({ catalogue: data });
                    }
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setResult((current) => ({
                        identity,
                        data: current?.identity === identity ? current.data : null,
                        error,
                    }));
                }
            });
        return () => controller.abort();
    }, [identity, update]);
    return result?.identity === identity ? result : { data: null, error: null };
}
