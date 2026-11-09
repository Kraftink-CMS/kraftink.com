import { useId, useState, type KeyboardEvent } from 'react';
import type { CatalogueResource } from '../../../shared/catalogue';
import { localized, useLocale } from '../../lib/i18n';
import { publicMessages } from '../../lib/translations';
import { Card } from '../UI';
import { ResourceMarkdown } from './ResourceMarkdown';

const tabs = ['description', 'changelog'] as const;
type ResourceTab = (typeof tabs)[number];

export function ResourceDetails({ resource }: { resource: CatalogueResource }) {
    const { locale } = useLocale();
    const text = publicMessages[locale];
    const [active, setActive] = useState<ResourceTab>('description');
    const id = useId();
    const readme = localized(resource.readme, locale);
    const description = readme ? (
        <ResourceMarkdown markdown={readme} images={resource.readmeImages} />
    ) : (
        <p className="resource-description mb-0">{localized(resource.description, locale)}</p>
    );
    const history = (resource.history ?? resource.versions).flatMap((entry) => {
        const notes = localized(entry.changelog, locale);
        return notes.trim() ? [{ version: entry.version, notes }] : [];
    });

    function moveTab(event: KeyboardEvent<HTMLButtonElement>, tab: ResourceTab) {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) {
            return;
        }
        event.preventDefault();
        const next = event.key === 'Home' || (event.key !== 'End' && tab === 'changelog') ? tabs[0] : tabs[1];
        setActive(next);
        document.getElementById(`${id}-${next}-tab`)?.focus();
    }

    if (!history.length) {
        return <Card title={text.description}>{description}</Card>;
    }

    return (
        <section className="card">
            <div className="card-header">
                <div className="nav nav-tabs card-header-tabs" role="tablist" aria-label={text.resourceDetails}>
                    {tabs.map((tab) => (
                        <button
                            className={`nav-link${active === tab ? ' active' : ''}`}
                            key={tab}
                            id={`${id}-${tab}-tab`}
                            type="button"
                            role="tab"
                            tabIndex={active === tab ? 0 : -1}
                            aria-selected={active === tab}
                            aria-controls={`${id}-${tab}-panel`}
                            onClick={() => setActive(tab)}
                            onKeyDown={(event) => moveTab(event, tab)}
                        >
                            {text[tab]}
                        </button>
                    ))}
                </div>
            </div>
            <div className="card-body">
                <div
                    id={`${id}-description-panel`}
                    role="tabpanel"
                    aria-labelledby={`${id}-description-tab`}
                    tabIndex={0}
                    hidden={active !== 'description'}
                >
                    {active === 'description' && description}
                </div>
                <div
                    id={`${id}-changelog-panel`}
                    role="tabpanel"
                    aria-labelledby={`${id}-changelog-tab`}
                    tabIndex={0}
                    hidden={active !== 'changelog'}
                >
                    {active === 'changelog' &&
                        history.map(({ version, notes }) => (
                            <section className="resource-changelog-version" key={version}>
                                <h2 className="h5">{text.releaseVersion.replace('{version}', version)}</h2>
                                <ResourceMarkdown
                                    markdown={notes}
                                    headingLevel={3}
                                    images={
                                        version === resource.versions[0]?.version ? resource.readmeImages : undefined
                                    }
                                />
                            </section>
                        ))}
                </div>
            </div>
        </section>
    );
}
