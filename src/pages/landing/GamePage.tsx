import { Link, useLocation } from 'react-router-dom';
import { bundledGames, matchGamePage, type BundledGame } from '../../../shared/games';
import { officialPluginPath } from '../../../shared/routes';
import { gameMessages } from '../../lib/translations';
import { useLocale, useSiteCopy } from '../../lib/i18n';
import { NotFoundPage } from '../NotFoundPage';

export function GamePage() {
    const { locale, path } = useLocale();
    const site = useSiteCopy();
    const { pathname } = useLocation();
    const game = matchGamePage(pathname);
    if (!game) {
        return <NotFoundPage />;
    }

    const copy = gameMessages[locale];
    const page = copy.pages[game];
    const { icon, accent, guide = 'games' }: BundledGame = bundledGames[game];

    return (
        <article>
            <a className="game-page-back" href={`${path('/')}#games-title`}>
                <i className="bi bi-arrow-left" aria-hidden="true" />
                {copy.backLink}
            </a>
            <header className="game-page-hero">
                <div className="game-page-intro">
                    <h1>{page.title}</h1>
                    <p>{page.intro}</p>
                    <div className="landing-actions">
                        <Link className="btn btn-primary" to={path('/downloads')}>
                            {site.download}
                        </Link>
                        <Link to={path('/documentation/installation')}>{copy.installationLink}</Link>
                    </div>
                </div>
                <section className="game-page-highlights" data-accent={accent} aria-labelledby="game-highlights">
                    <div className="game-page-highlights-heading">
                        <h2 id="game-highlights">{copy.highlightsTitle}</h2>
                        <i className={`bi bi-${icon} game-page-icon`} aria-hidden="true" />
                    </div>
                    <ul>
                        {page.highlights.map((highlight) => (
                            <li key={highlight}>
                                <i className="bi bi-check2" aria-hidden="true" />
                                {highlight}
                            </li>
                        ))}
                    </ul>
                </section>
            </header>
            <div className="game-page-features">
                {page.features.map((feature) => (
                    <section className="card" key={feature.title}>
                        <div className="card-body">
                            <h2>{feature.title}</h2>
                            <p>{feature.description}</p>
                        </div>
                    </section>
                ))}
            </div>
            <section className="game-page-plugins" aria-labelledby="game-plugins">
                <h2 id="game-plugins">{copy.pluginsTitle}</h2>
                <ul className="game-page-plugin-list">
                    {page.plugins.map(({ slug, description }) => (
                        <li key={slug}>
                            <h3>
                                <Link to={path(officialPluginPath(slug))}>{copy.pluginNames[slug]}</Link>
                            </h3>
                            <p>{description}</p>
                        </li>
                    ))}
                </ul>
            </section>
            <section className="game-page-setup" aria-labelledby="game-setup">
                <div>
                    <h2 id="game-setup">{copy.setupTitle}</h2>
                    <p>{page.setup}</p>
                </div>
                <Link to={path(`/documentation/${guide}`)}>
                    {copy.guideLink}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
            </section>
        </article>
    );
}
