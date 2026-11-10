import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Card, Empty, ErrorNotice, Loading, Skeleton, PageTitle } from '../../components/UI';
import { Modal } from '../../components/Modal';
import { ResourceDetails } from '../../components/market/ResourceDetails';
import { ResourceIcon } from '../../components/market/ResourceIcon';
import { useCatalogue } from '../../hooks/useCatalogue';
import { api } from '../../lib/api';
import { localized, useLocale } from '../../lib/i18n';
import { useSession } from '../../lib/session';
import { commonMessages, publicMessages } from '../../lib/translations';
import { resourcePrice } from '../../lib/catalogue';
import { LegalNotice } from '../../components/legal/LegalNotice';
import { bundledGameNames } from '../../../shared/games';
import { discordUrl, externalLinkRel } from '../../../shared/links';
import {
    findMarketResource,
    marketResourcePath,
    marketResourceRedirect,
    matchMarketResourceRoute,
} from '../../../shared/routes';
import { NotFoundPage } from '../NotFoundPage';

function GameBadges({ games }: { games: string[] }) {
    return (
        <span className="d-inline-flex flex-wrap gap-2">
            {games.map((game) => (
                <span className="badge text-bg-light" key={game}>
                    {Object.hasOwn(bundledGameNames, game)
                        ? bundledGameNames[game]
                        : game[0].toUpperCase() + game.slice(1).replaceAll('-', ' ')}
                </span>
            ))}
        </span>
    );
}

export function ResourcePage() {
    const { locale, path } = useLocale();
    const text = publicMessages[locale];
    const common = commonMessages[locale];
    const { pathname, search, hash } = useLocation();
    const route = matchMarketResourceRoute(pathname.split('/').slice(2).join('/'), search);
    const { data, error } = useCatalogue(route?.id);
    const { user } = useSession();
    const [failure, setFailure] = useState<unknown>(null);
    const [busy, setBusy] = useState(false);
    const [downloadOpen, setDownloadOpen] = useState(false);
    const resource = route ? findMarketResource(data?.resources, route) : undefined;
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
    if (!route) {
        return <NotFoundPage />;
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
                        <Card title={text.description}>
                            <div className="vstack gap-3">
                                <Skeleton />
                                <Skeleton width="85%" />
                                <Skeleton width="65%" />
                            </div>
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
    const resourcePath = path(marketResourcePath(resource));
    const redirect = marketResourceRedirect(pathname, resourcePath, search);
    if (redirect) {
        return <Navigate replace to={redirect + hash} />;
    }
    const version = resource.versions[0];
    const supported = version?.games?.supported.filter((game) => game !== '*') ?? [];
    const excluded = version?.games?.excluded ?? [];
    const enhancements = version?.games?.enhancements ?? [];
    const preview = localized(resource.image, locale);
    const name = localized(resource.name, locale);
    const description = localized(resource.description, locale);
    const readme = localized(resource.readme, locale);
    const otherResources = data.resources.filter(
        (entry) => entry.id !== resource.id && entry.author.id === resource.author.id,
    );
    const email = resource.support?.email;
    const discord = resource.support?.discord ?? (email ? null : discordUrl);
    const free = resource.commercial.kind === 'free';
    const downloadUrl = free ? version?.download?.url : undefined;
    const repositoryUnavailable = resource.access?.code === 'repository_unavailable';
    const installLabel = resource.manual_only ? text.manualInstallation : text.installInCms;
    const downloadButton = downloadUrl && !repositoryUnavailable && (
        <button className="btn btn-primary w-100" type="button" onClick={() => setDownloadOpen(true)}>
            <i className="bi bi-download me-2" aria-hidden="true" />
            {installLabel}
        </button>
    );
    const actionUrl = free ? resource.repository : (resource.commercial.url ?? resource.repository);
    const installArea = text.installAreas[resource.type];
    return (
        <>
            <Link className="back-link" to={path('/market')}>
                ← {text.returnMarket}
            </Link>
            <header className="page-heading resource-heading gap-3">
                {(!preview || resource.type !== 'theme') && <ResourceIcon resource={resource} />}
                <div className="resource-heading-copy">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                        <h1 className="mb-0">{name}</h1>
                        <span className="badge text-bg-light">{common[resource.type]}</span>
                    </div>
                    {readme && <p>{description}</p>}
                </div>
            </header>
            {downloadButton && <div className="d-lg-none mb-4">{downloadButton}</div>}
            <div className="resource-layout">
                <div className="resource-content">
                    {preview && (
                        <img
                            className="resource-hero-image rounded border mb-4"
                            key={preview}
                            src={preview}
                            alt=""
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(event) => {
                                event.currentTarget.hidden = true;
                            }}
                        />
                    )}
                    <ResourceDetails key={resource.id} resource={resource} />
                </div>
                <aside className="resource-aside">
                    <div className="vstack gap-3">
                        <Card>
                            <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-2">
                                <h2 className="card-title">
                                    {free
                                        ? common.free
                                        : resource.resourceId && resource.access?.allowed
                                          ? common.purchased
                                          : resourcePrice(resource, locale)}
                                </h2>
                                {version?.version && (
                                    <span className="badge text-bg-light text-wrap text-break">
                                        {text.releaseVersion.replace('{version}', version.version)}
                                    </span>
                                )}
                            </div>
                            <p className="small text-body-secondary mb-3 text-break">
                                {common.author} ·{' '}
                                {resource.author.url ? (
                                    <a
                                        href={resource.author.url}
                                        target="_blank"
                                        rel={externalLinkRel(resource.author.url)}
                                    >
                                        {resource.author.name}
                                    </a>
                                ) : (
                                    resource.author.name
                                )}
                            </p>
                            <ErrorNotice error={failure} />
                            {repositoryUnavailable ? (
                                <p className="alert alert-warning mb-0" role="status">
                                    {text.resourceUnavailable}
                                </p>
                            ) : downloadButton ? (
                                <div className="d-none d-lg-block">{downloadButton}</div>
                            ) : free || !resource.resourceId ? (
                                actionUrl ? (
                                    <a
                                        className="btn btn-primary w-100"
                                        href={actionUrl}
                                        target="_blank"
                                        rel={externalLinkRel(actionUrl)}
                                    >
                                        {free ? text.source : text.external}
                                    </a>
                                ) : (
                                    <>
                                        <p>{free ? text.downloadUnavailable : text.purchaseLinkUnavailable}</p>
                                        <a href="#resource-support" className="btn btn-outline-secondary w-100">
                                            {text.contactSupport}
                                        </a>
                                    </>
                                )
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
                                            to={`${path('/login')}?next=${encodeURIComponent(resourcePath)}`}
                                        >
                                            {common.login}
                                        </Link>
                                    )}
                                </>
                            )}
                        </Card>
                        <Card>
                            <h2 className="card-title mb-3">{text.resourcesAndSupport}</h2>
                            <div id="resource-support" className="d-flex flex-wrap gap-2">
                                {resource.repository && (
                                    <a
                                        className="btn btn-outline-secondary flex-fill"
                                        href={resource.repository}
                                        target="_blank"
                                        rel={externalLinkRel(resource.repository)}
                                    >
                                        <i className="bi bi-github me-2" aria-hidden="true" />
                                        {text.source}
                                    </a>
                                )}
                                {discord && (
                                    <a
                                        className="btn btn-outline-secondary flex-fill"
                                        href={discord}
                                        target="_blank"
                                        rel={externalLinkRel(discord)}
                                    >
                                        <i className="bi bi-discord me-2" aria-hidden="true" />
                                        {text.contactDiscord}
                                    </a>
                                )}
                                {email && (
                                    <a className="btn btn-outline-secondary flex-fill" href={`mailto:${email}`}>
                                        <i className="bi bi-envelope me-2" aria-hidden="true" />
                                        {text.contactEmail}
                                    </a>
                                )}
                            </div>
                        </Card>
                        <Card className="resource-compatibility">
                            <h2 className="card-title mb-2">{text.compatibility}</h2>
                            <dl className="metadata-list">
                                {Object.entries(version?.requirements ?? {}).map(([key, value]) => (
                                    <div key={key}>
                                        <dt>{key === 'cms' ? text.cms : key === 'php' ? text.php : key}</dt>
                                        <dd>
                                            <code>{value}</code>
                                        </dd>
                                    </div>
                                ))}
                                {resource.type === 'plugin' && (
                                    <div>
                                        <dt>{text.supportedGames}</dt>
                                        <dd className="d-flex flex-wrap align-items-center gap-2">
                                            {supported.length > 0 ? (
                                                <GameBadges games={supported} />
                                            ) : excluded.length > 0 ? (
                                                <>
                                                    <span>{text.allGamesExcept}</span>
                                                    <GameBadges games={excluded} />
                                                </>
                                            ) : (
                                                text.allGames
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {resource.type === 'plugin' && enhancements.length > 0 && (
                                    <div>
                                        <dt>{text.gameEnhancements}</dt>
                                        <dd>
                                            <GameBadges games={enhancements} />
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </Card>
                    </div>
                </aside>
                {otherResources.length > 0 && (
                    <Card title={text.moreFromAuthor} className="resource-related">
                        <ul className="list-unstyled d-flex flex-wrap gap-3 mb-0">
                            {otherResources.map((entry) => (
                                <li key={entry.id}>
                                    <Link to={path(marketResourcePath(entry))}>{localized(entry.name, locale)}</Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
            {downloadUrl && (
                <Modal
                    open={downloadOpen}
                    onClose={() => setDownloadOpen(false)}
                    labelledBy="resource-download-title"
                    trapFocus
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 id="resource-download-title" className="modal-title h5">
                                {installLabel}
                            </h2>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label={text.closeDownload}
                                onClick={() => setDownloadOpen(false)}
                            />
                        </div>
                        <div className="modal-body">
                            {!resource.manual_only && (
                                <ol>
                                    <li>{text.openInstallArea.replace('{area}', installArea)}</li>
                                    <li>{text.selectCatalogueResource.replace('{name}', name)}</li>
                                </ol>
                            )}
                            <p className="mb-0">{text.uploadManualZip.replace('{area}', installArea)}</p>
                        </div>
                        <div className="modal-footer">
                            <Link
                                className="btn btn-outline-secondary"
                                to={path('/documentation/extensions-catalogue')}
                                onClick={() => setDownloadOpen(false)}
                            >
                                {text.installationGuide}
                            </Link>
                            <a
                                className="btn btn-primary"
                                href={downloadUrl}
                                target="_blank"
                                rel={externalLinkRel(downloadUrl)}
                            >
                                {text.downloadZip}
                            </a>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
