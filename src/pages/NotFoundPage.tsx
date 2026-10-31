import { Link } from 'react-router-dom';
import { PageTitle } from '../components/UI';
import { useLocale } from '../lib/i18n';
import { publicMessages } from '../lib/translations';

export function NotFoundPage() {
    const { locale, path } = useLocale();
    const text = publicMessages[locale];
    return (
        <>
            <PageTitle title={text.notFound} description={text.notFoundText} />
            <Link to={path('/')} className="btn btn-primary">
                {text.returnHome}
            </Link>
        </>
    );
}
