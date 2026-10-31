import { Link } from 'react-router-dom';
import { PageTitle } from '../../components/UI';
import { useLocale } from '../../lib/i18n';
import { commonMessages, publicMessages } from '../../lib/translations';

export function CheckoutReturnPage() {
    const { locale, path } = useLocale();
    const text = publicMessages[locale];
    return (
        <>
            <PageTitle title={text.verified} description={text.paymentPending} />
            <Link to={path('/account')} className="btn btn-primary">
                {commonMessages[locale].purchases}
            </Link>
        </>
    );
}
