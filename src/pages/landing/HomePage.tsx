import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../components/UI';
import { Screenshot } from '../../components/landing/Screenshot';
import { Compatibility } from '../../components/landing/Compatibility';
import { ResourceCard, ResourceCardLoading } from '../../components/market/ResourceCard';
import { useCatalogue } from '../../hooks/useCatalogue';
import { useLocale, useSiteCopy, localized } from '../../lib/i18n';
import { DiscordIcon } from '../../components/DiscordIcon';
import { discordUrl, externalLinkRel } from '../../../shared/links';

const previewPluginCount = 3;
const previewThemeCount = 2;

export function HomePage() {
    const copy = useSiteCopy();
    const { locale, path } = useLocale();
    const { data, error } = useCatalogue();
    const [activeTab, setActiveTab] = useState(0);
    const screenshots = copy.workspace.tabs;
    const selected = screenshots[activeTab] ?? screenshots[0];
    const resources = [...(data?.resources ?? [])].sort((left, right) =>
        localized(left.name, locale).localeCompare(localized(right.name, locale), locale),
    );
    const plugins = resources.filter((resource) => resource.type === 'plugin').slice(0, previewPluginCount);
    const themes = resources.filter((resource) => resource.type === 'theme').slice(0, previewThemeCount);
    const loading = !data && !error;
    const preview = (
        <div className="row g-3">
            {(loading || plugins.length > 0) && (
                <div className="col-12 col-lg-4">
                    <div className="vstack gap-3">
                        {loading
                            ? Array.from({ length: previewPluginCount }, (_, index) => (
                                  <ResourceCardLoading key={index} />
                              ))
                            : plugins.map((resource) => <ResourceCard resource={resource} key={resource.id} />)}
                    </div>
                </div>
            )}
            {loading
                ? Array.from({ length: previewThemeCount }, (_, index) => (
                      <div className="col-md-6 col-lg-4" key={index}>
                          <ResourceCardLoading cover />
                      </div>
                  ))
                : themes.map((resource) => (
                      <div className="col-md-6 col-lg-4" key={resource.id}>
                          <ResourceCard resource={resource} />
                      </div>
                  ))}
        </div>
    );

    return (
        <div className="container">
            <header className="home-intro">
                <h1>{copy.landing.title}</h1>
                <p>{copy.landing.description}</p>
                <div className="landing-actions">
                    <Link className="btn btn-primary" to={path('/downloads')}>
                        {copy.landing.primary}
                    </Link>
                    <Link to={path('/documentation/installation')}>{copy.landing.secondary}</Link>
                </div>
            </header>

            <Compatibility />

            <section className="home-showcase" aria-labelledby="showcase-title">
                <div className="section-heading">
                    <div>
                        <h2 id="showcase-title">{copy.landing.previewTitle}</h2>
                        <p>{copy.landing.previewDescription}</p>
                    </div>
                </div>
                <div className="home-preview card overflow-hidden">
                    <div className="card-header screenshot-tabs" role="group" aria-label={copy.hero.window}>
                        {screenshots.map(([label], index) => (
                            <button
                                key={label}
                                type="button"
                                className={`screenshot-tab${activeTab === index ? ' active' : ''}`}
                                aria-pressed={activeTab === index}
                                onClick={() => setActiveTab(index)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {selected && <Screenshot filename={selected[1]} alt={selected[2]} primary />}
                </div>
            </section>

            <div className="home-reference">
                <section>
                    <h2>{copy.landing.featuresTitle}</h2>
                    <p>{copy.landing.featuresDescription}</p>
                    <ul className="home-feature-list">
                        {copy.project.included.map((feature) => (
                            <li key={feature}>{feature}</li>
                        ))}
                    </ul>
                    <Link to={path('/features')}>{copy.project.featuresLink}</Link>
                </section>
                <section>
                    <h2>{copy.landing.installationTitle}</h2>
                    <p>{copy.landing.installationDescription}</p>
                    <ul className="home-feature-list">
                        {copy.project.requirements.map((requirement) => (
                            <li key={requirement}>{requirement}</li>
                        ))}
                    </ul>
                    <ul className="home-guide-links">
                        {copy.guides.items.map(([heading, , slug]) => (
                            <li key={slug}>
                                <Link to={path(`/documentation/${slug}`)}>{heading}</Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className="home-market">
                <div className="section-heading">
                    <div>
                        <h2>{copy.landing.marketTitle}</h2>
                        <p>{copy.landing.marketDescription}</p>
                    </div>
                    <Link to={path('/market')}>{copy.project.allExtensions}</Link>
                </div>
                {loading ? <Loading>{preview}</Loading> : preview}
                <div aria-live="polite">
                    <ErrorNotice error={error} />
                    {data && plugins.length === 0 && themes.length === 0 && (
                        <p className="text-body-secondary">{copy.market.catalogueEmpty}</p>
                    )}
                </div>
            </section>

            <section className="home-community card" aria-labelledby="community-title">
                <div className="card-body p-4 p-lg-5 d-flex flex-wrap align-items-center justify-content-between gap-4">
                    <div className="home-community-copy">
                        <h2 id="community-title">{copy.community.title}</h2>
                        <p className="text-body-secondary mb-0">{copy.community.description}</p>
                    </div>
                    <a
                        className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                        href={discordUrl}
                        target="_blank"
                        rel={externalLinkRel(discordUrl)}
                    >
                        <DiscordIcon />
                        {copy.community.join}
                    </a>
                </div>
            </section>
        </div>
    );
}
