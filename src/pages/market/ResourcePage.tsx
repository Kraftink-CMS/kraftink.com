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
import { discordUrl, externalLinkRel } from '../../../shared/links';

const gameNames: Record<string, string> = {
    ark: 'ARK: Survival Evolved',
    arkascended: 'ARK: Survival Ascended',
    conanexiles: 'Conan Exiles',
    counterstrike2: 'Counter-Strike 2',
    dayz: 'DayZ',
    fivem: 'FiveM',
    garrysmod: 'Garry’s Mod',
    minecraftbedrock: 'Minecraft Bedrock',
    palworld: 'Palworld',
    projectzomboid: 'Project Zomboid',
    redm: 'RedM',
    sevendaystodie: '7 Days to Die',
    teamfortress2: 'Team Fortress 2',
};

function GameBadges({ games }: { games: string[] }) {
    return (
        <span className="d-inline-flex flex-wrap gap-2">
            {games.map((game) => (
                <span className="badge text-bg-light" key={game}>
                    {Object.hasOwn(gameNames, game)
                        ? gameNames[game]
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
    const supported = version?.supported_games ?? [];
    const excluded = version?.excluded_games ?? [];
    const enhancements = version?.game_enhancements ?? [];
    const preview = localized(resource.image, locale);
    const otherResources = data.resources.filter(
        (entry) => entry.id !== resource.id && entry.author.id === resource.author.id,
    );
    const email = resource.support?.email;
    const discord = resource.support?.discord ?? (email ? null : discordUrl);
    const free = resource.commercial.kind === 'free';
    const actionUrl = free
        ? (version?.download?.url ?? resource.repository)
        : (resource.commercial.url ?? resource.repository);
    const actionLabel = free ? (version?.download?.url ? common.download : text.source) : text.external;
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
                    {preview && (
                        <img
                            className="img-fluid rounded border w-100 mb-4"
                            src={preview}
                            alt=""
                            onError={(event) => {
                                event.currentTarget.hidden = true;
                            }}
                        />
                    )}
                    <Card title={text.compatibility}>
                        <dl className="metadata-list">
                            <div>
                                <dt>{common.author}</dt>
                                <dd>
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
                                </dd>
                            </div>
                            {version?.version && (
                                <div>
                                    <dt>{common.version}</dt>
                                    <dd>{version.version}</dd>
                                </div>
                            )}
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
                            <div id="resource-support">
                                <dt>{text.supportContact}</dt>
                                <dd className="d-flex flex-wrap gap-3">
                                    {discord && (
                                        <a href={discord} target="_blank" rel={externalLinkRel(discord)}>
                                            Discord
                                        </a>
                                    )}
                                    {email && <a href={`mailto:${email}`}>{text.contactEmail}</a>}
                                </dd>
                            </div>
                        </dl>
                        {resource.repository && (
                            <a
                                className="btn btn-outline-secondary"
                                href={resource.repository}
                                target="_blank"
                                rel={externalLinkRel(resource.repository)}
                            >
                                {text.source} ↗
                            </a>
                        )}
                    </Card>
                    {otherResources.length > 0 && (
                        <div className="mt-4">
                            <Card title={text.moreFromAuthor}>
                                <ul className="list-unstyled d-grid gap-2 mb-0">
                                    {otherResources.map((entry) => (
                                        <li key={entry.id}>
                                            <Link
                                                to={`${path('/market/resource')}/${encodeURIComponent(entry.resourceId ?? entry.id)}`}
                                            >
                                                {localized(entry.name, locale)}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    )}
                </div>
                <div className="col-lg-4">
                    <Card
                        title={
                            free
                                ? common.free
                                : resource.resourceId && resource.access?.allowed
                                  ? common.purchased
                                  : resourcePrice(resource, locale)
                        }
                    >
                        <ErrorNotice error={failure} />
                        {resource.access?.code === 'repository_unavailable' ? (
                            <p className="alert alert-warning mb-0" role="status">
                                {text.resourceUnavailable}
                            </p>
                        ) : free || !resource.resourceId ? (
                            actionUrl ? (
                                <a
                                    className="btn btn-primary w-100"
                                    href={actionUrl}
                                    target="_blank"
                                    rel={externalLinkRel(actionUrl)}
                                >
                                    {actionLabel}
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
