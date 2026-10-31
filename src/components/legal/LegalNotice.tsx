import { Link } from 'react-router-dom';
import { useLocale } from '../../lib/i18n';
import { legalMessages } from '../../lib/translations';

export function LegalNotice({
    context,
    className = '',
}: {
    context?: 'account' | 'creator' | 'purchase';
    className?: string;
}) {
    const { locale, path } = useLocale();
    const copy = legalMessages[locale];

    return (
        <p className={`small text-body-secondary ${className}`}>
            {context && <>{copy.notices[context]} </>}
            <Link to={path('/terms')}>{copy.terms.title}</Link>
            {' · '}
            <Link to={path('/privacy')}>{copy.privacy.title}</Link>.
        </p>
    );
}
