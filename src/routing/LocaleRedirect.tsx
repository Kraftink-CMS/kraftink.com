import { Navigate, useLocation } from 'react-router-dom';
import { useLocale } from '../lib/i18n';
import { localizedPathname } from '../../shared/locales';

export function LocaleRedirect() {
    const location = useLocation();
    const { preferred } = useLocale();
    return (
        <Navigate replace to={`${localizedPathname(location.pathname, preferred)}${location.search}${location.hash}`} />
    );
}
