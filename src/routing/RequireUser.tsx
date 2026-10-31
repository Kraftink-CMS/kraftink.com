import { useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasRole, type Role } from '../../shared/auth';
import { useLocale } from '../lib/i18n';
import { useSession } from '../lib/session';
import { commonMessages } from '../lib/translations';
import { ErrorNotice, Loading } from '../components/UI';

export function RequireUser({ role, children }: { role?: Role; children: ReactNode }) {
    const { user, loading, sessionError, refresh } = useSession();
    const [retrying, setRetrying] = useState(false);
    const { locale, path } = useLocale();
    const location = useLocation();
    if (loading) {
        return <Loading />;
    }
    if (sessionError) {
        return (
            <>
                <ErrorNotice error={sessionError} />
                <button
                    type="button"
                    className="btn btn-outline-primary"
                    disabled={retrying}
                    onClick={() => {
                        setRetrying(true);
                        void refresh()
                            .catch(() => undefined)
                            .finally(() => setRetrying(false));
                    }}
                >
                    {retrying ? commonMessages[locale].loading : commonMessages[locale].retry}
                </button>
            </>
        );
    }
    if (!user) {
        return (
            <Navigate
                replace
                to={`${path('/login')}?next=${encodeURIComponent(location.pathname + location.search)}`}
            />
        );
    }
    if (role && !hasRole(user, role)) {
        return (
            <div className="alert alert-danger" role="alert">
                {commonMessages[locale].permissionDenied}
            </div>
        );
    }
    return children;
}
