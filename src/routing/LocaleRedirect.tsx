import { Navigate, useLocation } from 'react-router-dom';
import { preferredLocale } from '../lib/i18n';
import { localizedPathname } from '../../shared/locales';

export function LocaleRedirect() {
    const location = useLocation();
    return (
        <Navigate
            replace
            to={`${localizedPathname(location.pathname, preferredLocale())}${location.search}${location.hash}`}
        />
    );
}
