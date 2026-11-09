import { useEffect, useState } from 'react';
import type { CatalogueResource } from '../../shared/catalogue';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { usePublicPageData } from '../lib/rendering';

export function useCatalogue(resourceId?: string) {
    const { user } = useSession();
    const { data: initial, update } = usePublicPageData();
    const identity = user?.id ?? 'public';
    const scope = JSON.stringify([identity, resourceId]);
    const [result, setResult] = useState<{
        scope: string;
        data: { resources: CatalogueResource[]; state: string } | null;
        error: unknown;
    } | null>(() =>
        initial.catalogue && initial.catalogueIdentity === identity && initial.catalogueResource === resourceId
            ? { scope, data: initial.catalogue, error: null }
            : null,
    );
    useEffect(() => {
        const controller = new AbortController();
        setResult((current) => ({ scope, data: current?.scope === scope ? current.data : null, error: null }));
        const url = resourceId ? `/api/catalogue?resource=${encodeURIComponent(resourceId)}` : '/api/catalogue';
        api<{ resources: CatalogueResource[]; state: string }>(url, { signal: controller.signal })
            .then((data) => {
                if (!controller.signal.aborted) {
                    setResult({ scope, data, error: null });
                    update({ catalogue: data, catalogueIdentity: identity, catalogueResource: resourceId });
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setResult((current) => ({
                        scope,
                        data: current?.scope === scope ? current.data : null,
                        error,
                    }));
                }
            });
        return () => controller.abort();
    }, [identity, resourceId, scope, update]);
    return result?.scope === scope ? result : { data: null, error: null };
}
