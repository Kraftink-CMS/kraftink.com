import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Card, Empty, ErrorNotice, Loading, Skeleton, PageTitle } from '../../components/UI';
import { useCatalogue } from '../../hooks/useCatalogue';
import { api } from '../../lib/api';
import { localized, useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { commonMessages, publicMessages } from '../../lib/translations';
import { resourcePrice } from '../../lib/catalogue';
import { LegalNotice } from '../../components/legal/LegalNotice';
import { externalLinkRel } from '../../../shared/links';

export function ResourcePage() {
    const { locale, path } = useLocale();
    const text = publicMessages[locale];
    const common = commonMessages[locale];
    const [search] = useSearchParams();
    const params = useParams();
    const { data, error } = useCatalogue();
    const { user } = useSession();
    const [failure, setFailure] = useState<unknown>(null);
    const [busy, setBusy] = useState(false);
    const id = params.resourceId ?? search.get('resource') ?? search.get('id');
    const resource = data?.resources.find((entry) => entry.resourceId === id || entry.id === id);
    async function checkout(event: FormEvent) {
        event.preventDefault();
        if (!resource?.resourceId) {
            return;
        }
        setBusy(true);
        try {
            const result = await api<{ url: string }>('/api/checkout', {
                method: 'POST',
                json: { resourceId: resource.resourceId },
            });
            window.location.assign(result.url);
        } catch (failure) {
            setFailure(failure);
            setBusy(false);
        }
    }
    if (!data) {
        return error ? (
            <ErrorNotice error={error} />
        ) : (
            <Loading>
                <Skeleton width="10rem" className="mb-4" />
                <Skeleton width="50%" height="2rem" className="mb-3" />
                <Skeleton width="75%" className="mb-4" />
                <div className="row g-4">
                    <div className="col-lg-8">
                        <Card title={text.compatibility}>
                            <dl className="metadata-list">
                                {[common.author, common.version, text.cms, text.php].map((label) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>
                                            <Skeleton height="1.5rem" width="65%" />
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>
                    </div>
                    <div className="col-lg-4">
                        <Card title={<Skeleton width="40%" height="1.25rem" />}>
                            <Skeleton height="2.75rem" />
                        </Card>
                    </div>
                </div>
            </Loading>
        );
    }
    if (!resource) {
        return (
            <>
                <PageTitle title={common.market} />
                <Empty>{text.noResource}</Empty>
                <Link to={path('/market')}>{text.returnMarket}</Link>
            </>
        );
    }
    const version = resource.versions[0];
    return (
        <>
            <Link className="back-link" to={path('/market')}>
                ← {text.returnMarket}
            </Link>
            <PageTitle title={localized(resource.name, locale)} description={localized(resource.description, locale)}>
                <span className="badge text-bg-light">{common[resource.type]}</span>
            </PageTitle>
            <div className="row g-4">
                <div className="col-lg-8">
                    <Card title={text.compatibility}>
                        <dl className="metadata-list">
                            <div>
                                <dt>{common.author}</dt>
                                <dd>{resource.author.name}</dd>
                            </div>
                            <div>
                                <dt>{common.version}</dt>
                                <dd>{version?.version}</dd>
                            </div>
                            {Object.entries(version?.requirements ?? {}).map(([key, value]) => (
                                <div key={key}>
                                    <dt>{key === 'cms' ? text.cms : key === 'php' ? text.php : key}</dt>
                                    <dd>
                                        <code>{value}</code>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        {resource.repository && (
                            <a href={resource.repository} target="_blank" rel={externalLinkRel(resource.repository)}>
                                {text.source} ↗
                            </a>
                        )}
                    </Card>
                </div>
                <div className="col-lg-4">
                    <Card
                        title={
                            resource.commercial.kind === 'free'
                                ? common.free
                                : resource.resourceId && resource.access?.allowed
                                  ? common.purchased
                                  : resourcePrice(resource, locale)
                        }
                    >
                        <ErrorNotice error={failure} />
                        {resource.commercial.kind === 'free' ? (
                            <a
                                className="btn btn-primary w-100"
                                href={version?.download?.url ?? resource.repository}
                                target="_blank"
                                rel={externalLinkRel(version?.download?.url ?? resource.repository)}
                            >
                                {common.download}
                            </a>
                        ) : !resource.resourceId ? (
                            <a
                                className="btn btn-primary w-100"
                                href={resource.commercial.url ?? resource.repository}
                                target="_blank"
                                rel={externalLinkRel(resource.commercial.url ?? resource.repository)}
                            >
                                {text.external}
                            </a>
                        ) : resource.access?.allowed ? (
                            <>
                                <p>{text.boughtHelp}</p>
                                <Link to={path('/account')} className="btn btn-primary w-100">
                                    {common.purchases}
                                </Link>
                            </>
                        ) : (
                            <>
                                <p>{text.checkoutHelp}</p>
                                <LegalNotice context="purchase" />
                                {user ? (
                                    <form onSubmit={checkout}>
                                        <button className="btn btn-primary w-100" disabled={busy} type="submit">
                                            {busy ? common.loading : text.confirmBuy}
                                        </button>
                                    </form>
                                ) : (
                                    <Link
                                        className="btn btn-primary w-100"
                                        to={`${path('/login')}?next=${encodeURIComponent(path('/market/resource') + '?resource=' + resource.resourceId)}`}
                                    >
                                        {common.login}
                                    </Link>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}
