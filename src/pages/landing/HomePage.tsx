import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorNotice } from '../../components/UI';
import { Screenshot } from '../../components/landing/Screenshot';
import { Compatibility } from '../../components/landing/Compatibility';
import { ResourceCard } from '../../components/market/ResourceCard';
import { useCatalogue } from '../../hooks/useCatalogue';
import { useLocale, useSiteCopy, localized } from '../../lib/i18n';

export function HomePage() {
    const copy = useSiteCopy();
    const { locale, path } = useLocale();
    const { data, error } = useCatalogue();
    const [activeTab, setActiveTab] = useState(0);
    const screenshots = copy.workspace.tabs;
    const selected = screenshots[activeTab] ?? screenshots[0];
    const resources = [...(data?.resources ?? [])]
        .sort((left, right) => localized(left.name, locale).localeCompare(localized(right.name, locale), locale))
        .slice(0, 3);

    return (
        <div className="container">
            <header className="home-intro">
                <h1>{copy.landing.title}</h1>
                <p>{copy.landing.description}</p>
                <div className="home-start">
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
                <div className="row g-4" data-market-list data-limit="3">
                    {resources.map((resource) => (
                        <div className="col-md-6 col-xl-4" key={resource.id}>
                            <ResourceCard resource={resource} />
                        </div>
                    ))}
                </div>
                <div data-catalogue-state aria-live="polite">
                    <ErrorNotice error={error} />
                    {!data && !error && <p className="text-body-secondary">{copy.market.loading}</p>}
                    {data && resources.length === 0 && (
                        <p className="text-body-secondary">{copy.market.catalogueEmpty}</p>
                    )}
                </div>
            </section>
        </div>
    );
}
