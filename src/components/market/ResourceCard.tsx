import { Link } from 'react-router-dom';
import type { CatalogueResource } from '../../../shared/catalogue';
import { localized, useLocale } from '../../lib/i18n';
import { commonMessages } from '../../lib/translations';
import { resourcePrice } from '../../lib/catalogue';

export function ResourceCard({ resource }: { resource: CatalogueResource }) {
    const { locale, path } = useLocale();
    const common = commonMessages[locale];
    const identifier = encodeURIComponent(resource.resourceId ?? resource.id);
    const image = localized(resource.image, locale);
    return (
        <article className="card resource-card h-100">
            <div className="resource-art" aria-hidden="true">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <span>{resource.type === 'plugin' ? '◫' : resource.type === 'theme' ? '◈' : '◇'}</span>
                )}
            </div>
            <div className="card-body">
                <span className="resource-type">{common[resource.type]}</span>
                <h2 className="h5">
                    <Link to={`${path('/market/resource')}/${identifier}`}>{localized(resource.name, locale)}</Link>
                </h2>
                <p>{localized(resource.description, locale)}</p>
                <p className="small text-body-secondary mb-0">{resource.author.name}</p>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
                <strong>
                    {resource.commercial.kind === 'free'
                        ? common.free
                        : resource.access?.allowed && resource.resourceId
                          ? common.purchased
                          : resourcePrice(resource, locale)}
                </strong>
                <Link
                    to={`${path('/market/resource')}/${identifier}`}
                    className="resource-link"
                    aria-label={`${common.resource} · ${localized(resource.name, locale)}`}
                >
                    ↗
                </Link>
            </div>
        </article>
    );
}
